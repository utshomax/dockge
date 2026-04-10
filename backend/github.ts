import { ValidationError } from "./util-server";
import yamlLib from "yaml";
import childProcessAsync from "promisify-child-process";
import path from "path";
import os from "os";
import fs from "fs";

/**
 * Recursively copies src into dest, handling type conflicts that fs.cpSync
 * cannot resolve (e.g. source is a directory but dest path is a file, or
 * source is a file but dest path is a directory).  Conflicting destination
 * entries are removed before the copy so the source always wins.
 */
function forceCopySync(src: string, dest: string): void {
    const srcStat = fs.statSync(src, { throwIfNoEntry: false });
    if (!srcStat) {
        return;
    }

    if (srcStat.isDirectory()) {
        const destStat = fs.statSync(dest, { throwIfNoEntry: false });
        if (destStat && !destStat.isDirectory()) {
            // dest is a file/symlink where we need a directory — remove it
            fs.rmSync(dest, { force: true });
        }
        fs.mkdirSync(dest, { recursive: true });
        for (const entry of fs.readdirSync(src)) {
            forceCopySync(path.join(src, entry), path.join(dest, entry));
        }
    } else {
        const destStat = fs.statSync(dest, { throwIfNoEntry: false });
        if (destStat && destStat.isDirectory()) {
            // dest is a directory where we need a file — remove it
            fs.rmSync(dest, { recursive: true, force: true });
        }
        fs.copyFileSync(src, dest);
    }
}

interface ParsedRepo {
    owner: string;
    repo: string;
}

function parseRepoUrl(url: string): ParsedRepo {
    let cleaned = url.trim().replace(/\.git$/, "");

    // Accept "owner/repo" shorthand
    if (!cleaned.includes("/")) {
        throw new ValidationError("Invalid GitHub repository URL");
    }

    // Strip protocol + host for full URLs
    if (cleaned.startsWith("https://github.com/")) {
        cleaned = cleaned.slice("https://github.com/".length);
    } else if (cleaned.startsWith("http://github.com/")) {
        cleaned = cleaned.slice("http://github.com/".length);
    } else if (cleaned.startsWith("github.com/")) {
        cleaned = cleaned.slice("github.com/".length);
    }

    const parts = cleaned.split("/").filter(Boolean);
    if (parts.length < 2) {
        throw new ValidationError("Invalid GitHub repository URL — expected owner/repo");
    }

    return { owner: parts[0], repo: parts[1] };
}

function getApiHeaders(pat?: string): HeadersInit {
    const headers: Record<string, string> = {
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "Dockge/1.0",
    };
    if (pat) {
        headers["Authorization"] = `Bearer ${pat}`;
    }
    return headers;
}

export async function listBranches(repoUrl: string, pat?: string): Promise<string[]> {
    const { owner, repo } = parseRepoUrl(repoUrl);
    const headers = getApiHeaders(pat);
    const branches: string[] = [];
    let page = 1;

    while (true) {
        const res = await fetch(
            `https://api.github.com/repos/${owner}/${repo}/branches?per_page=100&page=${page}`,
            { headers }
        );

        if (!res.ok) {
            const body = await res.text().catch(() => "");
            throw new ValidationError(`GitHub API error ${res.status}: ${body}`);
        }

        const data = await res.json() as Array<{ name: string }>;
        if (!Array.isArray(data) || data.length === 0) {
            break;
        }

        for (const b of data) {
            branches.push(b.name);
        }

        if (data.length < 100) {
            break;
        }
        page++;
    }

    return branches;
}

export async function findAndFetchCompose(repoUrl: string, branch: string, pat?: string, composePath?: string): Promise<string> {
    const { owner, repo } = parseRepoUrl(repoUrl);
    const headers = getApiHeaders(pat);

    let resolvedPath: string;

    if (composePath && composePath.trim().length > 0) {
        resolvedPath = composePath.trim();
    } else {
        // Auto-detect: get the root tree
        const treeRes = await fetch(
            `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}`,
            { headers }
        );

        if (!treeRes.ok) {
            const body = await treeRes.text().catch(() => "");
            throw new ValidationError(`GitHub API error ${treeRes.status}: ${body}`);
        }

        const treeData = await treeRes.json() as { tree: Array<{ path: string; type: string }> };
        const files = treeData.tree.filter(item => item.type === "blob").map(item => item.path);

        const priorityNames = [
            "compose.yaml",
            "compose.yml",
            "docker-compose.yaml",
            "docker-compose.yml",
        ];

        let detected: string | undefined;

        for (const name of priorityNames) {
            if (files.includes(name)) {
                detected = name;
                break;
            }
        }

        if (!detected) {
            const wildcardPattern = /^docker-compose\..+\.(yaml|yml)$/;
            detected = files.find(f => wildcardPattern.test(f));
        }

        if (!detected) {
            throw new ValidationError("No compose file found in repository root");
        }

        resolvedPath = detected;
    }

    const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${resolvedPath}`;
    const rawRes = await fetch(rawUrl, pat ? { headers: { "Authorization": `Bearer ${pat}` } } : {});

    if (!rawRes.ok) {
        throw new ValidationError(`Failed to fetch compose file: HTTP ${rawRes.status}`);
    }

    return rawRes.text();
}

/**
 * Returns true if any service in the compose YAML has a `build:` directive.
 */
export function hasBuildDirective(composeYAML: string): boolean {
    try {
        const parsed = yamlLib.parse(composeYAML);
        if (!parsed?.services || typeof parsed.services !== "object") {
            return false;
        }
        return Object.values(parsed.services as Record<string, unknown>).some(
            (svc) => svc !== null && typeof svc === "object" && "build" in (svc as object)
        );
    } catch {
        return false;
    }
}

/**
 * Shallow-clones the repo at the given branch into targetDir.
 * Uses a temp directory as intermediate to avoid issues with non-empty target dirs.
 * PAT is sanitized from any error messages before rethrowing.
 */
export async function cloneRepo(
    repoUrl: string,
    branch: string,
    targetDir: string,
    pat?: string
): Promise<void> {
    const { owner, repo } = parseRepoUrl(repoUrl);
    const cloneUrl = pat
        ? `https://${encodeURIComponent(pat)}@github.com/${owner}/${repo}.git`
        : `https://github.com/${owner}/${repo}.git`;

    // mkdtempSync creates a guaranteed-unique directory atomically, so git clone
    // never sees a pre-existing destination path.
    const tempParent = fs.mkdtempSync(path.join(os.tmpdir(), "dockge-gh-"));
    const tempDir = path.join(tempParent, "repo");

    try {
        await childProcessAsync.spawn(
            "git",
            [ "clone", "--branch", branch, "--depth", "1", "--single-branch", cloneUrl, tempDir ],
            { encoding: "utf-8" }
        );

        // Ensure target directory exists
        fs.mkdirSync(targetDir, { recursive: true });

        // Merge repo files into targetDir, resolving any type conflicts
        forceCopySync(tempDir, targetDir);
    } catch (cloneError: unknown) {
        const raw = cloneError instanceof Error ? cloneError.message : String(cloneError);
        // Sanitize PAT from any error output before surfacing to the client
        const sanitized = pat ? raw.replaceAll(pat, "***").replaceAll(encodeURIComponent(pat), "***") : raw;
        throw new ValidationError(`git clone failed: ${sanitized}`);
    } finally {
        try {
            fs.rmSync(tempParent, { recursive: true, force: true });
        } catch { /* ignore temp cleanup failures */ }
    }
}

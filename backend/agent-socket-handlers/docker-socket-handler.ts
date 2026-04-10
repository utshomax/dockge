import { AgentSocketHandler } from "../agent-socket-handler";
import { DockgeServer } from "../dockge-server";
import { callbackError, callbackResult, checkLogin, DockgeSocket, ValidationError } from "../util-server";
import { Stack } from "../stack";
import { AgentSocket } from "../../common/agent-socket";
import { listBranches, findAndFetchCompose, hasBuildDirective, cloneRepo } from "../github";
import { R } from "redbean-node";
import fs from "fs";

export class DockerSocketHandler extends AgentSocketHandler {
    create(socket : DockgeSocket, server : DockgeServer, agentSocket : AgentSocket) {
        // Do not call super.create()

        agentSocket.on("deployStack", async (name : unknown, composeYAML : unknown, composeENV : unknown, isAdd : unknown, callback) => {
            let createdPath: string | undefined;
            try {
                checkLogin(socket);
                const stack = await this.saveStack(server, name, composeYAML, composeENV, isAdd);
                // Track the newly created directory so we can clean it up if a
                // subsequent clone fails, preventing "Stack name already exists"
                // errors on the next retry.
                if (isAdd) {
                    createdPath = stack.path;
                }
                const needsBuild = typeof composeYAML === "string" && hasBuildDirective(composeYAML);
                if (needsBuild) {
                    const ghRow = await R.findOne("stack_github", " stack_name = ? ", [ stack.name ]);
                    if (ghRow) {
                        const pat = ghRow.pat ?? undefined;
                        await cloneRepo(ghRow.repo_url, ghRow.branch, stack.path, pat);
                    }
                }
                createdPath = undefined; // deploy succeeded, no cleanup needed
                await stack.deploy(socket, needsBuild);
                server.sendStackList();
                callbackResult({
                    ok: true,
                    msg: "Deployed",
                    msgi18n: true,
                }, callback);
                stack.joinCombinedTerminal(socket);
            } catch (e) {
                if (createdPath) {
                    try {
                        fs.rmSync(createdPath, { recursive: true, force: true });
                    } catch { /* ignore */ }
                }
                callbackError(e, callback);
            }
        });

        agentSocket.on("saveStack", async (name : unknown, composeYAML : unknown, composeENV : unknown, isAdd : unknown, callback) => {
            try {
                checkLogin(socket);
                await this.saveStack(server, name, composeYAML, composeENV, isAdd);
                callbackResult({
                    ok: true,
                    msg: "Saved",
                    msgi18n: true,
                }, callback);
                server.sendStackList();
            } catch (e) {
                callbackError(e, callback);
            }
        });

        agentSocket.on("deleteStack", async (name : unknown, callback) => {
            try {
                checkLogin(socket);
                if (typeof(name) !== "string") {
                    throw new ValidationError("Name must be a string");
                }
                const stack = await Stack.getStack(server, name);

                try {
                    await stack.delete(socket);
                } catch (e) {
                    server.sendStackList();
                    throw e;
                }

                server.sendStackList();
                callbackResult({
                    ok: true,
                    msg: "Deleted",
                    msgi18n: true,
                }, callback);

            } catch (e) {
                callbackError(e, callback);
            }
        });

        agentSocket.on("getStack", async (stackName : unknown, callback) => {
            try {
                checkLogin(socket);

                if (typeof(stackName) !== "string") {
                    throw new ValidationError("Stack name must be a string");
                }

                const stack = await Stack.getStack(server, stackName);

                if (stack.isManagedByDockge) {
                    stack.joinCombinedTerminal(socket);
                }

                callbackResult({
                    ok: true,
                    stack: await stack.toJSON(socket.endpoint),
                }, callback);
            } catch (e) {
                callbackError(e, callback);
            }
        });

        // requestStackList
        agentSocket.on("requestStackList", async (callback) => {
            try {
                checkLogin(socket);
                server.sendStackList();
                callbackResult({
                    ok: true,
                    msg: "Updated",
                    msgi18n: true,
                }, callback);
            } catch (e) {
                callbackError(e, callback);
            }
        });

        // startStack
        agentSocket.on("startStack", async (stackName : unknown, callback) => {
            try {
                checkLogin(socket);

                if (typeof(stackName) !== "string") {
                    throw new ValidationError("Stack name must be a string");
                }

                const stack = await Stack.getStack(server, stackName);
                await stack.start(socket);
                callbackResult({
                    ok: true,
                    msg: "Started",
                    msgi18n: true,
                }, callback);
                server.sendStackList();

                stack.joinCombinedTerminal(socket);

            } catch (e) {
                callbackError(e, callback);
            }
        });

        // stopStack
        agentSocket.on("stopStack", async (stackName : unknown, callback) => {
            try {
                checkLogin(socket);

                if (typeof(stackName) !== "string") {
                    throw new ValidationError("Stack name must be a string");
                }

                const stack = await Stack.getStack(server, stackName);
                await stack.stop(socket);
                callbackResult({
                    ok: true,
                    msg: "Stopped",
                    msgi18n: true,
                }, callback);
                server.sendStackList();
            } catch (e) {
                callbackError(e, callback);
            }
        });

        // restartStack
        agentSocket.on("restartStack", async (stackName : unknown, callback) => {
            try {
                checkLogin(socket);

                if (typeof(stackName) !== "string") {
                    throw new ValidationError("Stack name must be a string");
                }

                const stack = await Stack.getStack(server, stackName);
                await stack.restart(socket);
                callbackResult({
                    ok: true,
                    msg: "Restarted",
                    msgi18n: true,
                }, callback);
                server.sendStackList();
            } catch (e) {
                callbackError(e, callback);
            }
        });

        // updateStack
        agentSocket.on("updateStack", async (stackName : unknown, callback) => {
            try {
                checkLogin(socket);

                if (typeof(stackName) !== "string") {
                    throw new ValidationError("Stack name must be a string");
                }

                const stack = await Stack.getStack(server, stackName);
                await stack.update(socket);
                callbackResult({
                    ok: true,
                    msg: "Updated",
                    msgi18n: true,
                }, callback);
                server.sendStackList();
            } catch (e) {
                callbackError(e, callback);
            }
        });

        // down stack
        agentSocket.on("downStack", async (stackName : unknown, callback) => {
            try {
                checkLogin(socket);

                if (typeof(stackName) !== "string") {
                    throw new ValidationError("Stack name must be a string");
                }

                const stack = await Stack.getStack(server, stackName);
                await stack.down(socket);
                callbackResult({
                    ok: true,
                    msg: "Downed",
                    msgi18n: true,
                }, callback);
                server.sendStackList();
            } catch (e) {
                callbackError(e, callback);
            }
        });

        // Services status
        agentSocket.on("serviceStatusList", async (stackName : unknown, callback) => {
            try {
                checkLogin(socket);

                if (typeof(stackName) !== "string") {
                    throw new ValidationError("Stack name must be a string");
                }

                const stack = await Stack.getStack(server, stackName, true);
                const serviceStatusList = Object.fromEntries(await stack.getServiceStatusList());
                callbackResult({
                    ok: true,
                    serviceStatusList,
                }, callback);
            } catch (e) {
                callbackError(e, callback);
            }
        });

        // getExternalNetworkList
        agentSocket.on("getDockerNetworkList", async (callback) => {
            try {
                checkLogin(socket);
                const dockerNetworkList = await server.getDockerNetworkList();
                callbackResult({
                    ok: true,
                    dockerNetworkList,
                }, callback);
            } catch (e) {
                callbackError(e, callback);
            }
        });

        agentSocket.on("containerStats", async (callback) => {
            try {
                checkLogin(socket);
                const [ containerStats, diskStats ] = await Promise.all([
                    Stack.getAllContainerStats(server.stackDirFullPath),
                    Stack.getDiskStats(server.stackDirFullPath),
                ]);
                const hostStats = server.getHostStats();
                callbackResult({ ok: true, containerStats, hostStats, diskStats }, callback);
            } catch (e) {
                callbackError(e, callback);
            }
        });

        agentSocket.on("dockerPrune", async (force: unknown, callback) => {
            try {
                checkLogin(socket);
                if (typeof force !== "boolean") {
                    throw new ValidationError("force must be a boolean");
                }
                const output = await Stack.dockerPrune(server.stackDirFullPath, force);
                callbackResult({ ok: true, output }, callback);
            } catch (e) {
                callbackError(e, callback);
            }
        });

        // GitHub integration events

        agentSocket.on("githubListBranches", async (repoUrl: unknown, pat: unknown, callback) => {
            try {
                checkLogin(socket);
                if (typeof repoUrl !== "string") {
                    throw new ValidationError("repoUrl must be a string");
                }
                const patStr = typeof pat === "string" && pat.length > 0 ? pat : undefined;
                const branches = await listBranches(repoUrl, patStr);
                callbackResult({ ok: true, branches }, callback);
            } catch (e) {
                callbackError(e, callback);
            }
        });

        agentSocket.on("githubFetchCompose", async (repoUrl: unknown, branch: unknown, pat: unknown, composePath: unknown, callback) => {
            try {
                checkLogin(socket);
                if (typeof repoUrl !== "string") {
                    throw new ValidationError("repoUrl must be a string");
                }
                if (typeof branch !== "string") {
                    throw new ValidationError("branch must be a string");
                }
                const patStr = typeof pat === "string" && pat.length > 0 ? pat : undefined;
                const composePathStr = typeof composePath === "string" && composePath.length > 0 ? composePath : undefined;
                const composeYAML = await findAndFetchCompose(repoUrl, branch, patStr, composePathStr);
                callbackResult({ ok: true, composeYAML }, callback);
            } catch (e) {
                callbackError(e, callback);
            }
        });

        agentSocket.on("githubSaveConfig", async (stackName: unknown, repoUrl: unknown, pat: unknown, branch: unknown, composePath: unknown, callback) => {
            try {
                checkLogin(socket);
                if (typeof stackName !== "string") {
                    throw new ValidationError("stackName must be a string");
                }
                if (typeof repoUrl !== "string") {
                    throw new ValidationError("repoUrl must be a string");
                }
                if (typeof branch !== "string") {
                    throw new ValidationError("branch must be a string");
                }

                const composePathVal = typeof composePath === "string" && composePath.length > 0 ? composePath : null;

                let existing = await R.findOne("stack_github", " stack_name = ? ", [ stackName ]);

                if (existing) {
                    existing.repo_url = repoUrl;
                    existing.branch = branch;
                    existing.compose_path = composePathVal;
                    // Only update PAT if a new non-empty value was provided
                    if (typeof pat === "string" && pat.length > 0) {
                        existing.pat = pat;
                    }
                    await R.store(existing);
                } else {
                    const row = R.dispense("stack_github");
                    row.stack_name = stackName;
                    row.repo_url = repoUrl;
                    row.pat = typeof pat === "string" && pat.length > 0 ? pat : null;
                    row.branch = branch;
                    row.compose_path = composePathVal;
                    await R.store(row);
                }

                callbackResult({ ok: true, msg: "GitHub config saved" }, callback);
            } catch (e) {
                callbackError(e, callback);
            }
        });

        agentSocket.on("githubGetConfig", async (stackName: unknown, callback) => {
            try {
                checkLogin(socket);
                if (typeof stackName !== "string") {
                    throw new ValidationError("stackName must be a string");
                }

                const row = await R.findOne("stack_github", " stack_name = ? ", [ stackName ]);

                if (!row) {
                    callbackResult({ ok: true, repoUrl: "", branch: "", composePath: "", hasPat: false }, callback);
                    return;
                }

                callbackResult({
                    ok: true,
                    repoUrl: row.repo_url,
                    branch: row.branch,
                    composePath: row.compose_path ?? "",
                    hasPat: !!row.pat,
                }, callback);
            } catch (e) {
                callbackError(e, callback);
            }
        });

        agentSocket.on("githubDeployBranch", async (stackName: unknown, callback) => {
            try {
                checkLogin(socket);
                if (typeof stackName !== "string") {
                    throw new ValidationError("stackName must be a string");
                }

                const row = await R.findOne("stack_github", " stack_name = ? ", [ stackName ]);
                if (!row) {
                    throw new ValidationError("No GitHub config found for this stack");
                }

                const pat = row.pat ?? undefined;
                const composePath = row.compose_path ?? undefined;

                // Fetch compose file first (also validates the branch/repo are reachable)
                const composeYAML = await findAndFetchCompose(row.repo_url, row.branch, pat, composePath);

                // Load existing stack to preserve ENV
                const existingStack = await Stack.getStack(server, stackName);
                const composeENV = existingStack.composeENV ?? "";

                const needsBuild = hasBuildDirective(composeYAML);

                if (needsBuild) {
                    // Clone the full repo so Dockerfile + source files are on disk
                    await cloneRepo(row.repo_url, row.branch, existingStack.path, pat);
                }

                // Save compose + env (overwrites compose file with fetched content; preserves other repo files)
                const stack = new Stack(server, stackName, composeYAML, composeENV, false);
                await stack.save(false);

                // Pass --build when the compose file requires a local build
                await stack.deploy(socket, needsBuild);
                server.sendStackList();
                callbackResult({ ok: true, msg: "Deployed from GitHub" }, callback);
                stack.joinCombinedTerminal(socket);
            } catch (e) {
                callbackError(e, callback);
            }
        });
    }

    async saveStack(server : DockgeServer, name : unknown, composeYAML : unknown, composeENV : unknown, isAdd : unknown) : Promise<Stack> {
        // Check types
        if (typeof(name) !== "string") {
            throw new ValidationError("Name must be a string");
        }
        if (typeof(composeYAML) !== "string") {
            throw new ValidationError("Compose YAML must be a string");
        }
        if (typeof(composeENV) !== "string") {
            throw new ValidationError("Compose ENV must be a string");
        }
        if (typeof(isAdd) !== "boolean") {
            throw new ValidationError("isAdd must be a boolean");
        }

        const stack = new Stack(server, name, composeYAML, composeENV, false);
        await stack.save(isAdd);
        return stack;
    }

}


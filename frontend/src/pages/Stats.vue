<template>
    <div class="stats-page">
        <div class="page-header">
            <h1>Resource Monitor</h1>
            <p class="page-subtitle">Live CPU, memory and disk usage</p>
        </div>

        <!-- Host stats -->
        <div class="host-section">
            <div class="resource-card">
                <div class="resource-label">
                    CPU
                    <span class="resource-value">{{ hostCPU }}%</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill cpu" :style="{ width: hostCPU + '%' }"></div>
                </div>
            </div>
            <div class="resource-card">
                <div class="resource-label">
                    Memory
                    <span class="resource-value">{{ hostMemUsed }} / {{ hostMemTotal }}</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill mem" :style="{ width: (hostStats.mem ? hostStats.mem.percent : 0) + '%' }"></div>
                </div>
            </div>
            <div class="resource-card">
                <div class="resource-label">
                    Disk
                    <span class="resource-value">{{ diskUsed }} / {{ diskTotal }}</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill disk" :style="{ width: (diskStats.partition.percent || 0) + '%' }"></div>
                </div>
                <span class="path-hint">{{ diskStats.partition.path }}</span>
            </div>
        </div>

        <!-- Per-container table -->
        <div class="containers-section">
            <h2 class="section-title">Containers</h2>
            <table class="stats-table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>CPU%</th>
                        <th>Memory</th>
                        <th>Disk</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="c in containerStats" :key="c.Name" :class="{ 'row-unmanaged': !c.managedByDockge }">
                        <td class="container-name-cell">{{ c.Name }}</td>
                        <td><span class="badge cpu-badge">{{ c.CPUPerc }}</span></td>
                        <td class="mem-cell">
                            <span class="badge mem-badge">{{ c.MemPerc }}</span>
                            <span class="info-icon" :data-tooltip="c.MemUsage">ⓘ</span>
                        </td>
                        <td class="mono">{{ c.DiskUsage || '—' }}</td>
                        <td><span class="badge state-badge" :class="stateClass(c.State)">{{ c.State || 'running' }}</span></td>
                    </tr>
                    <tr v-if="containerStats.length === 0">
                        <td colspan="5" class="empty-row">No running containers</td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- Cleanup section -->
        <div class="cleanup-section">
            <h2 class="section-title">Docker Cleanup</h2>

            <!-- Default button row -->
            <div v-if="!pruneConfirmMode && !pruneLoading" class="cleanup-actions">
                <div class="cleanup-action">
                    <button class="btn-prune" @click="startConfirm('normal')">
                        Prune
                    </button>
                    <div class="cleanup-meta">
                        <span class="cleanup-label">Normal prune</span>
                        <span class="cleanup-hint">Removes stopped containers for each stack in your stacks folder. Running stacks are not affected.</span>
                    </div>
                </div>
                <div class="cleanup-action">
                    <button class="btn-prune btn-prune-danger" @click="startConfirm('force')">
                        Force prune
                    </button>
                    <div class="cleanup-meta">
                        <span class="cleanup-label danger-label">Destructive</span>
                        <span class="cleanup-hint">Also removes volumes for stopped stacks. Running stacks are never touched.</span>
                    </div>
                </div>
            </div>

            <!-- Loading row -->
            <div v-if="pruneLoading" class="cleanup-loading">
                <span class="loading-dot"></span>
                Cleaning up stacks&hellip;
            </div>

            <!-- Confirmation row -->
            <div v-if="pruneConfirmMode && !pruneLoading" class="cleanup-confirm">
                <p v-if="pruneConfirmMode === 'normal'" class="confirm-text">
                    Remove stopped containers for all stacks in your stacks folder?
                </p>
                <p v-else class="confirm-text">
                    <span class="danger-label">This will also remove volumes for stopped stacks.</span>
                    Running stacks will not be affected. Proceed?
                </p>
                <div class="confirm-actions">
                    <button class="btn-ghost" @click="cancelConfirm">Cancel</button>
                    <button
                        class="btn-prune btn-confirm-sm"
                        :class="pruneConfirmMode === 'force' ? 'btn-prune-danger' : ''"
                        @click="executePrune"
                    >
                        Confirm
                    </button>
                </div>
            </div>

            <!-- Result panel -->
            <div v-if="pruneResult" class="cleanup-result">
                <div class="result-header">Result</div>
                <pre class="result-output">{{ pruneResult }}</pre>
            </div>

            <!-- Error panel -->
            <div v-if="pruneError" class="cleanup-error">
                <span class="cleanup-error-label">Error: </span>{{ pruneError }}
            </div>
        </div>
    </div>
</template>

<script>
export default {
    data() {
        return {
            containerStats: [],
            hostStats: {},
            diskStats: { partition: {}, stacks: [] },
            pollTimer: null,
            pruneConfirmMode: null,
            pruneLoading: false,
            pruneResult: null,
            pruneError: null,
        };
    },

    computed: {
        hostCPU() {
            if (!this.hostStats.cpu) {
                return "0.0";
            }
            return this.hostStats.cpu.toFixed(1);
        },
        hostMemUsed() {
            if (!this.hostStats.mem) {
                return "—";
            }
            return this.formatBytes(this.hostStats.mem.used);
        },
        hostMemTotal() {
            if (!this.hostStats.mem) {
                return "—";
            }
            return this.formatBytes(this.hostStats.mem.total);
        },
        diskUsed() {
            return this.diskStats.partition.used ? this.formatBytes(this.diskStats.partition.used) : "—";
        },
        diskTotal() {
            return this.diskStats.partition.total ? this.formatBytes(this.diskStats.partition.total) : "—";
        },
    },

    mounted() {
        this.fetchStats();
    },

    beforeUnmount() {
        clearTimeout(this.pollTimer);
    },

    methods: {
        fetchStats() {
            this.$root.emitAgent("", "containerStats", (res) => {
                if (res.ok) {
                    this.containerStats = res.containerStats;
                    this.hostStats = res.hostStats;
                    this.diskStats = res.diskStats || { partition: {}, stacks: [] };
                }
                this.pollTimer = setTimeout(() => this.fetchStats(), 5000);
            });
        },

        stateClass(state) {
            if (!state || state === "running") return "state-running";
            if (state === "paused") return "state-paused";
            if (state === "restarting") return "state-restarting";
            return "state-unknown";
        },

        startConfirm(mode) {
            this.pruneConfirmMode = mode;
            this.pruneResult = null;
            this.pruneError = null;
        },

        cancelConfirm() {
            this.pruneConfirmMode = null;
        },

        executePrune() {
            const force = this.pruneConfirmMode === "force";
            this.pruneConfirmMode = null;
            this.pruneLoading = true;
            this.pruneResult = null;
            this.pruneError = null;

            this.$root.emitAgent("", "dockerPrune", force, (res) => {
                this.pruneLoading = false;
                if (res.ok) {
                    this.pruneResult = res.output || "(No output)";
                } else {
                    this.pruneError = res.msg || "Unknown error";
                }
            });
        },

        formatBytes(bytes) {
            if (!bytes || bytes === 0) {
                return "0 B";
            }
            const units = ["B", "KB", "MB", "GB", "TB"];
            const i = Math.floor(Math.log(bytes) / Math.log(1024));
            return (bytes / Math.pow(1024, i)).toFixed(1) + " " + units[i];
        },
    },
};
</script>

<style lang="scss" scoped>
@import "../styles/vars.scss";

.stats-page {
    max-width: 1040px;
    margin: 0 auto;
    padding-bottom: 40px;
}

.page-header {
    margin-bottom: 32px;
    display: flex;
    flex-direction: column;
    gap: 6px;

    h1 {
        font-size: 18px;
        font-weight: 600;
        color: $dark-font-color;
        letter-spacing: -0.02em;
        margin: 0;
    }
}

.page-subtitle {
    font-size: 13px;
    color: $dark-font-color3;
    margin: 0;
}

// ==============================
// Host section — 3 cards
// ==============================
.host-section {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
    margin-bottom: 12px;

    @media (max-width: 700px) {
        grid-template-columns: 1fr;
    }
}

.resource-card {
    background-color: $dark-bg3;
    border: 1px solid $dark-border-color;
    border-radius: $border-radius;
    padding: 16px;
}

.resource-label {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    font-size: 13px;
    font-weight: 500;
    color: $dark-font-color2;
    margin-bottom: 10px;
    gap: 8px;
}

.path-hint {
    display: block;
    font-size: 10px;
    font-family: monospace;
    color: $dark-font-color3;
    font-weight: 400;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin-top: 6px;
}

.resource-value {
    font-size: 13px;
    font-weight: 600;
    color: $dark-font-color;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
}

.progress-bar {
    height: 6px;
    background-color: rgba(255, 255, 255, 0.06);
    border-radius: 3px;
    overflow: hidden;
}

.progress-fill {
    height: 100%;
    border-radius: 3px;
    transition: width 0.5s ease;

    &.cpu  { background-color: $color-running; }
    &.mem  { background-color: #60a5fa; }
    &.disk { background-color: #a78bfa; }
}

// ==============================
// Containers + Disk sections
// ==============================
.containers-section {
    background-color: $dark-bg3;
    border: 1px solid $dark-border-color;
    border-radius: $border-radius;
    overflow: hidden;
}


.section-title {
    font-size: 13px;
    font-weight: 600;
    color: $dark-font-color2;
    margin: 0;
    padding: 14px 16px;
    border-bottom: 1px solid $dark-border-color;
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.stats-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;

    thead th {
        padding: 10px 16px;
        text-align: left;
        font-size: 11px;
        font-weight: 600;
        color: $dark-font-color3;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        border-bottom: 1px solid $dark-border-color;
    }

    tbody {
        tr {
            border-bottom: 1px solid rgba($dark-border-color, 0.5);
            transition: background-color 120ms ease;

            &:last-child { border-bottom: none; }
            &:hover { background-color: rgba(255, 255, 255, 0.02); }
        }

        td {
            padding: 10px 16px;
            color: $dark-font-color2;
            vertical-align: middle;
        }
    }
}


.container-name-cell {
    color: $dark-font-color !important;
    font-weight: 500;
    font-family: monospace;
    font-size: 12px;
}

.mono {
    font-family: monospace;
    font-size: 12px;
    color: $dark-font-color3 !important;
}

.badge {
    display: inline-block;
    padding: 2px 8px;
    border-radius: $border-radius-sm;
    font-size: 11px;
    font-weight: 600;
    font-variant-numeric: tabular-nums;

    &.cpu-badge {
        background-color: rgba($color-running, 0.12);
        color: $color-running;
    }

    &.mem-badge {
        background-color: rgba(96, 165, 250, 0.12);
        color: #60a5fa;
    }
}

.mem-cell {
    display: flex;
    align-items: center;
    gap: 5px;
}

.info-icon {
    position: relative;
    font-size: 11px;
    color: $dark-font-color3;
    cursor: default;
    line-height: 1;

    &::after {
        content: attr(data-tooltip);
        position: absolute;
        bottom: calc(100% + 5px);
        left: 50%;
        transform: translateX(-50%);
        background-color: $dark-bg2;
        border: 1px solid $dark-border-color;
        border-radius: $border-radius-sm;
        padding: 4px 8px;
        font-size: 11px;
        font-family: monospace;
        color: $dark-font-color;
        white-space: nowrap;
        opacity: 0;
        pointer-events: none;
        transition: opacity 120ms ease;
        z-index: 10;
    }

    &:hover {
        color: $dark-font-color2;
        &::after { opacity: 1; }
    }
}

.state-badge {
    &.state-running   { background-color: rgba($color-running, 0.12); color: $color-running; }
    &.state-paused    { background-color: rgba($color-warning, 0.12); color: $color-warning; }
    &.state-restarting { background-color: rgba(#60a5fa, 0.12); color: #60a5fa; }
    &.state-unknown   { background-color: rgba($dark-font-color3, 0.12); color: $dark-font-color3; }
}

.row-unmanaged {
    opacity: 0.35;
    filter: grayscale(1);
    pointer-events: none;
}

.empty-row {
    text-align: center;
    color: $dark-font-color3 !important;
    padding: 32px 16px !important;
    font-style: italic;
}

// ==============================
// Cleanup section
// ==============================
.cleanup-section {
    margin-top: 20px;
    background-color: $dark-bg3;
    border: 1px solid $dark-border-color;
    border-radius: $border-radius;
    overflow: hidden;
}

.cleanup-actions {
    display: flex;
    flex-direction: column;
    gap: 1px;
}

.cleanup-action {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 14px 16px;
    border-bottom: 1px solid rgba($dark-border-color, 0.5);

    &:last-child { border-bottom: none; }
}

.cleanup-meta {
    display: flex;
    flex-direction: column;
    gap: 3px;
}

.cleanup-label {
    font-size: 12px;
    font-weight: 600;
    color: $dark-font-color;
}

.cleanup-hint {
    font-size: 11px;
    color: $dark-font-color3;
}

.danger-label { color: $danger; }

.btn-prune {
    flex-shrink: 0;
    padding: 5px 14px;
    border-radius: $border-radius-sm;
    font-size: 12px;
    font-weight: 500;
    border: 1px solid $dark-border-color;
    background: rgba(255, 255, 255, 0.04);
    color: $dark-font-color2;
    cursor: pointer;
    transition: background-color 140ms ease, border-color 140ms ease, color 140ms ease;
    white-space: nowrap;

    &:hover {
        background: rgba(255, 255, 255, 0.08);
        color: $dark-font-color;
        border-color: rgba(255, 255, 255, 0.2);
    }

    &.btn-prune-danger {
        border-color: rgba($danger, 0.3);
        color: $danger;
        background: rgba($danger, 0.06);

        &:hover {
            background: rgba($danger, 0.12);
            border-color: rgba($danger, 0.5);
        }
    }

    &.btn-confirm-sm { padding: 4px 12px; }
}

.btn-ghost {
    padding: 4px 12px;
    border-radius: $border-radius-sm;
    font-size: 12px;
    font-weight: 500;
    border: 1px solid $dark-border-color;
    background: transparent;
    color: $dark-font-color3;
    cursor: pointer;
    transition: color 140ms ease, background-color 140ms ease;

    &:hover {
        color: $dark-font-color2;
        background: rgba(255, 255, 255, 0.04);
    }
}

.cleanup-loading {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 16px;
    font-size: 13px;
    color: $dark-font-color3;
}

.loading-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background-color: $dark-font-color3;
    animation: pulse 1.2s ease-in-out infinite;
}

@keyframes pulse {
    0%, 100% { opacity: 0.3; }
    50% { opacity: 1; }
}

.cleanup-confirm {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 14px 16px;

    .confirm-text {
        font-size: 13px;
        color: $dark-font-color2;
        margin: 0;
        flex: 1;

        .danger-label {
            display: block;
            margin-bottom: 4px;
            font-weight: 600;
        }
    }

    .confirm-actions {
        display: flex;
        gap: 8px;
        flex-shrink: 0;
    }
}

.cleanup-result {
    border-top: 1px solid $dark-border-color;

    .result-header {
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: $dark-font-color3;
        padding: 10px 16px 4px;
    }

    .result-output {
        margin: 0;
        padding: 0 16px 16px;
        font-family: monospace;
        font-size: 12px;
        line-height: 1.7;
        color: $color-running;
        white-space: pre-wrap;
        word-break: break-all;
        background: transparent;
        border: none;
    }
}

.cleanup-error {
    border-top: 1px solid $dark-border-color;
    padding: 12px 16px;
    font-size: 13px;
    color: $danger;
    background-color: rgba($danger, 0.06);

    .cleanup-error-label { font-weight: 600; }
}
</style>

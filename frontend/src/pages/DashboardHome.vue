<template>
    <div>
        <transition name="slide-fade" appear>
        <div v-if="$route.name === 'DashboardHome'" class="home-page">
            <!-- Page title -->
            <div class="page-header">
                <h1>{{ $t("Dashboard Overview") || 'Dashboard Overview' }}</h1>
                <p class="page-subtitle">{{ $t("Monitor your stacks and containers at a glance") || "Monitor your stacks and containers at a glance" }}</p>
            </div>

            <!-- Stats row -->
            <div class="stats-row">
                <div class="stat-card active-card">
                    <div class="stat-header">
                        <div class="stat-label">{{ $t("Active") || "Active" }}</div>
                        <div class="stat-icon-wrapper running">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                        </div>
                    </div>
                    <div class="stat-value running">{{ activeNum }}</div>
                </div>

                <div class="stat-card exited-card">
                    <div class="stat-header">
                        <div class="stat-label">{{ $t("Exited") || "Exited" }}</div>
                        <div class="stat-icon-wrapper exited">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="9" y1="9" x2="15" y2="15"/><line x1="15" y1="9" x2="9" y2="15"/></svg>
                        </div>
                    </div>
                    <div class="stat-value exited">{{ exitedNum }}</div>
                </div>

                <div class="stat-card inactive-card">
                    <div class="stat-header">
                        <div class="stat-label">{{ $t("Inactive") || "Inactive" }}</div>
                        <div class="stat-icon-wrapper inactive">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                        </div>
                    </div>
                    <div class="stat-value inactive">{{ inactiveNum }}</div>
                </div>

                <div class="stat-card total-card">
                    <div class="stat-header">
                        <div class="stat-label">{{ $t("Total Stacks") || "Total Stacks" }}</div>
                        <div class="stat-icon-wrapper total">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
                        </div>
                    </div>
                    <div class="stat-value total">{{ activeNum + exitedNum + inactiveNum }}</div>
                </div>
            </div>

            <!-- Bottom columns -->
            <div class="home-columns">
                <!-- Docker Run -->
                <div class="home-section command-section">
                    <div class="section-header">
                        <h3 class="section-title">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>
                            {{ $t("Docker Run") }}
                        </h3>
                        <p class="section-subtitle">{{ $t("Convert run commands to Compose templates") || "Convert run commands to Compose templates" }}</p>
                    </div>
                    <div class="terminal-panel">
                        <div class="terminal-header">
                            <div class="window-controls">
                                <span class="control close"></span>
                                <span class="control minimize"></span>
                                <span class="control maximize"></span>
                            </div>
                            <div class="terminal-title">bash</div>
                        </div>
                        <div class="terminal-body">
                            <span class="prompt-symbol">$</span>
                            <textarea
                                id="name"
                                v-model="dockerRunCommand"
                                type="text"
                                class="docker-run-input"
                                required
                                placeholder="docker run -d -p 80:80 nginx"
                            ></textarea>
                        </div>
                        <div class="terminal-footer">
                            <button class="btn btn-action" @click="convertDockerRun">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/>
                                </svg>
                                {{ $t("Convert to Compose") }}
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Agents -->
                <div class="home-section agents-section">
                    <div class="section-header">
                        <h3 class="section-title">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>
                            {{ $tc("dockgeAgent", 2) }}
                            <span class="badge-beta">beta</span>
                        </h3>
                        <p class="section-subtitle">{{ $t("Manage connected Dockge instances") || "Manage connected Dockge instances" }}</p>
                    </div>
                    <div class="panel modern-panel">
                        <div class="agents-list">
                            <div v-for="(agent, endpoint) in $root.agentList" :key="endpoint" class="agent-row">
                                <!-- Status -->
                                <div class="agent-status-wrapper">
                                    <template v-if="$root.agentStatusList[endpoint]">
                                        <span
                                            class="agent-dot"
                                            :class="{
                                                'online': $root.agentStatusList[endpoint] === 'online',
                                                'offline': $root.agentStatusList[endpoint] === 'offline'
                                            }"
                                        ></span>
                                    </template>
                                </div>
                                
                                <div class="agent-info">
                                    <span v-if="endpoint === ''" class="agent-name">{{ $t("currentEndpoint") }}</span>
                                    <a v-else :href="agent.url" target="_blank" class="agent-name link">{{ endpoint }}</a>
                                    
                                    <span v-if="endpoint !== ''" class="agent-url-label">{{ agent.url }}</span>
                                </div>

                                <button
                                    v-if="endpoint !== ''"
                                    class="remove-btn"
                                    @click="showRemoveAgentDialog[agent.url] = !showRemoveAgentDialog[agent.url]"
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                                    </svg>
                                </button>

                                <BModal v-model="showRemoveAgentDialog[agent.url]" :okTitle="$t('removeAgent')" okVariant="danger" @ok="removeAgent(agent.url)">
                                    <p>{{ agent.url }}</p>
                                    {{ $t("removeAgentMsg") }}
                                </BModal>
                            </div>

                            <div v-if="Object.keys($root.agentList).length === 0" class="no-agents">
                                <div class="no-agents-icon">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
                                </div>
                                <span class="no-agents-text">{{ $t("No agents connected") || 'No agents connected' }}</span>
                            </div>
                        </div>

                        <div class="agent-actions-container">
                            <button v-if="!showAgentForm" class="btn btn-outline-dashed btn-sm" @click="showAgentForm = !showAgentForm">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                                    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                                </svg>
                                {{ $t("addAgent") }}
                            </button>

                            <!-- Add Agent Form -->
                            <form v-if="showAgentForm" class="agent-form" @submit.prevent="addAgent">
                                <div class="form-group">
                                    <label class="form-label">{{ $t("dockgeURL") }}</label>
                                    <input id="url" v-model="agent.url" type="url" class="form-control" required placeholder="http://" />
                                </div>
                                <div class="form-group">
                                    <label class="form-label">{{ $t("Username") }}</label>
                                    <input id="username" v-model="agent.username" type="text" class="form-control" required />
                                </div>
                                <div class="form-group">
                                    <label class="form-label">{{ $t("Password") }}</label>
                                    <input id="password" v-model="agent.password" type="password" class="form-control" required autocomplete="new-password" />
                                </div>
                                <div class="form-actions">
                                    <button type="submit" class="btn linear-btn-primary" :disabled="connectingAgent">
                                        {{ connectingAgent ? $t("connecting") : $t("connect") }}
                                    </button>
                                    <button type="button" class="btn linear-btn-outline" @click="showAgentForm = false">
                                        {{ $t("Cancel") || 'Cancel' }}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        </transition>
        <router-view ref="child" />
    </div>
</template>

<script>
import { statusNameShort } from "../../../common/util-common";

export default {
    components: {},
    props: {
        calculatedHeight: {
            type: Number,
            default: 0,
        },
    },
    data() {
        return {
            dockerRunCommand: "",
            showAgentForm: false,
            showRemoveAgentDialog: {},
            connectingAgent: false,
            agent: {
                url: "http://",
                username: "",
                password: "",
            },
        };
    },

    computed: {
        activeNum() {
            return this.getStatusNum("active");
        },
        inactiveNum() {
            return this.getStatusNum("inactive");
        },
        exitedNum() {
            return this.getStatusNum("exited");
        },
    },

    methods: {
        addAgent() {
            this.connectingAgent = true;
            this.$root.getSocket().emit("addAgent", this.agent, (res) => {
                this.$root.toastRes(res);
                if (res.ok) {
                    this.showAgentForm = false;
                    this.agent = { url: "http://", username: "", password: "" };
                }
                this.connectingAgent = false;
            });
        },

        removeAgent(url) {
            this.$root.getSocket().emit("removeAgent", url, (res) => {
                if (res.ok) {
                    this.$root.toastRes(res);
                    let urlObj = new URL(url);
                    let endpoint = urlObj.host;
                    delete this.$root.allAgentStackList[endpoint];
                }
            });
        },

        getStatusNum(statusName) {
            let num = 0;
            for (let stackName in this.$root.completeStackList) {
                const stack = this.$root.completeStackList[stackName];
                if (statusNameShort(stack.status) === statusName) {
                    num += 1;
                }
            }
            return num;
        },

        convertDockerRun() {
            if (this.dockerRunCommand.trim() === "docker run") {
                throw new Error("Please enter a docker run command");
            }
            this.$root.getSocket().emit("composerize", this.dockerRunCommand, (res) => {
                if (res.ok) {
                    this.$root.composeTemplate = res.composeTemplate;
                    this.$router.push("/compose");
                } else {
                    this.$root.toastRes(res);
                }
            });
        },
    },
};
</script>

<style lang="scss" scoped>
@import "../styles/vars.scss";

.home-page {
    max-width: 1040px;
    margin: 0 auto;
    padding-bottom: 40px;
}

// =====================
// Page header
// =====================
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
    
    .page-subtitle {
        font-size: 13px;
        color: $dark-font-color3;
        margin: 0;
    }
}

// =====================
// Stats
// =====================
.stats-row {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    margin-bottom: 40px;

    @media (max-width: 850px) {
        grid-template-columns: repeat(2, 1fr);
    }
    @media (max-width: 480px) {
        grid-template-columns: 1fr;
    }
}

.stat-card {
    background-color: $dark-bg3;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 12px;
    padding: 20px 24px;
    display: flex;
    flex-direction: column;
    gap: 14px;
    position: relative;
    overflow: hidden;
    transition: border-color 150ms ease;

    &:hover { 
        border-color: rgba(255, 255, 255, 0.2); 
    }
}

.stat-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
}

.stat-label {
    font-size: 11px;
    font-weight: 500;
    color: $dark-font-color2;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-top: 4px;
}

.stat-icon-wrapper {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: 10px;
    
    &.running { background: rgba(#4ade80, 0.15); color: #4ade80; }
    &.exited { background: rgba(#f87171, 0.15); color: #f87171; }
    &.inactive { background: rgba(255,255,255,0.08); color: $dark-font-color3; }
    &.total { background: rgba(96, 165, 250, 0.15); color: #60a5fa; }
}

.stat-value {
    font-size: 28px;
    font-weight: 600;
    letter-spacing: -0.03em;
    line-height: 1;

    &.running  { color: #4ade80; }
    &.exited   { color: #f87171; }
    &.inactive { color: $dark-font-color3; }
    &.total    { color: #60a5fa; }
}

// =====================
// Columns layout
// =====================
.home-columns {
    display: grid;
    grid-template-columns: 1.3fr 1fr;
    gap: 24px;
    align-items: stretch;

    @media (max-width: 900px) {
        grid-template-columns: 1fr;
    }
}

.section-header {
    margin-bottom: 16px;
}

.section-title {
    font-size: 12px;
    font-weight: 500;
    color: $dark-font-color;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    margin: 0 0 6px 0;
    display: flex;
    align-items: center;
    gap: 8px;

    svg {
        color: $dark-font-color2;
    }
}

.section-subtitle {
    font-size: 12px;
    color: $dark-font-color3;
    margin: 0;
}

.badge-beta {
    font-size: 10px;
    font-weight: 600;
    color: #f5bd4f;
    background-color: rgba(#f5bd4f, 0.12);
    border: 1px solid rgba(#f5bd4f, 0.2);
    border-radius: 4px;
    padding: 2px 6px;
    text-transform: uppercase;
    letter-spacing: 0.04em;
}

// =====================
// Terminal panel
// =====================
.terminal-panel {
    background-color: #0b0c0f;
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 12px;
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 280px;
}

.terminal-header {
    background: rgba(255,255,255,0.03);
    border-bottom: 1px solid rgba(255,255,255,0.04);
    padding: 14px 16px;
    display: flex;
    align-items: center;
    position: relative;
    border-top-left-radius: 12px;
    border-top-right-radius: 12px;
}

.window-controls {
    display: flex;
    gap: 8px;
    
    .control {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        &.close { background-color: #ed6a5e; }
        &.minimize { background-color: #f5bd4f; }
        &.maximize { background-color: #61c454; }
    }
}

.terminal-title {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    font-size: 12px;
    color: $dark-font-color3;
    font-weight: 500;
    font-family: var(--font-mono);
}

.terminal-body {
    display: flex;
    padding: 20px;
    flex: 1;
    background: transparent;
}

.prompt-symbol {
    color: #4ade80;
    font-family: var(--font-mono);
    font-weight: 600;
    margin-right: 12px;
    font-size: 14px;
    padding-top: 2px;
}

.docker-run-input {
    width: 100%;
    background: transparent;
    border: none;
    outline: none;
    color: #e2e8f0;
    font-family: var(--font-mono);
    font-size: 14px;
    min-height: 140px;
    resize: none;
    line-height: 1.6;

    &::placeholder { color: rgba(255,255,255,0.15); }
}

.terminal-footer {
    padding: 14px 20px;
    border-top: 1px solid rgba(255,255,255,0.04);
    background-color: rgba(255,255,255,0.015);
    display: flex;
    justify-content: flex-end;
    border-bottom-left-radius: 12px;
    border-bottom-right-radius: 12px;
}

.btn-action {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    background-color: #e2e8f0;
    color: #0f172a;
    border-radius: 6px;
    font-weight: 600;
    font-size: 13px;
    border: none;
    cursor: pointer;
    transition: background-color 150ms ease;
    
    &:hover {
        background-color: #ffffff;
    }
}

// =====================
// Modern panel (Agents)
// =====================
.modern-panel {
    background-color: $dark-bg3;
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 12px;
    padding: 20px;
    height: 100%;
    display: flex;
    flex-direction: column;
}

.agents-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.agent-row {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 12px 14px;
    border: 1px solid rgba(255,255,255,0.04);
    border-radius: 10px;
    background: rgba(0,0,0,0.15);
    transition: all 150ms ease;

    &:hover {
        background: rgba(0,0,0,0.25);
        border-color: rgba(255,255,255,0.1);
    }
}

.agent-status-wrapper {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: rgba(255,255,255,0.05);
}

.agent-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
    background-color: $dark-font-color3;

    &.online  { background-color: #4ade80; box-shadow: 0 0 8px rgba(74,222,128,0.5); }
    &.offline { background-color: #f87171; box-shadow: 0 0 8px rgba(248,113,113,0.5);}
}

.agent-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.agent-name {
    font-size: 14px;
    font-weight: 500;
    color: $dark-font-color;

    &.link {
        text-decoration: none;
        &:hover { color: #60a5fa; }
    }
}

.agent-url-label {
    font-size: 11px;
    color: $dark-font-color3;
}

.remove-btn {
    background: none;
    border: none;
    cursor: pointer;
    color: $dark-font-color3;
    display: flex;
    align-items: center;
    padding: 6px;
    border-radius: 6px;
    transition: color 150ms ease, background-color 150ms ease;

    &:hover {
        color: #f87171;
        background-color: rgba(#f87171, 0.1);
    }
}

.no-agents {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 30px 10px;
    gap: 12px;
    background: rgba(0,0,0,0.1);
    border-radius: 10px;
    border: 1px dashed rgba(255,255,255,0.08);
    
    .no-agents-icon {
        color: $dark-font-color3;
        opacity: 0.5;
    }
    
    .no-agents-text {
        font-size: 13px;
        color: $dark-font-color3;
    }
}

.agent-actions-container {
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px dashed rgba(255,255,255,0.08);
}

.btn-outline-dashed {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    width: 100%;
    justify-content: center;
    padding: 10px;
    background: transparent;
    color: $dark-font-color2;
    border: 1px dashed rgba(255,255,255,0.15);
    border-radius: 8px;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 150ms ease;

    &:hover {
        background: rgba(255,255,255,0.03);
        border-color: #60a5fa;
        color: #60a5fa;
    }
}

// =====================
// Agent form
// =====================
.agent-form {
    margin-top: 12px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    background: rgba(0,0,0,0.15);
    padding: 16px;
    border-radius: 10px;
    border: 1px solid rgba(255,255,255,0.04);
}

.form-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.form-label {
    font-size: 12px;
    color: $dark-font-color2;
    font-weight: 500;
}

.form-control {
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 6px;
    padding: 8px 12px;
    color: $dark-font-color;
    font-size: 13px;
    outline: none;
    transition: border-color 150ms ease;
    
    &:focus {
        border-color: #60a5fa;
    }
}

.form-actions {
    display: flex;
    gap: 10px;
    padding-top: 8px;
    
    .btn {
        flex: 1;
    }
}
</style>

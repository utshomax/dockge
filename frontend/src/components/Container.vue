<template>
    <div class="container-card mb-3">
        <!-- Header row -->
        <div class="container-header">
            <div class="container-info">
                <span class="container-name">{{ name }}</span>
                <span class="container-image">
                    <span class="image-name">{{ imageName }}</span><span class="image-sep">:</span><span class="image-tag">{{ imageTag }}</span>
                </span>
            </div>

            <!-- View mode: status badge + ports + bash button -->
            <div v-if="!isEditMode" class="container-meta">
                <span v-if="status" class="status-badge" :class="statusClass">{{ status }}</span>
                <a v-for="port in (ports ?? envsubstService.ports)" :key="port" :href="parsePort(port).url" target="_blank" class="port-badge">
                    {{ parsePort(port).display }}
                </a>
                <router-link class="btn btn-normal btn-sm" :to="terminalRouteLink">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>
                    Bash
                </router-link>
            </div>

            <!-- Edit mode: edit + delete buttons -->
            <div v-if="isEditMode" class="container-edit-actions">
                <button class="btn btn-normal btn-sm" @click="showConfig = !showConfig">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
                    {{ $t("Edit") }}
                </button>
                <button class="btn btn-danger btn-sm" @click="remove">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                    {{ $t("deleteContainer") }}
                </button>
            </div>
        </div>

        <!-- Expanded config section -->
        <transition name="slide-fade" appear>
            <div v-if="isEditMode && showConfig" class="container-config">
                <!-- Image -->
                <div class="config-field">
                    <label class="config-label">{{ $t("dockerImage") }}</label>
                    <input v-model="service.image" class="form-control" list="image-datalist" />
                    <datalist id="image-datalist">
                        <option value="louislam/uptime-kuma:1" />
                    </datalist>
                </div>

                <!-- Ports -->
                <div class="config-field">
                    <label class="config-label">{{ $tc("port", 2) }}</label>
                    <ArrayInput name="ports" :display-name="$t('port')" placeholder="HOST:CONTAINER" />
                </div>

                <!-- Volumes -->
                <div class="config-field">
                    <label class="config-label">{{ $tc("volume", 2) }}</label>
                    <ArrayInput name="volumes" :display-name="$t('volume')" placeholder="HOST:CONTAINER" />
                </div>

                <!-- Restart Policy -->
                <div class="config-field">
                    <label class="config-label">{{ $t("restartPolicy") }}</label>
                    <select v-model="service.restart" class="form-select">
                        <option value="always">{{ $t("restartPolicyAlways") }}</option>
                        <option value="unless-stopped">{{ $t("restartPolicyUnlessStopped") }}</option>
                        <option value="on-failure">{{ $t("restartPolicyOnFailure") }}</option>
                        <option value="no">{{ $t("restartPolicyNo") }}</option>
                    </select>
                </div>

                <!-- Environment Variables -->
                <div class="config-field">
                    <label class="config-label">{{ $tc("environmentVariable", 2) }}</label>
                    <ArrayInput name="environment" :display-name="$t('environmentVariable')" placeholder="KEY=VALUE" />
                </div>

                <!-- Network -->
                <div class="config-field">
                    <label class="config-label">{{ $tc("network", 2) }}</label>
                    <div v-if="networkList.length === 0 && service.networks && service.networks.length > 0" class="config-warning">
                        {{ $t("NoNetworksAvailable") }}
                    </div>
                    <ArraySelect name="networks" :display-name="$t('network')" placeholder="Network Name" :options="networkList" />
                </div>

                <!-- Depends on -->
                <div class="config-field">
                    <label class="config-label">{{ $t("dependsOn") }}</label>
                    <ArrayInput name="depends_on" :display-name="$t('dependsOn')" :placeholder="$t(`containerName`)" />
                </div>
            </div>
        </transition>
    </div>
</template>

<script>
import { defineComponent } from "vue";
import { parseDockerPort } from "../../../common/util-common";

export default defineComponent({
    components: {},
    props: {
        name: {
            type: String,
            required: true,
        },
        isEditMode: {
            type: Boolean,
            default: false,
        },
        first: {
            type: Boolean,
            default: false,
        },
        status: {
            type: String,
            default: "N/A",
        },
        ports: {
            type: Array,
            default: null
        }
    },
    emits: [
    ],
    data() {
        return {
            showConfig: false,
        };
    },
    computed: {

        networkList() {
            let list = [];
            for (const networkName in this.jsonObject.networks) {
                list.push(networkName);
            }
            return list;
        },

        statusClass() {
            if (this.status === "running" || this.status === "healthy") {
                return "status-running";
            } else if (this.status === "unhealthy") {
                return "status-exited";
            } else {
                return "status-inactive";
            }
        },

        terminalRouteLink() {
            if (this.endpoint) {
                return {
                    name: "containerTerminalEndpoint",
                    params: {
                        endpoint: this.endpoint,
                        stackName: this.stackName,
                        serviceName: this.name,
                        type: "bash",
                    },
                };
            } else {
                return {
                    name: "containerTerminal",
                    params: {
                        stackName: this.stackName,
                        serviceName: this.name,
                        type: "bash",
                    },
                };
            }
        },

        endpoint() {
            return this.$parent.$parent.endpoint;
        },

        stack() {
            return this.$parent.$parent.stack;
        },

        stackName() {
            return this.$parent.$parent.stack.name;
        },

        service() {
            if (!this.jsonObject.services[this.name]) {
                return {};
            }
            return this.jsonObject.services[this.name];
        },

        jsonObject() {
            return this.$parent.$parent.jsonConfig;
        },

        envsubstJSONConfig() {
            return this.$parent.$parent.envsubstJSONConfig;
        },

        envsubstService() {
            if (!this.envsubstJSONConfig.services[this.name]) {
                return {};
            }
            return this.envsubstJSONConfig.services[this.name];
        },

        imageName() {
            if (this.envsubstService.image) {
                return this.envsubstService.image.split(":")[0];
            } else {
                return "";
            }
        },

        imageTag() {
            if (this.envsubstService.image) {
                let tag = this.envsubstService.image.split(":")[1];

                if (tag) {
                    return tag;
                } else {
                    return "latest";
                }
            } else {
                return "";
            }
        },
    },
    mounted() {
        if (this.first) {
            //this.showConfig = true;
        }
    },
    methods: {
        parsePort(port) {
            if (this.stack.endpoint) {
                return parseDockerPort(port, this.stack.primaryHostname);
            } else {
                let hostname = this.$root.info.primaryHostname || location.hostname;
                return parseDockerPort(port, hostname);
            }
        },
        remove() {
            delete this.jsonObject.services[this.name];
        },
    }
});
</script>

<style scoped lang="scss">
@import "../styles/vars";

.container-card {
    background-color: $dark-bg3;
    border: 1px solid $dark-border-color;
    border-radius: 8px;
    overflow: hidden;
    transition: border-color 160ms ease;

    &:hover { border-color: rgba(255, 255, 255, 0.08); }
}

// ======================
// Header
// ======================
.container-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 12px 14px;
    flex-wrap: wrap;
}

.container-info {
    display: flex;
    flex-direction: column;
    gap: 3px;
    min-width: 0;
}

.container-name {
    font-size: 13px;
    font-weight: 500;
    color: $dark-font-color;
    letter-spacing: -0.01em;
}

.container-image {
    font-size: 12px;
    color: $dark-font-color3;
    font-family: var(--font-mono);
}

.image-name { color: $dark-font-color2; }
.image-sep  { color: $dark-font-color3; margin: 0 1px; }
.image-tag  { color: $dark-font-color3; }

// ======================
// Meta (view mode)
// ======================
.container-meta {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
    flex-shrink: 0;
}

.status-badge {
    font-size: 11px;
    font-weight: 500;
    padding: 2px 7px;
    border-radius: 4px;
    &.status-running  { background-color: rgba(#4ade80, 0.12); color: #4ade80; }
    &.status-exited   { background-color: rgba(#f87171, 0.12); color: #f87171; }
    &.status-inactive { background-color: rgba(255, 255, 255, 0.06); color: $dark-font-color3; }
}

.port-badge {
    font-size: 11px;
    font-family: var(--font-mono);
    padding: 2px 7px;
    border-radius: 4px;
    background-color: $dark-bg2;
    border: 1px solid $dark-border-color;
    color: $dark-font-color2;
    text-decoration: none;
    transition: border-color 120ms ease, color 120ms ease;

    &:hover { border-color: rgba(255,255,255,0.15); color: $dark-font-color; }
}

// ======================
// Edit actions
// ======================
.container-edit-actions {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-shrink: 0;
}

// ======================
// Config (expanded)
// ======================
.container-config {
    padding: 14px;
    border-top: 1px solid $dark-border-color;
    display: flex;
    flex-direction: column;
    gap: 16px;
    background-color: rgba(255,255,255,0.01);
}

.config-field {
    display: flex;
    flex-direction: column;
    gap: 5px;
}

.config-label {
    font-size: 12px;
    font-weight: 500;
    color: $dark-font-color3;
}

.config-warning {
    font-size: 12px;
    color: $warning;
    margin-bottom: 6px;
}
</style>

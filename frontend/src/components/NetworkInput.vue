<template>
    <div class="networks-section">
        <div class="network-group-title">{{ $t("Internal Networks") }}</div>
        
        <div v-if="networkList.length > 0" class="linear-list">
            <div v-for="(networkRow, index) in networkList" :key="index" class="linear-list-item">
                <input v-model="networkRow.key" type="text" class="domain-input" :placeholder="$t(`Network name...`)" />
                <button class="remove-btn" @click="remove(index)">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                </button>
            </div>
        </div>

        <button class="btn linear-btn-ghost mt-3 me-2" @click="addField">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            {{ $t("addInternalNetwork") }}
        </button>

        <div class="network-group-title mt-4">{{ $t("External Networks") }}</div>

        <div v-if="externalNetworkList.length === 0" class="empty-state">
            {{ $t("No External Networks") }}
        </div>

        <div class="external-networks-list mt-2">
            <span
                v-for="(networkName, index) in externalNetworkList"
                :key="networkName"
                class="network-badge"
                :class="{ 'active': selectedExternalList[networkName] }"
                @click="selectedExternalList[networkName] = !selectedExternalList[networkName]"
            >
                {{ networkName }}
            </span>
        </div>
    </div>
</template>

<script>
export default {
    data() {
        return {
            networkList: [],
            externalList: {},
            selectedExternalList: {},
            externalNetworkList: [],
        };
    },
    computed: {
        jsonConfig() {
            return this.$parent.$parent.jsonConfig;
        },

        stack() {
            return this.$parent.$parent.stack;
        },

        editorFocus() {
            return this.$parent.$parent.editorFocus;
        },

        endpoint() {
            return this.$parent.$parent.endpoint;
        },
    },
    watch: {
        "jsonConfig.networks": {
            handler() {
                if (this.editorFocus) {
                    console.debug("jsonConfig.networks changed");
                    this.loadNetworkList();
                }
            },
            deep: true,
        },

        "selectedExternalList": {
            handler() {
                for (const networkName in this.selectedExternalList) {
                    const enable = this.selectedExternalList[networkName];

                    if (enable) {
                        if (!this.externalList[networkName]) {
                            this.externalList[networkName] = {};
                        }
                        this.externalList[networkName].external = true;
                    } else {
                        delete this.externalList[networkName];
                    }
                }
                this.applyToYAML();
            },
            deep: true,
        },

        "networkList": {
            handler() {
                this.applyToYAML();
            },
            deep: true,
        }

    },
    mounted() {
        this.loadNetworkList();
        this.loadExternalNetworkList();
    },
    methods: {
        loadNetworkList() {
            this.networkList = [];
            this.externalList = {};

            for (const key in this.jsonConfig.networks) {
                let obj = {
                    key: key,
                    value: this.jsonConfig.networks[key],
                };

                if (obj.value && obj.value.external) {
                    this.externalList[key] = Object.assign({}, obj.value);
                } else {
                    this.networkList.push(obj);
                }
            }

            // Restore selectedExternalList
            this.selectedExternalList = {};
            for (const networkName in this.externalList) {
                this.selectedExternalList[networkName] = true;
            }
        },

        loadExternalNetworkList() {
            this.$root.emitAgent(this.endpoint, "getDockerNetworkList", (res) => {
                if (res.ok) {
                    this.externalNetworkList = res.dockerNetworkList.filter((n) => {
                        // Filter out this stack networks
                        if (n.startsWith(this.stack.name + "_")) {
                            return false;
                        }
                        // They should be not supported.
                        // https://docs.docker.com/compose/compose-file/06-networks/#host-or-none
                        if (n === "none" || n === "host" || n === "bridge") {
                            return false;
                        }
                        return true;
                    });
                } else {
                    this.$root.toastRes(res);
                }
            });
        },

        addField() {
            this.networkList.push({
                key: "",
                value: {},
            });
        },

        remove(index) {
            this.networkList.splice(index, 1);
            this.applyToYAML();
        },

        applyToYAML() {
            if (this.editorFocus) {
                return;
            }

            this.jsonConfig.networks = {};

            // Internal networks
            for (const networkRow of this.networkList) {
                this.jsonConfig.networks[networkRow.key] = networkRow.value;
            }

            // External networks
            for (const networkName in this.externalList) {
                this.jsonConfig.networks[networkName] = this.externalList[networkName];
            }

            console.debug("applyToYAML", this.jsonConfig.networks);
        }

    },
};
</script>

<style lang="scss" scoped>
@import "../styles/vars.scss";

.linear-list {
    display: flex;
    flex-direction: column;
    gap: 8px;

    .linear-list-item {
        display: flex;
        align-items: center;
        background-color: $dark-bg2;
        border: 1px solid $dark-border-color;
        border-radius: 6px;
        padding: 6px 12px;
        transition: border-color 0.2s ease;

        &:focus-within {
            border-color: rgba(255, 255, 255, 0.25);
        }

        .domain-input {
            flex-grow: 1;
            background-color: transparent;
            border: none;
            color: $dark-font-color;
            outline: none;
            font-size: 13px;

            &::placeholder {
                color: rgba(255, 255, 255, 0.2);
            }
        }
        
        .remove-btn {
            background: transparent;
            border: none;
            color: #f87171;
            cursor: pointer;
            padding: 4px;
            display: flex;
            align-items: center;
            opacity: 0.6;
            transition: opacity 0.2s;
            &:hover {
                opacity: 1;
            }
        }
    }
}

.network-group-title {
    font-size: 11px;
    font-weight: 500;
    color: $dark-font-color3;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 8px;
}

.network-label {
    font-size: 13px;
    color: $dark-font-color;
    cursor: pointer;
}

.external-networks-list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}

.network-badge {
    font-size: 12px;
    padding: 4px 10px;
    border-radius: 12px;
    background-color: $dark-bg2;
    color: $dark-font-color3;
    border: 1px solid $dark-border-color;
    cursor: pointer;
    transition: all 0.2s ease;
    user-select: none;

    &:hover {
        border-color: rgba(255, 255, 255, 0.2);
        color: $dark-font-color2;
    }

    &.active {
        background-color: #f3f4f6;
        color: #111827;
        border-color: transparent;
        font-weight: 500;
    }
}

.empty-state {
    font-size: 13px;
    color: $dark-font-color3;
    padding: 8px 0;
}
</style>

<template>
    <transition name="slide-fade" appear>
        <div class="compose-page">
            <!-- Page header -->
            <div class="compose-header">
                <div class="compose-title">
                    <h1 v-if="isAdd">{{ $t("compose") }}</h1>
                    <h1 v-else class="flex-title">
                        <Uptime :stack="globalStack" class="title-dot" />
                        {{ stack.name }}
                        <span v-if="$root.agentCount > 1" class="agent-tag">{{ endpointDisplay }}</span>
                    </h1>
                </div>

                <!-- Action buttons -->
                <div v-if="stack.isManagedByDockge" class="compose-actions">
                    <!-- Edit Mode Actions -->
                    <button v-if="isEditMode" class="btn linear-btn-primary" :disabled="processing" @click="deployStack">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4.5 16.5c-1.5 1.5-1.5 2.5 0 4 1.5 1.5 2.5 1.5 4 0l8-8c1.5-1.5 1.5-2.5 0-4L12 4c-1.5-1.5-2.5-1.5-4 0L4.5 8.5"/><path d="m22 2-7 7"/></svg>
                        Deploy
                    </button>
                    <button v-if="isEditMode" class="btn linear-btn-outline" :disabled="processing" @click="saveStack">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                        Save
                    </button>
                    <button v-if="isEditMode && !isAdd" class="btn linear-btn-ghost" :disabled="processing" @click="discardStack">
                        Discard
                    </button>

                    <!-- View Mode Actions -->
                    <button v-if="!isEditMode" class="btn linear-btn-outline" :disabled="processing" @click="enableEditMode">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
                        {{ $t("editStack") }}
                    </button>

                    <button v-if="!isEditMode && !active" class="btn btn-success" :disabled="processing" @click="startStack">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                        {{ $t("startStack") }}
                    </button>

                    <button v-if="!isEditMode && active" class="btn linear-btn-outline" :disabled="processing" @click="restartStack">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/></svg>
                        {{ $t("restartStack") }}
                    </button>

                    <button v-if="!isEditMode" class="btn linear-btn-outline" :disabled="processing" @click="updateStack">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                        {{ $t("updateStack") }}
                    </button>

                    <button v-if="!isEditMode && active" class="btn linear-btn-outline" :disabled="processing" @click="stopStack">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/></svg>
                        {{ $t("stopStack") }}
                    </button>

                    <!-- More actions dropdown -->
                    <div v-if="!isEditMode" class="dropdown">
                        <button class="btn linear-btn-outline" data-bs-toggle="dropdown">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="5" r="1" fill="currentColor"/><circle cx="12" cy="12" r="1" fill="currentColor"/><circle cx="12" cy="19" r="1" fill="currentColor"/></svg>
                        </button>
                        <ul class="dropdown-menu dropdown-menu-end">
                            <li>
                                <button class="dropdown-item" @click="downStack">
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/></svg>
                                    {{ $t("downStack") }}
                                </button>
                            </li>
                        </ul>
                    </div>

                    <button v-if="!isEditMode" class="btn btn-danger" :disabled="processing" @click="showDeleteDialog = !showDeleteDialog">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                        {{ $t("deleteStack") }}
                    </button>
                </div>
            </div>

            <!-- URLs -->
            <div v-if="urls.length > 0" class="url-list">
                <a v-for="(url, index) in urls" :key="index" target="_blank" :href="url.url" class="url-badge">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                    {{ url.display }}
                </a>
            </div>

            <!-- Progress Terminal -->
            <transition name="slide-fade" appear>
                <Terminal
                    v-show="showProgressTerminal"
                    ref="progressTerminal"
                    class="mb-3 terminal"
                    :name="terminalName"
                    :endpoint="endpoint"
                    :rows="progressTerminalRows"
                    @has-data="showProgressTerminal = true; submitted = true;"
                ></Terminal>
            </transition>

            <div v-if="stack.isManagedByDockge" class="compose-body">
                <div class="compose-column">
                    <!-- General -->
                    <div v-if="isAdd" class="section">
                        <div class="section-label">{{ $t("general") }}</div>
                        <div class="panel big-panel">
                            <!-- Stack Name -->
                            <div class="field-row">
                                <label for="name" class="field-label">{{ $t("stackName") }}</label>
                                <input id="name" v-model="stack.name" type="text" class="form-control" required @blur="stackNameToLowercase">
                                <div class="field-hint">{{ $t("Lowercase only") }}</div>
                            </div>

                            <!-- Endpoint -->
                            <div class="field-row mt-3">
                                <label for="endpoint" class="field-label">{{ $t("dockgeAgent") }}</label>
                                <select id="endpoint" v-model="stack.endpoint" class="form-select">
                                    <option v-for="(agent, endpoint) in $root.agentList" :key="endpoint" :value="endpoint" :disabled="$root.agentStatusList[endpoint] != 'online'">
                                        ({{ $root.agentStatusList[endpoint] }}) {{ (endpoint) ? endpoint : $t("currentEndpoint") }}
                                    </option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <!-- Containers -->
                    <div class="section">
                        <div class="section-label">{{ $tc("container", 2) }}</div>

                        <div v-if="isEditMode" class="add-container-row">
                            <input
                                v-model="newContainerName"
                                :placeholder="$t(`New Container Name...`)"
                                class="add-container-input"
                                @keyup.enter="addContainer"
                            />
                            <button class="add-container-btn" @click="addContainer">
                                {{ $t("addContainer") }}
                            </button>
                        </div>

                        <div ref="containerList">
                            <Container
                                v-for="(service, name) in jsonConfig.services"
                                :key="name"
                                :name="name"
                                :is-edit-mode="isEditMode"
                                :first="name === Object.keys(jsonConfig.services)[0]"
                                :status="serviceStatusList[name]?.state"
                                :ports="serviceStatusList[name]?.ports"
                            />
                        </div>
                    </div>

                    <!-- Extra -->
                    <div v-if="isEditMode" class="section">
                        <div class="section-label">{{ $t("extra") }}</div>
                        <!-- URLs -->
                        <div class="mt-2">
                            <ArrayInput name="urls" :display-name="$t('url')" placeholder="https://" object-type="x-dockge" />
                        </div>
                    </div>

                    <!-- Combined Terminal Output -->
                    <div v-show="!isEditMode" class="section">
                        <div class="section-label">{{ $t("terminal") }}</div>
                        <div ref="terminalContainerEl" class="terminal-container mt-2" :class="{ fullscreen: isTerminalFullscreen }">
                            <Terminal
                                ref="combinedTerminal"
                                class="combined-terminal"
                                :style="isTerminalFullscreen ? { height: '100%' } : {}"
                                :name="combinedTerminalName"
                                :endpoint="endpoint"
                                :rows="combinedTerminalRows"
                                :cols="combinedTerminalCols"
                            ></Terminal>
                            <button class="fullscreen-btn" @click="toggleTerminalFullscreen" :title="isTerminalFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'">
                                <svg v-if="!isTerminalFullscreen" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/>
                                </svg>
                                <svg v-else width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M8 3v3a2 2 0 0 1-2 2H3"/><path d="M21 8h-3a2 2 0 0 1-2-2V3"/><path d="M3 16h3a2 2 0 0 1 2 2v3"/><path d="M16 21v-3a2 2 0 0 1 2-2h3"/>
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
                <div class="compose-column">
                    <!-- YAML editor -->
                    <div class="section">
                        <div class="section-label">{{ stack.composeFileName || 'compose.yaml' }}</div>
                        <div class="editor-panel mt-2" :class="{'edit-mode': isEditMode, 'fullscreen': isYamlFullscreen}">
                            <code-mirror
                                ref="editor"
                                v-model="stack.composeYAML"
                                :extensions="extensions"
                                minimal
                                :wrap="true"
                                :dark="true"
                                :tab="true"
                                :disabled="!isEditMode"
                                :hasFocus="editorFocus"
                                :scrollIntoView="false"
                            />
                            <button v-if="isEditMode" class="fullscreen-btn" @click="toggleYamlFullscreen" :title="isYamlFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'">
                                <svg v-if="!isYamlFullscreen" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/>
                                </svg>
                                <svg v-else width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M8 3v3a2 2 0 0 1-2 2H3"/><path d="M21 8h-3a2 2 0 0 1-2-2V3"/><path d="M3 16h3a2 2 0 0 1 2 2v3"/><path d="M16 21v-3a2 2 0 0 1 2-2h3"/>
                                </svg>
                            </button>
                        </div>
                        <div v-if="isEditMode && yamlError" class="yaml-error">
                            {{ yamlError }}
                        </div>
                    </div>

                    <!-- ENV editor -->
                    <div v-if="isEditMode" class="section">
                        <div class="section-label">.env</div>
                        <div class="editor-panel mt-2" :class="{'edit-mode': isEditMode, 'fullscreen': isEnvFullscreen}">
                            <code-mirror
                                ref="envEditor"
                                v-model="stack.composeENV"
                                :extensions="extensionsEnv"
                                minimal
                                :wrap="true"
                                :dark="true"
                                :tab="true"
                                :disabled="!isEditMode"
                                :hasFocus="editorFocus"
                                :scrollIntoView="false"
                            />
                            <button class="fullscreen-btn" @click="toggleEnvFullscreen" :title="isEnvFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'">
                                <svg v-if="!isEnvFullscreen" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/>
                                </svg>
                                <svg v-else width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M8 3v3a2 2 0 0 1-2 2H3"/><path d="M21 8h-3a2 2 0 0 1-2-2V3"/><path d="M3 16h3a2 2 0 0 1 2 2v3"/><path d="M16 21v-3a2 2 0 0 1 2-2h3"/>
                                </svg>
                            </button>
                        </div>
                    </div>

                    <div v-if="isEditMode">
                        <!-- Networks -->
                        <div class="section">
                            <NetworkInput />
                        </div>
                    </div>

                    <!-- <div class="shadow-box big-padding mb-3">
                        <div class="mb-3">
                            <label for="name" class="form-label"> Search Templates</label>
                            <input id="name" v-model="name" type="text" class="form-control" placeholder="Search..." required>
                        </div>

                        <prism-editor v-if="false" v-model="yamlConfig" class="yaml-editor" :highlight="highlighter" line-numbers @input="yamlCodeChange"></prism-editor>
                    </div>-->
                </div>
            </div>

            <div v-if="!stack.isManagedByDockge && !processing" class="not-managed">
                {{ $t("stackNotManagedByDockgeMsg") }}
            </div>

            <!-- Delete Dialog -->
            <BModal v-model="showDeleteDialog" :cancelTitle="$t('cancel')" :okTitle="$t('deleteStack')" okVariant="danger" @ok="deleteDialog">
                {{ $t("deleteStackMsg") }}
            </BModal>
        </div>
    </transition>
</template>

<script>
import CodeMirror from "vue-codemirror6";
import { yaml } from "@codemirror/lang-yaml";
import { python } from "@codemirror/lang-python";
import { dracula as editorTheme } from "thememirror";
import { lineNumbers, EditorView } from "@codemirror/view";
import { parseDocument, Document } from "yaml";


import {
    COMBINED_TERMINAL_COLS,
    COMBINED_TERMINAL_ROWS,
    copyYAMLComments, envsubstYAML,
    getCombinedTerminalName,
    getComposeTerminalName,
    PROGRESS_TERMINAL_ROWS,
    RUNNING
} from "../../../common/util-common";
import { BModal } from "bootstrap-vue-next";
import NetworkInput from "../components/NetworkInput.vue";
import dotenv from "dotenv";
import { ref } from "vue";

const template = `
services:
  nginx:
    image: nginx:latest
    restart: unless-stopped
    ports:
      - "8080:80"
`;
const envDefault = "# VARIABLE=value #comment";

let yamlErrorTimeout = null;

let serviceStatusTimeout = null;

export default {
    components: {
        NetworkInput,
        CodeMirror,
        BModal,
    },
    beforeRouteUpdate(to, from, next) {
        this.exitConfirm(next);
    },
    beforeRouteLeave(to, from, next) {
        this.exitConfirm(next);
    },
    setup() {
        const editorFocus = ref(false);

        const focusEffectHandler = (state, focusing) => {
            editorFocus.value = focusing;
            return null;
        };

        const extensions = [
            editorTheme,
            yaml(),
            lineNumbers(),
            EditorView.focusChangeEffect.of(focusEffectHandler)
        ];

        const extensionsEnv = [
            editorTheme,
            python(),
            lineNumbers(),
            EditorView.focusChangeEffect.of(focusEffectHandler)
        ];

        return { extensions,
            extensionsEnv,
            editorFocus };
    },
    yamlDoc: null,  // For keeping the yaml comments
    data() {
        return {
            jsonConfig: {},
            envsubstJSONConfig: {},
            yamlError: "",
            processing: true,
            showProgressTerminal: false,
            progressTerminalRows: PROGRESS_TERMINAL_ROWS,
            combinedTerminalRows: COMBINED_TERMINAL_ROWS,
            combinedTerminalCols: COMBINED_TERMINAL_COLS,
            stack: {

            },
            serviceStatusList: {},
            isEditMode: false,
            submitted: false,
            showDeleteDialog: false,
            newContainerName: "",
            stopServiceStatusTimeout: false,
            isYamlFullscreen: false,
            isEnvFullscreen: false,
            isTerminalFullscreen: false,
        };
    },
    computed: {
        endpointDisplay() {
            return this.$root.endpointDisplayFunction(this.endpoint);
        },

        urls() {
            if (!this.envsubstJSONConfig["x-dockge"] || !this.envsubstJSONConfig["x-dockge"].urls || !Array.isArray(this.envsubstJSONConfig["x-dockge"].urls)) {
                return [];
            }

            let urls = [];
            for (const url of this.envsubstJSONConfig["x-dockge"].urls) {
                let display;
                try {
                    let obj = new URL(url);
                    let pathname = obj.pathname;
                    if (pathname === "/") {
                        pathname = "";
                    }
                    display = obj.host + pathname + obj.search;
                } catch (e) {
                    display = url;
                }

                urls.push({
                    display,
                    url,
                });
            }
            return urls;
        },

        isAdd() {
            return this.$route.path === "/compose" && !this.submitted;
        },

        /**
         * Get the stack from the global stack list, because it may contain more real-time data like status
         * @return {*}
         */
        globalStack() {
            return this.$root.completeStackList[this.stack.name + "_" + this.endpoint];
        },

        status() {
            return this.globalStack?.status;
        },

        active() {
            return this.status === RUNNING;
        },

        terminalName() {
            if (!this.stack.name) {
                return "";
            }
            return getComposeTerminalName(this.endpoint, this.stack.name);
        },

        combinedTerminalName() {
            if (!this.stack.name) {
                return "";
            }
            return getCombinedTerminalName(this.endpoint, this.stack.name);
        },

        networks() {
            return this.jsonConfig.networks;
        },

        endpoint() {
            return this.stack.endpoint || this.$route.params.endpoint || "";
        },

        url() {
            if (this.stack.endpoint) {
                return `/compose/${this.stack.name}/${this.stack.endpoint}`;
            } else {
                return `/compose/${this.stack.name}`;
            }
        },
    },
    watch: {
        "stack.composeYAML": {
            handler() {
                if (this.editorFocus) {
                    console.debug("yaml code changed");
                    this.yamlCodeChange();
                }
            },
            deep: true,
        },

        "stack.composeENV": {
            handler() {
                if (this.editorFocus) {
                    console.debug("env code changed");
                    this.yamlCodeChange();
                }
            },
            deep: true,
        },

        jsonConfig: {
            handler() {
                if (!this.editorFocus) {
                    console.debug("jsonConfig changed");

                    let doc = new Document(this.jsonConfig);

                    // Stick back the yaml comments
                    if (this.yamlDoc) {
                        copyYAMLComments(doc, this.yamlDoc);
                    }

                    this.stack.composeYAML = doc.toString();
                    this.yamlDoc = doc;
                }
            },
            deep: true,
        },

        $route(to, from) {

        }
    },
    mounted() {
        if (this.isAdd) {
            this.processing = false;
            this.isEditMode = true;

            let composeYAML;
            let composeENV;

            if (this.$root.composeTemplate) {
                composeYAML = this.$root.composeTemplate;
                this.$root.composeTemplate = "";
            } else {
                composeYAML = template;
            }
            if (this.$root.envTemplate) {
                composeENV = this.$root.envTemplate;
                this.$root.envTemplate = "";
            } else {
                composeENV = envDefault;
            }

            // Default Values
            this.stack = {
                name: "",
                composeYAML,
                composeENV,
                isManagedByDockge: true,
                endpoint: "",
            };

            this.yamlCodeChange();

        } else {
            this.stack.name = this.$route.params.stackName;
            this.loadStack();
        }

        this.requestServiceStatus();
        window.addEventListener("keydown", this.handleKeydown);
        this.$nextTick(() => {
            if (this.$refs.terminalContainerEl) {
                this._terminalResizeObserver = new ResizeObserver(() => {
                    this.$refs.combinedTerminal?.updateTerminalSize();
                });
                this._terminalResizeObserver.observe(this.$refs.terminalContainerEl);
            }
        });
    },
    unmounted() {
        window.removeEventListener("keydown", this.handleKeydown);
        this._terminalResizeObserver?.disconnect();
        document.body.classList.remove("page-fullscreen-active");
    },
    methods: {
        startServiceStatusTimeout() {
            clearTimeout(serviceStatusTimeout);
            serviceStatusTimeout = setTimeout(async () => {
                this.requestServiceStatus();
            }, 5000);
        },

        requestServiceStatus() {
            // Do not request if it is add mode
            if (this.isAdd) {
                return;
            }

            this.$root.emitAgent(this.endpoint, "serviceStatusList", this.stack.name, (res) => {
                if (res.ok) {
                    this.serviceStatusList = res.serviceStatusList;
                }
                if (!this.stopServiceStatusTimeout) {
                    this.startServiceStatusTimeout();
                }
            });
        },

        exitConfirm(next) {
            if (this.isEditMode) {
                if (confirm(this.$t("confirmLeaveStack"))) {
                    this.exitAction();
                    next();
                } else {
                    next(false);
                }
            } else {
                this.exitAction();
                next();
            }
        },

        exitAction() {
            console.log("exitAction");
            this.stopServiceStatusTimeout = true;
            clearTimeout(serviceStatusTimeout);

            // Leave Combined Terminal
            console.debug("leaveCombinedTerminal", this.endpoint, this.stack.name);
            this.$root.emitAgent(this.endpoint, "leaveCombinedTerminal", this.stack.name, () => {});
        },

        bindTerminal() {
            this.$refs.progressTerminal?.bind(this.endpoint, this.terminalName);
        },

        loadStack() {
            this.processing = true;
            this.$root.emitAgent(this.endpoint, "getStack", this.stack.name, (res) => {
                if (res.ok) {
                    this.stack = res.stack;
                    this.yamlCodeChange();
                    this.processing = false;
                    this.bindTerminal();
                } else {
                    this.$root.toastRes(res);
                }
            });
        },

        deployStack() {
            this.processing = true;

            if (!this.jsonConfig.services) {
                this.$root.toastError("No services found in compose.yaml");
                this.processing = false;
                return;
            }

            // Check if services is object
            if (typeof this.jsonConfig.services !== "object") {
                this.$root.toastError("Services must be an object");
                this.processing = false;
                return;
            }

            let serviceNameList = Object.keys(this.jsonConfig.services);

            // Set the stack name if empty, use the first container name
            if (!this.stack.name && serviceNameList.length > 0) {
                let serviceName = serviceNameList[0];
                let service = this.jsonConfig.services[serviceName];

                if (service && service.container_name) {
                    this.stack.name = service.container_name;
                } else {
                    this.stack.name = serviceName;
                }
            }

            this.bindTerminal();

            this.$root.emitAgent(this.stack.endpoint, "deployStack", this.stack.name, this.stack.composeYAML, this.stack.composeENV, this.isAdd, (res) => {
                this.processing = false;
                this.$root.toastRes(res);

                if (res.ok) {
                    this.isEditMode = false;
                    this.$router.push(this.url);
                }
            });
        },

        saveStack() {
            this.processing = true;

            this.$root.emitAgent(this.stack.endpoint, "saveStack", this.stack.name, this.stack.composeYAML, this.stack.composeENV, this.isAdd, (res) => {
                this.processing = false;
                this.$root.toastRes(res);

                if (res.ok) {
                    this.isEditMode = false;
                    this.$router.push(this.url);
                }
            });
        },

        startStack() {
            this.processing = true;

            this.$root.emitAgent(this.endpoint, "startStack", this.stack.name, (res) => {
                this.processing = false;
                this.$root.toastRes(res);
            });
        },

        stopStack() {
            this.processing = true;

            this.$root.emitAgent(this.endpoint, "stopStack", this.stack.name, (res) => {
                this.processing = false;
                this.$root.toastRes(res);
            });
        },

        downStack() {
            this.processing = true;

            this.$root.emitAgent(this.endpoint, "downStack", this.stack.name, (res) => {
                this.processing = false;
                this.$root.toastRes(res);
            });
        },

        restartStack() {
            this.processing = true;

            this.$root.emitAgent(this.endpoint, "restartStack", this.stack.name, (res) => {
                this.processing = false;
                this.$root.toastRes(res);
            });
        },

        updateStack() {
            this.processing = true;

            this.$root.emitAgent(this.endpoint, "updateStack", this.stack.name, (res) => {
                this.processing = false;
                this.$root.toastRes(res);
            });
        },

        deleteDialog() {
            this.$root.emitAgent(this.endpoint, "deleteStack", this.stack.name, (res) => {
                this.$root.toastRes(res);
                if (res.ok) {
                    this.$router.push("/");
                }
            });
        },

        discardStack() {
            this.loadStack();
            this.isEditMode = false;
        },

        yamlToJSON(yaml) {
            let doc = parseDocument(yaml);
            if (doc.errors.length > 0) {
                throw doc.errors[0];
            }

            const config = doc.toJS() ?? {};

            // Check data types
            // "services" must be an object
            if (!config.services) {
                config.services = {};
            }

            if (Array.isArray(config.services) || typeof config.services !== "object") {
                throw new Error("Services must be an object");
            }

            return {
                config,
                doc,
            };
        },

        yamlCodeChange() {
            try {
                let { config, doc } = this.yamlToJSON(this.stack.composeYAML);

                this.yamlDoc = doc;
                this.jsonConfig = config;

                let env = dotenv.parse(this.stack.composeENV);
                let envYAML = envsubstYAML(this.stack.composeYAML, env);
                this.envsubstJSONConfig = this.yamlToJSON(envYAML).config;

                clearTimeout(yamlErrorTimeout);
                this.yamlError = "";
            } catch (e) {
                clearTimeout(yamlErrorTimeout);

                if (this.yamlError) {
                    this.yamlError = e.message;

                } else {
                    yamlErrorTimeout = setTimeout(() => {
                        this.yamlError = e.message;
                    }, 3000);
                }
            }
        },

        enableEditMode() {
            this.isEditMode = true;
        },

        checkYAML() {

        },

        addContainer() {
            this.checkYAML();

            if (this.jsonConfig.services[this.newContainerName]) {
                this.$root.toastError("Container name already exists");
                return;
            }

            if (!this.newContainerName) {
                this.$root.toastError("Container name cannot be empty");
                return;
            }

            this.jsonConfig.services[this.newContainerName] = {
                restart: "unless-stopped",
            };
            this.newContainerName = "";
            let element = this.$refs.containerList.lastElementChild;
            element.scrollIntoView({
                block: "start",
                behavior: "smooth"
            });
        },

        stackNameToLowercase() {
            this.stack.name = this.stack?.name?.toLowerCase();
        },

        toggleYamlFullscreen() {
            this.isYamlFullscreen = !this.isYamlFullscreen;
            this.syncFullscreenState();
        },

        toggleEnvFullscreen() {
            this.isEnvFullscreen = !this.isEnvFullscreen;
            this.syncFullscreenState();
        },

        toggleTerminalFullscreen() {
            this.isTerminalFullscreen = !this.isTerminalFullscreen;
            this.syncFullscreenState();
            this.refitCombinedTerminal();
        },

        syncFullscreenState() {
            const isFullscreenActive = this.isYamlFullscreen || this.isEnvFullscreen || this.isTerminalFullscreen;
            document.body.classList.toggle("page-fullscreen-active", isFullscreenActive);
        },

        refitCombinedTerminal() {
            this.$nextTick(() => {
                this.$refs.combinedTerminal?.updateTerminalSize();
            });
        },

        handleKeydown(e) {
            if (e.key === "Escape") {
                const hadTerminal = this.isTerminalFullscreen;
                this.isYamlFullscreen = false;
                this.isEnvFullscreen = false;
                this.isTerminalFullscreen = false;
                this.syncFullscreenState();
                if (hadTerminal) {
                    this.refitCombinedTerminal();
                }
            }
        },
    }
};
</script>

<style scoped lang="scss">
@import "../styles/vars.scss";

.compose-page {
    max-width: 1200px;
}

// =====================
// Header
// =====================
.compose-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 20px;
    flex-wrap: wrap;
}

.compose-title {
    h1 {
        font-size: 18px;
        font-weight: 600;
        color: $dark-font-color;
        letter-spacing: -0.02em;
        margin: 0;
    }

    .flex-title {
        display: flex;
        align-items: center;
        gap: 8px;
    }
}

.title-dot {
    flex-shrink: 0;
}

.agent-tag {
    font-size: 12px;
    font-weight: 400;
    color: $dark-font-color3;
}

.compose-actions {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
    flex-shrink: 0;
}

// =====================
// URL list
// =====================
.url-list {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 16px;
}

.url-badge {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 3px 8px;
    background-color: $dark-bg3;
    border: 1px solid $dark-border-color;
    border-radius: 4px;
    font-size: 12px;
    color: $dark-font-color2;
    text-decoration: none;
    transition: border-color 120ms ease, color 120ms ease;

    &:hover {
        border-color: rgba(255,255,255,0.15);
        color: $dark-font-color;
    }
}

// =====================
// Progress terminal
// =====================
.progress-terminal {
    height: 160px;
    border-radius: 8px;
    overflow: hidden;
    border: 1px solid $dark-border-color;
    margin-bottom: 20px;
}

// =====================
// Body (two columns)
// =====================
.compose-body {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    align-items: start;

    @media (max-width: 900px) {
        grid-template-columns: 1fr;
    }
}

// =====================
// Sections
// =====================
.section {
    margin-bottom: 20px;
}

.section-label {
    font-size: 11px;
    font-weight: 500;
    color: $dark-font-color3;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    margin-bottom: 8px;
}

// Fullscreen button — positioned inside each container
.fullscreen-btn {
    position: absolute;
    top: 8px;
    right: 8px;
    z-index: 10;
    background: rgba(0, 0, 0, 0.35);
    border: 1px solid rgba(255, 255, 255, 0.08);
    color: rgba(255, 255, 255, 0.35);
    cursor: pointer;
    padding: 4px 5px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    transition: color 120ms ease, background-color 120ms ease, border-color 120ms ease;

    &:hover {
        color: rgba(255, 255, 255, 0.85);
        background: rgba(0, 0, 0, 0.6);
        border-color: rgba(255, 255, 255, 0.2);
    }
}

// =====================
// Panels (cards)
// =====================
.panel {
    background-color: $dark-bg3;
    border: 1px solid $dark-border-color;
    border-radius: 8px;
    overflow: hidden;
}

.big-panel {
    padding: 16px;
}

// =====================
// Fields
// =====================
.field-row {
    margin-bottom: 14px;

    &:last-child { margin-bottom: 0; }
}

.field-label {
    font-size: 12px;
    font-weight: 500;
    color: $dark-font-color3;
    display: block;
    margin-bottom: 5px;
}

.field-hint {
    font-size: 11px;
    color: $dark-font-color3;
    margin-top: 4px;
}

// =====================
// Add container row
// =====================
.add-container-row {
    display: flex;
    margin-bottom: 12px;
    border-radius: 6px;
    border: 1px solid $dark-border-color;
    background-color: $dark-bg2;
    overflow: hidden;
    transition: border-color 0.2s ease;

    &:focus-within {
        border-color: rgba(255,255,255,0.3);
    }

    .add-container-input {
        flex: 1;
        border: none;
        background: transparent;
        box-shadow: none;
        outline: none;
        color: $dark-font-color;
        padding: 8px 12px;
        font-size: 13px;
        
        &::placeholder {
            color: rgba(255,255,255,0.3);
        }
    }

    .add-container-btn {
        border: none;
        border-left: 1px solid $dark-border-color;
        background-color: #f3f4f6;
        color: #111827;
        font-weight: 600;
        font-size: 13px;
        padding: 0 16px;
        transition: background-color 0.2s ease, opacity 0.2s ease;
        cursor: pointer;

        &:hover {
            background-color: #ffffff;
            opacity: 0.9;
        }
    }
}

// =====================
// Terminals
// =====================
.terminal-container {
    position: relative;
    border-radius: 8px;
    overflow: hidden;
    border: 1px solid $dark-border-color;

    &.fullscreen {
        position: fixed;
        inset: 0;
        z-index: 200;
        border-radius: 0;
        border: none;
    }
}

.combined-terminal {
    height: 300px;
}

// =====================
// YAML Editor
// =====================
.editor-panel {
    position: relative;
    background-color: #1e1e1e; /* Codemirror default dark background match */
    border: 1px solid $dark-border-color;
    border-radius: 8px;
    overflow: hidden;
    font-size: 13px;
    font-family: var(--font-mono);
    min-height: 300px;
    display: flex;
    flex-direction: column;

    &.edit-mode {
        border-color: rgba(255, 255, 255, 0.15);
    }

    &.fullscreen {
        position: fixed;
        inset: 0;
        z-index: 200;
        border-radius: 0;
        border: none;
        min-height: unset;
        overflow: auto;
    }
}
.editor-panel .vue-codemirror { /* target the inner editor wrapper */
    flex: 1;
    display: flex;
    flex-direction: column;
}
.editor-panel :deep(.cm-editor) {
    height: 100%;
    outline: none !important;
}

.yaml-error {
    margin-top: 6px;
    font-size: 12px;
    color: #f87171;
}

// =====================
// Not managed
// =====================
.not-managed {
    font-size: 13px;
    color: $dark-font-color2;
    padding: 16px;
    background-color: $dark-bg3;
    border: 1px solid $dark-border-color;
    border-radius: 8px;
}
</style>

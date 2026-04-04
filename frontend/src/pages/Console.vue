<template>
    <transition name="slide-fade" appear>
        <div v-if="!processing" class="console-page">
            <div class="page-header">
                <h1>{{ $t("console") }}</h1>
            </div>

            <div v-if="enableConsole" ref="terminalWrapper" class="terminal-wrapper" :class="{ fullscreen: isFullscreen }">
                <Terminal ref="terminal" class="terminal" :rows="20" mode="mainTerminal" name="console" :endpoint="endpoint" />
                <button class="fullscreen-btn" @click="toggleFullscreen" :title="isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'">
                    <svg v-if="!isFullscreen" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/>
                    </svg>
                    <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M8 3v3a2 2 0 0 1-2 2H3"/><path d="M21 8h-3a2 2 0 0 1-2-2V3"/><path d="M3 16h3a2 2 0 0 1 2 2v3"/><path d="M16 21v-3a2 2 0 0 1 2-2h3"/>
                    </svg>
                </button>
            </div>

            <div v-else class="console-disabled">
                <div class="console-disabled-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/>
                    </svg>
                </div>
                <div class="console-disabled-content">
                    <h3>{{ $t("Console is not enabled") }}</h3>
                    <p v-html="$t('ConsoleNotEnabledMSG1')"></p>
                    <p v-html="$t('ConsoleNotEnabledMSG2')"></p>
                    <p v-html="$t('ConsoleNotEnabledMSG3')"></p>
                </div>
            </div>
        </div>
    </transition>
</template>

<script>
export default {
    components: {},
    data() {
        return {
            processing: true,
            enableConsole: false,
            isFullscreen: false,
        };
    },
    computed: {
        endpoint() {
            return this.$route.params.endpoint || "";
        },
    },
    watch: {
        enableConsole(val) {
            if (val) {
                this.$nextTick(() => {
                    if (this.$refs.terminalWrapper) {
                        this._resizeObserver = new ResizeObserver(() => {
                            this.$refs.terminal?.updateTerminalSize();
                        });
                        this._resizeObserver.observe(this.$refs.terminalWrapper);
                    }
                });
            }
        },
    },
    mounted() {
        this.$root.emitAgent(this.endpoint, "checkMainTerminal", (res) => {
            this.enableConsole = res.ok;
            this.processing = false;
        });
        window.addEventListener("keydown", this.handleKeydown);
    },
    unmounted() {
        window.removeEventListener("keydown", this.handleKeydown);
        this._resizeObserver?.disconnect();
        document.body.classList.remove("page-fullscreen-active");
    },
    methods: {
        toggleFullscreen() {
            this.isFullscreen = !this.isFullscreen;
            this.syncFullscreenState();
            this.refitTerminal();
        },
        syncFullscreenState() {
            document.body.classList.toggle("page-fullscreen-active", this.isFullscreen);
        },
        handleKeydown(e) {
            if (e.key === "Escape" && this.isFullscreen) {
                this.isFullscreen = false;
                this.syncFullscreenState();
                this.refitTerminal();
            }
        },
        refitTerminal() {
            this.$nextTick(() => {
                this.$refs.terminal?.updateTerminalSize();
            });
        },
    },
};
</script>

<style scoped lang="scss">
@import "../styles/vars.scss";

.console-page {
    max-width: 960px;
    height: calc(100vh - 56px); // subtract content-panel's top + bottom padding (28px each)
    display: flex;
    flex-direction: column;
}

.page-header {
    margin-bottom: 20px;
    flex-shrink: 0;

    h1 {
        font-size: 18px;
        font-weight: 600;
        color: $dark-font-color;
        letter-spacing: -0.02em;
        margin: 0;
    }
}

// =====================
// Terminal wrapper
// =====================
.terminal-wrapper {
    position: relative;
    flex: 1;
    min-height: 0;
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

.terminal {
    width: 100%;
    height: 100%;
}

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
// Disabled state
// =====================
.console-disabled {
    display: flex;
    gap: 14px;
    align-items: flex-start;
    background-color: $dark-bg3;
    border: 1px solid $dark-border-color;
    border-radius: 8px;
    padding: 20px;
}

.console-disabled-icon {
    width: 36px;
    height: 36px;
    border-radius: 8px;
    background-color: rgba(255, 255, 255, 0.06);
    border: 1px solid $dark-border-color;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    color: $dark-font-color2;
}

.console-disabled-content {
    flex: 1;

    h3 {
        font-size: 14px;
        font-weight: 600;
        color: $dark-font-color;
        margin: 0 0 8px;
    }

    p {
        font-size: 13px;
        color: $dark-font-color2;
        margin: 0 0 6px;
        line-height: 1.6;

        &:last-child { margin-bottom: 0; }

        :deep(code) {
            font-family: var(--font-mono);
            font-size: 12px;
            background-color: rgba(255, 255, 255, 0.08);
            border: 1px solid $dark-border-color;
            border-radius: 3px;
            padding: 1px 5px;
        }
    }
}
</style>

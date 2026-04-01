<template>
    <transition name="slide-fade" appear>
        <div v-if="!processing" class="console-page">
            <div class="page-header">
                <h1>{{ $t("console") }}</h1>
            </div>

            <Terminal v-if="enableConsole" class="terminal" :rows="20" mode="mainTerminal" name="console" :endpoint="endpoint" />

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
        };
    },
    computed: {
        endpoint() {
            return this.$route.params.endpoint || "";
        },
    },
    mounted() {
        this.$root.emitAgent(this.endpoint, "checkMainTerminal", (res) => {
            this.enableConsole = res.ok;
            this.processing = false;
        });
    },
    methods: {},
};
</script>

<style scoped lang="scss">
@import "../styles/vars.scss";

.console-page {
    max-width: 960px;
}

.page-header {
    margin-bottom: 20px;

    h1 {
        font-size: 18px;
        font-weight: 600;
        color: $dark-font-color;
        letter-spacing: -0.02em;
        margin: 0;
    }
}

.terminal {
    height: 480px;
    border-radius: 8px;
    overflow: hidden;
    border: 1px solid $dark-border-color;
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

<template>
    <div class="dashboard-layout">
        <!-- Stack panel (left) -->
        <div v-if="!$root.isMobile" class="stack-panel">
            <div class="stack-panel-header">
                <router-link to="/compose" class="compose-btn linear-btn-primary">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                        <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                    {{ $t("compose") }}
                </router-link>
            </div>
            <StackList :scrollbar="true" />
        </div>

        <!-- Main content area -->
        <div ref="container" class="content-panel">
            <router-view :key="$route.fullPath" :calculatedHeight="height" />
        </div>
    </div>
</template>

<script>
import StackList from "../components/StackList.vue";

export default {
    components: {
        StackList,
    },
    data() {
        return {
            height: 0,
        };
    },
    mounted() {
        this.height = this.$refs.container?.offsetHeight ?? 0;
    },
};
</script>

<style lang="scss" scoped>
@import "../styles/vars.scss";

.dashboard-layout {
    display: flex;
    height: 100vh;
    overflow: hidden;
}

// =====================
// Left stack panel
// =====================
.stack-panel {
    width: 224px;
    min-width: 224px;
    height: 100vh;
    border-right: 1px solid $dark-border-color;
    background-color: $dark-bg2;
    display: flex;
    flex-direction: column;
    position: sticky;
    top: 0;
    flex-shrink: 0;
}

.stack-panel-header {
    height: 56px;
    display: flex;
    align-items: center;
    padding: 0 10px;
    border-bottom: 1px solid $dark-border-color;
    flex-shrink: 0;
}

.compose-btn {
    width: 100%;
    justify-content: center;
    // color constraint for links in dark mode
    color: #111827 !important;
    text-decoration: none !important;
    font-size: 13px;
    padding: 6px 10px;
    min-height: 32px;
    height: 32px;
}

// =====================
// Right content panel
// =====================
.content-panel {
    flex: 1;
    height: 100vh;
    overflow-y: auto;
    padding: 28px 32px;
    background-color: $dark-bg;

    @media (max-width: 770px) {
        padding: 16px;
    }
}

// Mobile — full width, bottom padding for nav
@media (max-width: 770px) {
    .dashboard-layout {
        display: block;
        height: auto;
        overflow: visible;
    }

    .content-panel {
        height: auto;
        padding-bottom: 80px;
    }
}
</style>

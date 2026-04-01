<template>
    <div class="settings-page">
        <div v-show="show" class="page-header">
            <h1>{{ $t("Settings") }}</h1>
        </div>

        <div class="settings-layout">
            <!-- Left menu -->
            <div v-if="showSubMenu" class="settings-sidebar">
                <nav class="settings-nav">
                    <router-link
                        v-for="(item, key) in subMenus"
                        :key="key"
                        :to="`/settings/${key}`"
                        class="settings-nav-item"
                    >
                        {{ item.title }}
                    </router-link>

                    <!-- Mobile logout -->
                    <a
                        v-if="$root.isMobile && $root.loggedIn && $root.socket.token !== 'autoLogin'"
                        class="settings-nav-item danger"
                        @click.prevent="$root.logout"
                    >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
                        </svg>
                        {{ $t("Logout") }}
                    </a>
                </nav>
            </div>

            <!-- Content area -->
            <div class="settings-content">
                <div v-if="currentPage" class="settings-content-header">
                    <h2>{{ subMenus[currentPage]?.title }}</h2>
                </div>
                <div class="settings-body">
                    <router-view v-slot="{ Component }">
                        <transition name="slide-fade" appear>
                            <component :is="Component" />
                        </transition>
                    </router-view>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import { useRoute } from "vue-router";

export default {
    data() {
        return {
            show: true,
            settings: {},
            settingsLoaded: false,
        };
    },

    computed: {
        currentPage() {
            let pathSplit = useRoute().path.split("/");
            let pathEnd = pathSplit[pathSplit.length - 1];
            if (!pathEnd || pathEnd === "settings") {
                return null;
            }
            return pathEnd;
        },

        showSubMenu() {
            if (this.$root.isMobile) {
                return !this.currentPage;
            }
            return true;
        },

        subMenus() {
            return {
                general: { title: this.$t("general") },
                appearance: { title: this.$t("Appearance") },
                security: { title: this.$t("Security") },
                globalEnv: { title: this.$t("GlobalEnv") },
                about: { title: this.$t("About") },
            };
        },
    },

    watch: {
        "$root.isMobile"() {
            this.loadGeneralPage();
        },
    },

    mounted() {
        this.loadSettings();
        this.loadGeneralPage();
    },

    methods: {
        loadGeneralPage() {
            if (!this.currentPage && !this.$root.isMobile) {
                this.$router.push("/settings/appearance");
            }
        },

        loadSettings() {
            this.$root.getSocket().emit("getSettings", (res) => {
                this.settings = res.data;
                if (this.settings.checkUpdate === undefined) {
                    this.settings.checkUpdate = true;
                }
                this.settingsLoaded = true;
            });
        },

        saveSettings(callback, currentPassword) {
            let valid = this.validateSettings();
            if (valid.success) {
                this.$root.getSocket().emit("setSettings", this.settings, currentPassword, (res) => {
                    this.$root.toastRes(res);
                    this.loadSettings();
                    if (callback) callback();
                });
            } else {
                this.$root.toastError(valid.msg);
            }
        },

        validateSettings() {
            if (this.settings.keepDataPeriodDays < 0) {
                return { success: false, msg: this.$t("dataRetentionTimeError") };
            }
            return { success: true, msg: "" };
        },
    },
};
</script>

<style lang="scss" scoped>
@import "../styles/vars.scss";

.settings-page {
    max-width: 900px;
}

.page-header {
    margin-bottom: 24px;

    h1 {
        font-size: 18px;
        font-weight: 600;
        color: $dark-font-color;
        letter-spacing: -0.02em;
        margin: 0;
    }
}

// =====================
// Layout
// =====================
.settings-layout {
    display: flex;
    gap: 0;
    background-color: $dark-bg3;
    border: 1px solid $dark-border-color;
    border-radius: 10px;
    overflow: hidden;
    min-height: 500px;
}

// =====================
// Sidebar
// =====================
.settings-sidebar {
    width: 180px;
    min-width: 180px;
    border-right: 1px solid $dark-border-color;
    padding: 12px 8px;
    flex-shrink: 0;

    @media (max-width: 640px) {
        width: 100%;
        min-width: unset;
        border-right: none;
        border-bottom: 1px solid $dark-border-color;
    }
}

.settings-nav {
    display: flex;
    flex-direction: column;
    gap: 1px;
}

.settings-nav-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 7px 10px;
    border-radius: 5px;
    font-size: 13px;
    font-weight: 450;
    color: $dark-font-color2;
    text-decoration: none;
    cursor: pointer;
    transition: background-color 120ms ease, color 120ms ease;
    border: none;
    background: none;
    width: 100%;
    text-align: left;

    &:hover {
        background-color: rgba(255, 255, 255, 0.06);
        color: $dark-font-color;
    }

    &.router-link-active {
        background-color: rgba(255, 255, 255, 0.08);
        color: $dark-font-color;
    }

    &.danger {
        color: rgba(#f87171, 0.8);
        &:hover {
            color: #f87171;
            background-color: rgba(#f87171, 0.08);
        }
    }
}

// =====================
// Content
// =====================
.settings-content {
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
}

.settings-content-header {
    padding: 14px 20px 12px;
    border-bottom: 1px solid $dark-border-color;

    h2 {
        font-size: 14px;
        font-weight: 600;
        color: $dark-font-color;
        margin: 0;
        letter-spacing: -0.01em;
    }
}

.settings-body {
    padding: 20px;
    flex: 1;
    overflow-y: auto;
}
</style>

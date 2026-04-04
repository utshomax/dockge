<template>
    <div :class="classes">
        <!-- Connection lost banner -->
        <div v-if="! $root.socketIO.connected && ! $root.socketIO.firstConnect" class="lost-connection">
            <div class="container-fluid">
                {{ $root.socketIO.connectionErrorMsg }}
                <div v-if="$root.socketIO.showReverseProxyGuide">
                    {{ $t("reverseProxyMsg1") }} <a href="https://github.com/louislam/uptime-kuma/wiki/Reverse-Proxy" target="_blank">{{ $t("reverseProxyMsg2") }}</a>
                </div>
            </div>
        </div>

        <!-- Sidebar -->
        <aside v-if="! $root.isMobile && $root.loggedIn" class="sidebar">
            <div class="sidebar-header">
                <router-link to="/" class="sidebar-logo">
                    <object class="logo-icon" width="20" height="20" data="/icon.svg" />
                    <span class="logo-text">Dockge</span>
                </router-link>
            </div>

            <!-- Nav links -->
            <nav class="sidebar-nav">
                <router-link to="/" class="nav-item" :class="{ active: $route.path === '/' }">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
                    </svg>
                    <span>{{ $t("home") }}</span>
                </router-link>
                <router-link to="/console" class="nav-item" :class="{ active: $route.path === '/console' }">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/>
                    </svg>
                    <span>{{ $t("console") }}</span>
                </router-link>
                <router-link to="/stats" class="nav-item" :class="{ active: $route.path === '/stats' }">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                    </svg>
                    <span>Stats</span>
                </router-link>
            </nav>

            <!-- Bottom section: settings + user -->
            <div class="sidebar-bottom">
                <a v-if="hasNewVersion" target="_blank" href="https://github.com/louislam/dockge/releases" class="nav-item update-pill">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 8 12 12 14 14"/></svg>
                    <span>{{ $t("newUpdate") }}</span>
                </a>

                <router-link to="/settings/general" class="nav-item" :class="{ active: $route.path.includes('settings') }">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/>
                    </svg>
                    <span>{{ $t("Settings") }}</span>
                </router-link>

                <!-- User dropdown -->
                <div class="dropdown user-menu">
                    <div class="nav-item user-trigger" data-bs-toggle="dropdown">
                        <div class="avatar">{{ $root.usernameFirstChar }}</div>
                        <span class="username-text">{{ $root.username }}</span>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
                    </div>
                    <ul class="dropdown-menu dropdown-menu-end user-dropdown">
                        <li>
                            <i18n-t v-if="$root.username != null" tag="span" keypath="signedInDisp" class="dropdown-item-text">
                                <strong>{{ $root.username }}</strong>
                            </i18n-t>
                        </li>
                        <li><hr class="dropdown-divider"></li>
                        <li>
                            <button class="dropdown-item" @click="scanFolder">
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/></svg>
                                {{ $t("scanFolder") }}
                            </button>
                        </li>
                        <li>
                            <button class="dropdown-item danger" @click="$root.logout">
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                                {{ $t("Logout") }}
                            </button>
                        </li>
                    </ul>
                </div>
            </div>
        </aside>

        <!-- Main content -->
        <div class="main-wrapper" :class="{ 'with-sidebar': !$root.isMobile && $root.loggedIn }">
            <div v-if="$root.socketIO.connecting" class="connecting-state">
                <div class="connecting-spinner"></div>
                <span>{{ $t("connecting...") }}</span>
            </div>

            <router-view v-if="$root.loggedIn" />
            <Login v-if="! $root.loggedIn && $root.allowLoginDialog" />
        </div>

        <!-- Mobile bottom nav -->
        <div v-if="$root.isMobile && $root.loggedIn" class="bottom-nav">
            <router-link to="/" class="bottom-nav-item" :class="{ active: $route.path === '/' }">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
                </svg>
                <span>{{ $t("home") }}</span>
            </router-link>
            <router-link to="/console" class="bottom-nav-item" :class="{ active: $route.path === '/console' }">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/>
                </svg>
                <span>{{ $t("console") }}</span>
            </router-link>
            <router-link to="/stats" class="bottom-nav-item" :class="{ active: $route.path === '/stats' }">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                </svg>
                <span>Stats</span>
            </router-link>
            <router-link to="/settings/general" class="bottom-nav-item" :class="{ active: $route.path.includes('settings') }">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/></svg>
                <span>{{ $t("Settings") }}</span>
            </router-link>
        </div>
    </div>
</template>

<script>
import Login from "../components/Login.vue";
import { compareVersions } from "compare-versions";
import { ALL_ENDPOINTS } from "../../../common/util-common";

export default {
    components: {
        Login,
    },

    data() {
        return {};
    },

    computed: {
        classes() {
            const classes = { dark: true };
            classes[this.$root.theme] = true;
            classes["mobile"] = this.$root.isMobile;
            return classes;
        },

        hasNewVersion() {
            if (this.$root.info.latestVersion && this.$root.info.version) {
                return compareVersions(this.$root.info.latestVersion, this.$root.info.version) >= 1;
            }
            return false;
        },
    },

    methods: {
        scanFolder() {
            this.$root.emitAgent(ALL_ENDPOINTS, "requestStackList", (res) => {
                this.$root.toastRes(res);
            });
        },
    },
};
</script>

<style lang="scss" scoped>
@import "../styles/vars.scss";

// ==============================
// Layout shell
// ==============================
.dark {
    background-color: $dark-bg;
    min-height: 100vh;
    display: flex;
}

// ==============================
// Sidebar
// ==============================
.sidebar {
    width: 200px;
    min-width: 200px;
    height: 100vh;
    position: fixed;
    left: 0;
    top: 0;
    background-color: $dark-bg2;
    border-right: 1px solid $dark-border-color;
    display: flex;
    flex-direction: column;
    z-index: 100;
    padding: 0;
}

.sidebar-header {
    height: 56px;
    display: flex;
    align-items: center;
    padding: 0 14px;
    border-bottom: 1px solid $dark-border-color;
    flex-shrink: 0;
}

.sidebar-logo {
    display: flex;
    align-items: center;
    gap: 8px;
    text-decoration: none;

    .logo-icon {
        pointer-events: none;
        flex-shrink: 0;
    }

    .logo-text {
        font-size: 14px;
        font-weight: 600;
        color: $dark-font-color;
        letter-spacing: -0.02em;
    }
}

// ==============================
// Nav items
// ==============================
.sidebar-nav {
    flex: 1;
    overflow-y: auto;
    padding: 8px 8px 0;
    display: flex;
    flex-direction: column;
    gap: 1px;
}

.nav-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 8px;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 450;
    color: $dark-font-color2;
    text-decoration: none;
    cursor: pointer;
    transition: background-color 140ms ease, color 140ms ease;
    border: none;
    background: none;
    width: 100%;

    svg { flex-shrink: 0; opacity: 0.7; }

    &:hover {
        background-color: rgba(255, 255, 255, 0.06);
        color: $dark-font-color;
        svg { opacity: 1; }
    }

    &.active {
        background-color: rgba(255, 255, 255, 0.08);
        color: $dark-font-color;
        svg { opacity: 1; }
    }

    &.update-pill {
        color: $color-warning;
        svg { opacity: 1; }
        &:hover { background-color: rgba($color-warning, 0.1); }
    }
}

// ==============================
// Bottom section
// ==============================
.sidebar-bottom {
    padding: 8px;
    border-top: 1px solid $dark-border-color;
    display: flex;
    flex-direction: column;
    gap: 1px;
    flex-shrink: 0;
}

// User menu
.user-menu {
    position: relative;
}

.user-trigger {
    cursor: pointer;
    .avatar {
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background-color: rgba(255, 255, 255, 0.15);
        color: $dark-font-color;
        font-size: 10px;
        font-weight: 600;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
    }
    .username-text {
        flex: 1;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-size: 13px;
    }
}

.user-dropdown {
    min-width: 180px;
    border-radius: 8px;
    border: 1px solid $dark-border-color;
    background-color: $dark-bg2;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
    padding: 4px;

    .dropdown-item-text {
        font-size: 12px;
        color: $dark-font-color3;
        padding: 4px 8px 8px;
        display: block;
    }

    .dropdown-divider {
        margin: 2px 0;
        border-color: $dark-border-color;
    }

    .dropdown-item {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 6px 8px;
        border-radius: 4px;
        font-size: 13px;
        color: $dark-font-color2;
        cursor: pointer;
        transition: background-color 120ms ease, color 120ms ease;

        &:hover {
            background-color: rgba(255, 255, 255, 0.06);
            color: $dark-font-color;
        }

        &.danger {
            color: rgba($danger, 0.8);
            &:hover {
                color: $danger;
                background-color: rgba($danger, 0.08);
            }
        }
    }
}

// ==============================
// Main content area
// ==============================
.main-wrapper {
    flex: 1;
    min-height: 100vh;

    &.with-sidebar {
        margin-left: 200px;
    }
}

// ==============================
// Connecting state
// ==============================
.connecting-state {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    height: 100vh;
    color: $dark-font-color3;
    font-size: 14px;
}

.connecting-spinner {
    width: 16px;
    height: 16px;
    border: 2px solid $dark-border-color;
    border-top-color: $dark-font-color2;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
}

@keyframes spin {
    to { transform: rotate(360deg); }
}

// ==============================
// Lost connection banner
// ==============================
.lost-connection {
    padding: 8px 16px;
    background-color: rgba($danger, 0.9);
    color: white;
    position: fixed;
    width: 100%;
    z-index: 99999;
    font-size: 13px;
    font-weight: 500;
    backdrop-filter: blur(8px);
}

// ==============================
// Mobile bottom nav
// ==============================
.bottom-nav {
    z-index: 1000;
    position: fixed;
    bottom: 0;
    height: calc(56px + env(safe-area-inset-bottom));
    width: 100%;
    left: 0;
    background-color: $dark-bg2;
    border-top: 1px solid $dark-border-color;
    display: flex;
    align-items: center;
    justify-content: space-around;
    padding-bottom: env(safe-area-inset-bottom);
}

.bottom-nav-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 3px;
    padding: 8px 16px;
    text-decoration: none;
    color: $dark-font-color3;
    font-size: 11px;
    font-weight: 500;
    transition: color 140ms ease;

    &.active, &.router-link-exact-active {
        color: $dark-font-color;
    }
    &:hover { color: $dark-font-color2; }
}

// ==============================
// Dark theme overrides for sidebar
// ==============================
.dark {
    .sidebar { background-color: $dark-bg2; }
    .bottom-nav { background-color: $dark-bg2; }
}

// ==============================
// Tablet / MD Sidebar Collapse
// ==============================
@media (max-width: 992px) {
    .sidebar {
        width: 64px;
        min-width: 64px;
    }

    .sidebar-header {
        padding: 0;
        justify-content: center;
    }

    .sidebar-logo {
        .logo-text {
            display: none;
        }
    }

    .sidebar-nav {
        padding: 8px 6px 0;
    }

    .nav-item {
        justify-content: center;
        padding: 10px 0;

        span {
            display: none;
        }
    }

    .sidebar-bottom {
        padding: 8px 6px;
        align-items: center;
    }

    .user-trigger {
        justify-content: center;
        padding: 8px 0;

        .username-text, svg {
            display: none;
        }

        .avatar {
            margin: 0;
        }
    }

    .main-wrapper.with-sidebar {
        margin-left: 64px;
    }
}
</style>

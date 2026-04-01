<template>
    <div class="auth-shell">
        <div class="auth-card">
            <!-- Logo -->
            <div class="auth-logo">
                <object width="28" height="28" data="/icon.svg" />
                <span class="auth-brand">Dockge</span>
            </div>

            <div class="auth-body">
                <h2 class="auth-title">Sign in to Dockge</h2>
                <p class="auth-sub">Enter your credentials to continue</p>

                <form class="auth-form" @submit.prevent="submit">
                    <div v-if="!tokenRequired" class="field-group">
                        <input
                            id="floatingInput"
                            v-model="username"
                            type="text"
                            class="auth-input"
                            placeholder="Username"
                            autocomplete="username"
                            required
                        />
                    </div>

                    <div v-if="!tokenRequired" class="field-group">
                        <input
                            id="floatingPassword"
                            v-model="password"
                            type="password"
                            class="auth-input"
                            placeholder="Password"
                            autocomplete="current-password"
                            required
                        />
                    </div>

                    <div v-if="tokenRequired" class="field-group">
                        <input
                            id="otp"
                            v-model="token"
                            type="text"
                            maxlength="6"
                            class="auth-input"
                            placeholder="2FA Token"
                            autocomplete="one-time-code"
                            required
                        />
                    </div>

                    <div class="auth-remember">
                        <label class="remember-label">
                            <input id="remember" v-model="$root.remember" type="checkbox" value="remember-me" class="remember-check" />
                            <span>{{ $t("Remember me") }}</span>
                        </label>
                    </div>

                    <button class="auth-btn" type="submit" :disabled="processing">
                        <span v-if="processing" class="btn-spinner"></span>
                        <span>{{ $t("Login") }}</span>
                    </button>

                    <div v-if="res && !res.ok" class="auth-error">
                        {{ $t(res.msg) }}
                    </div>
                </form>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    data() {
        return {
            processing: false,
            username: "",
            password: "",
            token: "",
            res: null,
            tokenRequired: false,
        };
    },

    mounted() {
        document.title += " - Login";
    },

    unmounted() {
        document.title = document.title.replace(" - Login", "");
    },

    methods: {
        submit() {
            this.processing = true;
            this.$root.login(this.username, this.password, this.token, (res) => {
                this.processing = false;
                if (res.tokenRequired) {
                    this.tokenRequired = true;
                } else {
                    this.res = res;
                }
            });
        },
    },
};
</script>

<style lang="scss" scoped>
@import "../styles/vars.scss";

.auth-shell {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: $dark-bg;
    padding: 24px;
}

.auth-card {
    width: 100%;
    max-width: 360px;
    background-color: $dark-bg2;
    border: 1px solid $dark-border-color;
    border-radius: 12px;
    overflow: hidden;
}

.auth-logo {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 20px 24px 16px;
    border-bottom: 1px solid $dark-border-color;

    object { pointer-events: none; }
}

.auth-brand {
    font-size: 15px;
    font-weight: 600;
    color: $dark-font-color;
    letter-spacing: -0.02em;
}

.auth-body {
    padding: 24px;
}

.auth-title {
    font-size: 16px;
    font-weight: 600;
    color: $dark-font-color;
    margin: 0 0 4px;
    letter-spacing: -0.02em;
}

.auth-sub {
    font-size: 13px;
    color: $dark-font-color3;
    margin: 0 0 20px;
}

.auth-form {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.field-group {
    display: flex;
    flex-direction: column;
}

.auth-input {
    background-color: $dark-bg;
    border: 1px solid $dark-border-color;
    border-radius: 6px;
    color: $dark-font-color;
    font-size: 14px;
    font-family: var(--font-sans);
    padding: 9px 12px;
    width: 100%;
    outline: none;
    transition: border-color 140ms ease, box-shadow 140ms ease;
    -webkit-appearance: none;

    &::placeholder { color: $dark-font-color3; }

    &:focus {
        border-color: rgba(255, 255, 255, 0.25);
        box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.06);
    }
}

.auth-remember {
    display: flex;
    align-items: center;
}

.remember-label {
    display: flex;
    align-items: center;
    gap: 7px;
    font-size: 13px;
    color: $dark-font-color2;
    cursor: pointer;
}

.remember-check {
    width: 14px;
    height: 14px;
    accent-color: #ffffff;
    cursor: pointer;
}

.auth-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    margin-top: 4px;
    width: 100%;
    padding: 9px 16px;
    font-size: 14px;
    font-weight: 500;
    font-family: var(--font-sans);
    color: #000;
    background-color: #ffffff;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    transition: background-color 140ms ease, opacity 140ms ease;

    &:hover { background-color: rgba(255,255,255,0.88); }
    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
}

.btn-spinner {
    width: 14px;
    height: 14px;
    border: 2px solid rgba(0,0,0,0.2);
    border-top-color: #000;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

.auth-error {
    padding: 10px 12px;
    background-color: rgba(#f87171, 0.1);
    border: 1px solid rgba(#f87171, 0.2);
    border-radius: 6px;
    font-size: 13px;
    color: #f87171;
    text-align: center;
}
</style>

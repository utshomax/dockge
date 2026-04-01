<template>
    <div class="auth-shell" data-cy="setup-form">
        <div class="auth-card">
            <!-- Logo -->
            <div class="auth-logo">
                <object width="28" height="28" data="/icon.svg" />
                <span class="auth-brand">Dockge</span>
            </div>

            <div class="auth-body">
                <h2 class="auth-title">Create admin account</h2>
                <p class="auth-sub">Set up your Dockge instance to get started</p>

                <form class="auth-form" @submit.prevent="submit">
                    <!-- Language -->
                    <div class="field-group">
                        <label class="field-label">Language</label>
                        <select id="language" v-model="$root.language" class="auth-select">
                            <option v-for="(lang, i) in $i18n.availableLocales" :key="`Lang${i}`" :value="lang">
                                {{ $i18n.messages[lang].languageName }}
                            </option>
                        </select>
                    </div>

                    <!-- Username -->
                    <div class="field-group">
                        <label class="field-label">Username</label>
                        <input
                            id="floatingInput"
                            v-model="username"
                            type="text"
                            class="auth-input"
                            :placeholder="$t('Username')"
                            required
                            data-cy="username-input"
                        />
                    </div>

                    <!-- Password -->
                    <div class="field-group">
                        <label class="field-label">Password</label>
                        <input
                            id="floatingPassword"
                            v-model="password"
                            type="password"
                            class="auth-input"
                            :placeholder="$t('Password')"
                            required
                            data-cy="password-input"
                        />
                    </div>

                    <!-- Repeat Password -->
                    <div class="field-group">
                        <label class="field-label">Repeat Password</label>
                        <input
                            id="repeat"
                            v-model="repeatPassword"
                            type="password"
                            class="auth-input"
                            :placeholder="$t('Repeat Password')"
                            required
                            data-cy="password-repeat-input"
                        />
                    </div>

                    <button class="auth-btn" type="submit" :disabled="processing" data-cy="submit-setup-form">
                        <span v-if="processing" class="btn-spinner"></span>
                        {{ $t("Create") }}
                    </button>
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
            repeatPassword: "",
        };
    },
    mounted() {
        this.$root.getSocket().emit("needSetup", (needSetup) => {
            if (!needSetup) {
                this.$router.push("/");
            }
        });
    },
    methods: {
        submit() {
            this.processing = true;

            if (this.password !== this.repeatPassword) {
                this.$root.toastError("PasswordsDoNotMatch");
                this.processing = false;
                return;
            }

            this.$root.getSocket().emit("setup", this.username, this.password, (res) => {
                this.processing = false;
                this.$root.toastRes(res);

                if (res.ok) {
                    this.processing = true;
                    this.$root.login(this.username, this.password, "", () => {
                        this.processing = false;
                        this.$router.push("/");
                    });
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
    max-width: 380px;
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
    gap: 12px;
}

.field-group {
    display: flex;
    flex-direction: column;
    gap: 5px;
}

.field-label {
    font-size: 12px;
    font-weight: 500;
    color: $dark-font-color3;
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

.auth-select {
    background-color: $dark-bg;
    border: 1px solid $dark-border-color;
    border-radius: 6px;
    color: $dark-font-color;
    font-size: 14px;
    font-family: var(--font-sans);
    padding: 9px 12px;
    width: 100%;
    outline: none;
    cursor: pointer;
    -webkit-appearance: none;
    transition: border-color 140ms ease;

    &:focus { border-color: rgba(255, 255, 255, 0.25); }
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
    &:disabled { opacity: 0.5; cursor: not-allowed; }
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
</style>

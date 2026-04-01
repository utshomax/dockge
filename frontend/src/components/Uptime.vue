<template>
    <!-- Status dot indicator -->
    <span class="status-dot" :class="dotClass" :title="statusName"></span>
</template>

<script>
import { statusColor, statusNameShort } from "../../../common/util-common";

export default {
    props: {
        stack: {
            type: Object,
            default: null,
        },
        fixedWidth: {
            type: Boolean,
            default: false,
        },
        pill: {
            type: Boolean,
            default: false,
        },
    },

    computed: {
        color() {
            return statusColor(this.stack?.status);
        },

        statusName() {
            return this.$t(statusNameShort(this.stack?.status));
        },

        dotClass() {
            const c = this.color;
            // Map bootstrap color names to our dot variants
            if (c === "primary" || c === "success") return "dot-running";
            if (c === "danger") return "dot-exited";
            if (c === "warning") return "dot-warning";
            return "dot-inactive";
        },
    },
};
</script>

<style scoped>
.status-dot {
    display: inline-block;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    flex-shrink: 0;
}

.dot-running  { background-color: #4ade80; box-shadow: 0 0 4px rgba(74, 222, 128, 0.5); }
.dot-exited   { background-color: #f87171; }
.dot-warning  { background-color: #fbbf24; }
.dot-inactive { background-color: #52525b; }
</style>

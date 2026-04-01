<template>
    <router-link :to="url" class="stack-item" :class="{ 'dim': !stack.isManagedByDockge, 'active': isActiveRoute }">
        <Uptime :stack="stack" :fixed-width="true" class="item-dot" />
        <div class="item-info">
            <span class="item-name">{{ stackName }}</span>
            <span v-if="$root.agentCount > 1" class="item-endpoint">{{ endpointDisplay }}</span>
        </div>
    </router-link>
</template>

<script>
import Uptime from "./Uptime.vue";

export default {
    components: {
        Uptime,
    },
    props: {
        stack: {
            type: Object,
            default: null,
        },
        isSelectMode: {
            type: Boolean,
            default: false,
        },
        depth: {
            type: Number,
            default: 0,
        },
        isSelected: {
            type: Function,
            default: () => {},
        },
        select: {
            type: Function,
            default: () => {},
        },
        deselect: {
            type: Function,
            default: () => {},
        },
    },
    data() {
        return {
            isCollapsed: true,
        };
    },
    computed: {
        endpointDisplay() {
            return this.$root.endpointDisplayFunction(this.stack.endpoint);
        },
        url() {
            if (this.stack.endpoint) {
                return `/compose/${this.stack.name}/${this.stack.endpoint}`;
            }
            return `/compose/${this.stack.name}`;
        },
        stackName() {
            return this.stack.name;
        },
        isActiveRoute() {
            return this.$route.path === this.url;
        },
    },
};
</script>

<style lang="scss" scoped>
@import "../styles/vars.scss";

.stack-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 5px 8px;
    border-radius: 5px;
    text-decoration: none;
    transition: background-color 120ms ease;
    cursor: pointer;
    width: 100%;
    min-height: 30px;

    &:hover {
        background-color: rgba(255, 255, 255, 0.06);
    }

    &.active {
        background-color: rgba(255, 255, 255, 0.08);

        .item-name {
            color: $dark-font-color;
        }
    }

    &.dim { opacity: 0.4; }
}

.item-dot {
    flex-shrink: 0;
}

.item-info {
    display: flex;
    flex-direction: column;
    overflow: hidden;
    flex: 1;
}

.item-name {
    font-size: 13px;
    font-weight: 450;
    color: $dark-font-color2;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    line-height: 1.4;
    transition: color 120ms ease;

    .stack-item:hover & {
        color: $dark-font-color;
    }
}

.item-endpoint {
    font-size: 11px;
    color: $dark-font-color3;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
</style>

<template>
    <div class="stack-list-wrapper" :style="boxStyle">
        <!-- Search row -->
        <div class="search-row">
            <div class="search-field">
                <svg class="search-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <form>
                    <input ref="searchInput" v-model="searchText" class="search-input" autocomplete="off" :placeholder="$t('Search...') + ' (Press /)'" />
                </form>
                <button v-if="searchText != ''" class="clear-btn" @click="clearSearchText">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                </button>
            </div>

            <!-- Filter tabs -->
            <div class="filter-tabs">
                <button class="filter-tab" :class="{ active: filterState.active == null }" @click="updateFilter({ ...filterState, active: null })">{{ $t("All") || "All" }}</button>
                <button class="filter-tab" :class="{ active: filterState.active != null && filterState.active[0] === true }" @click="updateFilter({ ...filterState, active: [true] })">{{ $t("Active") || "Active" }}</button>
                <button class="filter-tab" :class="{ active: filterState.active != null && filterState.active[0] === false }" @click="updateFilter({ ...filterState, active: [false] })">{{ $t("Inactive") || "Inactive" }}</button>
            </div>
        </div>

        <!-- Stack items -->
        <div ref="stackList" class="stack-items" :class="{ scrollbar: scrollbar }" :style="stackListStyle">
            <div v-if="Object.keys(sortedStackList).length === 0" class="empty-state">
                <router-link to="/compose">{{ $t("addFirstStackMsg") }}</router-link>
            </div>

            <StackListItem
                v-for="(item, index) in sortedStackList"
                :key="index"
                :stack="item"
                :isSelectMode="selectMode"
                :isSelected="isSelected"
                :select="select"
                :deselect="deselect"
            />
        </div>
    </div>

    <Confirm ref="confirmPause" :yes-text="$t('Yes')" :no-text="$t('No')" @yes="pauseSelected">
        {{ $t("pauseStackMsg") }}
    </Confirm>
</template>

<script>
import Confirm from "../components/Confirm.vue";
import StackListItem from "../components/StackListItem.vue";
import { CREATED_FILE, CREATED_STACK, EXITED, RUNNING, UNKNOWN } from "../../../common/util-common";

export default {
    components: {
        Confirm,
        StackListItem,
    },
    props: {
        scrollbar: {
            type: Boolean,
        },
    },
    data() {
        return {
            searchText: "",
            selectMode: false,
            selectAll: false,
            disableSelectAllWatcher: false,
            selectedStacks: {},
            windowTop: 0,
            filterState: {
                status: null,
                active: null,
                tags: null,
            },
        };
    },
    mounted() {
        window.addEventListener("keydown", this.handleGlobalKeydown);
    },
    beforeUnmount() {
        window.removeEventListener("keydown", this.handleGlobalKeydown);
    },
    computed: {
        boxStyle() {
            return {
                flex: 1,
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
            };
        },

        sortedStackList() {
            let result = Object.values(this.$root.completeStackList);

            result = result.filter((stack) => {
                let searchTextMatch = true;
                if (this.searchText !== "") {
                    const loweredSearchText = this.searchText.toLowerCase();
                    searchTextMatch =
                        stack.name.toLowerCase().includes(loweredSearchText) ||
                        stack.tags.find(
                            (tag) =>
                                tag.name.toLowerCase().includes(loweredSearchText) ||
                                tag.value?.toLowerCase().includes(loweredSearchText)
                        );
                }
                let activeMatch = true;
                if (this.filterState.active != null && this.filterState.active.length > 0) {
                    activeMatch = this.filterState.active.includes(stack.active);
                }
                let tagsMatch = true;
                if (this.filterState.tags != null && this.filterState.tags.length > 0) {
                    tagsMatch =
                        stack.tags
                            .map((tag) => tag.tag_id)
                            .filter((stackTagId) => this.filterState.tags.includes(stackTagId)).length > 0;
                }
                return searchTextMatch && activeMatch && tagsMatch;
            });

            result.sort((m1, m2) => {
                if (m1.isManagedByDockge && !m2.isManagedByDockge) return -1;
                else if (!m1.isManagedByDockge && m2.isManagedByDockge) return 1;

                if (m1.status !== m2.status) {
                    if (m2.status === RUNNING) return 1;
                    else if (m1.status === RUNNING) return -1;
                    else if (m2.status === EXITED) return 1;
                    else if (m1.status === EXITED) return -1;
                    else if (m2.status === CREATED_STACK) return 1;
                    else if (m1.status === CREATED_STACK) return -1;
                    else if (m2.status === CREATED_FILE) return 1;
                    else if (m1.status === CREATED_FILE) return -1;
                    else if (m2.status === UNKNOWN) return 1;
                    else if (m1.status === UNKNOWN) return -1;
                }
                return m1.name.localeCompare(m2.name);
            });

            return result;
        },

        stackListStyle() {
            return { height: "calc(100% - 52px)", overflowY: "auto" };
        },

        selectedStackCount() {
            return Object.keys(this.selectedStacks).length;
        },

        filtersActive() {
            return (
                this.filterState.status != null ||
                this.filterState.active != null ||
                this.filterState.tags != null ||
                this.searchText !== ""
            );
        },
    },
    watch: {
        searchText() {
            for (let stack of this.sortedStackList) {
                if (!this.selectedStacks[stack.id]) {
                    if (this.selectAll) {
                        this.disableSelectAllWatcher = true;
                        this.selectAll = false;
                    }
                    break;
                }
            }
        },
        selectAll() {
            if (!this.disableSelectAllWatcher) {
                this.selectedStacks = {};
                if (this.selectAll) {
                    this.sortedStackList.forEach((item) => {
                        this.selectedStacks[item.id] = true;
                    });
                }
            } else {
                this.disableSelectAllWatcher = false;
            }
        },
        selectMode() {
            if (!this.selectMode) {
                this.selectAll = false;
                this.selectedStacks = {};
            }
        },
    },
    methods: {
        handleGlobalKeydown(e) {
            const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : "";
            const isInput = activeTag === "input" || activeTag === "textarea" || (document.activeElement && document.activeElement.isContentEditable);

            if (e.key === "/" && !isInput) {
                e.preventDefault();
                this.$refs.searchInput?.focus();
            } else if (e.key === "Escape" && document.activeElement === this.$refs.searchInput) {
                this.clearSearchText();
                this.$refs.searchInput?.blur();
            } else if (e.key === "c" && !isInput) {
                e.preventDefault();
                this.$router.push("/compose");
            }
        },
        clearSearchText() {
            this.searchText = "";
        },
        updateFilter(newFilter) {
            this.filterState = newFilter;
        },
        deselect(id) {
            delete this.selectedStacks[id];
        },
        select(id) {
            this.selectedStacks[id] = true;
        },
        isSelected(id) {
            return id in this.selectedStacks;
        },
        cancelSelectMode() {
            this.selectMode = false;
            this.selectedStacks = {};
        },
        pauseDialog() {
            this.$refs.confirmPause.show();
        },
        pauseSelected() {
            Object.keys(this.selectedStacks)
                .filter((id) => this.$root.stackList[id].active)
                .forEach((id) => this.$root.getSocket().emit("pauseStack", id, () => {}));
            this.cancelSelectMode();
        },
        resumeSelected() {
            Object.keys(this.selectedStacks)
                .filter((id) => !this.$root.stackList[id].active)
                .forEach((id) => this.$root.getSocket().emit("resumeStack", id, () => {}));
            this.cancelSelectMode();
        },
    },
};
</script>

<style lang="scss" scoped>
@import "../styles/vars.scss";

.stack-list-wrapper {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
}

// =====================
// Search
// =====================
.search-row {
    padding: 10px 10px 8px;
    flex-shrink: 0;
}

.search-field {
    display: flex;
    align-items: center;
    gap: 6px;
    background-color: rgba(255, 255, 255, 0.04);
    border: 1px solid $dark-border-color;
    border-radius: 5px;
    padding: 5px 8px;
    transition: border-color 140ms ease;

    &:focus-within {
        border-color: rgba(255, 255, 255, 0.2);
    }
}

.filter-tabs {
    display: flex;
    gap: 8px;
    margin-top: 8px;
    background: rgba(0, 0, 0, 0.15);
    padding: 4px;
    border-radius: 6px;
    border: 1px solid rgba(255, 255, 255, 0.04);
}

.filter-tab {
    flex: 1;
    background: transparent;
    border: none;
    color: $dark-font-color3;
    font-size: 11px;
    font-weight: 500;
    padding: 6px 0;
    border-radius: 4px;
    cursor: pointer;
    transition: all 140ms ease;

    &:hover {
        color: $dark-font-color;
    }

    &.active {
        background: rgba(255, 255, 255, 0.08);
        color: $dark-font-color;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
    }
}

.search-icon {
    color: $dark-font-color3;
    flex-shrink: 0;
}

form {
    flex: 1;
}

.search-input {
    background: transparent;
    border: none;
    outline: none;
    color: $dark-font-color;
    font-size: 13px;
    width: 100%;
    font-family: var(--font-sans);

    &::placeholder { color: $dark-font-color3; }
}

.clear-btn {
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    color: $dark-font-color3;
    display: flex;
    align-items: center;
    transition: color 120ms ease;
    flex-shrink: 0;

    &:hover { color: $dark-font-color; }
}

// =====================
// Stack items
// =====================
.stack-items {
    flex: 1;
    overflow-y: auto;
    padding: 4px 6px 12px;
}

.empty-state {
    text-align: center;
    margin-top: 32px;
    font-size: 13px;

    a {
        color: $dark-font-color2;
        text-decoration: none;
        &:hover { color: $dark-font-color; }
    }
}
</style>

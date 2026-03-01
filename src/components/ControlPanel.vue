<template>
    <div class="control-panel" v-if="currentTab === 0">
        <div class="control-main">
            <div class="filter-tags-wrapper">
                <div class="filter-tags">
                    <div
                        v-for="ins in state.insurances"
                        :key="ins"
                        :class="['filter-tag', { active: currentIns === ins }]"
                        @click="selectInsurance(ins)"
                    >
                        {{ ins }}
                    </div>
                </div>
            </div>

            <div class="rank-control">
                <div class="rank-control-head">
                    <div class="company-search rank-search" ref="searchContainer">
                        <div class="direct-search-box">
                            <svg class="search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                <circle cx="11" cy="11" r="8"></circle>
                                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                            </svg>
                            <input
                                type="text"
                                class="search-input"
                                placeholder="选择公司..."
                                v-model="searchKeyword"
                                @focus="dropdownVisible = true"
                                @input="dropdownVisible = true"
                            >
                            <span class="rank-dropdown-arrow" @click.stop="toggleDropdown">▼</span>
                        </div>
                        <div :class="['rank-dropdown', { 'is-open': dropdownVisible && filteredCompanies.length > 0 }]">
                            <div
                                v-for="company in filteredCompanies"
                                :key="company"
                                class="rank-dropdown-item"
                                @click="onSelectCompany(company)"
                            >
                                {{ company }}
                            </div>
                        </div>
                    </div>
                </div>
                <div class="focus-tags" v-if="focusCompanies.length > 0">
                    <span class="focus-label">已关注</span>
                    <span
                        v-for="(name, idx) in focusCompanies"
                        :key="`${name}-${idx}`"
                        class="focus-tag"
                    >
                        <span class="focus-name">{{ name }}</span>
                        <button
                            type="button"
                            class="focus-remove-btn"
                            title="移除关注"
                            aria-label="移除关注公司"
                            @click.stop.prevent="removeFromFocus(name)"
                        >
                            ×
                        </button>
                    </span>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useClickOutside } from '../composables/useEventListener'
import {
    state,
    currentIns, 
    currentTab,
    setCurrentIns,
    companyList,
    focusCompanies,
    addFocusCompany,
    removeFocusCompany
} from '../stores/dataStore'

const searchKeyword = ref('')
const dropdownVisible = ref(false)
const searchContainer = ref(null)

function normalizeName(value) {
    return String(value || '').trim()
}

const normalizedFocusSet = computed(() => {
    return new Set(focusCompanies.value.map(normalizeName))
})

const availableCompanies = computed(() => {
    return companyList.value.filter(name => !normalizedFocusSet.value.has(normalizeName(name)))
})

const filteredCompanies = computed(() => {
    if (!searchKeyword.value) return availableCompanies.value
    return availableCompanies.value.filter(c => c.includes(searchKeyword.value))
})

useClickOutside(searchContainer, handleClickOutside)

function selectInsurance(ins) {
    setCurrentIns(ins)
}

function toggleDropdown() {
    dropdownVisible.value = !dropdownVisible.value
}

function onSelectCompany(company) {
    addFocusCompany(company)
    searchKeyword.value = ''
    dropdownVisible.value = false
}

function handleClickOutside(event) {
    if (event && searchContainer.value && !searchContainer.value.contains(event.target)) {
        dropdownVisible.value = false
    }
}

function removeFromFocus(name) {
    dropdownVisible.value = false
    searchKeyword.value = ''
    removeFocusCompany(name)
}
</script>

<style scoped>
.control-panel {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.control-main {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
}

.filter-tags-wrapper {
    flex: 1;
    min-width: 0;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
}

.filter-tags-wrapper::-webkit-scrollbar {
    height: 4px;
}

.filter-tags-wrapper::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.2);
    border-radius: 4px;
}

.rank-control {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 6px;
    flex-shrink: 0;
    width: 420px;
    max-width: 48vw;
}

.rank-control-head {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 8px;
}

.rank-search {
    width: 300px;
    position: relative;
    z-index: 2;
    flex-shrink: 0;
}

.direct-search-box {
    position: relative;
    display: flex;
    align-items: center;
    border: 1px solid var(--border-light);
    border-radius: 10px;
    background: #fff;
    min-height: 34px;
}

.direct-search-box:focus-within {
    border-color: #93c5fd;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.14);
}

.search-icon {
    position: absolute;
    left: 10px;
    color: #94a3b8;
}

.search-input {
    width: 100%;
    border: none;
    outline: none;
    background: transparent;
    font-size: var(--text-base);
    padding: 8px 32px 8px 30px;
    color: var(--text-primary);
    font-family: var(--font-sans);
}

.rank-dropdown-arrow {
    position: absolute;
    right: 10px;
    font-size: var(--text-xs);
    color: #94a3b8;
    cursor: pointer;
}

.rank-dropdown {
    position: absolute;
    top: calc(100% + 6px);
    left: 0;
    width: 100%;
    max-height: 320px;
    overflow-y: auto;
    background: #fff;
    border: 1px solid var(--border-light);
    border-radius: 10px;
    box-shadow: var(--shadow-lg);
    z-index: 16;
    display: none;
}

.rank-dropdown.is-open {
    display: block;
}

.rank-dropdown-item {
    padding: 10px 12px;
    font-size: var(--text-base);
    color: var(--text-primary);
    cursor: pointer;
}

.rank-dropdown-item:hover {
    background: var(--primary-light);
    color: var(--primary);
}

.focus-tags {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    flex-wrap: wrap;
    width: 100%;
    justify-content: flex-end;
}

.focus-label {
    font-size: var(--text-sm);
    color: var(--text-secondary);
    font-weight: var(--weight-medium);
    white-space: nowrap;
    padding-top: 3px;
}

.focus-tag {
    border: 1px solid #dbeafe;
    background: #eff6ff;
    color: #1e3a8a;
    border-radius: 999px;
    padding: 3px 10px;
    font-size: var(--text-sm);
    font-weight: var(--weight-medium);
    display: inline-flex;
    align-items: center;
    gap: 6px;
    cursor: default;
    flex-shrink: 0;
}

.focus-name {
    white-space: nowrap;
}

.focus-remove-btn {
    border: none;
    background: transparent;
    color: inherit;
    font-size: var(--text-base);
    line-height: 1;
    opacity: 0.75;
    cursor: pointer;
    padding: 0;
}

.focus-remove-btn:hover {
    opacity: 1;
}

/* 移动端适配 */
@media (max-width: 768px) {
    .control-panel {
        padding: 12px 16px !important;
    }

    .control-main {
        flex-direction: column;
        align-items: stretch;
        gap: 10px;
    }

    .rank-control {
        width: 100%;
        align-items: stretch;
        max-width: none;
    }

    .rank-control-head {
        justify-content: flex-start;
        flex-wrap: wrap;
    }

    .rank-search {
        width: 100%;
    }

    .focus-tags {
        width: 100%;
        justify-content: flex-start;
    }

    .filter-tags {
        display: flex;
        gap: 8px;
        flex-wrap: nowrap;
        min-width: min-content;
    }

    .filter-tag {
        flex-shrink: 0;
        padding: 8px 16px !important;
        font-size: var(--text-md) !important;
        white-space: nowrap;
    }
}

@media (max-width: 480px) {
    .control-panel {
        padding: 10px 12px !important;
    }

    .filter-tag {
        padding: 6px 12px !important;
        font-size: var(--text-sm) !important;
    }
}
</style>

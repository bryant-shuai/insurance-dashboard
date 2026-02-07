<template>
    <div class="control-panel" v-if="currentTab === 0">
        <!-- Insurance Filter -->
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
    </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { NTag } from 'naive-ui'
import { 
    state, 
    currentIns, 
    currentTab,
    setCurrentIns
} from '../stores/dataStore'

function selectInsurance(ins) {
    setCurrentIns(ins)
}
</script>

<style scoped>
.filter-tags-wrapper {
    width: 100%;
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

/* 移动端适配 */
@media (max-width: 768px) {
    .control-panel {
        padding: 12px 16px !important;
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
        font-size: 13px !important;
        white-space: nowrap;
    }
}

@media (max-width: 480px) {
    .control-panel {
        padding: 10px 12px !important;
    }

    .filter-tag {
        padding: 6px 12px !important;
        font-size: 12px !important;
    }
}
</style>

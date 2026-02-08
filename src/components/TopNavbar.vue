<template>
    <div class="top-navbar">
        <div class="nav-brand">
            <div class="nav-title">广州市行业非车险数据</div>
            <n-tag v-if="currentDataSetName" size="small" :bordered="false" round type="success" class="dataset-tag">
                <template #icon>
                    <n-icon size="12"><ServerOutline /></n-icon>
                </template>
                {{ currentDataSetName }}
            </n-tag>
        </div>
        <div class="nav-menu">
            <button 
                v-for="(tab, idx) in tabs" 
                :key="idx"
                :class="['nav-item', { active: currentTab === idx }]"
                @click="onTabClick(idx)"
            >
                <span class="nav-icon">{{ tabIcons[idx] }}</span>
                <span class="nav-text">{{ tab }}</span>
            </button>
        </div>
        <div class="nav-actions">
            <n-button type="primary" @click="$emit('switchData')" size="medium" class="manage-btn enhanced-button coordinated-button">
                <template #icon>
                    <n-icon><SettingsOutline /></n-icon>
                </template>
                <span class="btn-text">数据管理</span>
            </n-button>
        </div>
    </div>
</template>

<script setup>
import { NTag, NButton, NIcon } from 'naive-ui'
import { SettingsOutline, ServerOutline } from '@vicons/ionicons5'
import { currentTab, switchTab, currentDataSetId, dataSets } from '../stores/dataStore'
import { computed } from 'vue'

const tabs = ['全景概览', '深度分析', '原始数据']
const tabIcons = ['📊', '🔍', '📋']

const currentDataSetName = computed(() => {
    const dataset = dataSets.value.find(ds => ds.id === currentDataSetId.value)
    return dataset ? dataset.name : ''
})

const emit = defineEmits(['switchData'])

function onTabClick(idx) {
    switchTab(idx)
}
</script>

<style scoped>
.nav-icon {
    font-size: 14px;
    margin-right: 2px;
}

/* 移动端适配 */
@media (max-width: 768px) {
    .top-navbar {
        flex-direction: column;
        padding: 12px 16px !important;
        gap: 12px;
    }

    .nav-brand {
        width: 100%;
        justify-content: space-between;
    }

    .nav-title {
        font-size: 16px !important;
    }

    .dataset-tag {
        font-size: 11px;
    }

    .nav-menu {
        width: 100%;
        padding: 2px;
    }

    .nav-item {
        flex: 1;
        padding: 8px 12px !important;
        font-size: 13px !important;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
    }

    .nav-icon {
        font-size: 18px;
        margin-right: 0;
    }

    .nav-text {
        font-size: 11px;
        white-space: nowrap;
    }

    .nav-actions {
        width: 100%;
    }

    .manage-btn {
        width: 100%;
        justify-content: center;
    }

    .enhanced-button {
        box-shadow: 0 2px 6px rgba(30, 64, 175, 0.25);
        border: 2px solid var(--primary);
    }

    .enhanced-button:hover {
        box-shadow: 0 4px 12px rgba(30, 64, 175, 0.35);
        transform: translateY(-1px);
    }

    .btn-text {
        display: inline;
    }
}

@media (max-width: 480px) {
    .nav-title {
        font-size: 14px !important;
    }

    .nav-item {
        padding: 6px 8px !important;
        font-size: 12px !important;
    }

    .nav-text {
        font-size: 10px;
    }
}
</style>

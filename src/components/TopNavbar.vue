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
                <span class="nav-icon" v-html="tabIcons[idx]"></span>
                <span class="nav-text">{{ tab }}</span>
            </button>
        </div>
        <div class="nav-actions">
            <n-button 
                type="primary" 
                @click="$emit('switchData')" 
                size="medium" 
                class="manage-btn enhanced-button coordinated-button"
            >
                <template #icon>
                    <n-icon>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                            <path d="M262.29 192.31a64 64 0 1 0 57.4 57.4a64.13 64.13 0 0 0-57.4-57.4zM416.39 256a154.34 154.34 0 0 1-1.53 20.79l45.21 35.46a10.81 10.81 0 0 1 2.45 13.75l-42.77 74a10.81 10.81 0 0 1-13.14 4.59l-44.9-18.08a16.11 16.11 0 0 0-15.17 1.75A164.48 164.48 0 0 1 325 400.8a15.94 15.94 0 0 0-8.82 12.14l-6.73 47.89a11.08 11.08 0 0 1-10.68 9.17h-85.54a11.11 11.11 0 0 1-10.69-8.87l-6.72-47.82a16.07 16.07 0 0 0-9-12.22a155.3 155.3 0 0 1-21.46-12.57a16 16 0 0 0-15.11-1.71l-44.89 18.07a10.81 10.81 0 0 1-13.14-4.58l-42.77-74a10.8 10.8 0 0 1 2.45-13.75l38.21-30a16.05 16.05 0 0 0 6-14.08c-.36-4.17-.58-8.33-.58-12.5s.21-8.27.58-12.35a16 16 0 0 0-6.07-13.94l-38.19-30A10.81 10.81 0 0 1 49.48 186l42.77-74a10.81 10.81 0 0 1 13.14-4.59l44.9 18.08a16.11 16.11 0 0 0 15.17-1.75A164.48 164.48 0 0 1 187 111.2a15.94 15.94 0 0 0 8.82-12.14l6.73-47.89A11.08 11.08 0 0 1 213.23 42h85.54a11.11 11.11 0 0 1 10.69 8.87l6.72 47.82a16.07 16.07 0 0 0 9 12.22a155.3 155.3 0 0 1 21.46 12.57a16 16 0 0 0 15.11 1.71l44.89-18.07a10.81 10.81 0 0 1 13.14 4.58l42.77 74a10.8 10.8 0 0 1-2.45 13.75l-38.21 30a16.05 16.05 0 0 0-6.05 14.08c.33 4.14.55 8.3.55 12.47z" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32"></path>
                        </svg>
                    </n-icon>
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

const tabs = ['全景概览', '深度分析', '行业洞察', '原始数据', '智能助手']
// 使用内联 SVG 替代表情图标
const tabIcons = [
  '<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><circle cx=\"12\" cy=\"12\" r=\"10\"/><path d=\"M2 12h20\"/><path d=\"M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z\"/></svg>',
  '<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z\"/><circle cx=\"12\" cy=\"12\" r=\"3\"/></svg>',
  '<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5\"/><path d=\"M9 18h6\"/><path d=\"M10 22h4\"/></svg>',
  '<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z\"/><polyline points=\"14 2 14 8 20 8\"/><line x1=\"16\" y1=\"13\" x2=\"8\" y2=\"13\"/><line x1=\"16\" y1=\"17\" x2=\"8\" y2=\"17\"/><line x1=\"10\" y1=\"9\" x2=\"8\" y2=\"9\"/></svg>',
  '<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z\"/><path d=\"M19 10v2a7 7 0 0 1-14 0v-2\"/><line x1=\"12\" y1=\"19\" x2=\"12\" y2=\"23\"/><line x1=\"8\" y1=\"23\" x2=\"16\" y2=\"23\"/></svg>'
]

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
    display: flex;
    align-items: center;
}

.nav-icon svg {
    width: 16px;
    height: 16px;
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

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
// 彩色渐变填充图标 - 更现代、更有视觉冲击力
const tabIcons = [
  // 全景概览 - 地球/全景图标
  `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="url(#gradient1)">
    <defs>
      <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#4F46E5"/>
        <stop offset="100%" style="stop-color:#06B6D4"/>
      </linearGradient>
    </defs>
    <circle cx="12" cy="12" r="10" opacity="0.2"/>
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
  </svg>`,
  // 深度分析 - 放大镜/分析图标
  `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="url(#gradient2)">
    <defs>
      <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#7C3AED"/>
        <stop offset="100%" style="stop-color:#EC4899"/>
      </linearGradient>
    </defs>
    <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
    <circle cx="9.5" cy="9.5" r="2.5" opacity="0.3"/>
  </svg>`,
  // 行业洞察 - 灯泡/洞察图标
  `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="url(#gradient3)">
    <defs>
      <linearGradient id="gradient3" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#F59E0B"/>
        <stop offset="100%" style="stop-color:#EF4444"/>
      </linearGradient>
    </defs>
    <path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7zm2.85 11.1l-.85.6V16h-4v-2.3l-.85-.6A4.997 4.997 0 0 1 7 9c0-2.76 2.24-5 5-5s5 2.24 5 5c0 1.63-.8 3.16-2.15 4.1z"/>
    <path d="M12 4c-2.76 0-5 2.24-5 5 0 1.63.8 3.16 2.15 4.1l.85.6V16h4v-2.3l.85-.6A4.997 4.997 0 0 0 17 9c0-2.76-2.24-5-5-5z" opacity="0.3"/>
  </svg>`,
  // 原始数据 - 文档/数据图标
  `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="url(#gradient4)">
    <defs>
      <linearGradient id="gradient4" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#10B981"/>
        <stop offset="100%" style="stop-color:#059669"/>
      </linearGradient>
    </defs>
    <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
    <path d="M8 12h8v2H8zm0 4h8v2H8z" opacity="0.4"/>
  </svg>`,
  // 智能助手 - AI/机器人图标
  `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="url(#gradient5)">
    <defs>
      <linearGradient id="gradient5" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#3B82F6"/>
        <stop offset="100%" style="stop-color:#8B5CF6"/>
      </linearGradient>
    </defs>
    <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.38-1 1.72v.78h3c1.1 0 2 .9 2 2v8c0 1.1-.9 2-2 2H8c-1.1 0-2-.9-2-2V8.5c0-1.1.9-2 2-2h3v-.78c-.6-.34-1-.98-1-1.72a2 2 0 0 1 2-2M12 4a1 1 0 0 0-1 1 1 1 0 0 0 1 1 1 1 0 0 0 1-1 1 1 0 0 0-1-1zm-4 5.5v8h8v-8H8z"/>
    <circle cx="10" cy="10" r="1" fill="white"/>
    <circle cx="14" cy="10" r="1" fill="white"/>
    <path d="M12 17.5c1.33 0 2.42-.83 2.82-2H9.18c.4 1.17 1.49 2 2.82 2z" fill="white" opacity="0.8"/>
  </svg>`
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
    margin-right: 6px;
    display: flex;
    align-items: center;
    filter: drop-shadow(0 1px 2px rgba(0,0,0,0.1));
    transition: transform 0.2s ease;
}

.nav-icon svg {
    width: 18px;
    height: 18px;
}

.nav-item:hover .nav-icon {
    transform: scale(1.1);
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

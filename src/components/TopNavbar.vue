<template>
    <div class="top-navbar" @click="onNavbarClick">
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
            <div class="user-info" v-if="state.user">
                <n-dropdown trigger="click" :options="userOptions" @select="handleUserSelect">
                    <n-button text class="user-btn">
                        <template #icon>
                            <div class="user-avatar-icon">
                                <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <circle cx="12" cy="12" r="12" fill="#DCFCE7"/>
                                    <path fill-rule="evenodd" clip-rule="evenodd" d="M12 4C9.79086 4 8 5.79086 8 8C8 10.2091 9.79086 12 12 12C14.2091 12 16 10.2091 16 8C16 5.79086 14.2091 4 12 4ZM12 14C7.58172 14 4 17.5817 4 22H20C20 17.5817 16.4183 14 12 14Z" fill="#16A34A"/>
                                </svg>
                            </div>
                        </template>
                        {{ state.user.username }}
                    </n-button>
                </n-dropdown>
            </div>
            <div class="action-btn-wrapper" v-if="isAdmin">
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
                    <span class="btn-text">后台管理</span>
                </n-button>
            </div>
        </div>
    </div>
</template>

<script setup>
import { NTag, NButton, NIcon, NDropdown, useMessage } from 'naive-ui'
import { SettingsOutline, ServerOutline, PersonCircleOutline, LogOutOutline } from '@vicons/ionicons5'
import { currentTab, switchTab, currentDataSetId, dataSets, state, logout, isAdmin } from '../stores/dataStore'
import { computed, h } from 'vue'

const message = useMessage()
const tabs = ['全景概览', '深度分析', '行业洞察', '原始数据', '智能助手']
const tabIcons = ['🌐', '🔬', '💡', '📋', '🤖']

const currentDataSetName = computed(() => {
    const dataset = dataSets.value.find(ds => ds.id === currentDataSetId.value)
    return dataset ? dataset.name : ''
})

const userOptions = [
    {
        label: '退出登录',
        key: 'logout',
        icon: () => h(NIcon, null, { default: () => h(LogOutOutline) })
    }
]

function handleUserSelect(key) {
    if (key === 'logout') {
        logout()
    }
}

const emit = defineEmits(['switchData'])

function onTabClick(idx) {
    switchTab(idx)
}

function onNavbarClick(event) {
    // 如果点击的是导航按钮，让事件正常处理
    // 这个处理器确保点击顶部导航栏时，后台管理页面会关闭
    const isNavItem = event.target.closest('.nav-item')
    const isManageBtn = event.target.closest('.manage-btn')
    if (isNavItem && !isManageBtn) {
        // 点击了导航tab，关闭后台管理
        emit('switchData', false)
    }
}
</script>

<style scoped>
.nav-actions {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    gap: 12px;
}

.action-btn-wrapper {
    flex-shrink: 0;
}

.user-info {
    display: flex;
    align-items: center;
    flex-shrink: 0;
    white-space: nowrap;
}

.user-avatar-icon {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
}

.user-avatar-icon svg {
    display: block;
    width: 100%;
    height: 100%;
}

.user-btn {
    font-weight: 500;
    color: var(--text-secondary);
}

.user-btn:hover {
    color: var(--primary);
}

.nav-icon {
    font-size: 16px;
    margin-right: 4px;
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

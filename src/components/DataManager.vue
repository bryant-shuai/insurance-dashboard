<template>
    <div class="data-manager">
        <div class="dm-header">
            <div style="display:flex; align-items:center; gap: 14px;">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="background: linear-gradient(135deg, #EEF2FF, #E0E7FF); border-radius: 12px; padding: 8px;">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="3" y1="9" x2="21" y2="9"></line>
                    <line x1="9" y1="21" x2="9" y2="9"></line>
                </svg>
                <div>
                    <h1 style="font-size: clamp(16px, 1.5vw, 20px); font-weight: 700; letter-spacing: -0.02em; color: var(--text-primary); font-family: var(--font-sans);">系统管理</h1>
                    <n-text depth="3" style="font-size: 13px; font-family: var(--font-sans);">管理数据集和系统用户</n-text>
                </div>
            </div>
            <n-button @click="$emit('back')" quaternary size="medium">
                <template #icon>
                    <n-icon><ArrowBackOutline /></n-icon>
                </template>
                返回看板
            </n-button>
        </div>

        <div class="dm-content">
            <n-tabs type="segment" animated>
                <n-tab-pane name="datasets" tab="数据集管理">
                    <!-- Upload Section -->
                    <n-card class="dm-upload-card" :bordered="true" size="medium" style="margin-bottom: 24px;">
                        <template #header>
                            <n-text strong style="font-size: 15px; font-family: var(--font-sans);">上传新数据</n-text>
                        </template>
                        <div class="dm-upload-box" @click="triggerUpload">
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="background: linear-gradient(135deg, #EEF2FF, #E0E7FF); border-radius: 12px; padding: 12px; margin-bottom: 10px;">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                <polyline points="17 8 12 3 7 8"></polyline>
                                <line x1="12" y1="3" x2="12" y2="15"></line>
                            </svg>
                            <n-text strong style="font-size: 14px; font-family: var(--font-sans);">点击上传数据文件</n-text>
                            <n-text depth="3" style="font-size: 13px; margin-top: 4px; font-family: var(--font-sans);">支持 .xlsx, .xls, .csv</n-text>
                        </div>
                        <input type="file" ref="fileInput" hidden accept=".xlsx,.xls,.csv" @change="handleFileChange">
                    </n-card>

                    <!-- Datasets List -->
                    <n-card class="dm-datasets-card" :bordered="true" size="medium">
                        <template #header>
                            <div style="display:flex; align-items:center; justify-content:space-between; width:100%;">
                                <n-text strong style="font-size: 15px; font-family: var(--font-sans);">已保存的数据集</n-text>
                                <n-tag size="small" round :bordered="false" type="info">{{ dataSets.length }}</n-tag>
                            </div>
                        </template>
                        
                        <div class="dm-dataset-list" v-if="dataSets.length > 0">
                            <div 
                                v-for="dataset in dataSets" 
                                :key="dataset.id"
                                :class="['dm-dataset-item', { active: dataset.id === currentDataSetId }]"
                                tabindex="0"
                                @keydown.enter="dataset.id !== currentDataSetId && useDataSet(dataset.id)"
                            >
                                <div class="dm-dataset-info">
                                    <div class="dm-dataset-name">
                                        <span v-if="editingId === dataset.id">
                                            <n-input
                                                v-model:value="editingName"
                                                size="small"
                                                @blur="saveRename(dataset.id)"
                                                @keyup.enter="saveRename(dataset.id)"
                                                autofocus
                                                style="width: 200px;"
                                            />
                                        </span>
                                        <span v-else @dblclick="startRename(dataset.id, dataset.name)" style="cursor:text;">
                                            {{ dataset.name }}
                                        </span>
                                        <n-tag v-if="dataset.id === currentDataSetId" size="tiny" type="primary" :bordered="false" round>
                                            当前
                                        </n-tag>
                                    </div>
                                    <div class="dm-dataset-meta">
                                        <span style="display:flex; align-items:center; gap:4px;"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> {{ formatDate(dataset.createdAt) }}</span>
                                        <span style="display:flex; align-items:center; gap:4px;"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg> {{ Object.keys(dataset.companies).length }} 家公司</span>
                                    </div>
                                </div>
                                <div class="dm-dataset-actions">
                                    <template v-if="dataset.id !== currentDataSetId">
                                        <n-button type="primary" size="small" @click="useDataSet(dataset.id)" class="action-btn">
                                            使用
                                        </n-button>
                                        <n-button size="small" quaternary @click="startRename(dataset.id, dataset.name)" class="action-btn">
                                            重命名
                                        </n-button>
                                        <n-popconfirm @positive-click="handleDeleteDataSet(dataset.id)">
                                            <template #trigger>
                                                <n-button size="small" quaternary type="error" class="action-btn">删除</n-button>
                                            </template>
                                            确定删除该数据集吗？
                                        </n-popconfirm>
                                    </template>
                                    <n-tag v-else size="small" type="success" :bordered="false" round>使用中</n-tag>
                                </div>
                            </div>
                        </div>

                        <n-empty v-else description="暂无数据集" style="padding: 40px 0;">
                            <template #extra>
                                <n-button size="small" @click="triggerUpload">立即上传</n-button>
                            </template>
                        </n-empty>
                    </n-card>
                </n-tab-pane>

                <n-tab-pane name="users" tab="用户管理" v-if="isAdmin">
                    <n-card :bordered="true" size="medium">
                        <template #header>
                            <div style="display:flex; align-items:center; justify-content:space-between; width:100%;">
                                <n-text strong style="font-size: 15px;">用户列表</n-text>
                                <n-button type="primary" size="small" @click="showCreateUserModal = true">
                                    <template #icon>
                                        <n-icon><AddOutline /></n-icon>
                                    </template>
                                    新增用户
                                </n-button>
                            </div>
                        </template>

                        <n-data-table
                            :columns="userColumns"
                            :data="userList"
                            :loading="usersLoading"
                            :bordered="false"
                        />
                    </n-card>
                </n-tab-pane>
            </n-tabs>
        </div>

        <!-- Create User Modal -->
        <n-modal v-model:show="showCreateUserModal" preset="dialog" title="新增用户">
            <n-form
                ref="createUserFormRef"
                :model="createUserForm"
                :rules="createUserRules"
                label-placement="left"
                label-width="80"
                require-mark-placement="right-hanging"
            >
                <n-form-item label="用户名" path="username">
                    <n-input v-model:value="createUserForm.username" placeholder="请输入用户名" />
                </n-form-item>
                <n-form-item label="密码" path="password">
                    <n-input
                        v-model:value="createUserForm.password"
                        type="password"
                        show-password-on="click"
                        placeholder="请输入密码"
                    />
                </n-form-item>
                <n-form-item label="确认密码" path="confirm">
                    <n-input
                        v-model:value="createUserForm.confirm"
                        type="password"
                        show-password-on="click"
                        placeholder="请再次输入密码"
                    />
                </n-form-item>
            </n-form>
            <template #action>
                <n-button @click="showCreateUserModal = false">取消</n-button>
                <n-button type="primary" :loading="creatingUser" @click="handleCreateUser">确定</n-button>
            </template>
        </n-modal>

        <n-modal v-model:show="showChangePwdModal" preset="dialog" title="修改密码">
            <n-form
                ref="changePwdFormRef"
                :model="changePwdForm"
                :rules="changePwdRules"
                label-placement="left"
                label-width="80"
                require-mark-placement="right-hanging"
            >
                <n-form-item label="用户名">
                    <n-input :value="changePwdForm.username" disabled />
                </n-form-item>
                <n-form-item label="新密码" path="password">
                    <n-input
                        v-model:value="changePwdForm.password"
                        type="password"
                        show-password-on="click"
                        placeholder="请输入新密码"
                    />
                </n-form-item>
                <n-form-item label="确认密码" path="confirm">
                    <n-input
                        v-model:value="changePwdForm.confirm"
                        type="password"
                        show-password-on="click"
                        placeholder="请再次输入新密码"
                    />
                </n-form-item>
            </n-form>
            <template #action>
                <n-button @click="showChangePwdModal = false">取消</n-button>
                <n-button type="primary" :loading="changingPwd" @click="handleChangePassword">确定</n-button>
            </template>
        </n-modal>
    </div>
</template>

<script setup>
import { ref, computed, nextTick, onMounted, h } from 'vue'
import { 
    NCard, NButton, NIcon, NText, NTag, NEmpty, NInput, NPopconfirm, useMessage, 
    NTabs, NTabPane, NDataTable, NModal, NForm, NFormItem 
} from 'naive-ui'
import { 
    CloudUploadOutline, TrashOutline, CreateOutline, CheckmarkCircleOutline, 
    ArrowBackOutline, AddOutline 
} from '@vicons/ionicons5'
import { 
    dataSets, currentDataSetId, loadDataSet, uploadExcel, deleteDataSetFromServer, 
    renameDataSet, isAdmin, fetchUsers, deleteUser, register, updateUserPassword 
} from '../stores/dataStore'

const message = useMessage()
const fileInput = ref(null)
const editingId = ref(null)
const editingName = ref('')
const emit = defineEmits(['back'])

// User Management State
const userList = ref([])
const usersLoading = ref(false)
const showCreateUserModal = ref(false)
const creatingUser = ref(false)
const createUserFormRef = ref(null)
const createUserForm = ref({ username: '', password: '', confirm: '' })
const showChangePwdModal = ref(false)
const changingPwd = ref(false)
const changePwdFormRef = ref(null)
const changePwdForm = ref({ username: '', password: '', confirm: '' })

const createUserRules = {
    username: [
        { required: true, message: '请输入用户名', trigger: 'blur' },
        { pattern: /^[a-zA-Z0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]{4,20}$/, message: '4-20位英文、数字或符号', trigger: 'blur' }
    ],
    password: [
        { required: true, message: '请输入密码', trigger: 'blur' },
        { pattern: /^[a-zA-Z0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]{4,20}$/, message: '4-20位英文、数字或符号', trigger: 'blur' }
    ],
    confirm: [
        { required: true, message: '请确认密码', trigger: 'blur' },
        {
            validator: (_, value) => value === createUserForm.value.password,
            message: '两次输入不一致',
            trigger: 'blur'
        }
    ]
}

const changePwdRules = {
    password: [
        { required: true, message: '请输入新密码', trigger: 'blur' },
        { pattern: /^[a-zA-Z0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]{4,20}$/, message: '4-20位英文、数字或符号', trigger: 'blur' }
    ],
    confirm: [
        { required: true, message: '请确认新密码', trigger: 'blur' },
        {
            validator: (_, value) => value === changePwdForm.value.password,
            message: '两次输入不一致',
            trigger: 'blur'
        }
    ]
}

const userColumns = [
    { title: '用户名', key: 'username' },
    { 
        title: '角色', 
        key: 'role',
        render(row) {
            return h(NTag, { type: row.role === 'admin' ? 'warning' : 'default', size: 'small' }, { default: () => row.role === 'admin' ? '管理员' : '普通用户' })
        }
    },
    { 
        title: '创建时间', 
        key: 'createdAt',
        render(row) {
            return new Date(row.createdAt).toLocaleString()
        }
    },
    {
        title: '操作',
        key: 'actions',
        render(row) {
            const buttons = []
            if (row.role !== 'admin') {
                buttons.push(h(NButton, { size: 'small', type: 'primary', quaternary: true, onClick: () => openChangePwd(row.username) }, { default: () => '修改密码' }))
                buttons.push(h(
                    NPopconfirm,
                    { onPositiveClick: () => handleDeleteUser(row.username) },
                    {
                        trigger: () => h(NButton, { size: 'small', type: 'error', quaternary: true }, { default: () => '删除' }),
                        default: () => `确定要删除用户 ${row.username} 吗？`
                    }
                ))
            }
            return h('div', { style: 'display:flex; gap:8px;' }, buttons)
        }
    }
]

onMounted(() => {
    if (isAdmin.value) {
        loadUsers()
    }
})

async function loadUsers() {
    usersLoading.value = true
    try {
        userList.value = await fetchUsers()
    } catch (error) {
        message.error('加载用户列表失败')
    } finally {
        usersLoading.value = false
    }
}

async function handleCreateUser() {
    createUserFormRef.value?.validate(async (errors) => {
        if (!errors) {
            creatingUser.value = true
            try {
                await register(createUserForm.value.username, createUserForm.value.password)
                message.success('创建用户成功')
                showCreateUserModal.value = false
                createUserForm.value = { username: '', password: '', confirm: '' }
                loadUsers()
            } catch (error) {
                message.error(error.message || '创建用户失败')
            } finally {
                creatingUser.value = false
            }
        }
    })
}

async function handleDeleteUser(username) {
    try {
        await deleteUser(username)
        message.success('删除用户成功')
        loadUsers()
    } catch (error) {
        message.error(error.message || '删除用户失败')
    }
}

function openChangePwd(username) {
    changePwdForm.value = { username, password: '', confirm: '' }
    showChangePwdModal.value = true
}

async function handleChangePassword() {
    changePwdFormRef.value?.validate(async (errors) => {
        if (!errors) {
            changingPwd.value = true
            try {
                await updateUserPassword(changePwdForm.value.username, changePwdForm.value.password)
                message.success('修改密码成功')
                showChangePwdModal.value = false
            } catch (error) {
                message.error(error.message || '修改密码失败')
            } finally {
                changingPwd.value = false
            }
        }
    })
}

// ... (Existing Dataset Methods)
function triggerUpload() {
    fileInput.value.click()
}

async function handleFileChange(event) {
    const file = event.target.files[0]
    if (!file) return
    
    try {
        const dataset = await uploadExcel(file)
        await loadDataSet(dataset.id)
        message.success('上传成功')
    } catch (error) {
        message.error(error.message || '上传失败')
    }
    event.target.value = ''
}

function useDataSet(id) {
    loadDataSet(id)
    emit('back')
}

function startRename(id, name) {
    editingId.value = id
    editingName.value = name
}

async function saveRename(id) {
    if (!editingName.value.trim()) {
        editingId.value = null
        return
    }
    
    try {
        await renameDataSet(id, editingName.value)
        message.success('重命名成功')
    } catch (error) {
        message.error('重命名失败')
    } finally {
        editingId.value = null
    }
}

async function handleDeleteDataSet(id) {
    try {
        await deleteDataSetFromServer(id)
        message.success('删除成功')
    } catch (error) {
        message.error('删除失败')
    }
}

function formatDate(isoStr) {
    if (!isoStr) return ''
    return new Date(isoStr).toLocaleDateString()
}
</script>

<style scoped>
.data-manager {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: var(--bg-app);
    z-index: 1000;
    display: flex;
    flex-direction: column;
}

.dm-header {
    height: 64px;
    padding: 0 24px;
    background: rgba(255, 255, 255, 0.8);
    backdrop-filter: blur(12px);
    border-bottom: 1px solid var(--border-light);
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-shrink: 0;
}

.dm-content {
    flex: 1;
    overflow-y: auto;
    padding: 24px;
    max-width: 1200px;
    width: 100%;
    margin: 0 auto;
}

.dm-upload-box {
    border: 2px dashed var(--border-default);
    border-radius: var(--radius-lg);
    padding: 32px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
    background: var(--bg-subtle);
}

.dm-upload-box:hover {
    border-color: var(--primary);
    background: var(--primary-light);
}

.dm-dataset-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.dm-dataset-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px;
    background: var(--bg-card);
    border: 1px solid var(--border-light);
    border-radius: var(--radius-md);
    transition: all 0.2s ease;
}

.dm-dataset-item:hover {
    border-color: var(--primary-subtle);
    box-shadow: var(--shadow-sm);
}

.dm-dataset-item.active {
    border-color: var(--primary);
    background: var(--primary-light);
}

.dm-dataset-info {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.dm-dataset-name {
    font-size: 15px;
    font-weight: 600;
    color: var(--text-primary);
    display: flex;
    align-items: center;
    gap: 8px;
}

.dm-dataset-meta {
    font-size: 12px;
    color: var(--text-tertiary);
    display: flex;
    gap: 12px;
}

.dm-dataset-actions {
    display: flex;
    align-items: center;
    gap: 8px;
}

/* 适配暗色模式（如果有的话，虽然目前没做） */
@media (prefers-color-scheme: dark) {
    /* ... */
}
</style>

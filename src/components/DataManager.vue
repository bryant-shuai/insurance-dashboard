<template>
    <div class="page">
        <div class="chart-card admin-card">
            <!-- 左侧导航 + 右侧内容 -->
            <div class="admin-container">
                <!-- 左侧导航栏 -->
                <aside class="admin-sidebar">
                    <div class="sidebar-header">
                        <n-icon size="20"><SettingsOutline /></n-icon>
                        <span>后台管理</span>
                    </div>
                    <nav class="sidebar-nav">
                        <div 
                            v-for="item in menuItems" 
                            :key="item.key"
                            :class="['sidebar-nav-item', { active: activeMenu === item.key }]"
                            @click="activeMenu = item.key"
                        >
                            <n-icon size="18"><component :is="item.icon" /></n-icon>
                            <span>{{ item.label }}</span>
                        </div>
                    </nav>
                </aside>

                <!-- 右侧内容区 -->
                <main class="admin-main">
                    <!-- Dataset Management -->
                    <template v-if="activeMenu === 'datasets'">
                        <div class="content-body full-height">
                            <!-- Datasets List -->
                            <section class="content-section">
                                <div class="dm-toolbar">
                                    <n-button type="primary" size="small" @click="triggerUpload" class="dm-upload-btn">
                                        <template #icon>
                                            <n-icon><CloudUploadOutline /></n-icon>
                                        </template>
                                        上传数据
                                    </n-button>
                                </div>
                                <input type="file" ref="fileInput" hidden accept=".xlsx,.xls,.csv" @change="handleFileChange">
                                <div class="dm-dataset-list" v-if="dataSets.length > 0">
                                    <div 
                                        v-for="dataset in dataSets" 
                                        :key="dataset.id"
                                        :class="['dm-dataset-item', { active: dataset.id === currentDataSetId }]"
                                        tabindex="0"
                                        @keydown.enter="dataset.id !== currentDataSetId && useDataSet(dataset.id)"
                                    >
                                        <div class="dm-dataset-main">
                                            <div class="dm-dataset-icon">
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                                    <polyline points="14 2 14 8 20 8"></polyline>
                                                </svg>
                                            </div>
                                            <div class="dm-dataset-info">
                                                <div class="dm-dataset-name">
                                                    <span v-if="editingId === dataset.id">
                                                        <n-input
                                                            v-model:value="editingName"
                                                            size="small"
                                                            @blur="saveRename(dataset.id)"
                                                            @keyup.enter="saveRename(dataset.id)"
                                                            autofocus
                                                            class="dm-rename-input"
                                                        />
                                                    </span>
                                                    <span v-else @dblclick="startRename(dataset.id, dataset.name)" class="dm-name-text" :title="dataset.name">
                                                        {{ dataset.name }}
                                                    </span>
                                                    <n-tag v-if="dataset.id === currentDataSetId" size="tiny" type="success" :bordered="false" round class="dm-current-tag">
                                                        当前使用
                                                    </n-tag>
                                                </div>
                                                <div class="dm-dataset-meta">
                                                    <span class="dm-meta-item">
                                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                                                        {{ formatDate(dataset.createdAt) }}
                                                    </span>
                                                    <span class="dm-meta-separator">·</span>
                                                    <span class="dm-meta-item">
                                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
                                                        {{ Object.keys(dataset.companies).length }} 家公司
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="dm-dataset-actions">
                                            <template v-if="dataset.id !== currentDataSetId">
                                                <n-button type="primary" size="small" @click="useDataSet(dataset.id)" class="dm-action-btn dm-use-btn">
                                                    <template #icon>
                                                        <n-icon><CheckmarkCircleOutline /></n-icon>
                                                    </template>
                                                    使用
                                                </n-button>
                                                <n-button size="small" quaternary @click="startRename(dataset.id, dataset.name)" class="dm-action-btn">
                                                    <template #icon>
                                                        <n-icon><CreateOutline /></n-icon>
                                                    </template>
                                                    重命名
                                                </n-button>
                                                <n-popconfirm @positive-click="handleDeleteDataSet(dataset.id)" class="dm-delete-confirm">
                                                    <template #trigger>
                                                        <n-button size="small" quaternary type="error" class="dm-action-btn dm-delete-btn">
                                                            <template #icon>
                                                                <n-icon><TrashOutline /></n-icon>
                                                            </template>
                                                            删除
                                                        </n-button>
                                                    </template>
                                                    确定删除该数据集吗？此操作不可恢复。
                                                </n-popconfirm>
                                            </template>
                                            <n-tag v-else size="small" type="success" :bordered="false" round class="dm-using-tag">
                                                <template #icon>
                                                    <n-icon><CheckmarkCircleOutline /></n-icon>
                                                </template>
                                                使用中
                                            </n-tag>
                                        </div>
                                    </div>
                                </div>

                                <n-empty v-else description="暂无数据集" class="dm-empty">
                                    <template #icon>
                                        <div class="dm-empty-icon">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                                                <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
                                                <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path>
                                                <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
                                            </svg>
                                        </div>
                                    </template>
                                    <template #extra>
                                        <n-button type="primary" size="small" @click="triggerUpload" class="dm-empty-btn">
                                            <template #icon>
                                                <n-icon><CloudUploadOutline /></n-icon>
                                            </template>
                                            立即上传
                                        </n-button>
                                    </template>
                                </n-empty>
                            </section>
                        </div>
                    </template>

                    <!-- User Management -->
                    <template v-if="activeMenu === 'users' && isAdmin">
                        <div class="content-body full-height">
                            <section class="content-section">
                                <div class="dm-user-toolbar">
                                    <n-button type="primary" size="small" @click="showCreateUserModal = true" class="dm-add-btn">
                                        <template #icon>
                                            <n-icon><AddOutline /></n-icon>
                                        </template>
                                        新增用户
                                    </n-button>
                                </div>

                                <n-data-table
                                    :columns="userColumns"
                                    :data="userList"
                                    :loading="usersLoading"
                                    :bordered="false"
                                    class="dm-user-table"
                                />
                            </section>
                        </div>
                    </template>
                </main>
            </div>
        </div>
    </div>

    <!-- Create User Modal -->
    <n-modal v-model:show="showCreateUserModal" :show-icon="false" :mask-closable="false" class="auth-modal">
        <n-card class="auth-card-modal" :bordered="false" size="huge">
            <template #header>
                <div class="auth-header-modal">
                    <n-icon size="48" color="#1E40AF">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                            <path d="M416 128c-11.7 0-22.7 2.8-32.5 7.7C374.1 103.4 345.6 96 316 96c-48.5 0-91.3 23.8-117.4 60.3C192.3 153.8 183.8 152 176 152c-53 0-96 43-96 96s43 96 96 96c1.3 0 2.6-.1 3.9-.2C190.7 365.6 233.5 400 284 400c33.9 0 64.4-14.5 85.7-37.6C380.6 365.6 397.5 368 416 368c53 0 96-43 96-96s-43-96-96-96z" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32"/>
                            <circle cx="376" cy="168" r="24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32"/>
                        </svg>
                    </n-icon>
                    <h2>新增用户</h2>
                    <p class="subtitle">创建新用户账号</p>
                </div>
            </template>

            <n-form
                ref="createUserFormRef"
                :model="createUserForm"
                :rules="createUserRules"
                size="large"
            >
                <n-form-item path="username" label="用户名">
                    <n-input v-model:value="createUserForm.username" placeholder="请输入用户名">
                        <template #prefix>
                            <n-icon :component="PersonOutline" />
                        </template>
                    </n-input>
                </n-form-item>
                <n-form-item path="password" label="密码">
                    <n-input
                        v-model:value="createUserForm.password"
                        type="password"
                        show-password-on="click"
                        placeholder="请输入密码"
                    >
                        <template #prefix>
                            <n-icon :component="LockClosedOutline" />
                        </template>
                    </n-input>
                </n-form-item>
                <n-form-item path="confirm" label="确认密码">
                    <n-input
                        v-model:value="createUserForm.confirm"
                        type="password"
                        show-password-on="click"
                        placeholder="请再次输入密码"
                    >
                        <template #prefix>
                            <n-icon :component="LockClosedOutline" />
                        </template>
                    </n-input>
                </n-form-item>

                <div class="auth-modal-footer">
                    <n-button size="large" @click="showCreateUserModal = false">取消</n-button>
                    <n-button type="primary" size="large" :loading="creatingUser" @click="handleCreateUser">创建用户</n-button>
                </div>
            </n-form>
        </n-card>
    </n-modal>

    <!-- Change Password Modal -->
    <n-modal v-model:show="showChangePwdModal" :show-icon="false" :mask-closable="false" class="auth-modal">
        <n-card class="auth-card-modal" :bordered="false" size="huge">
            <template #header>
                <div class="auth-header-modal">
                    <n-icon size="48" color="#1E40AF">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                            <path d="M336 128c-11.7 0-22.7 2.8-32.5 7.7C294.1 103.4 265.6 96 236 96c-48.5 0-91.3 23.8-117.4 60.3C112.3 153.8 103.8 152 96 152c-53 0-96 43-96 96s43 96 96 96c1.3 0 2.6-.1 3.9-.2C110.7 365.6 153.5 400 204 400c33.9 0 64.4-14.5 85.7-37.6C300.6 365.6 317.5 368 336 368c53 0 96-43 96-96s-43-96-96-96z" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32"/>
                            <path d="M336 224c-11.7 0-22.7 2.8-32.5 7.7C294.1 199.4 265.6 192 236 192c-48.5 0-91.3 23.8-117.4 60.3-6.3 8.3-14.8 10.1-22.6 10.1" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32"/>
                            <circle cx="296" cy="184" r="24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32"/>
                        </svg>
                    </n-icon>
                    <h2>修改密码</h2>
                    <p class="subtitle">重置用户 {{ changePwdForm.username }} 的密码</p>
                </div>
            </template>

            <n-form
                ref="changePwdFormRef"
                :model="changePwdForm"
                :rules="changePwdRules"
                size="large"
            >
                <n-form-item path="password" label="新密码">
                    <n-input
                        v-model:value="changePwdForm.password"
                        type="password"
                        show-password-on="click"
                        placeholder="请输入新密码"
                    >
                        <template #prefix>
                            <n-icon :component="LockClosedOutline" />
                        </template>
                    </n-input>
                </n-form-item>
                <n-form-item path="confirm" label="确认密码">
                    <n-input
                        v-model:value="changePwdForm.confirm"
                        type="password"
                        show-password-on="click"
                        placeholder="请再次输入新密码"
                    >
                        <template #prefix>
                            <n-icon :component="LockClosedOutline" />
                        </template>
                    </n-input>
                </n-form-item>

                <div class="auth-modal-footer">
                    <n-button size="large" @click="showChangePwdModal = false">取消</n-button>
                    <n-button type="primary" size="large" :loading="changingPwd" @click="handleChangePassword">确认修改</n-button>
                </div>
            </n-form>
        </n-card>
    </n-modal>
</template>

<script setup>
import { ref, computed, nextTick, onMounted, h, watch } from 'vue'
import { 
    NCard, NButton, NIcon, NText, NTag, NEmpty, NInput, NPopconfirm, useMessage, 
    NTabs, NTabPane, NDataTable, NModal, NForm, NFormItem 
} from 'naive-ui'
import { 
    CloudUploadOutline, TrashOutline, CreateOutline, CheckmarkCircleOutline, 
    AddOutline, ServerOutline, PeopleOutline, SettingsOutline, LockClosedOutline
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

// Props
const props = defineProps({
    showDataManager: Boolean
})

// Menu State
const activeMenu = ref('datasets')

const menuItems = computed(() => {
    const items = [
        { key: 'datasets', label: '数据集管理', icon: ServerOutline }
    ]
    if (isAdmin.value) {
        items.push({ key: 'users', label: '用户管理', icon: PeopleOutline })
    }
    return items
})

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

// Watch for isAdmin changes and load users when it becomes true
watch(isAdmin, (newValue) => {
    if (newValue && userList.value.length === 0) {
        loadUsers()
    }
})

async function loadUsers() {
    if (!isAdmin.value) return
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
/* ===== Admin Card ===== */
.admin-card {
    padding: 0 !important;
    overflow: hidden;
    height: 100%;
}

/* ===== Admin Container - 左侧导航 + 右侧内容 ===== */
.admin-container {
    display: flex;
    height: 100%;
    min-height: 0;
}

/* ===== Sidebar ===== */
.admin-sidebar {
    width: 220px;
    background: var(--bg-subtle);
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
}

.sidebar-header {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 20px;
    font-size: 16px;
    font-weight: 600;
    color: var(--text-primary);
}

.sidebar-header :deep(.n-icon) {
    color: var(--primary);
}

.sidebar-nav {
    flex: 1;
    padding: 0 12px 12px;
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.sidebar-nav-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: all 0.2s ease;
    color: var(--text-secondary);
    font-size: 14px;
    font-weight: 500;
}

.sidebar-nav-item:hover {
    background: var(--bg-muted);
    color: var(--text-primary);
}

.sidebar-nav-item.active {
    background: var(--primary-light);
    color: var(--primary);
}

/* ===== Main Content ===== */
.admin-main {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    padding: 0;
}

.content-body {
    flex: 1;
    display: flex;
    gap: 0;
    overflow: hidden;
}

.content-body.single-column {
    display: flex;
    flex-direction: column;
}

.content-body.full-height {
    height: 100%;
}

.content-body > section {
    flex: 1;
    background: var(--bg-card);
    overflow: hidden;
    display: flex;
    flex-direction: column;
    min-height: 0;
}

/* Toolbar */
.dm-toolbar,
.dm-user-toolbar {
    padding: 16px 20px;
    display: flex;
    justify-content: flex-end;
    flex-shrink: 0;
}

.dm-upload-btn,
.dm-add-btn {
    font-weight: 500;
    font-size: 14px;
}

/* ===== Dataset List ===== */
.dm-dataset-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 0 20px 20px;
    overflow-y: auto;
    flex: 1;
    height: 100%;
}

.dm-dataset-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    background: var(--bg-subtle);
    border: 1px solid var(--border-light);
    border-radius: var(--radius-lg);
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    cursor: pointer;
}

.dm-dataset-item:hover {
    border-color: var(--primary-subtle);
    box-shadow: var(--shadow-sm);
    transform: translateY(-1px);
    background: var(--bg-card);
}

.dm-dataset-item.active {
    border-color: var(--success);
    background: linear-gradient(135deg, var(--success-bg), #F0FDF4);
    box-shadow: 0 0 0 1px var(--success), var(--shadow-sm);
}

.dm-dataset-main {
    display: flex;
    align-items: center;
    gap: 16px;
    flex: 1;
    min-width: 0;
}

.dm-dataset-icon {
    width: 44px;
    height: 44px;
    background: linear-gradient(135deg, var(--bg-muted), #F1F5F9);
    border-radius: var(--radius-md);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.dm-dataset-icon svg {
    width: 22px;
    height: 22px;
    color: var(--text-secondary);
}

.dm-dataset-item.active .dm-dataset-icon {
    background: linear-gradient(135deg, var(--success-bg), #DCFCE7);
}

.dm-dataset-item.active .dm-dataset-icon svg {
    color: var(--success);
}

.dm-dataset-info {
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 0;
    flex: 1;
}

.dm-dataset-name {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
}

.dm-name-text {
    font-size: 14px;
    font-weight: 500;
    color: var(--text-primary);
    cursor: text;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    padding: 2px 6px;
    margin: -2px -6px;
    border-radius: var(--radius-sm);
    transition: var(--transition-fast);
}

.dm-name-text:hover {
    background: var(--bg-muted);
}

.dm-rename-input {
    width: 240px;
}

.dm-current-tag {
    font-weight: 500;
    font-size: 12px;
    flex-shrink: 0;
}

.dm-dataset-meta {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    color: var(--text-secondary);
}

.dm-meta-item {
    display: flex;
    align-items: center;
    gap: 5px;
}

.dm-meta-item svg {
    width: 14px;
    height: 14px;
    color: var(--text-tertiary);
}

.dm-meta-separator {
    color: var(--text-tertiary);
}

/* ===== Actions ===== */
.dm-dataset-actions {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
}

.dm-action-btn {
    font-weight: 500;
    font-size: 14px;
}

.dm-use-btn {
    box-shadow: 0 2px 8px rgba(30, 64, 175, 0.25);
}

.dm-delete-btn:hover {
    background: var(--danger-bg) !important;
}

.dm-using-tag {
    font-weight: 500;
    font-size: 14px;
    padding: 0 12px;
    height: 32px;
}

/* ===== Empty State ===== */
.dm-empty :deep(.n-empty__icon) {
    margin-bottom: 16px;
}

.dm-empty-icon {
    width: 80px;
    height: 80px;
    background: linear-gradient(135deg, var(--bg-muted), #F1F5F9);
    border-radius: var(--radius-xl);
    display: flex;
    align-items: center;
    justify-content: center;
}

.dm-empty-icon svg {
    width: 40px;
    height: 40px;
    color: var(--text-tertiary);
}

.dm-empty :deep(.n-empty__description) {
    font-size: 15px;
    color: var(--text-secondary);
    margin-top: 8px;
}

.dm-empty-btn {
    margin-top: 16px;
    font-weight: 600;
    font-size: 14px;
}

/* ===== User Table ===== */
.dm-user-table {
    padding: 0 24px 24px;
}

.dm-user-table :deep(.n-data-table-th) {
    font-weight: 700;
    font-size: 13px;
    color: var(--text-secondary);
    background: var(--bg-subtle);
    text-transform: uppercase;
    letter-spacing: 0.03em;
}

.dm-user-table :deep(.n-data-table-td) {
    font-size: 14px;
    padding: 14px 16px;
}

/* 用户表格操作按钮字体统一 */
.dm-user-table :deep(.n-button) {
    font-weight: 500;
    font-size: 14px;
}

/* ===== Auth Modal (与登录页保持一致) ===== */
.auth-modal :deep(.n-modal-content) {
    padding: 0;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
}

.auth-card-modal {
    width: 100%;
    max-width: 400px;
    border-radius: 16px;
}

.auth-card-modal :deep(.n-card-header) {
    padding: 24px 28px 0;
}

.auth-card-modal :deep(.n-card__content) {
    padding: 20px 28px 28px;
}

.auth-header-modal {
    text-align: center;
    margin-bottom: 8px;
}

.auth-header-modal h2 {
    margin: 16px 0 8px;
    font-size: 24px;
    color: #111827;
    font-weight: 600;
}

.auth-header-modal .subtitle {
    margin: 0;
    color: #6B7280;
    font-size: 14px;
}

.auth-modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin-top: 24px;
}

.auth-modal-footer .n-button {
    min-width: 100px;
    font-weight: 500;
    font-size: 14px;
}

/* 移除输入框聚焦时的默认蓝色阴影 */
.auth-card-modal :deep(.n-input) {
    --n-box-shadow-focus: none !important;
    --n-border-hover: 1px solid #d1d5db !important;
    --n-border-focus: 1px solid #6b7280 !important;
}

.auth-card-modal :deep(.n-input .n-input__state-border) {
    box-shadow: none !important;
}

.auth-card-modal :deep(.n-input:hover .n-input__state-border) {
    border-color: #d1d5db !important;
}

.auth-card-modal :deep(.n-input--focus .n-input__state-border) {
    border-color: #6b7280 !important;
    box-shadow: none !important;
}

/* 优化表单错误提示样式 */
.auth-card-modal :deep(.n-form-item-feedback__line) {
    font-size: 12px;
    line-height: 1.4;
    padding-top: 4px;
    color: var(--danger, #d03050);
}

.auth-card-modal :deep(.n-form-item-label) {
    font-size: 14px;
    font-weight: 500;
}



/* ===== Responsive ===== */
@media (max-width: 1024px) {
    .admin-sidebar {
        width: 64px;
    }

    .sidebar-header span,
    .sidebar-nav-item span {
        display: none;
    }

    .sidebar-header {
        justify-content: center;
        padding: 16px 12px;
    }

    .sidebar-nav-item {
        justify-content: center;
        padding: 12px;
    }

    .content-body.two-columns {
        flex-direction: column;
        overflow-y: auto;
    }

    .content-body > section {
        min-height: 250px;
    }
}

@media (max-width: 768px) {
    .admin-container {
        flex-direction: column;
    }

    .admin-sidebar {
        width: 100%;
        flex-direction: row;
        padding: 12px;
    }

    .sidebar-header {
        display: none;
    }

    .sidebar-nav {
        flex-direction: row;
        width: 100%;
        padding: 0;
    }

    .sidebar-nav-item {
        flex: 1;
        justify-content: center;
    }

    .sidebar-nav-item span {
        display: none;
    }

    .dm-dataset-item {
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
        padding: 14px;
    }

    .dm-dataset-actions {
        width: 100%;
        justify-content: flex-end;
    }

    .dm-upload-box {
        padding: 30px 20px;
    }
}

@media (max-width: 480px) {
    .dm-dataset-actions {
        flex-wrap: wrap;
    }

    .dm-action-btn {
        font-size: 12px;
    }
}
</style>

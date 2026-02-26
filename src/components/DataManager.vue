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
                    <h1 style="font-size: clamp(16px, 1.5vw, 20px); font-weight: 700; letter-spacing: -0.02em; color: var(--text-primary); font-family: var(--font-sans);">数据管理</h1>
                    <n-text depth="3" style="font-size: 13px; font-family: var(--font-sans);">管理和切换你的数据集</n-text>
                </div>
            </div>
            <n-button @click="onBack" quaternary size="medium">
                <template #icon>
                    <n-icon><ArrowBackOutline /></n-icon>
                </template>
                返回看板
            </n-button>
        </div>

        <div class="dm-content">
            <!-- Upload Section -->
            <n-card class="dm-upload-card" :bordered="true" size="medium">
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
                                <n-button size="small" quaternary type="error" @click="handleDeleteDataSet(dataset.id)" class="action-btn">
                                    删除
                                </n-button>
                            </template>
                            <n-tag v-else size="small" type="success" :bordered="false" round>使用中</n-tag>
                        </div>
                    </div>
                </div>

                <n-empty v-else description="暂无数据集" style="padding: 40px 0;">
                    <template #extra>
                        <n-text depth="3" style="font-size: 12px;">上传文件后，数据将自动保存</n-text>
                    </template>
                </n-empty>
            </n-card>
        </div>
    </div>
</template>

<script setup>
import { ref, nextTick } from 'vue'
import { NButton, NCard, NTag, NText, NInput, NEmpty, NIcon } from 'naive-ui'
import { ArrowBackOutline } from '@vicons/ionicons5'
import { formatDate } from '../utils/formatters'
import { dataSets, currentDataSetId, loadDataSet, deleteDataSet, renameDataSet, uploadExcel, state } from '../stores/dataStore'

const emit = defineEmits(['back'])

const fileInput = ref(null)
const editingId = ref(null)
const editingName = ref('')
const isUploading = ref(false)

function onBack() { emit('back') }
function triggerUpload() { fileInput.value.click() }

async function handleFileChange(event) {
    const file = event.target.files[0]
    if (!file) return
    isUploading.value = true
    try {
        const dataset = await uploadExcel(file)
        await loadDataSet(dataset.id)
        onBack()
    } catch (error) {
        alert(error.message || '文件上传失败')
    } finally {
        isUploading.value = false
    }
    event.target.value = ''
}

function useDataSet(dataSetId) {
    loadDataSet(dataSetId)
    onBack()
}

function startRename(dataSetId, name) {
    editingId.value = dataSetId
    editingName.value = name
}

async function saveRename(dataSetId) {
    if (editingName.value.trim()) {
        try {
            await renameDataSet(dataSetId, editingName.value.trim())
        } catch (error) {
            alert(error.message || '重命名失败')
        }
    }
    editingId.value = null
    editingName.value = ''
}

async function handleDeleteDataSet(dataSetId) {
    const dataset = dataSets.value.find(ds => ds.id === dataSetId)
    const name = dataset ? dataset.name : '此数据集'
    if (confirm(`确定要删除"${name}"吗？`)) {
        try {
            await deleteDataSet(dataSetId)
            if (dataSetId === currentDataSetId.value && dataSets.value.length > 0) {
                await loadDataSet(dataSets.value[0].id)
                onBack()
            } else if (dataSets.value.length === 0) {
                onBack()
            }
        } catch (error) {
            alert(error.message || '删除失败')
        }
    }
}

function formatDatasetDate(dateString) {
    return formatDate(dateString)
}
</script>

<style scoped>
.data-manager {
    max-width: 1200px;
    margin: 0 auto;
    padding: clamp(16px, 2vw, 32px);
}

.dm-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: clamp(20px, 2.5vw, 36px);
}

.dm-content {
    display: grid;
    grid-template-columns: clamp(280px, 25vw, 380px) 1fr;
    gap: clamp(16px, 2vw, 28px);
}

@media (max-width: 900px) {
    .dm-content {
        grid-template-columns: 1fr;
    }
}

.dm-upload-box {
    border: 2px dashed var(--border-light);
    padding: clamp(28px, 3vw, 48px) 20px;
    border-radius: var(--radius-lg);
    text-align: center;
    cursor: pointer;
    transition: var(--transition-smooth);
    display: flex;
    flex-direction: column;
    align-items: center;
}

.dm-upload-box:hover {
    border-color: var(--primary);
    background: var(--primary-light);
    transform: translateY(-1px);
}

.dm-upload-box:focus-visible {
    outline: 2px solid var(--primary);
    outline-offset: 2px;
}

.dm-dataset-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.dm-dataset-item {
    border: 1px solid var(--border-light);
    border-radius: var(--radius-md);
    padding: clamp(12px, 1.2vw, 18px);
    display: flex;
    justify-content: space-between;
    align-items: center;
    transition: var(--transition-fast);
    background: var(--bg-card);
    cursor: pointer;
}

.dm-dataset-item:hover {
    border-color: var(--primary-subtle);
    box-shadow: var(--shadow-sm);
}

.dm-dataset-item:focus-visible {
    outline: 2px solid var(--primary);
    outline-offset: 2px;
}

.dm-dataset-item.active {
    border-color: var(--primary);
    background: var(--primary-light);
}

.dm-dataset-info { flex: 1; min-width: 0; }

.dm-dataset-name {
    font-size: 14px;
    font-weight: 700;
    color: var(--text-primary);
    margin-bottom: 4px;
    display: flex;
    align-items: center;
    gap: 8px;
    font-family: var(--font-sans);
}

.dm-dataset-meta {
    font-size: 13px;
    color: var(--text-tertiary);
    display: flex;
    gap: 14px;
    font-family: var(--font-sans);
}

.dm-dataset-actions {
    display: flex;
    gap: 6px;
    align-items: center;
    flex-shrink: 0;
    margin-left: 12px;
}

.action-btn {
    font-weight: 400 !important;
    font-size: 13px !important;
    font-family: var(--font-sans) !important;
    transition: var(--transition-fast);
}

.action-btn:focus-visible {
    outline: 2px solid var(--primary);
    outline-offset: 2px;
}

.n-button {
    font-weight: 400 !important;
    font-size: 13px !important;
    font-family: var(--font-sans) !important;
}
</style>

<template>
    <div class="data-manager">
        <div class="dm-header">
            <div style="display:flex; align-items:center; gap: 14px;">
                <div style="width:40px; height:40px; background: linear-gradient(135deg, #EEF2FF, #E0E7FF); border-radius: 12px; display:flex; align-items:center; justify-content:center; font-size:20px;">📊</div>
                <div>
                    <h1 style="font-size: clamp(16px, 1.5vw, 20px); font-weight: 700; letter-spacing: -0.02em; color: var(--text-primary); font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">数据管理</h1>
                    <n-text depth="3" style="font-size: 13px; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">管理和切换你的数据集</n-text>
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
                    <n-text strong style="font-size: 15px; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">上传新数据</n-text>
                </template>
                <div class="dm-upload-box" @click="triggerUpload">
                    <div style="width:48px; height:48px; background: linear-gradient(135deg, #EEF2FF, #E0E7FF); border-radius: 12px; display:flex; align-items:center; justify-content:center; font-size:24px; margin-bottom: 10px;">📂</div>
                    <n-text strong style="font-size: 14px; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">点击上传数据文件</n-text>
                    <n-text depth="3" style="font-size: 13px; margin-top: 4px; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">支持 .xlsx, .xls, .csv</n-text>
                </div>
                <input type="file" ref="fileInput" hidden accept=".xlsx,.xls,.csv" @change="handleFileChange">
            </n-card>

            <!-- Datasets List -->
            <n-card class="dm-datasets-card" :bordered="true" size="medium">
                <template #header>
                    <div style="display:flex; align-items:center; justify-content:space-between; width:100%;">
                        <n-text strong style="font-size: 15px; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">已保存的数据集</n-text>
                        <n-tag size="small" round :bordered="false" type="info">{{ dataSets.length }}</n-tag>
                    </div>
                </template>
                
                <div class="dm-dataset-list" v-if="dataSets.length > 0">
                    <div 
                        v-for="dataset in dataSets" 
                        :key="dataset.id"
                        :class="['dm-dataset-item', { active: dataset.id === currentDataSetId }]"
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
                                <span>📅 {{ formatDate(dataset.createdAt) }}</span>
                                <span>📈 {{ Object.keys(dataset.companies).length }} 家公司</span>
                            </div>
                        </div>
                        <div class="dm-dataset-actions">
                            <template v-if="dataset.id !== currentDataSetId">
                                <n-button type="primary" size="small" @click="useDataSet(dataset.id)">
                                    使用
                                </n-button>
                                <n-button size="small" quaternary @click="startRename(dataset.id, dataset.name)">
                                    重命名
                                </n-button>
                                <n-button size="small" quaternary type="error" @click="deleteDataSet(dataset.id)">
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
import { dataSets, currentDataSetId, loadDataSet, deleteDataSetFromServer, renameDataSet, uploadFile, state } from '../stores/dataStore'

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
        const dataset = await uploadFile(file)
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

async function deleteDataSet(dataSetId) {
    const dataset = dataSets.value.find(ds => ds.id === dataSetId)
    const name = dataset ? dataset.name : '此数据集'
    if (confirm(`确定要删除"${name}"吗？`)) {
        try {
            await deleteDataSetFromServer(dataSetId)
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
}

.dm-dataset-item:hover {
    border-color: var(--primary-subtle);
    box-shadow: var(--shadow-sm);
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
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.dm-dataset-meta {
    font-size: 13px;
    color: var(--text-tertiary);
    display: flex;
    gap: 14px;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.dm-dataset-actions {
    display: flex;
    gap: 6px;
    align-items: center;
    flex-shrink: 0;
    margin-left: 12px;
}

.n-button {
    font-weight: 400 !important;
    font-size: 13px !important;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
}
</style>

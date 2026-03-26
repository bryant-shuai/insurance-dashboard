<template>
    <div class="upload-overlay" v-if="!state.isDataLoaded">
        <div class="upload-header-wrap">
            <div class="upload-title-row">
                <div class="upload-title-bar"></div>
                <h1 class="upload-title">
                    📊 广州市行业非车险数据看板
                </h1>
            </div>
        </div>

        <div class="upload-period-card">
            <label class="upload-period-label">报表月份</label>
            <n-date-picker
                v-model:formatted-value="reportPeriodMonth"
                class="upload-period-picker"
                type="month"
                clearable
                format="yyyy年M月"
                value-format="yyyy-MM"
                placeholder="选择报表月份"
                :actions="['clear', 'confirm']"
            />
            <n-text depth="3" class="upload-period-tip">
                上传时必填，系统按该月份保存累计数据
            </n-text>
        </div>

        <div class="upload-box" @click="triggerUpload">
            <n-upload action="#" :auto-upload="false" style="border: none; background: transparent; padding: 0;">
                <n-upload-dragger style="border: none; background: transparent; padding: 0;">
                    <div class="upload-content">
                        <div class="upload-icon">
                            📁
                        </div>
                        <n-text class="upload-main-text">
                            点击上传数据文件
                        </n-text>
                        <n-text depth="3" class="upload-sub-text">
                            支持 .xlsx, .xls, .csv 格式
                        </n-text>
                        <n-text depth="3" class="upload-slogan">
                            分担风雨、共享阳光
                        </n-text>
                    </div>
                </n-upload-dragger>
            </n-upload>
        </div>

        <input 
            type="file" 
            ref="fileInput" 
            hidden 
            accept=".xlsx,.xls,.csv" 
            @change="handleFileChange"
        >
    </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { NDatePicker, NText, NUploadDragger } from 'naive-ui'
import { state, uploadExcel, loadDataSet } from '../stores/dataStore'
import { normalizeReportPeriodInput } from '../utils/ranking'

const fileInput = ref(null)
const isUploading = ref(false)
const reportPeriodMonth = ref(null)
const selectedReportPeriod = computed(() => normalizeReportPeriodInput(reportPeriodMonth.value))

const emit = defineEmits(['fileUploaded', 'closeDataManager'])

function triggerUpload() {
    if (!selectedReportPeriod.value) {
        alert('请先选择报表月份')
        return
    }
    fileInput.value.click()
}

async function handleFileChange(event) {
    const file = event.target.files[0]
    if (!file) return
    
    isUploading.value = true
    try {
        emit('closeDataManager')
        const dataset = await uploadExcel(file, {
            reportPeriod: selectedReportPeriod.value
        })
        await loadDataSet(dataset.id)
        emit('fileUploaded')
    } catch (error) {
        alert(error.message || '文件上传失败')
    } finally {
        isUploading.value = false
        event.target.value = ''
    }
}

defineExpose({ triggerUpload })
</script>

<style scoped>
.upload-period-card {
    position: absolute;
    top: clamp(92px, 12vw, 156px);
    width: min(420px, 90vw);
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 16px 18px;
    border-radius: 18px;
    background: rgba(255, 255, 255, 0.82);
    border: 1px solid rgba(226, 232, 240, 0.9);
    box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
    backdrop-filter: blur(10px);
}

.upload-period-label {
    font-size: var(--text-sm);
    font-weight: var(--weight-semibold);
    color: #111827;
}

.upload-period-picker {
    width: 100%;
}

.upload-period-picker :deep(.n-input) {
    --n-height: 42px;
}

.upload-period-picker :deep(.n-input__border),
.upload-period-picker :deep(.n-input__state-border) {
    border-radius: 12px;
}

.upload-period-tip {
    font-size: var(--text-xs);
}

.upload-header-wrap {
    position: absolute;
    top: clamp(16px, 3vw, 32px);
    width: 90%;
    max-width: 1600px;
    display: flex;
    justify-content: center;
}

.upload-title-row {
    display: flex;
    align-items: center;
    gap: 12px;
}

.upload-title-bar {
    width: 4px;
    height: 28px;
    background: linear-gradient(180deg, #4F46E5, #06B6D4);
    border-radius: 2px;
}

.upload-title {
    font-family: var(--font-sans);
    font-size: clamp(var(--text-2xl), 2vw, 28px);
    font-weight: var(--weight-extrabold);
    color: #111827;
    letter-spacing: -0.03em;
}

.upload-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
}

.upload-icon {
    width: 64px;
    height: 64px;
    background: var(--primary-light, #EEF2FF);
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 28px;
}

.upload-main-text {
    font-size: clamp(var(--text-lg), 1.2vw, var(--text-2xl));
    font-weight: var(--weight-bold);
    color: #111827;
}

.upload-sub-text {
    font-size: var(--text-md);
    font-weight: var(--weight-medium);
}

.upload-slogan {
    font-size: var(--text-sm);
    margin-top: 8px;
    opacity: 0.6;
    font-weight: var(--weight-regular);
}
</style>

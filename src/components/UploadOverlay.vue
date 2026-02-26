<template>
    <div class="upload-overlay" v-if="!state.isDataLoaded">
        <div style="position: absolute; top: clamp(16px, 3vw, 32px); width: 90%; max-width: 1600px; display:flex; justify-content:center;">
            <div style="display:flex; align-items:center; gap:12px;">
                <div style="width:4px; height:28px; background: linear-gradient(180deg, #4F46E5, #06B6D4); border-radius:2px;"></div>
                <h1 style="font-size: clamp(18px, 2vw, 28px); font-weight: 800; color: #111827; letter-spacing: -0.03em; font-family: 'Inter', sans-serif;">
                    <span style="display:flex; align-items:center; gap:8px;"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:#4F46E5;"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg> 广州市行业非车险数据看板</span>
                </h1>
            </div>
        </div>

        <div class="upload-box" @click="triggerUpload">
            <n-upload action="#" :auto-upload="false" style="border: none; background: transparent; padding: 0;">
                <n-upload-dragger style="border: none; background: transparent; padding: 0;">
                    <div style="display:flex; flex-direction:column; align-items:center; gap: 12px;">
                        <div style="width:64px; height:64px; background: var(--primary-light, #EEF2FF); border-radius: 16px; display:flex; align-items:center; justify-content:center; font-size:28px;">
                            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:#4F46E5;"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
                        </div>
                        <n-text style="font-size: clamp(15px, 1.2vw, 18px); font-weight: 700; color: #111827;">
                            点击上传数据文件
                        </n-text>
                        <n-text depth="3" style="font-size: 13px;">
                            支持 .xlsx, .xls, .csv 格式
                        </n-text>
                        <n-text depth="3" style="font-size: 12px; margin-top: 8px; opacity: 0.6;">
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
import { ref, watch } from 'vue'
import { NText, NUploadDragger } from 'naive-ui'
import { state, uploadExcel, loadDataSet, dataSets } from '../stores/dataStore'

const fileInput = ref(null)
const isUploading = ref(false)

watch(() => state.isDataLoaded, (val) => {
    // 不需要额外的本地状态，直接使用 store 的状态
})

const emit = defineEmits(['fileUploaded', 'closeDataManager'])

function triggerUpload() {
    fileInput.value.click()
}

async function handleFileChange(event) {
    const file = event.target.files[0]
    if (!file) return
    
    isUploading.value = true
    try {
        emit('closeDataManager')
        const dataset = await uploadExcel(file)
        await loadDataSet(dataset.id)
        emit('fileUploaded')
    } catch (error) {
        alert(error.message || '文件上传失败')
    } finally {
        isUploading.value = false
    }
}

defineExpose({ triggerUpload })
</script>

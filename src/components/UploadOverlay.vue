<template>
    <div class="upload-overlay" v-if="!state.isDataLoaded">
        <div style="position: absolute; top: clamp(16px, 3vw, 32px); width: 90%; max-width: 1600px; display:flex; justify-content:center;">
            <div style="display:flex; align-items:center; gap:12px;">
                <div style="width:4px; height:28px; background: linear-gradient(180deg, #4F46E5, #06B6D4); border-radius:2px;"></div>
                <h1 style="font-size: clamp(18px, 2vw, 28px); font-weight: 800; color: #111827; letter-spacing: -0.03em; font-family: 'Inter', sans-serif;">
                    <span style="display:flex; align-items:center; gap:10px;">
                        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24">
                            <defs>
                                <linearGradient id="headerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" style="stop-color:#4F46E5"/>
                                    <stop offset="100%" style="stop-color:#06B6D4"/>
                                </linearGradient>
                            </defs>
                            <circle cx="12" cy="12" r="10" fill="url(#headerGrad)" opacity="0.15"/>
                            <path fill="url(#headerGrad)" d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
                        </svg>
                        广州市行业非车险数据看板
                    </span>
                </h1>
            </div>
        </div>

        <div class="upload-box" @click="triggerUpload">
            <n-upload action="#" :auto-upload="false" style="border: none; background: transparent; padding: 0;">
                <n-upload-dragger style="border: none; background: transparent; padding: 0;">
                    <div style="display:flex; flex-direction:column; align-items:center; gap: 12px;">
                        <div style="width:64px; height:64px; background: var(--primary-light, #EEF2FF); border-radius: 16px; display:flex; align-items:center; justify-content:center; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.15);">
                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24">
                                <defs>
                                    <linearGradient id="uploadGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" style="stop-color:#4F46E5"/>
                                        <stop offset="100%" style="stop-color:#06B6D4"/>
                                    </linearGradient>
                                </defs>
                                <circle cx="12" cy="12" r="10" fill="url(#uploadGrad)" opacity="0.15"/>
                                <path fill="url(#uploadGrad)" d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z"/>
                            </svg>
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

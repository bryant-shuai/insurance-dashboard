<template>
    <n-config-provider :theme-overrides="themeOverrides">
        <n-message-provider>
            <n-dialog-provider>
                <!-- Loading -->
                <div v-if="isLoading" class="loading-overlay">
                    <div class="loading-content">
                        <n-spin :size="48" />
                        <n-text depth="3" style="margin-top: 16px; font-size: 15px;">加载数据中...</n-text>
                    </div>
                </div>

                <!-- Data Manager -->
                <DataManager v-else-if="showDataManager && state.isDataLoaded" @back="onBackFromDataManager" />

                <!-- Upload Overlay -->
                <UploadOverlay v-else-if="!state.isDataLoaded" ref="uploadOverlay" @fileUploaded="onFileUploaded" @closeDataManager="showDataManager = false" />

                <!-- Main App -->
                <div class="container" v-else>
                    <TopNavbar @switchData="onSwitchData" />
                    <ControlPanel />
                    <OverviewPage v-show="currentTab === 0" />
                    <AnalysisPage v-show="currentTab === 1" />
                    <InsightPage v-show="currentTab === 2" />
                    <RawDataPage v-show="currentTab === 3" />
                </div>
            </n-dialog-provider>
        </n-message-provider>
    </n-config-provider>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { NConfigProvider, NMessageProvider, NDialogProvider, NSpin, NText } from 'naive-ui'
import { state, currentTab, loadDataFromStorage, loadDataSet, currentDataSetId, fetchDatasets, dataSets } from './stores/dataStore'
import UploadOverlay from './components/UploadOverlay.vue'
import DataManager from './components/DataManager.vue'
import TopNavbar from './components/TopNavbar.vue'
import ControlPanel from './components/ControlPanel.vue'
import OverviewPage from './components/OverviewPage.vue'
import AnalysisPage from './components/AnalysisPage.vue'
import InsightPage from './components/InsightPage.vue'
import RawDataPage from './components/RawDataPage.vue'

const themeOverrides = {
    common: {
        primaryColor: '#1E40AF',
        primaryColorHover: '#1E3A8A',
        primaryColorPressed: '#1E3A8A',
        primaryColorFocus: '#1E3A8A',
        primaryColorSuppl: '#1E40AF',
        borderRadius: '10px',
        borderRadiusSmall: '6px',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        fontSize: '14px',
        heightMedium: '38px',
    },
    Button: {
        fontWeight: '600',
        borderRadiusMedium: '10px',
        paddingMedium: '0 20px',
    },
    Card: {
        borderRadius: '14px',
        paddingMedium: '20px',
    },
    Tag: {
        borderRadius: '100px',
    },
    Input: {
        borderRadius: '10px',
    },
}

const uploadOverlay = ref(null)
const showDataManager = ref(false)
const isLoading = ref(true)

onMounted(async () => {
    try {
        await fetchDatasets()
        if (dataSets.value.length > 0) {
            await loadDataSet(dataSets.value[0].id)
        }
    } catch (error) {
        console.error('从服务器获取数据集失败:', error)
    }
    isLoading.value = false
})

async function onFileUploaded() {
    showDataManager.value = false
    await nextTick()
}

function onSwitchData() {
    showDataManager.value = true
}

function onBackFromDataManager() {
    showDataManager.value = false
}
</script>

<style scoped>
.loading-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(160deg, #F8FAFC 0%, #EEF2FF 50%, #F0FDFA 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
}

.loading-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
}
</style>

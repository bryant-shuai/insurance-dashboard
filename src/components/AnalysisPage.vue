<template>
    <div class="page">
        <div class="chart-card" style="height: 100%;">
            <div class="chart-header">
                <div class="chart-title">
                    <span style="margin-right: 6px; font-size: 20px;">🔍</span>
                    <template v-if="selectedCompany">
                        <span class="company-name">{{ selectedCompany.split('-').pop() }}</span>
                        <span class="title-separator">|</span>
                        <span class="title-text">分险种透视</span>
                    </template>
                    <template v-else>
                        非车险结构透视
                    </template>
                </div>
                <div class="chart-actions">
                    <div class="company-search" ref="searchContainer">
                        <div class="search-box" @click="toggleDropdown">
                            <span style="display:flex;align-items:center;gap:6px;">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                                选择公司...
                            </span>
                            <span style="font-size:10px;opacity:0.5;">▼</span>
                        </div>
                        <div :class="['dropdown', { show: dropdownVisible }]">
                            <input 
                                type="text" 
                                class="dropdown-input" 
                                placeholder="搜索公司名称..." 
                                v-model="searchKeyword"
                            >
                            <div 
                                v-for="company in filteredCompanies" 
                                :key="company"
                                class="dropdown-item"
                                @click="onSelectCompany(company)"
                            >
                                {{ company }}
                            </div>
                        </div>
                    </div>
                </div>
                <div class="chart-subtitle">
                    <span style="width:8px; height:8px; background:var(--chart-primary); display:inline-block; border-radius:2px;"></span> 单位：万元
                </div>
            </div>
            
            <div class="analysis-layout">
                <div class="list-container" ref="listContainer">
                    <div 
                        v-for="(item, idx) in analysisList" 
                        :key="item.fullName"
                        :class="[
                            'list-item', 
                            { 'focus-company': isFocusCompany(item.name) },
                            { 'active': selectedCompany === item.fullName }
                        ]"
                        :ref="el => { if (isFocusCompany(item.name)) focusItemRefs[idx] = el }"
                        @click="selectCompany(item.fullName)"
                    >
                        <div class="item-left">
                            <div class="rank">{{ idx + 1 }}</div>
                            <div class="name" :style="isFocusCompany(item.name) ? 'color: var(--danger)' : ''">
                                {{ item.name }}
                            </div>
                        </div>
                        <div class="item-right">
                            <div class="val-p">{{ Math.round(item.p).toLocaleString() }}</div>
                            <div :class="['val-g', item.g >= 0 ? 'pos' : 'neg']">
                                {{ formatGrowth(item.g) }}
                            </div>
                        </div>
                    </div>
                    <div style="height: 1px;"></div>
                </div>
                <div style="background: var(--bg-muted); padding: clamp(12px, 1.5vw, 20px); border-radius: var(--radius-md); display: flex; flex-direction: column; flex: 1; min-height: 0;">
                    <div style="flex: 1; position: relative; min-height: 300px;">
                        <VChart 
                            class="detail-chart"
                            :option="chartOption"
                            :autoresize="true"
                        />
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { useWindowResize, useClickOutside } from '../composables/useEventListener'
import VChart from "vue-echarts"
import { useECharts, useNiceInterval } from '../composables/useECharts'
import { formatGrowth, formatPremium, formatAxisValue } from '../utils/formatters'
import { 
    analysisList, 
    focusCompanies, 
    selectedCompany,
    setSelectedCompany,
    getCompanyDetail,
    companyList
} from '../stores/dataStore'

useECharts()

const listContainer = ref(null)
const focusItemRefs = ref({})

// 使用组合式函数优化事件监听
const isMobile = useWindowResize()
useClickOutside(searchContainer, handleClickOutside)

// Company selection dropdown
const dropdownVisible = ref(false)
const searchKeyword = ref('')
const searchContainer = ref(null)

const filteredCompanies = computed(() => {
    if (!searchKeyword.value) return companyList.value
    return companyList.value.filter(c => c.includes(searchKeyword.value))
})

function toggleDropdown() {
    dropdownVisible.value = !dropdownVisible.value
}

function onSelectCompany(company) {
    // Find the full company name from analysisList
    const companyItem = analysisList.value.find(item => item.name === company)
    if (companyItem) {
        selectCompany(companyItem.fullName)
        // Scroll to the selected company in the list
        nextTick(() => {
            const companyIndex = analysisList.value.findIndex(item => item.fullName === companyItem.fullName)
            if (companyIndex !== -1 && listContainer.value) {
                const listItems = listContainer.value.querySelectorAll('.list-item')
                if (listItems[companyIndex]) {
                    listItems[companyIndex].scrollIntoView({ 
                        behavior: 'smooth', 
                        block: 'center' 
                    })
                }
            }
        })
    }
    dropdownVisible.value = false
    searchKeyword.value = ''
}

function handleClickOutside(event) {
    if (searchContainer.value && !searchContainer.value.contains(event.target)) {
        dropdownVisible.value = false
    }
}

const chartOption = computed(() => {
    if (!selectedCompany.value) return {}
    
    const chartData = getCompanyDetail(selectedCompany.value)
    const labels = chartData.map(d => d.name)
    const mainData = chartData.map(d => d.p)
    
    const { interval, max: newMax } = useNiceInterval(mainData)
    
    const isMobileVal = isMobile.value
    
    return {
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'shadow'
            },
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            borderColor: 'rgba(209, 213, 219, 0.8)',
            borderWidth: 1,
            padding: 16,
            textStyle: {
                color: '#374151',
                fontSize: 13,
                fontFamily: 'Inter'
            },
            formatter: function(params) {
                const param = params[0]
                const idx = param.dataIndex
                const item = chartData[idx]
                const pStr = formatPremium(item.p)
                const gStr = formatGrowth(item.g)
                
                return `
                    <div style="font-weight: 600; margin-bottom: 8px; font-size: 14px; font-family: var(--font-sans); color: #111827;">${item.name}</div>
                    <div style="margin-bottom: 4px; font-family: var(--font-sans); color: #4B5563;">保费: <span style="color: #4F46E5">${pStr}</span></div>
                    <div style="font-family: var(--font-sans); color: #4B5563;">增速: <span style="color: ${item.g >= 0 ? '#10B981' : '#EF4444'}">${gStr}</span></div>
                `
            }
        },
        grid: {
            left: isMobileVal ? 10 : '3%',
            right: isMobileVal ? 40 : '4%',
            bottom: isMobileVal ? 10 : '8%',
            top: isMobileVal ? 30 : '18%',
            containLabel: true
        },
        xAxis: isMobileVal ? {
            type: 'value',
            name: '保费',
            nameLocation: 'end',
            nameGap: 15,
            nameTextStyle: {
                color: '#6B7280',
                fontSize: 10,
                fontWeight: 400,
                fontFamily: 'Inter'
            },
            max: newMax,
            interval: interval,
            axisLine: {
                show: false
            },
            axisTick: {
                show: false
            },
            axisLabel: {
                color: '#6B7280',
                fontSize: 9,
                fontFamily: 'Inter',
                formatter: formatAxisValue
            },
            splitLine: {
                lineStyle: {
                    color: 'rgba(156, 163, 175, 0.15)',
                    type: 'dashed'
                }
            }
        } : {
            type: 'category',
            data: labels,
            axisLine: {
                lineStyle: {
                    color: 'rgba(156, 163, 175, 0.2)'
                }
            },
            axisLabel: {
                color: '#4B5563',
                fontSize: 11,
                fontWeight: 500,
                rotate: 0,
                fontFamily: 'Inter'
            },
            axisTick: {
                show: false
            }
        },
        yAxis: isMobileVal ? {
            type: 'category',
            data: labels,
            inverse: true,
            axisLine: {
                show: false
            },
            axisTick: {
                show: false
            },
            axisLabel: {
                color: '#4B5563',
                fontSize: 10,
                fontWeight: 500,
                fontFamily: 'Inter'
            }
        } : {
            type: 'value',
            name: '保费',
            nameLocation: 'end',
            nameGap: 25,
            nameTextStyle: {
                color: '#6B7280',
                fontSize: 11,
                fontWeight: 400,
                fontFamily: 'Inter',
                padding: [0, 0, 0, 0]
            },
            max: newMax,
            interval: interval,
            axisLine: {
                show: false
            },
            axisTick: {
                show: false
            },
            axisLabel: {
                color: '#6B7280',
                fontSize: 10,
                fontFamily: 'Inter',
                formatter: formatAxisValue
            },
            splitLine: {
                lineStyle: {
                    color: 'rgba(156, 163, 175, 0.15)',
                    type: 'dashed'
                }
            }
        },
        series: [
            {
                name: '保费',
                type: 'bar',
                data: mainData,
                barWidth: isMobileVal ? '35%' : '50%',
                barCategoryGap: isMobileVal ? '40%' : '20%',
                itemStyle: {
                    borderRadius: isMobileVal ? [0, 4, 4, 0] : [8, 8, 0, 0],
                    color: '#4F46E5'
                },
                label: {
                    show: true,
                    position: isMobileVal ? 'right' : 'top',
                    formatter: function(params) {
                        const idx = params.dataIndex
                        const item = chartData[idx]
                        const premium = formatPremium(item.p)
                        const growth = formatGrowth(item.g)
                        if (isMobileVal) {
                            return `${premium}  ${growth}`
                        }
                        return `${premium}\n${growth}`
                    },
                    color: '#374151',
                    fontSize: isMobileVal ? 10 : 11,
                    fontWeight: '600',
                    fontFamily: 'Inter',
                    lineHeight: isMobileVal ? 14 : 15,
                    offset: isMobileVal ? [10, 0] : [0, 0]
                },
                emphasis: {
                    itemStyle: {
                        color: '#4338CA'
                    }
                }
                // 移除 animationDelay 提升性能
            }
        ],
        animationEasing: 'cubicOut',
        animationDuration: 1000
    }
})

function isFocusCompany(name) {
    return focusCompanies.value.includes(name)
}

function selectCompany(fullName) {
    setSelectedCompany(fullName)
}

watch(analysisList, (list) => {
    if (list.length > 0 && !selectedCompany.value) {
        selectCompany(list[0].fullName)
    }
}, { immediate: true })

watch(focusCompanies, async () => {
    await nextTick()
    const focusIdx = Object.keys(focusItemRefs.value)[0]
    if (focusIdx && focusItemRefs.value[focusIdx]) {
        focusItemRefs.value[focusIdx].scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
}, { deep: true })
</script>

<style scoped>
.page {
    height: 100%;
}

.chart-card {
    background: #FFFFFF;
    border-radius: 16px;
    padding: clamp(16px, 2vw, 24px);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
    border: 1px solid rgba(229, 231, 235, 0.8);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    font-family: var(--font-sans);
    max-height: calc(100vh - 40px);
    display: flex;
    flex-direction: column;
}

.chart-card:hover {
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08);
    transform: translateY(-2px);
}

.chart-header {
    margin-bottom: clamp(12px, 1.5vw, 16px);
    font-family: var(--font-sans);
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: clamp(12px, 1.5vw, 24px);
}

.chart-actions {
    flex: 1;
    min-width: 200px;
}

.chart-subtitle {
    flex-shrink: 0;
}

.chart-title {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 8px;
    font-family: var(--font-sans);
}

.chart-title {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-shrink: 0;
}

.chart-title span:first-child {
    font-size: 24px;
    line-height: 1;
    font-family: var(--font-sans);
}

.company-name {
    font-size: clamp(14px, 1.2vw, 20px);
    font-weight: 800;
    color: var(--primary);
    font-family: var(--font-sans);
    letter-spacing: -0.03em;
}

.title-separator {
    font-size: clamp(14px, 1.2vw, 20px);
    color: var(--text-tertiary);
    font-weight: 400;
}

.title-text {
    font-size: clamp(14px, 1.2vw, 20px);
    font-weight: 800;
    color: var(--text-primary);
    font-family: var(--font-sans);
    letter-spacing: -0.03em;
}

/* Company search styles */
.company-search {
    position: relative;
    width: 100%;
    max-width: 240px;
}

.search-box {
    width: 100%;
    padding: 12px 14px;
    border: 1px solid var(--border-light);
    border-radius: var(--radius-md);
    font-size: 13px;
    background: var(--bg-card);
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    align-items: center;
    transition: var(--transition-fast);
    color: var(--text-tertiary);
    height: 44px;
}

.search-box:hover {
    border-color: var(--primary-subtle);
    color: var(--primary);
}

.dropdown {
    position: absolute;
    top: calc(100% + 6px);
    left: 0;
    width: 100%;
    max-height: 360px;
    overflow-y: auto;
    background: var(--bg-card);
    border: 1px solid var(--border-light);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-lg);
    z-index: 200;
    display: none;
}

.dropdown.show {
    display: block;
    animation: slideDown 200ms ease-out;
}

@keyframes slideDown {
    from { opacity: 0; transform: translateY(-6px); }
    to { opacity: 1; transform: translateY(0); }
}

.dropdown-input {
    width: 100%;
    padding: 12px 14px;
    border: none;
    border-bottom: 1px solid var(--border-light);
    outline: none;
    font-size: 13px;
    position: sticky;
    top: 0;
    background: var(--bg-card);
    font-family: inherit;
}

.dropdown-input:focus {
    background: var(--bg-subtle);
}

.dropdown-item {
    padding: 10px 14px;
    font-size: 13px;
    cursor: pointer;
    transition: var(--transition-fast);
    color: var(--text-primary);
}

.dropdown-item:hover {
    background: var(--primary-light);
    color: var(--primary);
}

.chart-subtitle {
    display: flex;
    align-items: center;
    gap: 8px;
    font-family: var(--font-sans);
}

.chart-subtitle span {
    font-size: 13px;
    color: #6B7280;
    font-weight: 400;
    line-height: 1.4;
    font-family: var(--font-sans);
}

.chart-header {
    margin-bottom: clamp(12px, 1.5vw, 16px);
    font-family: var(--font-sans);
    flex-shrink: 0;
}

.analysis-layout {
    display: flex;
    gap: clamp(16px, 2vw, 24px);
    flex: 1;
    min-height: 300px;
    overflow: hidden;
}

.list-container {
    flex: 0 0 300px;
    overflow-y: scroll !important;
    padding-right: 8px;
    max-height: calc(100vh - 200px);
    height: 100%;
    display: block !important;
}

.list-container::-webkit-scrollbar {
    width: 4px;
}

.list-container::-webkit-scrollbar-track {
    background: #F3F4F6;
    border-radius: 4px;
}

.list-container::-webkit-scrollbar-thumb {
    background: #D1D5DB;
    border-radius: 4px;
}

.list-container::-webkit-scrollbar-thumb:hover {
    background: #9CA3AF;
}

.list-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    margin-bottom: 8px;
    border-radius: 8px;
    background: #F9FAFB;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    font-family: var(--font-sans);
    border: 1px solid transparent;
}

.list-item:hover {
    background: #F3F4F6;
}

.list-item.focus-company {
    background: #FEF2F2;
}

.list-item.active {
    background: #F0FDF4;
}

.item-left {
    display: flex;
    align-items: center;
    gap: 12px;
    font-family: var(--font-sans);
}

.rank {
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #E5E7EB;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 700;
    color: #6B7280;
    font-family: var(--font-sans);
}

.name {
    font-size: 14px;
    font-weight: 500;
    color: #374151;
    font-family: var(--font-sans);
}

.item-right {
    text-align: right;
    font-family: var(--font-sans);
}

.val-p {
    font-size: 14px;
    font-weight: 700;
    color: #111827;
    margin-bottom: 4px;
    font-family: var(--font-sans);
}

.val-g {
    font-size: 12px;
    font-weight: 600;
    font-family: var(--font-sans);
}

.val-g.pos {
    color: #10B981;
}

.val-g.neg {
    color: #EF4444;
}

.detail-chart {
    width: 100%;
    height: 100%;
}

@media (max-width: 1024px) {
    .analysis-layout {
        flex-direction: column;
        gap: 16px;
    }
    
    .list-container {
        flex: 0 0 auto;
        max-height: 250px;
        overflow-y: auto;
        border-right: none;
        border-bottom: 1px solid var(--border-light);
        padding-bottom: 12px;
    }

    .chart-card {
        max-height: none;
    }
}

@media (max-width: 768px) {
    .chart-card {
        padding: 16px;
    }

    .chart-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
    }

    .chart-actions {
        width: 100%;
    }

    .company-search {
        max-width: 100%;
    }
    
    .list-container {
        max-height: 200px;
    }
    
    .list-item {
        padding: 10px 12px;
    }
    
    .name {
        font-size: 13px;
    }

    .val-p {
        font-size: 13px;
    }

    .val-g {
        font-size: 11px;
    }

    .chart-title .company-name,
    .chart-title .title-text {
        font-size: 16px !important;
    }

    .analysis-layout > div:last-child {
        max-height: 550px;
        min-height: 450px;
    }

    .detail-chart {
        min-height: 400px;
    }
}
</style>

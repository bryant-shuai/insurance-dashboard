<template>
    <div class="page">
        <div class="chart-card" style="height: 100%;">
            <div class="chart-header">
                <div class="view-tabs">
                    <div 
                        :class="['view-tab', { active: activeView === 'detail' }]" 
                        @click="activeView = 'detail'"
                    >
                        结构透视
                    </div>
                    <div 
                        :class="['view-tab', { active: activeView === 'insight' }]" 
                        @click="activeView = 'insight'"
                    >
                        行业洞察
                    </div>
                </div>
                <div class="chart-title" v-if="activeView === 'detail'">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px;"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
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
                        <div class="direct-search-box">
                            <svg class="search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                            <input 
                                type="text" 
                                class="search-input" 
                                placeholder="输入公司名称搜索..." 
                                v-model="searchKeyword"
                                @focus="dropdownVisible = true"
                                @input="dropdownVisible = true"
                            >
                            <span class="dropdown-arrow" @click.stop="toggleDropdown">▼</span>
                        </div>
                        <div :class="['dropdown', { show: dropdownVisible && filteredCompanies.length > 0 }]">
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
            
            <div class="analysis-layout" v-if="activeView === 'detail'">
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

            <!-- 深度洞察视图 -->
            <div class="insight-layout" v-else>
                <div class="insight-grid">
                    <!-- 左侧：市场份额分布 (Treemap) -->
                    <div class="insight-card treemap-card">
                        <div class="card-title">
                            <div class="title-left">
                                <span class="icon-rocket">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="color: #4f46e5;"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
                                </span> 市场份额矩形树图
                            </div>
                            
                            <!-- 还原并优化后的图例：保留定义，采用极简布局 -->
                            <div class="treemap-legend-inline">
                                <div class="legend-item"><span class="legend-color star"></span>明星<span class="def">(高增高份)</span></div>
                                <div class="legend-item"><span class="legend-color cow"></span>奶牛<span class="def">(低增高份)</span></div>
                                <div class="legend-item"><span class="legend-color question"></span>野猫<span class="def">(高增低份)</span></div>
                                <div class="legend-item"><span class="legend-color dog"></span>瘦狗<span class="def">(低增低份)</span></div>
                            </div>
                        </div>
                        
                        <div class="bcg-chart-wrapper">
                            <VChart v-if="treemapData.length > 0" class="bcg-chart" :option="treemapChartOption" autoresize />
                            <div v-else class="loading-placeholder">
                                <div class="spinner"></div>
                                <span>数据结构构建中...</span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- 右侧：核心指标 & 排位 -->
                    <div class="insight-card info-card">
                        <div class="card-title">
                            <span class="icon-chart">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="color: #10b981;"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
                            </span> 市场竞争格局洞察
                        </div>
                        <div class="insight-metrics" v-if="currentInsight">
                            <div class="metric-item">
                                <span class="label">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:4px; vertical-align:middle;"><rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect><rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect><line x1="6" y1="6" x2="6" y2="6"></line><line x1="6" y1="18" x2="6" y2="18"></line></svg>
                                    市场规模
                                </span>
                                <span class="value">{{ Math.round(currentInsight.total_premium).toLocaleString() }} 万</span>
                            </div>
                            <div class="metric-item">
                                <span class="label">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:4px; vertical-align:middle;"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg>
                                    集中度 (CR4)
                                </span>
                                <span :class="['value', currentInsight.cr4 > 60 ? 'high' : 'low']">{{ currentInsight.cr4 }}%</span>
                            </div>
                        </div>
                        
                        <!-- 市场集中度进度条 -->
                        <div class="market-concentration" v-if="currentInsight">
                            <div class="concentration-header">
                                <span class="concentration-label">市场集中度</span>
                                <span class="concentration-type">{{ currentInsight.market_type }}</span>
                            </div>
                            <div class="concentration-bar-container">
                                <div class="concentration-bar-bg">
                                    <div 
                                        class="concentration-bar-fill" 
                                        :style="{ 
                                            width: currentInsight.cr4 + '%',
                                            background: currentInsight.cr4 > 60 ? 'linear-gradient(90deg, #ef4444 0%, #f97316 100%)' : 
                                                       currentInsight.cr4 > 30 ? 'linear-gradient(90deg, #f59e0b 0%, #fbbf24 100%)' : 
                                                       'linear-gradient(90deg, #10b981 0%, #34d399 100%)'
                                        }"
                                    >
                                        <span class="concentration-value">{{ currentInsight.cr4 }}%</span>
                                    </div>
                                </div>
                                <div class="concentration-markers">
                                    <span class="marker" style="left: 30%">30%</span>
                                    <span class="marker" style="left: 60%">60%</span>
                                </div>
                            </div>
                        </div>
                        
                        <!-- 龙头排名 -->
                        <div class="top-ranking" v-if="currentInsight?.top_companies">
                            <div class="rank-header">市场 Top 5 份额</div>
                            <div class="rank-list">
                                <div v-for="(item, idx) in currentInsight.top_companies" :key="item.company" class="rank-row">
                                    <span class="rank-num">{{ idx + 1 }}</span>
                                    <span class="rank-name">{{ item.company.split('-').pop() }}</span>
                                    <div class="rank-bar-bg">
                                        <div class="rank-bar-fill" :style="{ width: (item.premium / currentInsight.total_premium * 100 * 3) + '%' }"></div>
                                    </div>
                                    <span class="rank-val">{{ ((item.premium / currentInsight.total_premium) * 100).toFixed(1) }}%</span>
                                </div>
                            </div>
                        </div>
                        
                        <p class="analysis-text" v-if="bcgStats">
                            当前市场中，<strong>{{ bcgStats.star }}</strong> 家公司处于高速扩张且占有率领先的“明星”位置。
                            市场整体中位增速为 <strong>{{ summaryData?.avg_growth }}%</strong>。
                        </p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted } from 'vue'
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
    companyList,
    advancedAnalysisData,
    fetchAdvancedAnalysis,
    currentDataSetId
} from '../stores/dataStore'

useECharts()

const activeView = ref('detail')
const listContainer = ref(null)
const focusItemRefs = ref({})

// 使用组合式函数优化事件监听
const isMobile = useWindowResize()

// Company selection dropdown
const dropdownVisible = ref(false)
const searchKeyword = ref('')
const searchContainer = ref(null)

useClickOutside(searchContainer, handleClickOutside)

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
    if (event && searchContainer.value && !searchContainer.value.contains(event.target)) {
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

// 深度洞察数据
const currentInsight = computed(() => advancedAnalysisData.value?.market_insight?.['非车险'])
const bcgMatrix = computed(() => advancedAnalysisData.value?.bcg_matrix || [])
const summaryData = computed(() => advancedAnalysisData.value?.summary)

const treemapData = computed(() => {
    if (!bcgMatrix.value.length) return []
    
    const colorMap = {
        '明星': '#10b981',
        '奶牛': '#3b82f6',
        '野猫': '#f59e0b',
        '瘦狗': '#ef4444'
    }

    // 过滤掉市场份额小于0.5%的公司，同时使用0.45次方极致压缩头部公司面积
    // tooltip 中展示真实保费数据，确保数据准确性
    const totalPremium = currentInsight.value?.total_premium || 1
    return bcgMatrix.value
        .filter(d => (d.z / totalPremium) >= 0.005) // 只保留份额>=0.5%的公司
        .map(d => ({
            name: d.name,
            value: Math.pow(d.z, 0.45), // 从0.5降至0.45，进一步压缩头部公司
            realValue: d.z,
            growth: d.y,
            quadrant: d.quadrant,
            itemStyle: {
                color: colorMap[d.quadrant] || '#94a3b8'
            }
        }))
})

const treemapChartOption = computed(() => {
    if (!treemapData.value.length) return {}
    
    return {
        tooltip: {
            backgroundColor: 'rgba(255, 255, 255, 0.98)',
            borderWidth: 0,
            padding: 12,
            boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
            formatter: (info) => {
                const d = info.data
                const realPremium = d.realValue || d.value
                const share = ((realPremium / currentInsight.value.total_premium) * 100).toFixed(2)
                const growthStr = formatGrowth(d.growth)
                const growthColor = d.growth >= 0 ? '#10b981' : '#ef4444'
                
                return `
                    <div style="font-weight:bold;margin-bottom:8px;font-size:14px;color:#1e293b;border-bottom:1px solid #f1f5f9;padding-bottom:6px;">${d.name}</div>
                    <div style="display:flex;justify-content:space-between;gap:20px;margin-bottom:4px;">
                        <span style="color:#64748b;font-size:12px;">保费规模:</span>
                        <span style="color:#1e293b;font-weight:600;font-size:12px;">${Math.round(realPremium).toLocaleString()} 万</span>
                    </div>
                    <div style="display:flex;justify-content:space-between;gap:20px;margin-bottom:4px;">
                        <span style="color:#64748b;font-size:12px;">市场份额:</span>
                        <span style="color:#1e293b;font-weight:600;font-size:12px;">${share}%</span>
                    </div>
                    <div style="display:flex;justify-content:space-between;gap:20px;margin-bottom:4px;">
                        <span style="color:#64748b;font-size:12px;">增长速度:</span>
                        <span style="color:${growthColor};font-weight:600;font-size:12px;">${growthStr}</span>
                    </div>
                    <div style="display:flex;justify-content:space-between;gap:20px;">
                        <span style="color:#64748b;font-size:12px;">竞争象限:</span>
                        <span style="color:#4f46e5;font-weight:600;font-size:12px;">${d.quadrant}</span>
                    </div>
                `
            }
        },
        series: [{
            type: 'treemap',
            data: treemapData.value,
            left: 0,
            right: 0,
            top: 0,
            bottom: 0,
            leafDepth: 1,
            roam: 'move',
            nodeClick: 'zoomToNode',
            visibleMin: 120, // 降低阈值，确保过滤后的公司都能显示
            squareRatio: 0.5 * (1 + Math.sqrt(5)),
            label: {
                show: true,
                formatter: (params) => {
                    const realVal = params.data.realValue || params.value
                    const share = ((realVal / currentInsight.value.total_premium) * 100).toFixed(1)
                    // 所有方块都尝试显示标签，使用智能截断
                    const name = params.name
                    const maxLen = share >= 5 ? 8 : share >= 2 ? 6 : 4 // 根据份额动态调整长度
                    const displayName = name.length > maxLen ? name.substring(0, maxLen) + '...' : name
                    return displayName + '\n' + share + '%'
                },
                fontSize: 11,
                fontWeight: 600,
                color: '#fff',
                align: 'center',
                verticalAlign: 'middle',
                overflow: 'truncate',
                ellipsis: '...'
            },
            upperLabel: {
                show: false
            },
            itemStyle: {
                borderColor: '#fff',
                borderWidth: 1,
                gapWidth: 2,
                borderRadius: 4
            },
            levels: [
                {
                    itemStyle: {
                        borderColor: '#fff',
                        borderWidth: 2,
                        gapWidth: 4
                    }
                }
            ],
            // 核心配色方案
            color: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'],
            breadcrumb: { show: false }
        }]
    }
})

const bcgStats = computed(() => {
    if (!bcgMatrix.value.length) return null
    return {
        star: bcgMatrix.value.filter(d => d.quadrant === '明星').length,
        cow: bcgMatrix.value.filter(d => d.quadrant === '奶牛').length,
        wildcat: bcgMatrix.value.filter(d => d.quadrant === '野猫').length,
        dog: bcgMatrix.value.filter(d => d.quadrant === '瘦狗').length
    }
})

const bcgChartOption = computed(() => {
    if (!bcgMatrix.value.length) return {}
    
    // 计算气泡大小的基准值
    const maxZ = Math.max(...bcgMatrix.value.map(d => d.z))
    
    return {
        tooltip: {
            padding: 10,
            backgroundColor: 'rgba(255, 255, 255, 0.98)',
            borderWidth: 0,
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            formatter: (params) => {
                const d = params.data
                return `
                    <div style="font-weight:bold;margin-bottom:5px;color:#1e293b">${d[3]}</div>
                    <div style="font-size:12px;color:#64748b;margin-bottom:2px;">市场份额: <span style="color:#0f172a;font-weight:600">${d[0]}%</span></div>
                    <div style="font-size:12px;color:#64748b;margin-bottom:2px;">同比增长: <span style="color:${d[1] >= 0 ? '#10b981' : '#ef4444'};font-weight:600">${d[1]}%</span></div>
                    <div style="font-size:12px;color:#64748b">保费规模: <span style="color:#4f46e5;font-weight:600">${Math.round(d[2]).toLocaleString()}万</span></div>
                `
            }
        },
        grid: { 
            left: '8%', 
            right: '12%', 
            bottom: '15%', 
            top: '12%',
            containLabel: true 
        },
        xAxis: {
            type: 'value',
            name: '市场份额 (%)',
            nameLocation: 'center',
            nameGap: 30,
            splitLine: { show: true, lineStyle: { type: 'dashed', color: '#f1f5f9' } },
            axisLabel: { formatter: '{value}%', color: '#94a3b8', fontSize: 10 },
            axisLine: { lineStyle: { color: '#e2e8f0' } },
            scale: true
        },
        yAxis: {
            type: 'value',
            name: '增速 (%)',
            nameLocation: 'end',
            nameGap: 20,
            splitLine: { show: true, lineStyle: { type: 'dashed', color: '#f1f5f9' } },
            axisLabel: { formatter: '{value}%', color: '#94a3b8', fontSize: 10 },
            axisLine: { lineStyle: { color: '#e2e8f0' } },
            scale: true
        },
        visualMap: {
            show: false,
            dimension: 4,
            pieces: [
                { value: '明星', color: '#10b981' },
                { value: '奶牛', color: '#3b82f6' },
                { value: '野猫', color: '#f59e0b' },
                { value: '瘦狗', color: '#ef4444' }
            ]
        },
        series: [{
            type: 'scatter',
            symbolSize: (data) => {
                // 动态计算气泡大小，防止过大或过小
                const val = data[2]
                const size = Math.sqrt(val / maxZ) * 60 + 10
                return isNaN(size) ? 20 : size
            },
            data: bcgMatrix.value.map(d => [d.x, d.y, d.z, d.name, d.quadrant]),
            itemStyle: {
                shadowBlur: 10,
                shadowColor: 'rgba(0, 0, 0, 0.05)',
                opacity: 0.85
            },
            label: {
                show: true,
                formatter: '{@[3]}',
                position: 'top',
                fontSize: 10,
                color: '#64748b',
                fontWeight: 500,
                distance: 8
            },
            markLine: {
                silent: true,
                lineStyle: { type: 'solid', color: '#cbd5e1', width: 1 },
                data: [
                    { type: 'average', name: '平均增速', valueIndex: 1 },
                    { type: 'average', name: '平均份额', valueIndex: 0 }
                ]
            }
        }]
    }
})

onMounted(() => {
    if (currentDataSetId.value) {
        fetchAdvancedAnalysis(currentDataSetId.value)
    }
})

watch(currentDataSetId, (newId) => {
    if (newId) fetchAdvancedAnalysis(newId)
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
.view-tabs {
    display: flex;
    background: #f1f5f9;
    padding: 3px;
    border-radius: 10px;
    margin-right: 20px;
    height: 38px;
    align-items: center;
}

.view-tab {
    padding: 4px 16px;
    height: 32px;
    display: flex;
    align-items: center;
    font-size: 13px;
    font-weight: 600;
    color: #64748b;
    cursor: pointer;
    border-radius: 8px;
    transition: all 0.2s;
}

.view-tab.active {
    background: white;
    color: #1e293b;
    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.insight-layout {
    flex: 1;
    overflow: hidden;
    min-height: 0;
}

.insight-grid {
    display: grid;
    grid-template-columns: 3.5fr 1fr;
    gap: clamp(12px, 1vw, 16px);
    height: 100%;
    min-height: 0;
}

.insight-card {
    background: #ffffff;
    border: 1px solid #f1f5f9;
    border-radius: 12px;
    padding: 16px 20px 12px 20px;
    display: flex;
    flex-direction: column;
    transition: all 0.3s ease;
    min-height: 0;
    overflow: hidden;
}

.insight-card:hover {
    border-color: #e2e8f0;
    box-shadow: 0 6px 16px rgba(0,0,0,0.04);
}

.card-title {
    font-size: 14px;
    font-weight: 700;
    color: #1e293b;
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    flex-wrap: nowrap;
}

.title-left {
    display: flex;
    align-items: center;
    gap: 6px;
    white-space: nowrap;
}

.treemap-legend-inline {
    display: flex;
    gap: 8px;
    background: #f8fafc;
    padding: 3px 8px;
    border-radius: 6px;
    border: 1px solid #f1f5f9;
}

.treemap-legend-inline .legend-item {
    font-size: 10px;
    color: #64748b;
    display: flex;
    align-items: center;
    gap: 3px;
    white-space: nowrap;
}

.treemap-legend-inline .legend-item .def {
    font-size: 9px;
    opacity: 0.7;
    font-weight: 400;
}

.icon-rocket, .icon-chart {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    background: #f8fafc;
    border: 1px solid #f1f5f9;
    border-radius: 6px;
    font-size: 13px;
}

.treemap-card {
    padding: 16px 0 0 0 !important;
    overflow: hidden;
}

.treemap-card .card-title {
    padding: 0 20px;
    margin-bottom: 12px;
}

.bcg-chart-wrapper {
    flex: 1;
    position: relative;
    background: white;
    overflow: hidden;
    min-height: 0;
}

.legend-color {
    width: 7px;
    height: 7px;
    border-radius: 2px;
}

.legend-color.star { background: #10b981; }
.legend-color.cow { background: #3b82f6; }
.legend-color.question { background: #f59e0b; }
.legend-color.dog { background: #ef4444; }

.insight-metrics {
    display: grid;
    grid-template-columns: 1fr; /* 改为单列以压缩宽度 */
    gap: 8px;
    margin-bottom: 10px;
}

.metric-item {
    background: #f8fafc;
    padding: 8px 12px;
    border-radius: 8px;
    border: 1px solid #f1f5f9;
}

.metric-item .label {
    display: flex;
    align-items: center;
    font-size: 12px;
    color: #64748b;
    margin-bottom: 4px;
}

.metric-item .value {
    font-size: 18px;
    font-weight: 800;
    color: #1e293b;
}

/* 市场集中度进度条 */
.market-concentration {
    margin-bottom: 16px;
}

.concentration-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
}

.concentration-label {
    font-size: 11px;
    font-weight: 600;
    color: #64748b;
}

.concentration-type {
    font-size: 10px;
    font-weight: 700;
    padding: 2px 8px;
    border-radius: 4px;
    background: #f1f5f9;
    color: #475569;
}

.concentration-bar-container {
    position: relative;
}

.concentration-bar-bg {
    height: 20px;
    background: #f1f5f9;
    border-radius: 5px;
    overflow: hidden;
    position: relative;
}

.concentration-bar-fill {
    height: 100%;
    border-radius: 5px;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    padding-right: 8px;
    transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    min-width: 40px;
}

.concentration-value {
    font-size: 10px;
    font-weight: 700;
    color: white;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.concentration-markers {
    display: flex;
    justify-content: space-between;
    position: relative;
    margin-top: 4px;
    height: 12px;
}

.concentration-markers .marker {
    position: absolute;
    font-size: 9px;
    color: #94a3b8;
    transform: translateX(-50%);
}

.concentration-markers .marker::before {
    content: '';
    position: absolute;
    top: -14px;
    left: 50%;
    transform: translateX(-50%);
    width: 1px;
    height: 6px;
    background: #cbd5e1;
}

.top-ranking {
    margin-top: 0;
    border-top: 1px dashed #e2e8f0;
    padding-top: 10px;
}

.rank-header {
    font-size: 13px;
    font-weight: 700;
    color: #1e293b;
    margin-bottom: 10px;
}

.rank-row {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
}

.rank-num {
    width: 16px;
    height: 16px;
    background: #f1f5f9;
    border-radius: 3px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 9px;
    font-weight: 700;
    color: #64748b;
}

.rank-name {
    width: 60px;
    font-size: 12px;
    color: #475569;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.rank-bar-bg {
    flex: 1;
    height: 4px;
    background: #f1f5f9;
    border-radius: 2px;
    overflow: hidden;
}

.rank-bar-fill {
    height: 100%;
    background: #4f46e5;
    border-radius: 2px;
}

.rank-val {
    width: 35px;
    text-align: right;
    font-size: 11px;
    font-weight: 600;
    color: #1e293b;
}

.analysis-text {
    font-size: 12px;
    color: #64748b;
    line-height: 1.5;
    margin-top: 10px;
    padding: 8px 10px;
    background: #f1f5f9;
    border-radius: 6px;
}

@media (max-width: 1024px) {
    .insight-grid { grid-template-columns: 1fr; }
}

.page {
    height: 100%;
    overflow: hidden;
    display: flex;
    flex-direction: column;
}

.chart-card {
    background: #FFFFFF;
    border-radius: 16px;
    padding: clamp(16px, 2vw, 24px) clamp(16px, 2vw, 24px) clamp(12px, 1.5vw, 16px) clamp(16px, 2vw, 24px);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
    border: 1px solid rgba(229, 231, 235, 0.8);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    font-family: var(--font-sans);
    display: flex;
    flex-direction: column;
    flex: 1;
    overflow: hidden;
    min-height: 0;
}

.chart-card:hover {
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08);
    transform: translateY(-2px);
}

.chart-header {
    margin-bottom: clamp(12px, 1.5vw, 16px);
    font-family: var(--font-sans);
    display: flex;
    align-items: center;
    gap: 16px;
    flex-wrap: wrap; /* 允许在小屏幕换行 */
    height: auto;   /* 高度自适应 */
    min-height: 44px;
}

@media (max-width: 768px) {
    .chart-header {
        flex-direction: column;
        align-items: stretch;
        gap: 12px;
        height: auto;
    }

    .chart-actions {
        width: 100%;
        justify-content: flex-start;
    }

    .company-search {
        max-width: none;
        width: 100%;
    }
}

.chart-actions {
    flex: 1;
    min-width: 150px;
    display: flex;
    justify-content: flex-start;
}

.chart-subtitle {
    flex-shrink: 0;
}

.chart-title {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
    margin-bottom: 0;
    flex-wrap: wrap; /* 允许标题内部也换行 */
}

.chart-title span:first-child {
    font-size: 24px;
    line-height: 1;
    font-family: var(--font-sans);
}

.company-name {
    font-size: 16px;
    font-weight: 800;
    color: var(--primary);
    font-family: var(--font-sans);
    letter-spacing: -0.01em;
}

.title-separator {
    font-size: 16px;
    color: var(--text-tertiary);
    font-weight: 400;
}

.title-text {
    font-size: 16px;
    font-weight: 800;
    color: var(--text-primary);
    font-family: var(--font-sans);
}

/* Company search styles */
.company-search {
    position: relative;
    width: 100%;
    max-width: 200px;
}

.direct-search-box {
    width: 100%;
    height: 38px;
    background: var(--bg-card);
    border: 1px solid var(--border-light);
    border-radius: var(--radius-md);
    display: flex;
    align-items: center;
    padding: 0 10px;
    transition: all 0.2s;
    cursor: text;
}

.direct-search-box:focus-within {
    border-color: var(--primary);
    box-shadow: 0 0 0 2px var(--primary-light);
}

.search-icon {
    color: var(--text-tertiary);
    margin-right: 8px;
    flex-shrink: 0;
}

.search-input {
    flex: 1;
    border: none;
    background: transparent;
    outline: none;
    font-size: 13px;
    color: var(--text-primary);
    width: 100%;
    padding: 0;
}

.dropdown-arrow {
    font-size: 10px;
    color: var(--text-tertiary);
    cursor: pointer;
    margin-left: 6px;
    opacity: 0.6;
    padding: 4px;
    transition: transform 0.2s;
}

.dropdown.show + .direct-search-box .dropdown-arrow {
    transform: rotate(180deg);
}

.dropdown {
    position: absolute;
    top: calc(100% + 6px);
    left: 0;
    width: 100%;
    max-height: 280px;
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
    overflow: hidden;
    min-height: 0;
}

.list-container {
    flex: 0 0 300px;
    overflow-y: auto;
    padding-right: 8px;
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
    position: absolute;
    top: 0;
    left: 0;
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
        min-height: 450px;
        height: 450px;
    }

    .insight-grid {
        display: flex;
        flex-direction: column;
        gap: 16px;
    }

    .bcg-chart-wrapper {
        min-height: 400px;
        height: 400px;
    }

    .detail-chart {
        min-height: 400px;
        height: 400px;
    }
}
</style>

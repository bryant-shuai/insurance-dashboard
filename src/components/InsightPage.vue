<template>
    <div class="page">
        <div class="chart-card" style="height: 100%;">
            <!-- 深度洞察视图 -->
            <div class="insight-layout">
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
                            当前市场中，<strong>{{ bcgStats.star }}</strong> 家公司处于高速扩张且占有率领先的"明星"位置。
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

onMounted(() => {
    if (currentDataSetId.value) {
        fetchAdvancedAnalysis(currentDataSetId.value)
    }
})

watch(currentDataSetId, (newId) => {
    if (newId) fetchAdvancedAnalysis(newId)
})
</script>

<style scoped>
.page {
    height: 100%;
    overflow: hidden;
    display: flex;
    flex-direction: column;
}

.chart-card {
    background: var(--bg-card);
    border-radius: var(--radius-lg);
    border: 1px solid var(--border-light);
    box-shadow: var(--shadow-sm);
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
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
    grid-template-columns: 1fr;
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

.value.high {
    color: #ef4444;
}

.value.low {
    color: #10b981;
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

.rank-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.rank-row {
    display: flex;
    align-items: center;
    gap: 8px;
}

.rank-num {
    font-size: 12px;
    font-weight: 700;
    color: #64748b;
    width: 20px;
}

.rank-name {
    font-size: 12px;
    color: #1e293b;
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.rank-bar-bg {
    flex: 2;
    height: 6px;
    background: #f1f5f9;
    border-radius: 3px;
    overflow: hidden;
}

.rank-bar-fill {
    height: 100%;
    background: linear-gradient(90deg, #3b82f6, #60a5fa);
    border-radius: 3px;
}

.rank-val {
    font-size: 11px;
    font-weight: 600;
    color: #475569;
    width: 40px;
    text-align: right;
}

.analysis-text {
    font-size: 12px;
    color: #64748b;
    line-height: 1.5;
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid #f1f5f9;
}

.loading-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: #94a3b8;
}

.spinner {
    width: 32px;
    height: 32px;
    border: 3px solid #f1f5f9;
    border-top: 3px solid #3b82f6;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 12px;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

@media (max-width: 1200px) {
    .insight-grid {
        grid-template-columns: 1fr;
        gap: 16px;
    }
    
    .bcg-chart-wrapper {
        min-height: 400px;
    }
}

@media (max-width: 768px) {
    .card-title {
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
    }
    
    .treemap-legend-inline {
        align-self: flex-end;
    }
    
    .insight-metrics {
        gap: 12px;
    }
    
    .metric-item {
        padding: 12px;
    }
}
</style>
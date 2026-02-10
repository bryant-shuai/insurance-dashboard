<template>
    <div class="page">
        <div class="chart-card" style="height: 100%;">
            <div class="insight-layout">
                <div class="insight-grid">

                    <!-- ========== 左侧：市场份额矩形树图 ========== -->
                    <div class="insight-card treemap-card">
                        <div class="card-title">
                            <div class="title-left">
                                <span class="icon-rocket">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                                        stroke="currentColor" stroke-width="2.5"
                                        stroke-linecap="round" stroke-linejoin="round"
                                        style="color: #4f46e5;">
                                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                        <line x1="3" y1="9" x2="21" y2="9"></line>
                                        <line x1="9" y1="21" x2="9" y2="9"></line>
                                    </svg>
                                </span>
                                市场份额矩形树图
                            </div>
                            <div class="treemap-legend-inline">
                                <div class="legend-item">
                                    <span class="legend-color star"></span>明星<span class="def">(高增高份)</span>
                                </div>
                                <div class="legend-item">
                                    <span class="legend-color cow"></span>奶牛<span class="def">(低增高份)</span>
                                </div>
                                <div class="legend-item">
                                    <span class="legend-color question"></span>野猫<span class="def">(高增低份)</span>
                                </div>
                                <div class="legend-item">
                                    <span class="legend-color dog"></span>瘦狗<span class="def">(低增低份)</span>
                                </div>
                            </div>
                        </div>

                        <div class="bcg-chart-wrapper">
                            <div
                                class="custom-treemap-container"
                                ref="treemapContainer"
                            >
                                <div
                                    v-for="item in layoutTreemapData"
                                    :key="`${item.name}-${forceUpdateKey}`"
                                    class="treemap-cell"
                                    :class="getQuadrantClass(item)"
                                    :style="getCellPositionStyle(item)"
                                >
                                    <!-- 超大方块 ≥25000: 名称+排名+保费标签+保费值+份额+增速 -->
                                    <template v-if="item._cellArea >= 25000">
                                        <div class="cell-header">
                                            <span class="unit-name" :style="{ fontSize: item._fontSizeScale.unitName + 'px' }">
                                                {{ item.displayName }}
                                            </span>
                                            <span class="unit-rank" :style="{ fontSize: item._fontSizeScale.unitRank + 'px' }">
                                                #{{ item.rank }}
                                            </span>
                                        </div>
                                        <div class="cell-content">
                                            <div class="efficiency-label" :style="{ fontSize: item._fontSizeScale.efficiencyLabel + 'px' }">
                                                保费
                                            </div>
                                            <div class="efficiency-value" :style="{ fontSize: item._fontSizeScale.efficiencyValue + 'px' }">
                                                {{ formatWan(item.realValue) }}
                                            </div>
                                        </div>
                                        <div class="cell-footer">
                                            <div>
                                                <div class="stat-label" :style="{ fontSize: item._fontSizeScale.statLabel + 'px' }">份额</div>
                                                <div :style="{ fontSize: item._fontSizeScale.statValue + 'px' }">{{ getShare(item) }}%</div>
                                            </div>
                                            <div style="text-align: right">
                                                <div class="stat-label" :style="{ fontSize: item._fontSizeScale.statLabel + 'px' }">增速</div>
                                                <div :style="{ fontSize: item._fontSizeScale.statValue + 'px' }">{{ formatGrowth(item.growth) }}</div>
                                            </div>
                                        </div>
                                    </template>

                                    <!-- 大方块 8000-25000: 名称+排名+保费值+份额+增速 -->
                                    <template v-else-if="item._cellArea > 8000">
                                        <div class="cell-header">
                                            <span class="unit-name" :style="{ fontSize: item._fontSizeScale.unitName + 'px' }">
                                                {{ item.displayName }}
                                            </span>
                                            <span class="unit-rank" :style="{ fontSize: item._fontSizeScale.unitRank + 'px' }">
                                                #{{ item.rank }}
                                            </span>
                                        </div>
                                        <div class="cell-content">
                                            <div class="efficiency-value" :style="{ fontSize: item._fontSizeScale.efficiencyValue + 'px' }">
                                                {{ formatWan(item.realValue) }}
                                            </div>
                                        </div>
                                        <div class="cell-footer">
                                            <div>
                                                <div class="stat-label" :style="{ fontSize: item._fontSizeScale.statLabel + 'px' }">份额</div>
                                                <div :style="{ fontSize: item._fontSizeScale.statValue + 'px' }">{{ getShare(item) }}%</div>
                                            </div>
                                            <div style="text-align: right">
                                                <div class="stat-label" :style="{ fontSize: item._fontSizeScale.statLabel + 'px' }">增速</div>
                                                <div :style="{ fontSize: item._fontSizeScale.statValue + 'px' }">{{ formatGrowth(item.growth) }}</div>
                                            </div>
                                        </div>
                                    </template>

                                    <!-- 中方块 5000-8000: 名称+排名+保费标签+保费值+份额+增速 -->
                                    <template v-else-if="item._cellArea > 5000">
                                        <div class="cell-header">
                                            <span class="unit-name" :style="{ fontSize: item._fontSizeScale.unitName + 'px' }">
                                                {{ item.displayName }}
                                            </span>
                                            <span class="unit-rank" :style="{ fontSize: item._fontSizeScale.unitRank + 'px' }">
                                                #{{ item.rank }}
                                            </span>
                                        </div>
                                        <div class="cell-content">
                                            <div class="efficiency-label" :style="{ fontSize: item._fontSizeScale.efficiencyLabel + 'px' }">
                                                保费
                                            </div>
                                            <div class="efficiency-value" :style="{ fontSize: item._fontSizeScale.efficiencyValue + 'px' }">
                                                {{ formatWan(item.realValue) }}
                                            </div>
                                        </div>
                                        <div class="cell-footer">
                                            <div>
                                                <div class="stat-label" :style="{ fontSize: item._fontSizeScale.statLabel + 'px' }">份额</div>
                                                <div :style="{ fontSize: item._fontSizeScale.statValue + 'px' }">{{ getShare(item) }}%</div>
                                            </div>
                                            <div style="text-align: right">
                                                <div class="stat-label" :style="{ fontSize: item._fontSizeScale.statLabel + 'px' }">增速</div>
                                                <div :style="{ fontSize: item._fontSizeScale.statValue + 'px' }">{{ formatGrowth(item.growth) }}</div>
                                            </div>
                                        </div>
                                    </template>

                                    <!-- 小方块 3000-5000: 仅保费值居中 -->
                                    <template v-else-if="item._cellArea > 3000">
                                        <div class="cell-content ultra-compact">
                                            <div class="efficiency-value" :style="{ fontSize: item._fontSizeScale.efficiencyValue + 'px' }">
                                                {{ formatWan(item.realValue) }}
                                            </div>
                                        </div>
                                    </template>

                                    <!-- 微型方块 <3000: 仅名称 -->
                                    <template v-else>
                                        <div class="cell-header compact">
                                            <span class="unit-name" style="font-size: 9px">{{ item.displayName }}</span>
                                        </div>
                                    </template>
                                </div>
                            </div>

                            <!-- 加载占位 -->
                            <div v-if="!treemapData || treemapData.length === 0" class="loading-placeholder">
                                <div class="spinner"></div>
                                <span>数据结构构建中...</span>
                            </div>
                        </div>
                    </div>

                    <!-- ========== 右侧：市场竞争格局洞察 ========== -->
                    <div class="insight-card info-card">
                        <div class="card-title">
                            <span class="icon-chart">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                                    stroke="currentColor" stroke-width="2.5"
                                    stroke-linecap="round" stroke-linejoin="round"
                                    style="color: #10b981">
                                    <line x1="18" y1="20" x2="18" y2="10"></line>
                                    <line x1="12" y1="20" x2="12" y2="4"></line>
                                    <line x1="6" y1="20" x2="6" y2="14"></line>
                                </svg>
                            </span>
                            市场竞争格局洞察
                        </div>

                        <!-- 核心指标 -->
                        <div class="insight-metrics" v-if="currentInsight">
                            <div class="metric-item">
                                <span class="label">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                                        stroke="currentColor" stroke-width="2"
                                        stroke-linecap="round" stroke-linejoin="round"
                                        style="margin-right: 4px; vertical-align: middle">
                                        <rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect>
                                        <rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect>
                                        <line x1="6" y1="6" x2="6" y2="6"></line>
                                        <line x1="6" y1="18" x2="6" y2="18"></line>
                                    </svg>
                                    市场规模
                                </span>
                                <span class="value">
                                    {{ Math.round(currentInsight.total_premium).toLocaleString() }}
                                </span>
                            </div>
                            <div class="metric-item">
                                <span class="label">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                                        stroke="currentColor" stroke-width="2"
                                        stroke-linecap="round" stroke-linejoin="round"
                                        style="margin-right: 4px; vertical-align: middle">
                                        <circle cx="12" cy="12" r="10"></circle>
                                        <circle cx="12" cy="12" r="6"></circle>
                                        <circle cx="12" cy="12" r="2"></circle>
                                    </svg>
                                    集中度 (CR4)
                                </span>
                                <span :class="['value', currentInsight.cr4 > 60 ? 'high' : 'low']">
                                    {{ currentInsight.cr4 }}%
                                </span>
                            </div>
                        </div>

                        <!-- 市场集中度 -->
                        <div class="market-concentration" v-if="currentInsight">
                            <div class="concentration-header">
                                <span class="concentration-label">市场集中度</span>
                                <span :class="[
                                    'concentration-type',
                                    {
                                        'type-high': currentInsight.cr4 > 60,
                                        'type-medium': currentInsight.cr4 > 30 && currentInsight.cr4 <= 60,
                                        'type-low': currentInsight.cr4 <= 30
                                    }
                                ]">
                                    {{ currentInsight.market_type }}
                                </span>
                            </div>

                            <!-- CR4 解释卡片 -->
                            <div class="concentration-explanation">
                                <p class="explanation-text">
                                    <strong>市场集中度(CR4)</strong>
                                    衡量市场中前四大公司的份额总和。数值越高表示市场越集中，竞争程度相对较低；数值越低表示市场越分散，竞争更加激烈。
                                </p>
                            </div>

                            <!-- 集中度进度条 -->
                            <div class="concentration-bar-container">
                                <div class="concentration-bar-bg">
                                    <div
                                        class="concentration-bar-fill"
                                        :style="{
                                            width: currentInsight.cr4 + '%',
                                            background: currentInsight.cr4 > 60
                                                ? 'linear-gradient(90deg, #ef4444, #f97316)'
                                                : currentInsight.cr4 > 30
                                                    ? 'linear-gradient(90deg, #f59e0b, #fbbf24)'
                                                    : 'linear-gradient(90deg, #10b981, #34d399)'
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
                                <div
                                    v-for="(item, idx) in currentInsight.top_companies.slice(0, 4)"
                                    :key="item.company"
                                    class="rank-row"
                                >
                                    <span class="rank-num">{{ idx + 1 }}</span>
                                    <span class="rank-name">{{ item.company.split('-').pop() }}</span>
                                    <div class="rank-bar-bg">
                                        <div
                                            class="rank-bar-fill"
                                            :style="{ width: (item.premium / currentInsight.total_premium * 100 * 3) + '%' }"
                                        ></div>
                                    </div>
                                    <span class="rank-val">
                                        {{ ((item.premium / currentInsight.total_premium) * 100).toFixed(1) }}%
                                    </span>
                                </div>
                            </div>
                        </div>

                        <!-- 分析文字 -->
                        <p class="analysis-text" v-if="bcgStats">
                            当前市场中，
                            <span v-if="bcgStats.starNames.length > 0" class="company-highlight">
                                <template v-for="(name, idx) in bcgStats.starNames" :key="name">
                                    <span class="company-name">{{ name }}</span>
                                    <span v-if="idx < bcgStats.starNames.length - 1">、</span>
                                </template>
                            </span>
                            处于高速扩张且占有率领先的"明星"位置。
                            市场整体中位增速为 <strong>{{ summaryData?.avg_growth }}%</strong>。
                        </p>
                    </div>

                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useECharts } from '../composables/useECharts'
import { formatGrowth } from '../utils/formatters'
import * as d3 from 'd3'
import {
    advancedAnalysisData,
    fetchAdvancedAnalysis,
    currentDataSetId
} from '../stores/dataStore'

useECharts()

// ============================================================
// 响应式数据
// ============================================================
const currentInsight = computed(() =>
    advancedAnalysisData.value?.market_insight?.['非车险']
)
const bcgMatrix = computed(() =>
    advancedAnalysisData.value?.bcg_matrix || []
)
const summaryData = computed(() =>
    advancedAnalysisData.value?.summary
)

// ============================================================
// Treemap 数据处理
// ============================================================
const treemapData = computed(() => {
    if (!bcgMatrix.value.length) return []
    const totalPremium = currentInsight.value?.total_premium || 1
    return bcgMatrix.value
        .filter(d => (d.z / totalPremium) >= 0.005)
        .map(d => ({
            name: d.name,
            value: Math.pow(d.z, 0.45),
            realValue: d.z,
            growth: d.y,
            quadrant: d.quadrant
        }))
})

const filteredTreemapData = computed(() => {
    if (!treemapData.value.length || !currentInsight.value) return []
    return treemapData.value
        .filter(item => item.name !== '其他')
        .slice(0, 20)
        .sort((a, b) => (b.realValue || b.value) - (a.realValue || a.value))
        .map((item, index) => ({
            ...item,
            displayName: item.name.split('-').pop(),
            share: ((item.realValue || item.value) / currentInsight.value.total_premium) * 100,
            rank: index + 1
        }))
})

// ============================================================
// 动态字体缩放 — 与生产完全一致
// ============================================================
const FONT_SCALE_BREAKPOINTS = [
    { minArea: 0,     maxArea: 2000,     scaleFactor: 0.5 },
    { minArea: 2000,  maxArea: 5000,     scaleFactor: 0.6 },
    { minArea: 5000,  maxArea: 8000,     scaleFactor: 0.7 },
    { minArea: 8000,  maxArea: 15000,    scaleFactor: 0.8 },
    { minArea: 15000, maxArea: 25000,    scaleFactor: 0.9 },
    { minArea: 25000, maxArea: 50000,    scaleFactor: 1.0 },
    { minArea: 50000, maxArea: Infinity, scaleFactor: 1.1 }
]

const BASE_FONT_SIZES = {
    unitName: 12,
    unitRank: 8,
    efficiencyLabel: 8,
    efficiencyValue: 12,
    statLabel: 9,
    statValue: 10
}

const getFontSizeScale = (area) => {
    const bp = FONT_SCALE_BREAKPOINTS.find(b => area >= b.minArea && area < b.maxArea)
    const factor = bp ? bp.scaleFactor : 1
    const result = {}
    Object.keys(BASE_FONT_SIZES).forEach(k => {
        result[k] = BASE_FONT_SIZES[k] * factor
    })
    return { ...result, area, breakpoint: bp ? bp.minArea : 0 }
}

// ============================================================
// D3 Squarify Treemap 布局
// ============================================================
const CELL_GAP = 3

const calculateTreemapLayout = () => {
    if (!filteredTreemapData.value.length) return []

    const container = treemapContainer.value
    if (!container || !d3 || typeof d3.hierarchy !== 'function') {
        return generateFallbackLayout()
    }

    try {
        const rect = container.getBoundingClientRect()
        const cs = window.getComputedStyle(container)
        const w = Math.max(100,
            (rect.width || 1060) - (parseFloat(cs.paddingLeft) || 0) - (parseFloat(cs.paddingRight) || 0)
        )
        const h = Math.max(100,
            (rect.height || 610) - (parseFloat(cs.paddingTop) || 0) - (parseFloat(cs.paddingBottom) || 0)
        )

        const data = filteredTreemapData.value.map(item => ({
            ...item,
            layoutValue: Math.pow(item.realValue || 1, 0.32)
        }))

        const root = d3.hierarchy({ children: data })
            .sum(d => d.layoutValue || 0)
            .sort((a, b) => b.value - a.value)

        d3.treemap()
            .size([w, h])
            .paddingInner(CELL_GAP)
            .paddingOuter(6)
            .round(true)
            .tile(d3.treemapSquarify.ratio(1.618))(root)

        return root.leaves().map((d, i) => {
            const cw = d.x1 - d.x0
            const ch = d.y1 - d.y0
            const area = cw * ch
            return {
                ...d.data,
                rank: d.data.rank || (i + 1),
                x0: d.x0,
                y0: d.y0,
                x1: d.x1,
                y1: d.y1,
                width: cw,
                height: ch,
                _cellArea: area,
                _fontSizeScale: getFontSizeScale(area)
            }
        })
    } catch (e) {
        console.error('Treemap layout failed:', e)
        return generateFallbackLayout()
    }
}

const generateFallbackLayout = () => {
    const el = treemapContainer.value
    if (!el) return []

    const rect = el.getBoundingClientRect()
    const w = rect.width || 1060
    const h = rect.height || 610
    const n = filteredTreemapData.value.length
    if (!n) return []

    const cols = Math.ceil(Math.sqrt(n * (w / h)))
    const rows = Math.ceil(n / cols)
    const cw = w / cols
    const ch = h / rows

    return filteredTreemapData.value.map((item, i) => {
        const col = i % cols
        const row = Math.floor(i / cols)
        const ww = cw - CELL_GAP
        const hh = ch - CELL_GAP
        const area = ww * hh
        return {
            ...item,
            rank: i + 1,
            x0: col * cw + CELL_GAP / 2,
            y0: row * ch + CELL_GAP / 2,
            width: ww,
            height: hh,
            _cellArea: area,
            _fontSizeScale: getFontSizeScale(area)
        }
    })
}

const layoutTreemapData = computed(() => {
    void forceUpdateKey.value
    return calculateTreemapLayout()
})

// ============================================================
// 工具函数
// ============================================================
const formatWan = (num) => {
    if (!num) return '0'
    return Math.round(num).toLocaleString()
}

const getShare = (item) => {
    if (!currentInsight.value) return '0.0'
    return ((item.realValue / currentInsight.value.total_premium) * 100).toFixed(1)
}

const getQuadrantClass = (item) => {
    const g = item.growth || 0
    const s = item.share || (
        currentInsight.value
            ? ((item.realValue || item.value) / currentInsight.value.total_premium) * 100
            : 0
    )
    if (g >= 10 && s >= 5) return 'quadrant-star'
    if (g < 10 && s >= 5) return 'quadrant-cow'
    if (g >= 10 && s < 5) return 'quadrant-question'
    return 'quadrant-dog'
}

const getQuadrantColor = (item) => {
    const c = getQuadrantClass(item)
    const colors = {
        'quadrant-star': '#10b981',
        'quadrant-cow': '#3b82f6',
        'quadrant-question': '#f59e0b',
        'quadrant-dog': '#ef4444'
    }
    return colors[c] || '#6b7280'
}

const getCellPositionStyle = (item) => {
    if (item.x0 !== undefined && item.width !== undefined) {
        return {
            position: 'absolute',
            left: item.x0 + 'px',
            top: item.y0 + 'px',
            width: item.width + 'px',
            height: item.height + 'px',
            backgroundColor: getQuadrantColor(item)
        }
    }
    return {
        position: 'absolute',
        left: '0',
        top: '0',
        width: '100px',
        height: '50px',
        backgroundColor: getQuadrantColor(item)
    }
}

const bcgStats = computed(() => {
    if (!bcgMatrix.value.length) return null
    const stars = bcgMatrix.value.filter(d => d.quadrant === '明星')
    return {
        star: stars.length,
        starNames: stars.map(d => d.name),
        cow: bcgMatrix.value.filter(d => d.quadrant === '奶牛').length,
        wildcat: bcgMatrix.value.filter(d => d.quadrant === '野猫').length,
        dog: bcgMatrix.value.filter(d => d.quadrant === '瘦狗').length
    }
})

// ============================================================
// 生命周期 & 响应式 — 与生产完全一致
// ============================================================
const forceUpdateKey = ref(0)
const treemapContainer = ref(null)
let resizeObserver = null

const triggerRelayout = () => {
    forceUpdateKey.value++
}

onMounted(() => {
    if (currentDataSetId.value) {
        fetchAdvancedAnalysis(currentDataSetId.value)
    }
    nextTick(() => {
        if (treemapContainer.value && typeof ResizeObserver !== 'undefined') {
            resizeObserver = new ResizeObserver(() => {
                requestAnimationFrame(triggerRelayout)
            })
            resizeObserver.observe(treemapContainer.value)
        }
        triggerRelayout()
    })
})

onUnmounted(() => {
    if (resizeObserver) {
        resizeObserver.disconnect()
        resizeObserver = null
    }
})

watch(currentDataSetId, (id) => {
    if (id) {
        fetchAdvancedAnalysis(id)
    }
})

watch(
    [advancedAnalysisData, currentInsight],
    () => {
        if (advancedAnalysisData.value && currentInsight.value) {
            nextTick(() => {
                requestAnimationFrame(() => {
                    triggerRelayout()
                })
            })
        }
    },
    { deep: true }
)
</script>

<style scoped>
/* ============================================================
   完全对齐生产 dist CSS (data-v-240a1533)
   ============================================================ */

/* --- 页面布局 --- */
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
    grid-template-columns: 3.2fr .8fr;
    gap: clamp(12px, 1vw, 16px);
    height: 100%;
    min-height: 0;
}

/* --- 卡片通用 --- */
.insight-card {
    background: #fff;
    border: 1px solid #f1f5f9;
    border-radius: 12px;
    padding: 16px 20px;
    display: flex;
    flex-direction: column;
    transition: none;
    min-height: 0;
    overflow: hidden;
    animation: fadeInUp .5s cubic-bezier(.4, 0, .2, 1);
}

.insight-card:hover {
    box-shadow: 0 1px 2px #00000008, 0 1px 3px #0000000f;
    border-color: #f1f5f9;
}

.treemap-card,
.info-card {
    animation-delay: .05s;
}

/* --- 标题 --- */
.card-title {
    font-family: 'Fira Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 15px;
    font-weight: 700;
    color: #1e293b;
    margin-bottom: 20px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    flex-wrap: nowrap;
    letter-spacing: -.02em;
    line-height: 1.3;
    font-feature-settings: "liga" 1, "kern" 1;
    animation: fadeInUp .5s cubic-bezier(.4, 0, .2, 1) .1s both;
}

.title-left {
    display: flex;
    align-items: center;
    gap: 8px;
}

/* --- 图例 --- */
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
    opacity: .7;
    font-weight: 400;
}

.legend-color {
    width: 7px;
    height: 7px;
    border-radius: 2px;
}

.legend-color.star     { background: #10b981; }
.legend-color.cow      { background: #3b82f6; }
.legend-color.question { background: #f59e0b; }
.legend-color.dog      { background: #ef4444; }

/* --- 图标 --- */
.icon-rocket,
.icon-chart {
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

/* --- Treemap 卡片 --- */
.treemap-card {
    padding: 16px 0 0 !important;
    overflow: hidden;
}

.treemap-card .card-title {
    padding: 0 20px;
    margin-bottom: 12px;
}

.bcg-chart-wrapper {
    flex: 1;
    position: relative;
    background: #f8fafc;
    border-radius: 0 0 12px 12px;
    overflow: hidden;
    min-height: 0;
}

/* --- Treemap 容器 & 单元格 --- */
.custom-treemap-container {
    position: relative;
    width: 100%;
    height: 100%;
    background: #f8fafc;
    overflow: hidden;
    animation: fadeInUp .5s cubic-bezier(.4, 0, .2, 1) .3s both;
}

.treemap-cell {
    position: absolute;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 6px 8px;
    box-sizing: border-box;
    border-radius: 6px;
    transition: all .25s cubic-bezier(.4, 0, .2, 1);
    cursor: pointer;
    overflow: hidden;
    color: #fff;
    box-shadow: 0 1px 3px #00000014, 0 1px 2px #0000000a, inset 0 1px #ffffff26;
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
}

.treemap-cell .unit-name,
.treemap-cell .unit-rank,
.treemap-cell .efficiency-label,
.treemap-cell .efficiency-value,
.treemap-cell .stat-label,
.treemap-cell .cell-footer > div > div:last-child {
    transition: font-size .2s cubic-bezier(.4, 0, .2, 1),
                line-height .2s cubic-bezier(.4, 0, .2, 1);
}

.treemap-cell:hover {
    filter: brightness(1.12) saturate(1.1);
    box-shadow: 0 6px 20px #0000002e, 0 0 0 1px #ffffff4d, inset 0 1px #ffffff40;
    z-index: 100;
    transform: scale(1.01);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
}

/* --- 单元格内部元素 --- */
.cell-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2px;
    flex-shrink: 0;
}

.cell-header.compact {
    margin-bottom: 0;
}

.unit-name {
    font-family: 'Fira Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: clamp(12px, 1.6vw, 16px);
    font-weight: 800;
    line-height: 1.2;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    flex: 1;
    margin-right: 4px;
    text-shadow: 0 2px 4px rgba(0, 0, 0, .3);
    letter-spacing: -.02em;
    font-feature-settings: "liga" 1, "kern" 1;
    color: #fff;
}

.unit-rank {
    font-family: 'Roboto Mono', 'SF Mono', Monaco, Consolas, monospace;
    font-size: 9px;
    font-weight: 600;
    opacity: .85;
    flex-shrink: 0;
    background: linear-gradient(135deg, #fff3, #ffffff1a);
    padding: 2px 6px;
    border-radius: 10px;
    backdrop-filter: blur(6px);
    -webkit-backdrop-filter: blur(6px);
    text-shadow: 0 1px 2px rgba(0, 0, 0, .3);
    border: 1px solid rgba(255, 255, 255, .1);
    box-shadow: 0 1px 2px #0000001a, inset 0 1px #fff3;
}

.cell-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: flex-start;
    text-align: left;
    min-height: 0;
    padding-left: 12px;
    padding-right: 8px;
}

.cell-content.compact {
    flex: 0;
}

.cell-content.ultra-compact {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
    min-height: 0;
    padding: 0;
}

.efficiency-label {
    font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 9px;
    font-weight: 700;
    opacity: .8;
    text-transform: uppercase;
    letter-spacing: .8px;
    margin-bottom: 3px;
    color: #ffffffe6;
    text-shadow: 0 1px 2px rgba(0, 0, 0, .25);
    font-feature-settings: "liga" 1, "kern" 1;
}

.efficiency-value {
    font-family: 'Fira Code', 'Courier New', monospace;
    font-weight: 600;
    font-size: clamp(12px, 1.6vw, 16px);
    line-height: 1.15;
    letter-spacing: -.02em;
    text-shadow: 0 2px 4px rgba(0, 0, 0, .3);
    font-feature-settings: "tnum" 1, "kern" 1;
    color: #fff;
    margin-bottom: 4px;
}

.cell-footer {
    display: flex;
    justify-content: space-between;
    font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: clamp(10px, 1.1vw, 13px);
    font-weight: 700;
    padding-top: 6px;
    border-top: 1px solid rgba(255, 255, 255, .25);
    margin-top: 6px;
    flex-shrink: 0;
    letter-spacing: -.01em;
    font-feature-settings: "tnum" 1;
}

.stat-label {
    font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: clamp(9px, .9vw, 11px);
    font-weight: 800;
    opacity: .8;
    text-transform: uppercase;
    letter-spacing: .6px;
    margin-bottom: 2px;
    color: #fffffff2;
    text-shadow: 0 1px 2px rgba(0, 0, 0, .3);
    font-feature-settings: "liga" 1, "kern" 1;
}

/* --- 象限渐变色 (CSS background 覆盖 inline backgroundColor) --- */
.quadrant-star     { background: linear-gradient(135deg, #059669, #10b981); }
.quadrant-cow      { background: linear-gradient(135deg, #1d4ed8, #3b82f6); }
.quadrant-question { background: linear-gradient(135deg, #d97706, #f59e0b); }
.quadrant-dog      { background: linear-gradient(135deg, #dc2626, #ef4444); }

/* ============================================================
   右侧面板
   ============================================================ */

/* --- 核心指标 --- */
.insight-metrics {
    display: grid;
    grid-template-columns: 1fr;
    gap: 8px;
    margin-bottom: 10px;
}

.metric-item {
    background: #f8fafc;
    padding: 12px 16px;
    border-radius: 12px;
    border: 1px solid #f1f5f9;
    transition: all .3s ease;
    animation: fadeInUp .5s cubic-bezier(.4, 0, .2, 1) .2s both;
}

.metric-item:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 8px #0000000f;
    border-color: #e2e8f0;
}

.metric-item .label {
    display: flex;
    align-items: center;
    font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 13px;
    color: #64748b;
    margin-bottom: 6px;
    font-weight: 600;
    letter-spacing: -.01em;
}

.metric-item .value {
    font-family: 'Fira Code', 'Courier New', monospace;
    font-size: 22px;
    font-weight: 700;
    color: #0f172a;
    font-feature-settings: "tnum" 1, "kern" 1;
    letter-spacing: -.02em;
    line-height: 1.2;
}

.value.high { color: #ef4444; }
.value.low  { color: #10b981; }

/* --- 集中度 --- */
.market-concentration {
    margin-bottom: 16px;
}

.concentration-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
    padding-bottom: 8px;
    border-bottom: 1px solid rgba(226, 232, 240, .4);
}

.concentration-label {
    font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 12px;
    font-weight: 700;
    color: #64748b;
    letter-spacing: -.01em;
}

.concentration-type {
    font-family: 'Fira Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 12px;
    font-weight: 800;
    padding: 5px 12px;
    border-radius: 20px;
    letter-spacing: .03em;
    text-transform: uppercase;
    transition: all .3s ease;
}

.concentration-type.type-high   { background: none; color: #f97316; }
.concentration-type.type-medium { background: none; color: #f59e0b; }
.concentration-type.type-low    { background: none; color: #1e3a8a; }

.concentration-explanation {
    background: #f8fafc;
    border-radius: 8px;
    padding: 12px;
    margin-bottom: 16px;
    border: 1px solid #f1f5f9;
}

.explanation-text {
    font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 12px;
    line-height: 1.5;
    color: #64748b;
    margin: 0;
    font-weight: 500;
}

.explanation-text strong {
    color: #1e293b;
    font-weight: 700;
}

/* --- 集中度进度条 --- */
.concentration-bar-container {
    position: relative;
}

.concentration-bar-bg {
    height: 20px;
    background: #f1f5f9;
    border-radius: 5px;
    overflow: hidden;
}

.concentration-bar-fill {
    height: 100%;
    border-radius: 5px;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    padding-right: 8px;
    transition: all .6s cubic-bezier(.4, 0, .2, 1);
    min-width: 40px;
}

.concentration-value {
    font-family: 'Fira Code', 'Courier New', monospace;
    font-size: 12px;
    font-weight: 700;
    color: #fff;
    text-shadow: 0 2px 4px rgba(0, 0, 0, .5);
    letter-spacing: -.02em;
    font-feature-settings: "tnum" 1;
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

/* --- 龙头排名 --- */
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

/* --- 分析文字 --- */
.analysis-text {
    font-size: 12px;
    color: #64748b;
    line-height: 1.5;
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid #f1f5f9;
}

.company-highlight {
    display: inline-block;
    margin: 0 4px;
}

.company-name {
    font-family: 'Fira Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 12px;
    font-weight: 800;
    color: #1e3a8a;
    letter-spacing: .03em;
    text-transform: uppercase;
}

/* --- 加载状态 --- */
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

/* --- 动画 --- */
@keyframes spin {
    0%   { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

@keyframes fadeInUp {
    0%  { opacity: 0; transform: translateY(20px); }
    to  { opacity: 1; transform: translateY(0); }
}

/* --- 响应式 --- */
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
}
</style>

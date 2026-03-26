<script setup>
import { computed } from 'vue'
import { NEmpty, NModal } from 'naive-ui'
import VChart from 'vue-echarts'
import { currentIns, dataSets } from '../stores/dataStore'
import { useECharts, useNiceInterval } from '../composables/useECharts'
import {
    DEFAULT_RANKING_INSURANCE,
    DEFAULT_RANKING_FLOW_HEAD_COUNT,
    buildCompanyRankingFlow,
    getCompanyShortName,
    normalizeRankingText
} from '../utils/ranking'

useECharts()

const props = defineProps({
    show: {
        type: Boolean,
        default: false
    },
    companyName: {
        type: String,
        default: ''
    },
    insurance: {
        type: String,
        default: ''
    }
})

const emit = defineEmits(['update:show'])

const activeInsurance = computed(() => {
    return props.insurance || currentIns.value || DEFAULT_RANKING_INSURANCE
})

const flowHeadCount = DEFAULT_RANKING_FLOW_HEAD_COUNT
const seriesPalette = ['#5b7f2b', '#b45309', '#8f3f2d', '#8b5a2b', '#2f855a', '#9a3412', '#7f5539', '#a16207', '#6b4f3b']

const rankingFlow = computed(() => {
    return buildCompanyRankingFlow(dataSets.value, {
        companyName: props.companyName,
        insurance: activeInsurance.value,
        headCount: flowHeadCount
    })
})

const displayCompanyName = computed(() => {
    return getCompanyShortName(props.companyName) || normalizeRankingText(props.companyName) || '未选择公司'
})

const currentRankLabel = computed(() => {
    const rank = rankingFlow.value.currentRank
    return Number.isFinite(rank) ? String(rank) : '--'
})

const selectedSeries = computed(() => {
    return rankingFlow.value.seriesCompanies.find(company => company.isSelected) || null
})

const currentPoint = computed(() => {
    const series = selectedSeries.value
    if (!series) return null

    const lastKnownIndex = Number.isInteger(series.lastKnownIndex)
        ? series.lastKnownIndex
        : series.data.reduce((lastIndex, point, pointIndex) => (point ? pointIndex : lastIndex), -1)

    return lastKnownIndex >= 0 ? series.data[lastKnownIndex] : null
})

const currentShareLabel = computed(() => {
    const share = currentPoint.value?.share
    return Number.isFinite(share) ? `${share.toFixed(2)}%` : '--'
})

const currentPremiumLabel = computed(() => {
    const premium = currentPoint.value?.premium
    return Number.isFinite(premium) ? Number(premium).toLocaleString('zh-CN') : '--'
})

const rankDeltaClass = computed(() => {
    const delta = rankingFlow.value.rankDelta
    if (!Number.isFinite(delta) || delta === 0) return ''
    return delta > 0 ? 'is-up' : 'is-down'
})

const rankDeltaDescription = computed(() => {
    const delta = rankingFlow.value.rankDelta
    if (!Number.isFinite(delta)) return '暂无上月对比'
    if (delta === 0) return '较前月持平'
    return `较前月${delta > 0 ? '上升' : '下降'}${Math.abs(delta)}位`
})

const previewModeLabel = computed(() => {
    return `${flowHeadCount}+1`
})

const statusBadges = computed(() => {
    return [
        {
            key: 'period',
            className: 'ranking-flow__period',
            text: `当前：${rankingFlow.value.currentPeriodLabel || '最新累计期'}`
        },
        {
            key: 'mode',
            className: 'ranking-flow__mode',
            text: `模式：${previewModeLabel.value}`
        }
    ].filter(Boolean)
})

const summaryCards = computed(() => {
    return [
        {
            key: 'rank',
            label: '排名',
            value: currentRankLabel.value,
            meta: rankDeltaDescription.value,
            metaClass: rankDeltaClass.value
        },
        {
            key: 'share',
            label: '份额',
            value: currentShareLabel.value,
            meta: '按当前累计期测算',
            metaClass: ''
        },
        {
            key: 'premium',
            label: '保费',
            value: currentPremiumLabel.value,
            meta: '累计保费收入',
            metaClass: ''
        }
    ]
})

function closeModal() {
    emit('update:show', false)
}

function compactPeriodLabel(label) {
    const text = normalizeRankingText(label)
    if (!text) return ''

    const fullMatch = text.match(/((?:19|20)\d{2})年(\d{1,2})月/)
    if (fullMatch) {
        return `${Number(fullMatch[2])}月累计`
    }

    return text.endsWith('累计') ? text : `${text}累计`
}

function formatTooltipPremium(value) {
    return Number.isFinite(value) ? Number(value).toLocaleString('zh-CN') : '--'
}

function buildTooltipContent(param, periods) {
    if (!param?.data || !Number.isFinite(param.data.value)) return ''

    const rank = Number(param.data.value)
    const share = Number.isFinite(param.data.share) ? `${Number(param.data.share).toFixed(2)}%` : '--'
    const premium = formatTooltipPremium(param.data.premium)
    const periodLabel = compactPeriodLabel(param.data.periodLabel || periods[param.dataIndex]?.periodLabel || '')

    return `
        <div style="min-width: 160px;">
            <div style="font-size:11px;color:#78716C;margin-bottom:6px;">${periodLabel}</div>
            <div style="font-weight:600;color:${param.color};margin-bottom:6px;">${param.seriesName}</div>
            <div style="display:flex;justify-content:space-between;gap:12px;margin-top:4px;">
                <span>排名</span>
                <span style="font-weight:600;">第${rank}位</span>
            </div>
            <div style="display:flex;justify-content:space-between;gap:12px;margin-top:4px;">
                <span>份额</span>
                <span style="font-weight:600;">${share}</span>
            </div>
            <div style="display:flex;justify-content:space-between;gap:12px;margin-top:4px;">
                <span>保费</span>
                <span style="font-weight:600;">${premium}</span>
            </div>
        </div>
    `
}

const chartOption = computed(() => {
    const flow = rankingFlow.value
    if (!flow.seriesCompanies.length) return {}

    const periods = flow.periods || []
    const labels = periods.map(period => compactPeriodLabel(period.periodLabel || period.reportPeriod || period.datasetName || ''))
    const rankValues = flow.seriesCompanies.flatMap(company =>
        company.data
            .map(point => point?.value)
            .filter(value => Number.isFinite(value))
    )

    const { interval: yInterval, max: yMax } = useNiceInterval(rankValues.length > 0 ? rankValues : [8], 6)
    const maxRank = Math.max(flow.maxRank || 0, yMax || 8)

    return {
        backgroundColor: 'transparent',
        animationDuration: 900,
        animationEasing: 'cubicOut',
        tooltip: {
            trigger: 'item',
            backgroundColor: 'rgba(255, 252, 244, 0.98)',
            borderColor: 'rgba(217, 119, 6, 0.14)',
            borderWidth: 1,
            padding: 10,
            textStyle: {
                color: '#334155',
                fontSize: 11,
                fontFamily: 'var(--font-sans)'
            },
            formatter: param => buildTooltipContent(param, periods)
        },
        grid: {
            left: 42,
            right: 126,
            top: 18,
            bottom: 34,
            containLabel: true
        },
        xAxis: {
            type: 'category',
            data: labels,
            boundaryGap: true,
            axisLine: {
                lineStyle: {
                    color: 'rgba(148, 163, 184, 0.28)'
                }
            },
            axisTick: {
                show: false
            },
            axisLabel: {
                color: '#78716c',
                fontSize: 11,
                fontWeight: 500,
                interval: 0
            },
            splitLine: {
                show: false
            }
        },
        yAxis: {
            type: 'value',
            inverse: true,
            min: 1,
            max: maxRank,
            interval: yInterval || 1,
            axisLine: {
                show: false
            },
            axisTick: {
                show: false
            },
            axisLabel: {
                color: '#78716c',
                fontSize: 11,
                formatter(value) {
                    return `第${value}`
                }
            },
            splitLine: {
                lineStyle: {
                    color: 'rgba(226, 232, 240, 0.92)',
                    type: 'solid'
                }
            }
        },
        series: flow.seriesCompanies.map((company, index) => {
            const color = seriesPalette[index] || '#6b4f3b'
            const isSelected = company.isSelected
            const lineWidth = isSelected ? 3.5 : 2
            const symbolSize = isSelected ? 7 : 5

            return {
                name: company.companyName,
                type: 'line',
                smooth: 0.28,
                connectNulls: false,
                showSymbol: true,
                symbol: 'circle',
                symbolSize,
                clip: false,
                z: isSelected ? 20 : 10 + index,
                lineStyle: {
                    width: lineWidth,
                    color,
                    opacity: isSelected ? 1 : 0.76
                },
                itemStyle: {
                    color,
                    borderColor: '#fffdf7',
                    borderWidth: 2
                },
                emphasis: {
                    focus: 'series',
                    lineStyle: {
                        width: lineWidth + 1
                    },
                    itemStyle: {
                        shadowBlur: 12,
                        shadowColor: color
                    }
                },
                label: {
                    show: false
                },
                data: company.data.map((point, pointIndex) => {
                    if (!point) {
                        return null
                    }

                    const isLastPoint = pointIndex === company.lastKnownIndex
                    return {
                        value: point.value,
                        companyName: company.companyName,
                        fullName: company.fullName,
                        periodLabel: point.periodLabel,
                        premium: point.premium,
                        share: point.share,
                        label: {
                            show: isLastPoint,
                            position: 'right',
                            distance: 8,
                            color,
                            fontSize: isSelected ? 12 : 11,
                            fontWeight: isSelected ? 700 : 600,
                            formatter: company.companyName
                        }
                    }
                })
            }
        })
    }
})
</script>

<template>
    <n-modal
        :show="show"
        :mask-closable="true"
        :close-on-esc="true"
        class="ranking-flow-modal"
        @update:show="emit('update:show', $event)"
    >
        <div class="ranking-flow-panel">
            <button
                type="button"
                class="ranking-flow__close"
                aria-label="关闭排名流转弹窗"
                @click="closeModal"
            >
                ×
            </button>

            <header class="ranking-flow__header">
                <div class="ranking-flow__copy">
                    <h2 class="ranking-flow__title">
                        {{ displayCompanyName }}累计份额排名
                    </h2>
                    <div class="ranking-flow__subtitle">
                        <span
                            v-for="badge in statusBadges"
                            :key="badge.key"
                            :class="badge.className"
                        >
                            {{ badge.text }}
                        </span>
                    </div>
                </div>

                <div class="ranking-flow__stats">
                    <div
                        v-for="card in summaryCards"
                        :key="card.key"
                        class="ranking-flow__stat"
                    >
                        <span class="ranking-flow__stat-label">{{ card.label }}</span>
                        <strong class="ranking-flow__stat-value">{{ card.value }}</strong>
                        <span class="ranking-flow__stat-meta" :class="card.metaClass">{{ card.meta }}</span>
                    </div>
                </div>
            </header>

            <div class="ranking-flow__body">
                <div v-if="rankingFlow.seriesCompanies.length > 0" class="ranking-flow__chart-shell">
                    <VChart
                        class="ranking-flow__chart"
                        :option="chartOption"
                        :update-options="{ notMerge: true }"
                        :autoresize="true"
                    />
                </div>

                <n-empty
                    v-else
                    class="ranking-flow__empty"
                    description="暂无可用的累计排名数据"
                />
            </div>
        </div>
    </n-modal>
</template>

<style scoped>
.ranking-flow-panel {
    position: relative;
    width: min(90vw, 1280px);
    height: min(82vh, 760px);
    padding: clamp(16px, 1.8vw, 24px);
    border-radius: 24px;
    border: 1px solid rgba(229, 231, 235, 0.95);
    background:
        radial-gradient(circle at top right, rgba(245, 158, 11, 0.08), transparent 30%),
        radial-gradient(circle at left bottom, rgba(16, 185, 129, 0.07), transparent 34%),
        linear-gradient(180deg, #fffefc 0%, #ffffff 72%, #fcfaf6 100%);
    box-shadow: 0 18px 42px rgba(15, 23, 42, 0.1);
    color: var(--text-primary);
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.ranking-flow__close {
    position: absolute;
    top: 16px;
    right: 16px;
    width: 34px;
    height: 34px;
    border: 1px solid rgba(229, 231, 235, 0.92);
    border-radius: 999px;
    background: rgba(255, 252, 244, 0.94);
    color: #57534e;
    font-size: 18px;
    line-height: 1;
    cursor: pointer;
    transition: transform 150ms ease, background-color 150ms ease, border-color 150ms ease;
}

.ranking-flow__close:hover {
    transform: scale(1.04);
    background: #fff7ed;
    border-color: rgba(245, 158, 11, 0.35);
}

.ranking-flow__header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    padding-right: 48px;
}

.ranking-flow__copy {
    min-width: 0;
}

.ranking-flow__title {
    margin: 0;
    font-size: clamp(20px, 1.8vw, 28px);
    line-height: 1.15;
    letter-spacing: -0.02em;
    font-weight: 700;
    color: #111827;
}

.ranking-flow__subtitle {
    margin-top: 10px;
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
}

.ranking-flow__period,
.ranking-flow__mode {
    display: inline-flex;
    align-items: center;
    padding: 3px 8px;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 600;
}

.ranking-flow__period {
    background: rgba(245, 158, 11, 0.12);
    border: 1px solid rgba(245, 158, 11, 0.2);
    color: #a16207;
}

.ranking-flow__mode {
    background: rgba(120, 113, 108, 0.08);
    border: 1px solid rgba(120, 113, 108, 0.14);
    color: #57534e;
}

.ranking-flow__stats {
    display: grid;
    grid-template-columns: repeat(3, minmax(118px, 1fr));
    gap: 8px;
    flex-shrink: 0;
}

.ranking-flow__stat {
    min-width: 118px;
    padding: 10px 12px;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.82);
    border: 1px solid rgba(226, 232, 240, 0.9);
    box-shadow: 0 2px 6px rgba(15, 23, 42, 0.03);
    backdrop-filter: blur(6px);
}

.ranking-flow__stat-label {
    display: block;
    font-size: 10px;
    color: #8b95a7;
    margin-bottom: 3px;
    letter-spacing: 0.02em;
}

.ranking-flow__stat-value {
    display: block;
    font-size: clamp(18px, 1.35vw, 22px);
    line-height: 1.15;
    font-weight: 650;
    letter-spacing: -0.01em;
    color: #111827;
    font-variant-numeric: tabular-nums;
}

.ranking-flow__stat-meta {
    display: block;
    margin-top: 4px;
    font-size: 10px;
    color: #94a3b8;
    line-height: 1.25;
}

.ranking-flow__stat-meta.is-up {
    color: #047857;
}

.ranking-flow__stat-meta.is-down {
    color: #b91c1c;
}

.ranking-flow__body {
    flex: 1 1 auto;
    min-height: 0;
    margin-top: 12px;
}

.ranking-flow__chart-shell {
    height: 100%;
    min-height: 0;
    padding: 10px 10px 2px;
    border-radius: 18px;
    background: linear-gradient(180deg, #ffffff 0%, #fffdf8 100%);
    border: 1px solid rgba(229, 231, 235, 0.95);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.9);
}

.ranking-flow__chart {
    width: 100%;
    height: 100%;
    min-height: 0;
}

.ranking-flow__empty {
    height: 100%;
    color: #6b7280;
}

.ranking-flow__empty :deep(.n-empty__description) {
    color: #6b7280;
}

@media (max-width: 1024px) {
    .ranking-flow-panel {
        width: 94vw;
        height: 90vh;
        padding: 16px;
    }

    .ranking-flow__header {
        flex-direction: column;
        padding-right: 44px;
    }

    .ranking-flow__stats {
        width: 100%;
        grid-template-columns: repeat(3, minmax(0, 1fr));
    }

    .ranking-flow__stat {
        min-width: 0;
    }
}

@media (max-width: 768px) {
    .ranking-flow-panel {
        width: 96vw;
        height: 92vh;
        border-radius: 20px;
    }

    .ranking-flow__title {
        font-size: 22px;
    }

    .ranking-flow__subtitle {
        font-size: 12px;
    }

    .ranking-flow__stats {
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 10px;
    }

    .ranking-flow__stat {
        padding: 10px 11px;
        border-radius: 12px;
    }

    .ranking-flow__stat-value {
        font-size: 20px;
    }
}

@media (max-width: 560px) {
    .ranking-flow__stats {
        grid-template-columns: 1fr;
    }
}
</style>

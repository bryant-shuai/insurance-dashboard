<template>
    <div class="echarts-card">
        <div class="chart-header">
            <div class="chart-title">
                <span v-if="icon" class="chart-icon">{{ icon }}</span>
                <h3>{{ title }}</h3>
            </div>
            <div v-if="subtitle" class="chart-subtitle">
                <div class="subtitle-indicator"></div>
                <span>{{ subtitle }}</span>
            </div>
        </div>
        
        <div class="chart-container">
            <VChart 
                class="chart"
                :option="chartOption"
                :autoresize="true"
                :loading="loading"
            />
        </div>
    </div>
</template>

<script setup>
import { ref, computed, watch, shallowRef } from 'vue'
import { useWindowResize } from '../composables/useEventListener'
import VChart from "vue-echarts"
import { useECharts, useNiceInterval } from '../composables/useECharts'
import { formatGrowth, formatPremium, formatAxisValue } from '../utils/formatters'
import { focusCompanies } from '../stores/dataStore'

useECharts()

const props = defineProps({
    title: { type: String, required: true },
    subtitle: { type: String, default: '' },
    icon: { type: String, default: '' },
    data: { type: Array, default: () => [] },
    mainType: { type: String, default: 'premium' }
})

const loading = ref(false)

// 使用组合式函数优化事件监听
const isMobile = useWindowResize()

// 钱袋子路径
const MONEY_BAG_PATH = 'path://M27.5,12.5c0-1.7,0.7-3.1,1.9-4.2c1.2-1.1,2.8-1.7,4.6-1.7c1.7,0,3.3,0.6,4.5,1.7c1.2,1.1,1.9,2.5,1.9,4.2c0,1.4-0.5,2.7-1.4,3.7c1.7,1,3.2,2.4,4.2,4.1c1.2,1.8,1.9,4,1.9,6.5c0,3.1-1.1,5.8-3.1,7.9c-2,2.1-4.8,3.2-8,3.2c-3.2,0-6-1.1-8-3.2c-2.1-2.1-3.1-4.8-3.1-7.9c0-2.5,0.7-4.7,1.9-6.5c1.1-1.7,2.5-3.1,4.2-4.1C28,15.2,27.5,13.9,27.5,12.5z M34,10.5c-0.8,0-1.6,0.3-2.1,0.8c-0.6,0.5-0.9,1.2-0.9,2c0,0.8,0.3,1.5,0.9,2c0.6,0.5,1.3,0.8,2.1,0.8c0.8,0,1.5-0.3,2.1-0.8c0.6-0.5,0.9-1.2,0.9-2c0-0.8-0.3-1.5-0.9-2C35.5,10.8,34.8,10.5,34,10.5z M34,31.5c2.2,0,4.1-0.8,5.4-2.1c1.4-1.3,2.1-3.2,2.1-5.4c0-2.2-0.7-4.1-2.1-5.4c-1.4-1.3-3.2-2.1-5.4-2.1c-2.2,0-4.1,0.8-5.4,2.1c-1.4,1.3-2.1,3.2-2.1,5.4c0,2.2,0.7,4.1,2.1,5.4C29.9,30.7,31.8,31.5,34,31.5z'

const sortedData = computed(() => {
    return [...props.data].sort((a, b) => {
        const valueA = props.mainType === 'premium' ? a.p : a.g
        const valueB = props.mainType === 'premium' ? b.p : b.g
        return valueB - valueA
    })
})

const chartOption = computed(() => {
    const data = sortedData.value
    const labels = data.map(d => d.name)
    const mainData = data.map(d => props.mainType === 'premium' ? d.p : d.g)
    
    const { interval, max: newMax } = useNiceInterval(mainData)
    
    const isMobileVal = isMobile.value
    const isHorizontal = isMobileVal
    
    // Generate colors based on focus companies
    const colors = data.map(d => {
        if (focusCompanies.value.includes(d.name)) return '#EF4444'
        return '#4F46E5'
    })
    
    return {
        color: colors,
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
                const mainParam = params[0]
                const companyName = mainParam.name
                const idx = mainParam.dataIndex
                const item = data[idx]
                
                return `
                    <div style="font-weight: 600; margin-bottom: 8px; font-size: 14px; font-family: var(--font-sans); color: #111827;">${companyName}</div>
                    <div style="margin-bottom: 4px; font-family: var(--font-sans); color: #4B5563;">保费: <span style="color: ${mainParam.color}">${formatPremium(item.p)}</span></div>
                    <div style="font-family: var(--font-sans); color: #4B5563;">增速: <span style="color: ${item.g >= 0 ? '#10B981' : '#EF4444'}">${formatGrowth(item.g)}</span></div>
                `
            }
        },
        grid: {
            left: 10,
            right: isHorizontal ? 60 : 20,
            bottom: isHorizontal ? 10 : 40,
            top: isHorizontal ? 20 : 60,
            containLabel: true
        },
        xAxis: isHorizontal ? {
            type: 'value',
            name: props.mainType === 'premium' ? '保费' : '增速',
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
            axisLine: { show: false },
            axisTick: { show: false },
            axisLabel: {
                color: '#6B7280',
                fontSize: 9,
                fontFamily: 'Inter',
                formatter: function(value) {
                    if (props.mainType === 'premium') return formatAxisValue(value)
                    return Math.round(value)
                }
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
            axisLine: { lineStyle: { color: 'rgba(156, 163, 175, 0.2)' } },
            axisLabel: {
                color: '#4B5563',
                fontSize: 11,
                fontWeight: 500,
                rotate: 0,
                fontFamily: 'Inter',
                interval: 0
            },
            axisTick: { show: false }
        },
        yAxis: isHorizontal ? {
            type: 'category',
            data: labels,
            inverse: true,
            axisLine: { show: false },
            axisTick: { show: false },
            axisLabel: {
                color: '#4B5563',
                fontSize: 11,
                fontWeight: 500,
                fontFamily: 'Inter',
                formatter: function(value) {
                    if (value.length > 6) return value.substring(0, 6) + '..'
                    return value
                }
            }
        } : {
            type: 'value',
            name: props.mainType === 'premium' ? '保费' : '增速',
            nameLocation: 'end',
            nameGap: 25,
            nameTextStyle: {
                color: '#6B7280',
                fontSize: 11,
                fontWeight: 400,
                fontFamily: 'Inter'
            },
            max: newMax,
            interval: interval,
            axisLine: { show: false },
            axisTick: { show: false },
            axisLabel: {
                color: '#6B7280',
                fontSize: 10,
                fontFamily: 'Inter',
                formatter: function(value) {
                    if (props.mainType === 'premium') return formatAxisValue(value)
                    return Math.round(value)
                }
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
                name: props.mainType === 'premium' ? '保费' : '增速',
                type: 'bar',
                data: mainData,
                barWidth: isHorizontal ? '35%' : '45%',
                barCategoryGap: isMobileVal ? '40%' : '20%',
                itemStyle: {
                    borderRadius: isHorizontal ? [0, 4, 4, 0] : [8, 8, 0, 0],
                    opacity: 0.9
                },
                label: {
                    show: true,
                    position: isHorizontal ? 'right' : 'top',
                    formatter: function(params) {
                        const idx = params.dataIndex
                        const item = data[idx]
                        const premium = formatPremium(item.p)
                        const growth = formatGrowth(item.g)
                        if (isHorizontal) {
                            return `${premium}  ${growth}`
                        }
                        return `${premium}\n${growth}`
                    },
                    color: '#374151',
                    fontSize: isHorizontal ? 10 : 11,
                    fontWeight: '600',
                    fontFamily: 'Inter',
                    lineHeight: 14,
                    offset: isHorizontal ? [10, 0] : [0, 0]
                },
                emphasis: {
                    itemStyle: {
                        opacity: 1
                    }
                }
                // 移除 animationDelay 提升性能
            }
        ],
        animationEasing: 'cubicOut',
        animationDuration: 1000
    }
})

watch(() => props.data, (newData) => {
    if (newData.length > 0) {
        loading.value = true
        setTimeout(() => {
            loading.value = false
        }, 300)
    }
}, { deep: true })

watch(focusCompanies, () => {
    // Recompute chart when focus companies change
}, { deep: true })
</script>

<style scoped>
.echarts-card {
    background: #FFFFFF;
    border-radius: 16px;
    padding: 24px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
    border: 1px solid rgba(229, 231, 235, 0.8);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    font-family: var(--font-sans);
}

.echarts-card:hover {
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08);
    transform: translateY(-2px);
}

.chart-header {
    margin-bottom: 16px;
    font-family: var(--font-sans);
}

.chart-title {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 8px;
    font-family: var(--font-sans);
}

.chart-icon {
    font-size: 24px;
    line-height: 1;
    font-family: var(--font-sans);
}

.chart-title h3 {
    font-size: 18px;
    font-weight: 700;
    color: #111827;
    margin: 0;
    line-height: 1.3;
    font-family: var(--font-sans);
}

.chart-subtitle {
    display: flex;
    align-items: center;
    gap: 8px;
    font-family: var(--font-sans);
}

.subtitle-indicator {
    width: 8px;
    height: 8px;
    background: linear-gradient(135deg, #4F46E5, #10B981);
    border-radius: 50%;
    flex-shrink: 0;
}

.chart-subtitle span {
    font-size: 13px;
    color: #6B7280;
    font-weight: 400;
    line-height: 1.4;
    font-family: var(--font-sans);
}

.chart-container {
    height: clamp(300px, 40vw, 500px);
    position: relative;
    font-family: var(--font-sans);
}

.chart {
    width: 100%;
    height: 100%;
    font-family: var(--font-sans);
}

/* Responsive design */
@media (max-width: 768px) {
    .echarts-card {
        padding: 16px;
        font-family: var(--font-sans);
    }
    
    .chart-container {
        height: 520px;
    }
    
    .chart-title h3 {
        font-size: 15px;
        font-family: var(--font-sans);
    }

    .chart-icon {
        font-size: 20px;
    }

    .chart-header {
        margin-bottom: 12px;
    }
}

@media (max-width: 480px) {
    .chart-container {
        height: 260px;
    }
    
    .echarts-card {
        padding: 12px;
        font-family: var(--font-sans);
    }

    .chart-title h3 {
        font-size: 14px;
    }

    .chart-icon {
        font-size: 18px;
    }

    .chart-subtitle span {
        font-size: 11px;
    }
}
</style>

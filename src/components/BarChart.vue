<template>
    <div class="chart-card">
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
        <div class="canvas-container">
            <canvas ref="chartCanvas"></canvas>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, watch, onUnmounted, computed } from 'vue'
import { Chart, registerables } from 'chart.js'
import ChartDataLabels from 'chartjs-plugin-datalabels'
import { focusCompanies } from '../stores/dataStore'

Chart.register(...registerables, ChartDataLabels)
Chart.defaults.font.family = "'Inter', -apple-system, system-ui, sans-serif"
Chart.defaults.color = '#6B7280'

const props = defineProps({
    title: { type: String, required: true },
    subtitle: { type: String, default: '' },
    icon: { type: String, default: '' },
    data: { type: Array, default: () => [] },
    mainType: { type: String, default: 'premium' }
})

const chartCanvas = ref(null)
let chartInstance = null

const gradientColors = computed(() => {
    return props.data.map(d => {
        if (focusCompanies.value.includes(d.name)) {
            return {
                main: '#EF4444',
                gradient: 'rgba(239, 68, 68, 0.1)'
            }
        }
        return {
            main: '#4F46E5',
            gradient: 'rgba(79, 70, 229, 0.1)'
        }
    })
})

function drawChart() {
    if (!chartCanvas.value) return
    
    const ctx = chartCanvas.value.getContext('2d')
    if (chartInstance) chartInstance.destroy()

    const labels = props.data.map(d => d.name)
    const mainData = props.data.map(d => props.mainType === 'premium' ? d.p : d.g)
    const colors = gradientColors.value

    chartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                data: mainData,
                backgroundColor: colors.map(c => c.gradient),
                borderColor: colors.map(c => c.main),
                borderWidth: 2,
                borderRadius: 8,
                borderSkipped: false,
                barPercentage: 0.65,
                categoryPercentage: 0.75,
                extraData: props.data
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 1000,
                easing: 'easeOutQuart'
            },
            layout: { 
                padding: {
                    top: 40,
                    left: 16,
                    right: 16,
                    bottom: 8
                } 
            },
            plugins: {
                legend: { display: false },
                tooltip: { 
                    enabled: true,
                    backgroundColor: 'rgba(17, 24, 39, 0.95)',
                    titleFont: { 
                        family: "'Inter'", 
                        size: 14, 
                        weight: '600' 
                    },
                    bodyFont: { 
                        family: "'Inter'", 
                        size: 13 
                    },
                    padding: 16,
                    cornerRadius: 12,
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    borderWidth: 1,
                    displayColors: false,
                    boxPadding: 8,
                    usePointStyle: true,
                    callbacks: {
                        label: (ctx) => {
                            const item = ctx.dataset.extraData[ctx.dataIndex]
                            const pStr = Math.round(item.p).toLocaleString()
                            const gStr = item.g > 0 ? `+${item.g.toFixed(1)}%` : `${item.g.toFixed(1)}%`
                            return [
                                { text: `保费: ¥${pStr}`, color: '#FFFFFF' },
                                { text: `增速: ${gStr}`, color: item.g >= 0 ? '#10B981' : '#EF4444' }
                            ]
                        }
                    }
                },
                datalabels: {
                    anchor: 'end',
                    align: 'top',
                    color: '#374151',
                    font: { 
                        size: 11, 
                        weight: '600', 
                        family: "'Inter'" 
                    },
                    padding: 8,
                    display: true,
                    formatter: (value, context) => {
                        const idx = context.dataIndex
                        const item = context.dataset.extraData[idx]
                        const pStr = Math.round(item.p).toLocaleString()
                        const gStr = item.g > 0 ? `+${item.g.toFixed(1)}%` : `${item.g.toFixed(1)}%`
                        if (props.mainType === 'premium') {
                            return `¥${pStr}\n${gStr}`
                        } else {
                            return `${gStr}\n¥${pStr}`
                        }
                    }
                }
            },
            scales: {
                x: { 
                    grid: { 
                        display: false 
                    }, 
                    ticks: { 
                        font: { 
                            size: 12, 
                            weight: '500', 
                            family: "'Inter'" 
                        }, 
                        maxRotation: 45, 
                        minRotation: 0,
                        color: '#4B5563',
                        padding: 12
                    },
                    border: { 
                        display: false 
                    }
                },
                y: { 
                    beginAtZero: true, 
                    grid: { 
                        color: 'rgba(156, 163, 175, 0.15)',
                        drawBorder: false,
                        drawTicks: false,
                        lineWidth: 1
                    },
                    ticks: {
                        font: { 
                            size: 11, 
                            family: "'Inter'",
                            weight: '400'
                        },
                        color: '#6B7280',
                        padding: 16,
                        callback: function(value) {
                            if (props.mainType === 'premium') {
                                if (value >= 1000000) {
                                    return `¥${(value / 1000000).toFixed(1)}M`
                                } else if (value >= 1000) {
                                    return `¥${(value / 1000).toFixed(1)}K`
                                }
                            }
                            return value
                        }
                    },
                    border: { 
                        display: false 
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            },
            elements: {
                bar: {
                    hoverBackgroundColor: function(context) {
                        const color = gradientColors.value[context.dataIndex]
                        return color.main + '33'
                    },
                    hoverBorderColor: function(context) {
                        const color = gradientColors.value[context.dataIndex]
                        return color.main
                    },
                    hoverBorderWidth: 3
                }
            }
        }
    })
}

watch(() => props.data, () => drawChart(), { deep: true })
watch(focusCompanies, () => drawChart(), { deep: true })
onMounted(() => drawChart())
onUnmounted(() => { if (chartInstance) chartInstance.destroy() })
</script>

<style scoped>
.chart-card {
    background: #FFFFFF;
    border-radius: 16px;
    padding: 24px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
    border: 1px solid rgba(229, 231, 235, 0.8);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.chart-card:hover {
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08);
    transform: translateY(-2px);
}

.chart-header {
    margin-bottom: 24px;
}

.chart-title {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 8px;
}

.chart-icon {
    font-size: 24px;
    line-height: 1;
}

.chart-title h3 {
    font-size: 18px;
    font-weight: 700;
    color: #111827;
    margin: 0;
    line-height: 1.3;
}

.chart-subtitle {
    display: flex;
    align-items: center;
    gap: 8px;
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
}

.canvas-container {
    position: relative;
    height: 320px;
    width: 100%;
}

@media (max-width: 768px) {
    .chart-card {
        padding: 20px;
    }
    
    .canvas-container {
        height: 280px;
    }
    
    .chart-title h3 {
        font-size: 16px;
    }
}

@media (max-width: 480px) {
    .canvas-container {
        height: 240px;
    }
    
    .chart-card {
        padding: 16px;
    }
}
</style>

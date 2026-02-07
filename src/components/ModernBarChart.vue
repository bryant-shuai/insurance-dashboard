<template>
    <div class="modern-chart-card">
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
            <div class="chart-grid">
                <!-- Y-axis labels -->
                <div class="y-axis">
                    <div 
                        v-for="tick in yAxisTicks" 
                        :key="tick.value"
                        class="y-tick"
                    >
                        <span class="tick-label">{{ tick.label }}</span>
                    </div>
                </div>
                
                <!-- Bars container -->
                <div class="bars-container">
                    <div 
                        v-for="(item, index) in chartData" 
                        :key="item.name"
                        :class="['bar-item', { 'focus-company': isFocusCompany(item.name) }]"
                        @click="handleBarClick(item)"
                    >
                        <div class="bar-wrapper">
                            <div 
                                class="bar"
                                :style="{
                                    height: `${item.barHeight}%`,
                                    backgroundColor: isFocusCompany(item.name) ? '#EF444422' : '#4F46E522',
                                    borderColor: isFocusCompany(item.name) ? '#EF4444' : '#4F46E5'
                                }"
                            >
                                <div class="bar-value">
                                    <div class="main-value">{{ formatMainValue(item) }}</div>
                                    <div :class="['growth-value', item.g >= 0 ? 'positive' : 'negative']">
                                        {{ formatGrowth(item.g) }}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="bar-label">{{ item.name }}</div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { formatMainValue, formatGrowth, formatYAxisValue } from '../utils/formatters'
import { focusCompanies } from '../stores/dataStore'

const props = defineProps({
    title: { type: String, required: true },
    subtitle: { type: String, default: '' },
    icon: { type: String, default: '' },
    data: { type: Array, default: () => [] },
    mainType: { type: String, default: 'premium' },
    showGrowth: { type: Boolean, default: true }
})

const emit = defineEmits(['barClick'])

const sortedData = computed(() => {
    return [...props.data].sort((a, b) => {
        const valueA = props.mainType === 'premium' ? a.p : a.g
        const valueB = props.mainType === 'premium' ? b.p : b.g
        return valueB - valueA
    })
})

const maxValue = computed(() => {
    if (sortedData.value.length === 0) return 1
    const values = sortedData.value.map(item => props.mainType === 'premium' ? item.p : Math.abs(item.g))
    return Math.max(...values) * 1.2 // Add 20% buffer
})

const yAxisTicks = computed(() => {
    const ticks = []
    const max = maxValue.value
    const step = max / 4
    
    for (let i = 0; i <= 4; i++) {
        const value = max - (i * step)
        ticks.push({
            value,
            label: formatYAxisValue(value)
        })
    }
    
    return ticks
})

const processedData = computed(() => {
    const max = maxValue.value
    return sortedData.value.map(item => {
        const mainValue = props.mainType === 'premium' ? item.p : item.g
        const barHeight = (Math.abs(mainValue) / max) * 100
        
        return {
            ...item,
            mainValue,
            barHeight
        }
    })
})

const chartData = computed(() => {
    return sortedData.value.map(item => {
        const max = maxValue.value
        const mainValue = props.mainType === 'premium' ? item.p : item.g
        const barHeight = (Math.abs(mainValue) / max) * 100
        
        return {
            ...item,
            mainValue,
            barHeight
        }
    })
})

function isFocusCompany(name) {
    return focusCompanies.value.includes(name)
}

function formatMainValue(item) {
    return formatMainValue(item, props.mainType)
}

function formatGrowth(growth) {
    return formatGrowth(growth)
}

function formatYAxisValue(value) {
    return formatYAxisValue(value, props.mainType)
}

function handleBarClick(item) {
    emit('barClick', item)
}
</script>

<style scoped>
.modern-chart-card {
    background: #FFFFFF;
    border-radius: 16px;
    padding: 24px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
    border: 1px solid rgba(229, 231, 235, 0.8);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.modern-chart-card:hover {
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08);
    transform: translateY(-2px);
}

.chart-header {
    margin-bottom: 32px;
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

.chart-container {
    position: relative;
    height: 400px;
    overflow: hidden;
}

.chart-grid {
    display: flex;
    height: 100%;
    position: relative;
}

.y-axis {
    width: 80px;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding-right: 16px;
    border-right: 1px solid rgba(156, 163, 175, 0.15);
}

.y-tick {
    position: relative;
    height: 1px;
    display: flex;
    align-items: center;
}

.tick-label {
    font-size: 11px;
    color: #6B7280;
    font-weight: 400;
    line-height: 1;
}

.bars-container {
    flex: 1;
    display: flex;
    align-items: flex-end;
    gap: 16px;
    padding: 0 16px;
    height: 100%;
    position: relative;
}

/* Add horizontal grid lines */
.bars-container::before {
    content: '';
    position: absolute;
    top: 0;
    left: 16px;
    right: 16px;
    height: 100%;
    background-image: 
        linear-gradient(to top, rgba(156, 163, 175, 0.15) 1px, transparent 1px);
    background-size: 100% calc(100% / 4);
    pointer-events: none;
}

.bar-item {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    cursor: pointer;
    transition: all 0.2s ease;
    padding: 12px 0;
    border-radius: 8px;
}

.bar-item:hover {
    background-color: rgba(79, 70, 229, 0.05);
    transform: translateY(-2px);
}

.bar-item.focus-company {
    position: relative;
}

.bar-item.focus-company::after {
    content: '';
    position: absolute;
    top: 8px;
    right: 8px;
    width: 6px;
    height: 6px;
    background-color: #EF4444;
    border-radius: 50%;
}

.bar-wrapper {
    flex: 1;
    width: 100%;
    display: flex;
    align-items: flex-end;
    position: relative;
    min-height: 120px;
}

.bar {
    width: 100%;
    border-radius: 6px 6px 0 0;
    border: 2px solid;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: center;
    padding-top: 12px;
    position: relative;
    min-height: 40px;
}

.bar:hover {
    transform: scaleY(1.02);
    border-width: 2.5px;
}

.bar-value {
    text-align: center;
    z-index: 2;
}

.main-value {
    font-size: 12px;
    font-weight: 700;
    color: #111827;
    line-height: 1.2;
    margin-bottom: 4px;
}

.growth-value {
    font-size: 11px;
    font-weight: 600;
    line-height: 1;
}

.growth-value.positive {
    color: #10B981;
}

.growth-value.negative {
    color: #EF4444;
}

.bar-label {
    margin-top: 12px;
    font-size: 12px;
    font-weight: 500;
    color: #4B5563;
    text-align: center;
    line-height: 1.2;
    word-break: break-all;
    max-width: 100%;
}

/* Responsive design */
@media (max-width: 768px) {
    .modern-chart-card {
        padding: 20px;
    }
    
    .chart-container {
        height: 320px;
    }
    
    .bars-container {
        gap: 12px;
    }
    
    .bar-label {
        font-size: 11px;
    }
    
    .main-value {
        font-size: 11px;
    }
    
    .growth-value {
        font-size: 10px;
    }
}

@media (max-width: 480px) {
    .chart-container {
        height: 280px;
    }
    
    .bars-container {
        gap: 8px;
    }
    
    .bar {
        padding-top: 8px;
    }
    
    .bar-label {
        font-size: 10px;
        margin-top: 8px;
    }
}

/* Animation */
@keyframes barGrow {
    from {
        height: 0;
        opacity: 0;
    }
    to {
        height: var(--bar-height);
        opacity: 1;
    }
}

.bar {
    animation: barGrow 1s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

/* Stagger animation */
.bar-item:nth-child(1) .bar { animation-delay: 0.1s; }
.bar-item:nth-child(2) .bar { animation-delay: 0.15s; }
.bar-item:nth-child(3) .bar { animation-delay: 0.2s; }
.bar-item:nth-child(4) .bar { animation-delay: 0.25s; }
.bar-item:nth-child(5) .bar { animation-delay: 0.3s; }
.bar-item:nth-child(6) .bar { animation-delay: 0.35s; }
.bar-item:nth-child(7) .bar { animation-delay: 0.4s; }
.bar-item:nth-child(8) .bar { animation-delay: 0.45s; }
.bar-item:nth-child(9) .bar { animation-delay: 0.5s; }
.bar-item:nth-child(10) .bar { animation-delay: 0.55s; }
</style>
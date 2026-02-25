<template>
    <div class="page">
        <div class="chart-card">
            <div class="chart-header">
                <div class="chart-title">
                    <span class="chart-icon">📋</span>
                    <h3>原始数据</h3>
                </div>
                <div class="chart-subtitle">
                    <div class="subtitle-indicator"></div>
                    <span>滚动查看完整数据表</span>
                </div>
            </div>
            <div class="table-box" v-html="filteredHtml"></div>
        </div>
    </div>
</template>

<script setup>
import { computed } from 'vue'
import { state } from '../stores/dataStore'

// 过滤掉"地区"列的 HTML
const filteredHtml = computed(() => {
    if (!state.rawHtml) return ''
    
    const parser = new DOMParser()
    const doc = parser.parseFromString(state.rawHtml, 'text/html')
    const table = doc.querySelector('table')
    
    if (!table) return state.rawHtml
    
    const rows = table.querySelectorAll('tr')
    if (rows.length < 2) return state.rawHtml
    
    // 找到包含"地区"单元格的行
    let regionRowIndex = -1
    let regionCell = null
    
    for (let i = 0; i < rows.length; i++) {
        const cells = rows[i].querySelectorAll('td, th')
        for (let j = 0; j < cells.length; j++) {
            if (cells[j].textContent.trim() === '地区') {
                regionRowIndex = i
                regionCell = cells[j]
                break
            }
        }
        if (regionCell) break
    }
    
    if (!regionCell) return state.rawHtml
    
    // 获取该单元格的 rowspan 值
    const rowspan = parseInt(regionCell.getAttribute('rowspan') || '1')
    
    // 删除"地区"单元格
    regionCell.remove()
    
    // 对于 rowspan 之后的所有数据行，删除第一个单元格（地区数据，如"广州市"）
    for (let i = regionRowIndex + rowspan; i < rows.length; i++) {
        const firstCell = rows[i].querySelector('td, th')
        if (firstCell) firstCell.remove()
    }
    
    return table.outerHTML
})

</script>

<style scoped>
.page {
    height: 100%;
    display: flex;
    flex-direction: column;
    gap: clamp(12px, 1.5vw, 20px);
    min-height: 0;
}

.chart-card {
    background: #FFFFFF;
    border-radius: 16px;
    padding: clamp(16px, 2vw, 24px);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
    border: 1px solid rgba(229, 231, 235, 0.8);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;
}

.chart-card:hover {
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08);
    transform: translateY(-2px);
}

.chart-header {
    margin-bottom: clamp(12px, 1.5vw, 16px);
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.chart-title {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 8px;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.chart-icon {
    font-size: 24px;
    line-height: 1;
}

.chart-title h3 {
    font-size: clamp(16px, 1.2vw, 20px);
    font-weight: 800;
    color: #111827;
    margin: 0;
    line-height: 1.3;
    letter-spacing: -0.03em;
}

.chart-subtitle {
    display: flex;
    align-items: center;
    gap: 8px;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
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

/* 移动端适配 */
@media (max-width: 768px) {
    .chart-card {
        padding: 16px;
        max-height: calc(100vh - 100px);
    }

    .chart-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
    }

    .chart-title {
        margin-bottom: 4px;
    }

    .chart-title h3 {
        font-size: 16px;
    }

    .chart-icon {
        font-size: 20px;
    }

    .chart-subtitle span {
        font-size: 12px;
    }
}

@media (max-width: 480px) {
    .chart-card {
        padding: 12px;
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

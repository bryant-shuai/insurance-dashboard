<template>
    <div class="page">
        <div class="chart-card">
            <div class="chart-header">
                <div class="chart-title">
                    <svg class="chart-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                        <defs>
                            <linearGradient id="dataGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" style="stop-color:#10B981"/>
                                <stop offset="100%" style="stop-color:#059669"/>
                            </linearGradient>
                        </defs>
                        <circle cx="12" cy="12" r="10" fill="url(#dataGrad)" opacity="0.15"/>
                        <path fill="url(#dataGrad)" d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
                    </svg>
                    <h3>原始数据</h3>
                </div>
                <div class="chart-subtitle">
                    <div class="subtitle-indicator"></div>
                    <span>滚动查看完整数据表</span>
                </div>
            </div>
            <div class="table-container" ref="tableContainer">
                <div class="table-body" ref="tableBody" v-html="tableHtml"></div>
                <!-- 遮挡表头右侧滚动条的盖板 -->
                <div class="scrollbar-mask"></div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed, ref, onMounted, watch, nextTick } from 'vue'
import { state } from '../stores/dataStore'

const tableContainer = ref(null)
const tableBody = ref(null)

// 移除不稳定的 JS 同步逻辑
// 使用原生单表格 + CSS Sticky 保证绝对对齐

// 解析并处理表格数据，合并为一个完整表格
const tableHtml = computed(() => {
    if (!state.rawHtml) return ''
    
    const parser = new DOMParser()
    const doc = parser.parseFromString(state.rawHtml, 'text/html')
    const table = doc.querySelector('table')
    
    if (!table) return state.rawHtml
    
    const rows = Array.from(table.querySelectorAll('tr'))
    if (rows.length < 2) return table.outerHTML
    
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
    
    if (regionCell) {
        const rowspan = parseInt(regionCell.getAttribute('rowspan') || '1')
        regionCell.remove()
        for (let i = regionRowIndex + rowspan; i < rows.length; i++) {
            const firstCell = rows[i].querySelector('td, th')
            if (firstCell) firstCell.remove()
        }
    }
    
    // 返回合并后的完整表格，并标记前三行为 thead
    // 重新构建 HTML
    const allRows = Array.from(table.querySelectorAll('tr'))
    const headerHtml = allRows.slice(0, 3).map(r => r.outerHTML).join('')
    const bodyHtml = allRows.slice(3).map(r => r.outerHTML).join('')
    
    return `<table>
        <thead class="sticky-header">${headerHtml}</thead>
        <tbody>${bodyHtml}</tbody>
    </table>`
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
    display: flex;
    align-items: center;
    color: #4F46E5;
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

/* 表格容器 */
.table-container {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    position: relative;
    border: 1px solid var(--border-light);
    border-radius: var(--radius-lg);
    background: var(--bg-card);
    overflow: hidden;
}

/* 数据区域 - 可滚动 */
.table-body {
    flex: 1;
    overflow: auto;
    min-height: 0;
}

.table-body :deep(table) {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
    font-size: clamp(12px, 0.85vw, 14px);
    table-layout: auto;
}

/* 粘性表头样式 */
.table-body :deep(thead.sticky-header tr:nth-child(1) td),
.table-body :deep(thead.sticky-header tr:nth-child(2) td),
.table-body :deep(thead.sticky-header tr:nth-child(3) td) {
    position: sticky;
    z-index: 100;
    background: #fff; /* 纯白背景遮挡下方内容 */
    font-weight: 700;
    color: var(--text-primary);
    text-align: center;
    border-right: 1px solid var(--border-light);
    border-bottom: 1px solid var(--border-light);
    height: 40px;
    padding: 0 12px;
    box-sizing: border-box;
    white-space: nowrap;
    vertical-align: middle;
}

.table-body :deep(thead.sticky-header tr:nth-child(1) td) { top: 0; }
.table-body :deep(thead.sticky-header tr:nth-child(2) td) { top: 40px; }
.table-body :deep(thead.sticky-header tr:nth-child(3) td) { top: 80px; }

/* 遮盖右侧滚动条在表头部分的盖板 */
.scrollbar-mask {
    position: absolute;
    top: 0;
    right: 0;
    width: 12px; /* 略大于滚动条宽度 */
    height: 120px; /* 三行表头的高度 (40*3) */
    background: #fff;
    z-index: 101;
    border-bottom: 1px solid var(--border-light);
}

.table-body :deep(tbody td) {
    padding: 12px;
    border-right: 1px solid var(--border-light);
    border-bottom: 1px solid var(--border-light);
    white-space: nowrap;
    vertical-align: middle;
    box-sizing: border-box;
    background: #fff;
}

.table-body :deep(tbody tr:nth-child(odd) td) {
    background: var(--bg-subtle);
}

.table-body :deep(tbody tr:hover td) {
    background: linear-gradient(90deg, rgba(148, 163, 184, 0.08), rgba(203, 213, 225, 0.12));
}

/* 隐藏最后一行和最后一列的边框 */
.table-body :deep(td:last-child) {
    border-right: none;
}

.table-body :deep(tr:last-child td) {
    border-bottom: none;
}

/* 滚动条样式 */
.table-body::-webkit-scrollbar {
    width: 8px;
    height: 8px;
}

.table-body::-webkit-scrollbar-track {
    background: var(--bg-subtle);
    border-radius: 4px;
}

.table-body::-webkit-scrollbar-thumb {
    background: var(--border-default);
    border-radius: 4px;
}

.table-body::-webkit-scrollbar-thumb:hover {
    background: var(--text-tertiary);
}
</style>

<script setup>
import { computed, ref, watch } from 'vue'
import { state } from '../stores/dataStore'

const HEADER_ROW_HEIGHT = 38
const ALL_GROUP_KEY = '__all__'
const ALL_MODE_REGION_WIDTH = 84
const ALL_MODE_COMPANY_WIDTH = 116
const GROUP_MODE_REGION_WIDTH = 76
const GROUP_MODE_COMPANY_WIDTH = 104
const GROUP_MODE_METRIC_WIDTH = 112

const density = ref('compact')
const selectedGroup = ref(ALL_GROUP_KEY)
const companyKeyword = ref('')
const sortState = ref({
    colPosition: null,
    direction: null
})

function normalizeText(value) {
    if (value === undefined || value === null) return ''
    return String(value).trim()
}

function isMetricLabel(label) {
    const text = normalizeText(label)
    if (!text) return false
    return ['本期累计', '上年同期', '同比增长', '增量保费', '增量'].some(keyword => text.includes(keyword))
}

function looksLikeReportTitle(label) {
    const text = normalizeText(label)
    if (!text) return false
    return text.length >= 10 && ['报表', '统计', '快报', '主体', '分险种'].some(keyword => text.includes(keyword))
}

function deriveGroupAndMetric(labels) {
    const cleaned = (labels || []).map(normalizeText).filter(Boolean)
    if (!cleaned.length) return { group: '', metric: '' }

    let metric = ''
    for (let i = cleaned.length - 1; i >= 0; i--) {
        if (isMetricLabel(cleaned[i])) {
            metric = cleaned[i]
            break
        }
    }
    if (!metric) metric = cleaned[cleaned.length - 1]

    if (!isMetricLabel(metric)) {
        return { group: metric, metric }
    }

    let group = ''
    const metricIndex = cleaned.lastIndexOf(metric)
    for (let i = metricIndex - 1; i >= 0; i--) {
        const label = cleaned[i]
        if (!label || isMetricLabel(label) || label === metric) continue
        group = label
        break
    }

    if (!group) {
        group = cleaned.find(label => !isMetricLabel(label)) || metric
    }

    if (looksLikeReportTitle(group)) {
        const fallback = cleaned.find(label => !looksLikeReportTitle(label) && !isMetricLabel(label))
        if (fallback) group = fallback
    }

    return { group, metric }
}

function getHeaderColumnCount(layout) {
    if (!Array.isArray(layout) || layout.length === 0) return 0
    return layout.reduce((max, row) => {
        const count = (row || []).reduce((sum, cell) => sum + (Number(cell?.colspan) || 1), 0)
        return Math.max(max, count)
    }, 0)
}

function buildHeaderGrid(layout, colCount) {
    if (!Array.isArray(layout) || layout.length === 0 || colCount <= 0) return []

    const rowCount = layout.length
    const grid = Array.from({ length: rowCount }, () => Array(colCount).fill(''))

    for (let r = 0; r < rowCount; r++) {
        const cells = layout[r] || []
        let c = 0

        for (const cell of cells) {
            while (c < colCount && grid[r][c]) {
                c += 1
            }
            if (c >= colCount) break

            const text = normalizeText(cell?.text)
            const rowspan = Number(cell?.rowspan) || 1
            const colspan = Number(cell?.colspan) || 1

            for (let rr = r; rr < Math.min(rowCount, r + rowspan); rr++) {
                for (let cc = c; cc < Math.min(colCount, c + colspan); cc++) {
                    grid[rr][cc] = text
                }
            }

            c += colspan
        }
    }

    return grid
}

function annotateHeaderCells(rows) {
    const sourceRows = rows || []
    const occupiedRows = []

    return sourceRows.map(row => {
        for (let i = 0; i < occupiedRows.length; i++) {
            if (occupiedRows[i] > 0) {
                occupiedRows[i] -= 1
            }
        }

        const resultRow = []
        let cursor = 0

        for (const cell of row || []) {
            while (occupiedRows[cursor] > 0) {
                cursor += 1
            }

            const rowspan = Number(cell?.rowspan) || 1
            const colspan = Number(cell?.colspan) || 1

            resultRow.push({
                text: normalizeText(cell?.text),
                rowspan,
                colspan,
                colStart: cursor
            })

            for (let spanIndex = 0; spanIndex < colspan; spanIndex++) {
                occupiedRows[cursor + spanIndex] = Math.max(occupiedRows[cursor + spanIndex] || 0, rowspan)
            }

            cursor += colspan
        }

        return resultRow
    })
}

function buildProjectedHeaderLayout(headerGrid, selectedIndices) {
    if (!Array.isArray(headerGrid) || !headerGrid.length || !selectedIndices.length) return []

    const projected = headerGrid.map(row => selectedIndices.map(index => normalizeText(row?.[index])))
    const rowCount = projected.length
    const colCount = selectedIndices.length
    const visited = Array.from({ length: rowCount }, () => Array(colCount).fill(false))
    const result = []

    for (let r = 0; r < rowCount; r++) {
        const rowCells = []
        for (let c = 0; c < colCount; c++) {
            if (visited[r][c]) continue

            const text = projected[r][c] || ''
            let colspan = 1
            while (
                c + colspan < colCount &&
                !visited[r][c + colspan] &&
                projected[r][c + colspan] === text
            ) {
                colspan += 1
            }

            let rowspan = 1
            let canExpand = true
            while (r + rowspan < rowCount && canExpand) {
                for (let cc = c; cc < c + colspan; cc++) {
                    if (visited[r + rowspan][cc] || projected[r + rowspan][cc] !== text) {
                        canExpand = false
                        break
                    }
                }
                if (canExpand) rowspan += 1
            }

            for (let rr = r; rr < r + rowspan; rr++) {
                for (let cc = c; cc < c + colspan; cc++) {
                    visited[rr][cc] = true
                }
            }

            rowCells.push({ text, rowspan, colspan, colStart: c })
        }
        result.push(rowCells)
    }

    return result
}

const legacyTableData = computed(() => {
    if (!state.rawHtml) {
        return { headerLayout: [], rows: [] }
    }

    try {
        const parser = new DOMParser()
        const doc = parser.parseFromString(state.rawHtml, 'text/html')
        const table = doc.querySelector('table')
        if (!table) return { headerLayout: [], rows: [] }

        const allRows = Array.from(table.querySelectorAll('tr'))
        if (!allRows.length) return { headerLayout: [], rows: [] }

        const headerRowCount = Math.min(3, allRows.length)
        const headerLayout = allRows.slice(0, headerRowCount).map(row => {
            const cells = Array.from(row.querySelectorAll('td, th'))
            return cells.map(cell => ({
                text: normalizeText(cell.textContent),
                rowspan: Number(cell.getAttribute('rowspan') || 1),
                colspan: Number(cell.getAttribute('colspan') || 1)
            }))
        })

        const rows = allRows.slice(headerRowCount).map(row => {
            return Array.from(row.querySelectorAll('td, th')).map(cell => normalizeText(cell.textContent))
        })

        return { headerLayout, rows }
    } catch (error) {
        console.error('解析历史 rawHtml 失败:', error)
        return { headerLayout: [], rows: [] }
    }
})

const headerLayout = computed(() => {
    if (Array.isArray(state.rawHeaderLayout) && state.rawHeaderLayout.length > 0) {
        return state.rawHeaderLayout
    }
    return legacyTableData.value.headerLayout
})

const tableRows = computed(() => {
    if (Array.isArray(state.rawRows) && state.rawRows.length > 0) {
        return state.rawRows
    }
    return legacyTableData.value.rows
})

const totalColumnCount = computed(() => {
    const rowMax = tableRows.value.reduce((max, row) => Math.max(max, Array.isArray(row) ? row.length : 0), 0)
    const headerMax = getHeaderColumnCount(headerLayout.value)
    return Math.max(rowMax, headerMax)
})

const normalizedRows = computed(() => {
    const colCount = totalColumnCount.value
    return tableRows.value.map(row => Array.from({ length: colCount }, (_, idx) => normalizeText(row?.[idx])))
})

const headerGrid = computed(() => {
    return buildHeaderGrid(headerLayout.value, totalColumnCount.value)
})

const columnMeta = computed(() => {
    const colCount = totalColumnCount.value
    if (colCount === 0) return []

    return Array.from({ length: colCount }, (_, index) => {
        const labels = headerGrid.value
            .map(row => normalizeText(row?.[index]))
            .filter(Boolean)
        const { group, metric } = deriveGroupAndMetric(labels)

        return {
            index,
            group: group || `列${index + 1}`,
            metric: metric || group || `列${index + 1}`
        }
    })
})

const regionColIndex = computed(() => {
    const idx = columnMeta.value.findIndex(col => col.group.includes('地区'))
    return idx >= 0 ? idx : 0
})

const companyColIndex = computed(() => {
    const idx = columnMeta.value.findIndex(col => col.group.includes('公司'))
    if (idx >= 0) return idx
    return regionColIndex.value === 0 ? 1 : 0
})

const baseColumnIndices = computed(() => {
    return Array.from(new Set([regionColIndex.value, companyColIndex.value]))
        .filter(index => index >= 0 && index < totalColumnCount.value)
        .sort((a, b) => a - b)
})

const insuranceGroups = computed(() => {
    const baseSet = new Set(baseColumnIndices.value)
    const groups = []

    for (const col of columnMeta.value) {
        if (baseSet.has(col.index)) continue
        if (!col.group || isMetricLabel(col.group)) continue
        if (!groups.includes(col.group)) groups.push(col.group)
    }

    return groups
})

watch(insuranceGroups, groups => {
    if (selectedGroup.value === ALL_GROUP_KEY) return
    if (!groups.includes(selectedGroup.value)) {
        selectedGroup.value = ALL_GROUP_KEY
    }
}, { immediate: true })

function getGroupColumnIndices(groupName) {
    if (!groupName) return []
    const baseSet = new Set(baseColumnIndices.value)
    return columnMeta.value
        .filter(col => !baseSet.has(col.index) && col.group === groupName)
        .map(col => col.index)
}

const visibleColumnIndices = computed(() => {
    if (selectedGroup.value === ALL_GROUP_KEY) {
        return Array.from({ length: totalColumnCount.value }, (_, idx) => idx)
    }

    const base = baseColumnIndices.value
    const groupColumns = getGroupColumnIndices(selectedGroup.value)

    return Array.from(new Set([...base, ...groupColumns]))
        .filter(index => index >= 0 && index < totalColumnCount.value)
        .sort((a, b) => a - b)
})

const filteredRows = computed(() => {
    const keyword = normalizeText(companyKeyword.value).toLowerCase()
    if (!keyword) return normalizedRows.value

    const companyIndex = companyColIndex.value
    return normalizedRows.value.filter(row => {
        const companyName = normalizeText(row?.[companyIndex]).toLowerCase()
        return companyName.includes(keyword)
    })
})

const displayRows = computed(() => {
    return sortedRows.value.map(row => visibleColumnIndices.value.map(index => row?.[index] || ''))
})

const isGroupMode = computed(() => selectedGroup.value !== ALL_GROUP_KEY)
const fixedLeftWidth = computed(() => {
    const regionWidth = isGroupMode.value ? GROUP_MODE_REGION_WIDTH : ALL_MODE_REGION_WIDTH
    const companyWidth = isGroupMode.value ? GROUP_MODE_COMPANY_WIDTH : ALL_MODE_COMPANY_WIDTH
    return regionWidth + companyWidth
})

function parseSortableValue(value) {
    const text = normalizeText(value)
    if (!text) return { type: 'empty', value: '' }

    const numericText = text.replace(/,/g, '').replace(/%/g, '')
    if (/^-?\d+(\.\d+)?$/.test(numericText)) {
        return { type: 'number', value: Number(numericText) }
    }

    return { type: 'string', value: text.toLowerCase() }
}

function compareCellValues(a, b) {
    const parsedA = parseSortableValue(a)
    const parsedB = parseSortableValue(b)

    if (parsedA.type === 'empty' && parsedB.type === 'empty') return 0
    if (parsedA.type === 'empty') return 1
    if (parsedB.type === 'empty') return -1

    if (parsedA.type === 'number' && parsedB.type === 'number') {
        return parsedA.value - parsedB.value
    }

    return String(parsedA.value).localeCompare(String(parsedB.value), 'zh-Hans-CN', { numeric: true })
}

const sortedRows = computed(() => {
    const { colPosition, direction } = sortState.value
    if (colPosition === null || !direction) {
        return filteredRows.value
    }

    const sourceColumnIndex = visibleColumnIndices.value[colPosition]
    if (sourceColumnIndex === undefined) {
        return filteredRows.value
    }

    return filteredRows.value
        .map((row, originIndex) => ({ row, originIndex }))
        .sort((a, b) => {
            const compareResult = compareCellValues(a.row[sourceColumnIndex], b.row[sourceColumnIndex])
            if (compareResult !== 0) {
                return direction === 'asc' ? compareResult : -compareResult
            }
            return a.originIndex - b.originIndex
        })
        .map(item => item.row)
})

function removeTitleHeaderRows(rows, totalCols) {
    if (!Array.isArray(rows) || rows.length <= 1) return rows || []
    const [firstRow, ...restRows] = rows
    const firstCells = firstRow || []
    if (firstCells.length !== 1) return rows

    const onlyCell = firstCells[0]
    const colspan = Number(onlyCell?.colspan) || 1
    const text = normalizeText(onlyCell?.text)
    const almostFullSpan = colspan >= Math.max(totalCols - 1, 1)
    if (almostFullSpan && looksLikeReportTitle(text)) {
        return restRows
    }
    return rows
}

const displayHeaderRows = computed(() => {
    if (selectedGroup.value === ALL_GROUP_KEY) {
        const rows = annotateHeaderCells(headerLayout.value)
        return removeTitleHeaderRows(rows, totalColumnCount.value)
    }
    const projectedRows = buildProjectedHeaderLayout(headerGrid.value, visibleColumnIndices.value)
    return removeTitleHeaderRows(projectedRows, visibleColumnIndices.value.length)
})

const hiddenColumnCount = computed(() => {
    return Math.max(totalColumnCount.value - visibleColumnIndices.value.length, 0)
})

const hasTableData = computed(() => {
    return headerLayout.value.length > 0 || tableRows.value.length > 0
})

watch(visibleColumnIndices, indices => {
    if (sortState.value.colPosition === null) return
    if (sortState.value.colPosition >= indices.length) {
        sortState.value = { colPosition: null, direction: null }
    }
})

function getHeaderCellClass(cell) {
    const isSingleColumn = Number(cell?.colspan) === 1
    if (!isSingleColumn) return ''

    if (cell.colStart === 0) return 'sticky-region'
    if (cell.colStart === 1) return 'sticky-company'
    return ''
}

function isSortableHeaderCell(cell) {
    return Number(cell?.colspan) === 1 && Number(cell?.colStart) >= 2
}

function getSortDirection(colPosition) {
    if (sortState.value.colPosition !== colPosition) return ''
    return sortState.value.direction || ''
}

function getSortSymbol(colPosition) {
    const direction = getSortDirection(colPosition)
    if (direction === 'asc') return '↑'
    if (direction === 'desc') return '↓'
    return '↕'
}

function toggleSort(colPosition) {
    if (sortState.value.colPosition !== colPosition) {
        sortState.value = { colPosition, direction: 'asc' }
        return
    }

    if (sortState.value.direction === 'asc') {
        sortState.value = { colPosition, direction: 'desc' }
        return
    }

    if (sortState.value.direction === 'desc') {
        sortState.value = { colPosition: null, direction: null }
        return
    }

    sortState.value = { colPosition, direction: 'asc' }
}

function onHeaderClick(cell) {
    if (!isSortableHeaderCell(cell)) return
    toggleSort(cell.colStart)
}

function getHeaderCellStyle(rowIndex, cell) {
    const baseZIndex = 160 - rowIndex
    const style = { top: `${rowIndex * HEADER_ROW_HEIGHT}px`, zIndex: baseZIndex }
    const isSingleColumn = Number(cell?.colspan) === 1

    if (isSingleColumn) {
        const width = getColumnWidthByPosition(cell.colStart)
        if (width) {
            style.width = `${width}px`
            style.minWidth = `${width}px`
            style.maxWidth = `${width}px`
        }
    }

    if (isSingleColumn && cell.colStart === 0) {
        style.zIndex = baseZIndex + 60
        return style
    }
    if (isSingleColumn && cell.colStart === 1) {
        style.zIndex = baseZIndex + 50
        return style
    }
    return style
}

function getColumnWidthByPosition(colPosition) {
    if (colPosition === 0) {
        return isGroupMode.value ? GROUP_MODE_REGION_WIDTH : ALL_MODE_REGION_WIDTH
    }
    if (colPosition === 1) {
        return isGroupMode.value ? GROUP_MODE_COMPANY_WIDTH : ALL_MODE_COMPANY_WIDTH
    }
    if (isGroupMode.value) {
        return GROUP_MODE_METRIC_WIDTH
    }
    return null
}

function getBodyCellClass(colPosition) {
    return {
        'sticky-region': colPosition === 0,
        'sticky-company': colPosition === 1,
        'is-metric-col': colPosition >= 2
    }
}

function getBodyCellStyle(colPosition) {
    const width = getColumnWidthByPosition(colPosition)
    if (!width) return null
    return {
        width: `${width}px`,
        minWidth: `${width}px`,
        maxWidth: `${width}px`
    }
}

function setDensity(nextDensity) {
    density.value = nextDensity
}

function clearCompanyKeyword() {
    companyKeyword.value = ''
}
</script>

<template>
    <div class="page raw-data-page">
        <section class="table-shell">
            <div v-if="hasTableData" class="toolbar">
                <div class="toolbar-search">
                    <input
                        v-model.trim="companyKeyword"
                        type="text"
                        placeholder="按公司名称搜索..."
                        aria-label="按公司名称搜索"
                    >
                    <button
                        v-if="companyKeyword"
                        class="search-clear"
                        @click="clearCompanyKeyword"
                    >
                        清空
                    </button>
                </div>

                <div class="group-tabs" role="group" aria-label="分组选择">
                    <button :class="{ active: selectedGroup === ALL_GROUP_KEY }" @click="selectedGroup = ALL_GROUP_KEY">全部展示</button>
                    <button
                        v-for="group in insuranceGroups"
                        :key="group"
                        :class="{ active: selectedGroup === group }"
                        @click="selectedGroup = group"
                    >
                        {{ group }}
                    </button>
                </div>

                <div class="density-switch" role="group" aria-label="密度">
                    <button :class="{ active: density === 'compact' }" @click="setDensity('compact')">紧凑</button>
                    <button :class="{ active: density === 'comfortable' }" @click="setDensity('comfortable')">舒适</button>
                </div>
            </div>

            <div class="table-container">
                <div class="table-scroll" :style="{ '--fixed-left-width': `${fixedLeftWidth}px` }">
                    <table
                        v-if="hasTableData"
                        :class="[
                            'raw-table',
                            `density-${density}`,
                            selectedGroup === ALL_GROUP_KEY ? 'mode-all' : 'mode-group'
                        ]"
                    >
                        <thead>
                            <tr v-for="(row, rowIndex) in displayHeaderRows" :key="`h-${rowIndex}`">
                                <th
                                    v-for="(cell, cellIndex) in row"
                                    :key="`h-${rowIndex}-${cellIndex}`"
                                    :rowspan="cell.rowspan || 1"
                                    :colspan="cell.colspan || 1"
                                    :style="getHeaderCellStyle(rowIndex, cell)"
                                    :class="[
                                        getHeaderCellClass(cell),
                                        { sortable: isSortableHeaderCell(cell) },
                                        `sort-${getSortDirection(cell.colStart)}`
                                    ]"
                                    @click="onHeaderClick(cell)"
                                >
                                    <span class="head-label">{{ cell.text || '—' }}</span>
                                    <span v-if="isSortableHeaderCell(cell)" class="sort-indicator" :class="`sort-${getSortDirection(cell.colStart)}`">
                                        {{ getSortSymbol(cell.colStart) }}
                                    </span>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="(row, rowIndex) in displayRows" :key="`r-${rowIndex}`">
                                <td
                                    v-for="(cell, colIndex) in row"
                                    :key="`r-${rowIndex}-${colIndex}`"
                                    :class="getBodyCellClass(colIndex)"
                                    :style="getBodyCellStyle(colIndex)"
                                >
                                    <span class="cell-text">{{ cell }}</span>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                    <div v-else class="empty-state">暂无原始表格数据</div>
                </div>
            </div>
        </section>
    </div>
</template>

<style scoped>
.raw-data-page {
    min-height: 0;
}

.table-shell {
    height: 100%;
    min-height: 0;
    display: flex;
    flex-direction: column;
    border-radius: 16px;
    border: 1px solid var(--border-light);
    background: #fff;
    overflow: hidden;
    box-shadow: 0 8px 20px rgba(15, 23, 42, 0.05);
}

.toolbar {
    padding: 10px 14px;
    border-bottom: 1px solid #e9edf4;
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
}

.toolbar-search {
    margin-right: auto;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    min-width: min(360px, 100%);
}

.toolbar-search input {
    height: 32px;
    border: 1px solid #dbe3ed;
    border-radius: 10px;
    padding: 0 12px;
    font-size: var(--text-sm);
    color: #0f172a;
    background: #fff;
    min-width: min(300px, 100%);
}

.toolbar-search input:focus {
    outline: none;
    border-color: #93c5fd;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.14);
}

.search-clear {
    border: 1px solid #dbeafe;
    background: #eff6ff;
    color: #1e40af;
    font-size: var(--text-sm);
    font-weight: var(--weight-semibold);
    border-radius: 8px;
    padding: 5px 10px;
    cursor: pointer;
}

.group-tabs,
.density-switch {
    display: inline-flex;
    border: 1px solid #dbeafe;
    background: #eff6ff;
    border-radius: 10px;
    padding: 2px;
    flex-wrap: wrap;
    gap: 2px;
}

.group-tabs button,
.density-switch button {
    border: none;
    background: transparent;
    color: #64748b;
    font-size: var(--text-sm);
    font-weight: var(--weight-semibold);
    padding: 4px 10px;
    border-radius: 8px;
    cursor: pointer;
}

.group-tabs button.active,
.density-switch button.active {
    background: #fff;
    color: #1e40af;
    box-shadow: 0 1px 2px rgba(15, 23, 42, 0.14);
}

.table-container {
    flex: 1;
    min-height: 0;
    padding: 8px;
    background: linear-gradient(180deg, #f8fafc 0%, #ffffff 100%);
}

.table-scroll {
    height: 100%;
    min-height: 0;
    overflow: auto;
    position: relative;
    border: 1px solid #dbe3ed;
    border-radius: 12px;
    background: #fff;
}

.table-scroll::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: var(--fixed-left-width, 200px);
    pointer-events: none;
    z-index: 21;
    background: #fff;
    box-shadow: inset -1px 0 0 #dbe3ed;
}

.raw-table {
    --region-col-width: 84px;
    --company-col-width: 116px;
    --fixed-left-width: calc(var(--region-col-width) + var(--company-col-width));
    width: max-content;
    min-width: 100%;
    border-collapse: separate;
    border-spacing: 0;
}

.raw-table.mode-all {
    --region-col-width: 84px;
    --company-col-width: 116px;
}

.raw-table.mode-group {
    --region-col-width: 76px;
    --company-col-width: 104px;
}

.raw-table.density-compact {
    --row-height: 30px;
    --cell-font: 12px;
    --cell-pad-x: 10px;
}

.raw-table.density-comfortable {
    --row-height: 36px;
    --cell-font: 13px;
    --cell-pad-x: 12px;
}

.raw-table th,
.raw-table td {
    border-right: 1px solid #e2e8f0;
    border-bottom: 1px solid #e2e8f0;
    white-space: nowrap;
    font-size: var(--cell-font);
    padding: 0 var(--cell-pad-x);
}

.raw-table thead th {
    position: sticky;
    background: linear-gradient(180deg, #ffffff, #f6f9ff);
    color: #0f172a;
    text-align: center;
    font-weight: var(--weight-bold);
    height: 38px;
    z-index: 30;
}

.raw-table thead th.sortable {
    cursor: pointer;
    user-select: none;
}

.raw-table thead th .head-label {
    pointer-events: none;
}

.sort-indicator {
    margin-left: 6px;
    display: inline-flex;
    align-items: center;
    line-height: 1;
    font-size: var(--text-xs);
    color: #94a3b8;
    vertical-align: middle;
    opacity: 0.35;
    transition: opacity 0.15s ease, color 0.15s ease;
}

.raw-table thead th.sortable:hover .sort-indicator {
    opacity: 0.75;
}

.sort-indicator.sort-asc,
.sort-indicator.sort-desc {
    opacity: 1;
    color: #1e40af;
    font-weight: var(--weight-bold);
}

.raw-table tbody td {
    height: var(--row-height);
    color: #1e293b;
    background: #fff;
}

.raw-table tbody tr:nth-child(odd) td {
    background: #fbfcff;
}

.raw-table tbody tr:hover td {
    background: linear-gradient(90deg, rgba(219, 234, 254, 0.42), rgba(239, 246, 255, 0.58));
}

.raw-table td.is-metric-col {
    text-align: center;
    font-family: var(--font-mono);
    font-variant-numeric: tabular-nums;
}

.cell-text {
    display: block;
    width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    position: relative;
    z-index: 1;
}

.sticky-region,
.sticky-company {
    position: sticky;
}

.sticky-region {
    left: 0;
    min-width: var(--region-col-width);
    max-width: var(--region-col-width);
    z-index: 28;
}

.sticky-company {
    left: var(--region-col-width);
    min-width: var(--company-col-width);
    max-width: var(--company-col-width);
    z-index: 27;
}

.raw-table thead th.sticky-region,
.raw-table thead th.sticky-company {
    background: linear-gradient(180deg, #ffffff, #f6f9ff) !important;
}

.raw-table td.sticky-region,
.raw-table td.sticky-company {
    z-index: 22;
    background: #fff !important;
}

.raw-table td.sticky-region .cell-text,
.raw-table td.sticky-company .cell-text {
    background: inherit;
}

.raw-table tbody tr:nth-child(odd) td.sticky-region,
.raw-table tbody tr:nth-child(odd) td.sticky-company {
    background: #fbfcff !important;
}

.raw-table tbody tr:hover td.sticky-region,
.raw-table tbody tr:hover td.sticky-company {
    background: #eaf3ff !important;
}

.raw-table th:last-child,
.raw-table td:last-child {
    border-right: none;
}

.empty-state {
    min-height: 220px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #64748b;
    font-size: var(--text-base);
}

@media (max-width: 1024px) {
    .toolbar {
        padding-left: 12px;
        padding-right: 12px;
    }

    .table-container {
        padding: 8px;
    }
}
</style>

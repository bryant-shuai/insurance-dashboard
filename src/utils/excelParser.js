import * as XLSX from 'xlsx'
import { state, currentIns, saveDataToStorage } from '../stores/dataStore'

export function processFile(file) {
    return new Promise((resolve, reject) => {
        if (!file) {
            reject(new Error('No file provided'))
            return
        }
        
        const reader = new FileReader()
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result)
                const workbook = XLSX.read(data, { type: 'array' })
                const sheet = workbook.Sheets[workbook.SheetNames[0]]
                const json = XLSX.utils.sheet_to_json(sheet, { header: 1 })
                
                processData(json)
                
                // 保存原始表格HTML
                state.rawHtml = XLSX.utils.sheet_to_html(sheet)
                    .replace('<table>', '<table border="0" cellpadding="0" cellspacing="0">')
                
                state.isDataLoaded = true
                
                // 保存数据到 localStorage
                saveDataToStorage()
                
                resolve()
            } catch (err) {
                reject(err)
            }
        }
        reader.onerror = () => reject(new Error('Failed to read file'))
        reader.readAsArrayBuffer(file)
    })
}

export function processFileOnly(file) {
    return new Promise((resolve, reject) => {
        if (!file) {
            reject(new Error('No file provided'))
            return
        }
        
        const reader = new FileReader()
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result)
                const workbook = XLSX.read(data, { type: 'array' })
                const sheet = workbook.Sheets[workbook.SheetNames[0]]
                const json = XLSX.utils.sheet_to_json(sheet, { header: 1 })
                
                // 临时保存当前状态
                const tempInsurances = [...state.insurances]
                const tempCompanies = { ...state.companies }
                const tempRawHtml = state.rawHtml
                const tempIsDataLoaded = state.isDataLoaded
                
                // 处理新文件数据
                processData(json)
                
                // 保存原始表格HTML
                const rawHtml = XLSX.utils.sheet_to_html(sheet)
                    .replace('<table>', '<table border="0" cellpadding="0" cellspacing="0">')
                
                // 返回处理后的数据，不修改当前状态
                const result = {
                    insurances: [...state.insurances],
                    companies: { ...state.companies },
                    rawHtml: rawHtml
                }
                
                // 恢复之前的状态
                state.insurances = tempInsurances
                state.companies = tempCompanies
                state.rawHtml = tempRawHtml
                state.isDataLoaded = tempIsDataLoaded
                
                resolve(result)
            } catch (err) {
                reject(err)
            }
        }
        reader.onerror = () => reject(new Error('Failed to read file'))
        reader.readAsArrayBuffer(file)
    })
}

function processData(rows) {
    let headerIdx = -1
    let metricIdx = -1
    
    // 查找表头行
    for (let i = 0; i < Math.min(20, rows.length); i++) {
        const str = (rows[i] || []).join(' ')
        if (str.includes('非车险')) headerIdx = i
        if (str.includes('本期累计') && str.includes('同比增长')) metricIdx = i
    }

    if (headerIdx === -1 || metricIdx === -1) {
        throw new Error('表头识别失败')
    }

    const headers = rows[headerIdx]
    const metrics = rows[metricIdx]
    const colMap = {}
    let tempIns = ''
    const maxCol = Math.max(headers.length, metrics.length)

    // 重置状态
    state.insurances = []
    state.companies = {}

    // 解析列映射
    for (let i = 0; i < maxCol; i++) {
        if (headers[i] && !['地区', '公司名称'].includes(headers[i])) {
            tempIns = headers[i].trim()
            if (!state.insurances.includes(tempIns)) {
                state.insurances.push(tempIns)
                colMap[tempIns] = {}
            }
        }
        if (tempIns && metrics[i]) {
            const m = metrics[i].toString().trim()
            if (m.includes('本期累计')) colMap[tempIns].p = i
            if (m.includes('同比增长')) colMap[tempIns].g = i
        }
    }

    // 解析数据行
    for (let i = metricIdx + 1; i < rows.length; i++) {
        const row = rows[i]
        if (!row || row.length < 2) continue
        const region = row[0] || ''
        const name = row[1] || ''
        if (region.includes('合计') || name.includes('合计') || !name) continue

        const fullName = region ? `${region}-${name}` : name
        state.companies[fullName] = {}

        state.insurances.forEach(ins => {
            const map = colMap[ins]
            if (map && map.p !== undefined) {
                let p = parseFloat(row[map.p]) || 0
                let gStr = map.g !== undefined ? String(row[map.g]).replace('%', '') : '0'
                let g = parseFloat(gStr)
                if (isNaN(g)) g = 0
                state.companies[fullName][ins] = { premium: p, growth: g }
            }
        })
    }

    // 排序险种，非车险放第一位
    state.insurances.sort((a, b) => a === '非车险' ? -1 : 1)
    
    // 设置默认选中的险种
    if (state.insurances.length > 0) {
        currentIns.value = state.insurances[0]
    }
}

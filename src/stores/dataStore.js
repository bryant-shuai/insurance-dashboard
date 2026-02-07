import { reactive, ref, computed } from 'vue'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

// 子险种列表
export const SUB_INSURANCES = [
    '企业财产保险', '工程险', '船舶保险', '货物运输保险', 
    '责任保险', '保证保险', '意外伤害保险', '健康保险'
]

// 响应式状态
export const state = reactive({
    insurances: [],
    companies: {},
    rawHtml: '',
    isDataLoaded: false
})

export const focusCompanies = ref([])
export const currentIns = ref('')
export const currentTab = ref(0)
export const selectedCompany = ref(null)
export const dataSets = ref([])
export const currentDataSetId = ref(null)

// 计算属性：获取公司列表
export const companyList = computed(() => {
    const comps = Object.keys(state.companies).map(k => k.split('-').pop())
    return [...new Set(comps)].sort((a, b) => a.localeCompare(b, 'zh-Hans-CN'))
})

// 计算属性：根据当前险种获取排名数据
export const rankingData = computed(() => {
    if (!currentIns.value) return { byPremium: [], byGrowth: [] }
    
    const allData = Object.keys(state.companies).map(k => ({
        name: k.split('-').pop(),
        fullName: k,
        p: state.companies[k][currentIns.value]?.premium || 0,
        g: state.companies[k][currentIns.value]?.growth || 0
    }))

    // 按保费排序
    const sortedByP = [...allData].sort((a, b) => b.p - a.p)
    let dataP = sortedByP.slice(0, 10)
    focusCompanies.value.forEach(fc => {
        if (!dataP.find(d => d.name === fc)) {
            const found = sortedByP.find(d => d.name === fc)
            if (found) dataP.push(found)
        }
    })

    // 按增速排序（保费大于10）
    const sortedByG = [...allData].filter(d => d.p > 10).sort((a, b) => b.g - a.g)
    let dataG = sortedByG.slice(0, 10)
    focusCompanies.value.forEach(fc => {
        if (!dataG.find(d => d.name === fc)) {
            const found = allData.find(d => d.name === fc)
            if (found) dataG.push(found)
        }
    })

    return { byPremium: dataP, byGrowth: dataG }
})

// 计算属性：分析列表数据
export const analysisList = computed(() => {
    return Object.keys(state.companies).map(k => ({
        name: k.split('-').pop(),
        fullName: k,
        p: state.companies[k]['非车险']?.premium || 0,
        g: state.companies[k]['非车险']?.growth || 0
    })).sort((a, b) => b.p - a.p)
})

// 方法：添加关注公司
export function addFocusCompany(name) {
    if (!focusCompanies.value.includes(name)) {
        focusCompanies.value.push(name)
    }
}

// 方法：移除关注公司
export function removeFocusCompany(name) {
    focusCompanies.value = focusCompanies.value.filter(c => c !== name)
}

// 方法：设置当前险种
export function setCurrentIns(ins) {
    currentIns.value = ins
}

// 方法：切换标签页
export function switchTab(idx) {
    currentTab.value = idx
}

// 方法：设置选中的公司
export function setSelectedCompany(fullName) {
    selectedCompany.value = fullName
}

// 方法：获取某公司的分险种数据
export function getCompanyDetail(fullName) {
    if (!fullName || !state.companies[fullName]) return []
    
    return SUB_INSURANCES.map(ins => ({
        name: ins,
        p: state.companies[fullName][ins]?.premium || 0,
        g: state.companies[fullName][ins]?.growth || 0
    }))
}

// 方法：保存数据到 localStorage
export function saveDataToStorage(dataSetName = null) {
    try {
        const dataSetId = currentDataSetId.value || Date.now().toString()
        const dataSetNameToUse = dataSetName || `数据集 ${dataSets.value.length + 1}`
        
        const newDataSet = {
            id: dataSetId,
            name: dataSetNameToUse,
            insurances: state.insurances,
            companies: state.companies,
            rawHtml: state.rawHtml,
            createdAt: new Date().toISOString()
        }
        
        // 检查是否已存在该数据集
        const existingIndex = dataSets.value.findIndex(ds => ds.id === dataSetId)
        if (existingIndex >= 0) {
            dataSets.value[existingIndex] = newDataSet
        } else {
            dataSets.value.push(newDataSet)
        }
        
        currentDataSetId.value = dataSetId
        
        // 保存所有数据集
        const dataToSave = {
            dataSets: dataSets.value,
            currentDataSetId: currentDataSetId.value,
            focusCompanies: focusCompanies.value,
            currentIns: currentIns.value,
            currentTab: currentTab.value,
            selectedCompany: selectedCompany.value
        }
        localStorage.setItem('insuranceDashboardData', JSON.stringify(dataToSave))
    } catch (error) {
        console.error('保存数据失败:', error)
    }
}

// 方法：添加新数据集（不修改当前状态）
export function addDataSet(dataSetName, insurances, companies, rawHtml) {
    try {
        const dataSetId = Date.now().toString()
        const newDataSet = {
            id: dataSetId,
            name: dataSetName,
            insurances: insurances,
            companies: companies,
            rawHtml: rawHtml,
            createdAt: new Date().toISOString()
        }
        
        dataSets.value.push(newDataSet)
        
        // 保存所有数据集
        const dataToSave = {
            dataSets: dataSets.value,
            currentDataSetId: currentDataSetId.value,
            focusCompanies: focusCompanies.value,
            currentIns: currentIns.value,
            currentTab: currentTab.value,
            selectedCompany: selectedCompany.value
        }
        localStorage.setItem('insuranceDashboardData', JSON.stringify(dataToSave))
        
        return dataSetId
    } catch (error) {
        console.error('添加数据集失败:', error)
        return null
    }
}

// 方法：从 localStorage 加载数据
export function loadDataFromStorage() {
    try {
        const savedData = localStorage.getItem('insuranceDashboardData')
        if (savedData) {
            const data = JSON.parse(savedData)
            dataSets.value = data.dataSets || []
            currentDataSetId.value = data.currentDataSetId || null
            focusCompanies.value = data.focusCompanies || []
            currentTab.value = data.currentTab || 0
            selectedCompany.value = data.selectedCompany || null
            
            // 如果有当前数据集，加载它
            if (currentDataSetId.value && dataSets.value.length > 0) {
                const currentDataSet = dataSets.value.find(ds => ds.id === currentDataSetId.value)
                if (currentDataSet) {
                    loadDataSet(currentDataSet.id)
                    return true
                }
            }
        }
    } catch (error) {
        console.error('加载数据失败:', error)
    }
    return false
}

// 方法：加载指定的数据集
export function loadDataSet(dataSetId) {
    try {
        const dataSet = dataSets.value.find(ds => ds.id === dataSetId)
        if (dataSet) {
            state.insurances = dataSet.insurances || []
            state.companies = dataSet.companies || {}
            state.rawHtml = dataSet.rawHtml || ''
            state.isDataLoaded = true
            currentDataSetId.value = dataSetId
            if (state.insurances.length > 0) {
                currentIns.value = state.insurances[0]
            }
            return true
        }
    } catch (error) {
        console.error('加载数据集失败:', error)
    }
    return false
}

// 方法：删除数据集
export function deleteDataSet(dataSetId) {
    try {
        const index = dataSets.value.findIndex(ds => ds.id === dataSetId)
        if (index >= 0) {
            dataSets.value.splice(index, 1)
            
            // 如果删除的是当前数据集，清空状态
            if (currentDataSetId.value === dataSetId) {
                state.insurances = []
                state.companies = {}
                state.rawHtml = ''
                state.isDataLoaded = false
                currentDataSetId.value = null
                currentIns.value = ''
            }
            
            // 保存更新后的数据集列表
            const dataToSave = {
                dataSets: dataSets.value,
                currentDataSetId: currentDataSetId.value,
                focusCompanies: focusCompanies.value,
                currentIns: currentIns.value,
                currentTab: currentTab.value,
                selectedCompany: selectedCompany.value
            }
            localStorage.setItem('insuranceDashboardData', JSON.stringify(dataToSave))
        }
    } catch (error) {
        console.error('删除数据集失败:', error)
    }
}

// 方法：清除 localStorage 中的数据
export function clearDataFromStorage() {
    try {
        localStorage.removeItem('insuranceDashboardData')
        dataSets.value = []
        currentDataSetId.value = null
        state.insurances = []
        state.companies = {}
        state.rawHtml = ''
        state.isDataLoaded = false
        focusCompanies.value = []
        currentIns.value = ''
        currentTab.value = 0
        selectedCompany.value = null
    } catch (error) {
        console.error('清除数据失败:', error)
    }
}

// API 方法：从服务器获取所有数据集
export async function fetchDatasets() {
    try {
        const response = await fetch(`${API_BASE_URL}/datasets`)
        if (!response.ok) {
            throw new Error('获取数据集失败')
        }
        const datasets = await response.json()
        dataSets.value = datasets
        return datasets
    } catch (error) {
        console.error('获取数据集失败:', error)
        throw error
    }
}

// API 方法：上传文件到服务器
export async function uploadFile(file) {
    try {
        const formData = new FormData()
        formData.append('file', file)
        
        const response = await fetch(`${API_BASE_URL}/upload`, {
            method: 'POST',
            body: formData
        })
        
        if (!response.ok) {
            const error = await response.json()
            throw new Error(error.error || '上传文件失败')
        }
        
        const dataset = await response.json()
        dataSets.value.push(dataset)
        return dataset
    } catch (error) {
        console.error('上传文件失败:', error)
        throw error
    }
}

// API 方法：从服务器删除数据集
export async function deleteDataSetFromServer(dataSetId) {
    try {
        const response = await fetch(`${API_BASE_URL}/datasets/${dataSetId}`, {
            method: 'DELETE'
        })
        
        if (!response.ok) {
            throw new Error('删除数据集失败')
        }
        
        const index = dataSets.value.findIndex(ds => ds.id === dataSetId)
        if (index >= 0) {
            dataSets.value.splice(index, 1)
        }
        
        // 如果删除的是当前数据集，清空状态
        if (currentDataSetId.value === dataSetId) {
            state.insurances = []
            state.companies = {}
            state.rawHtml = ''
            state.isDataLoaded = false
            currentDataSetId.value = null
            currentIns.value = ''
        }
        
        return true
    } catch (error) {
        console.error('删除数据集失败:', error)
        throw error
    }
}

// API 方法：重命名数据集
export async function renameDataSet(dataSetId, newName) {
    try {
        const response = await fetch(`${API_BASE_URL}/datasets/${dataSetId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name: newName })
        })
        
        if (!response.ok) {
            throw new Error('重命名数据集失败')
        }
        
        const dataset = await response.json()
        const index = dataSets.value.findIndex(ds => ds.id === dataSetId)
        if (index >= 0) {
            dataSets.value[index] = dataset
        }
        
        return dataset
    } catch (error) {
        console.error('重命名数据集失败:', error)
        throw error
    }
}

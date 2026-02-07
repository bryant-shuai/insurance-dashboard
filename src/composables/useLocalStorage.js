import { ref, watch } from 'vue'

/**
 * localStorage 封装组合式函数
 * @param {string} key - 存储键名
 * @param {*} defaultValue - 默认值
 * @param {Object} options - 配置选项
 * @param {number} options.debounceMs - 防抖毫秒数（默认 300ms）
 * @param {boolean} options.syncAcrossTabs - 是否跨标签页同步（默认 false）
 * @returns {import('vue').Ref} 响应式引用
 */
export function useLocalStorage(key, defaultValue = null, options = {}) {
    const { debounceMs = 300, syncAcrossTabs = false } = options
    
    // 初始化值
    const storedValue = localStorage.getItem(key)
    const initialValue = storedValue ? JSON.parse(storedValue) : defaultValue
    const state = ref(initialValue)
    
    // 防抖写入
    let timeoutId = null
    const debouncedWrite = () => {
        if (timeoutId) clearTimeout(timeoutId)
        timeoutId = setTimeout(() => {
            try {
                localStorage.setItem(key, JSON.stringify(state.value))
            } catch (error) {
                console.warn(`localStorage 写入失败 [${key}]:`, error)
            }
        }, debounceMs)
    }
    
    // 监听状态变化并持久化
    watch(state, debouncedWrite, { deep: true })
    
    // 跨标签页同步（可选）
    if (syncAcrossTabs) {
        const handleStorageChange = (event) => {
            if (event.key === key && event.newValue !== JSON.stringify(state.value)) {
                try {
                    state.value = event.newValue ? JSON.parse(event.newValue) : defaultValue
                } catch (error) {
                    console.warn(`localStorage 读取失败 [${key}]:`, error)
                }
            }
        }
        window.addEventListener('storage', handleStorageChange)
    }
    
    return state
}

/**
 * 批量操作 localStorage（提升性能）
 * @param {Array<{key: string, value: any}>} operations - 操作数组
 */
export function batchLocalStorage(operations) {
    try {
        operations.forEach(({ key, value }) => {
            if (value === undefined || value === null) {
                localStorage.removeItem(key)
            } else {
                localStorage.setItem(key, JSON.stringify(value))
            }
        })
    } catch (error) {
        console.warn('批量 localStorage 操作失败:', error)
    }
}
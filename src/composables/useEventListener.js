import { ref, onMounted, onUnmounted } from 'vue'

/**
 * 通用事件监听器组合式函数
 * @param {EventTarget} target - 监听目标（如 window, document）
 * @param {string} event - 事件名称（如 'resize', 'click'）
 * @param {Function} handler - 事件处理器
 * @param {Object} options - 事件选项
 */
export function useEventListener(target, event, handler, options) {
    onMounted(() => {
        target.addEventListener(event, handler, options)
    })
    
    onUnmounted(() => {
        target.removeEventListener(event, handler, options)
    })
}

/**
 * 窗口尺寸变化监听器（响应式）
 * @param {(width: number, height: number) => void} callback - 回调函数
 * @returns {import('vue').Ref<boolean>} isMobile 响应式移动端检测
 */
export function useWindowResize(callback) {
    const isMobile = Vue.ref(window.innerWidth <= 768)
    
    const handleResize = () => {
        const width = window.innerWidth
        const height = window.innerHeight
        isMobile.value = width <= 768
        callback?.(width, height)
    }
    
    useEventListener(window, 'resize', handleResize)
    return isMobile
}

/**
 * 点击外部区域监听器
 * @param {import('vue').Ref<HTMLElement>} elementRef - 元素引用
 * @param {Function} callback - 点击外部时的回调
 */
export function useClickOutside(elementRef, callback) {
    const handleClick = (event) => {
        if (elementRef.value && !elementRef.value.contains(event.target)) {
            callback(event)
        }
    }
    
    useEventListener(document, 'click', handleClick)
}
import { ref, onMounted, onUnmounted } from 'vue'

// 窗口大小变化监听
export function useWindowResize(callback) {
    const width = ref(window.innerWidth)
    const height = ref(window.innerHeight)
    
    const handleResize = () => {
        width.value = window.innerWidth
        height.value = window.innerHeight
        if (callback) callback(width.value, height.value)
    }
    
    onMounted(() => {
        window.addEventListener('resize', handleResize)
    })
    
    onUnmounted(() => {
        window.removeEventListener('resize', handleResize)
    })
    
    return { width, height }
}

// 点击外部区域监听
export function useClickOutside(elementRef, callback) {
    const handleClickOutside = (event) => {
        if (elementRef.value && !elementRef.value.contains(event.target)) {
            callback(event)
        }
    }
    
    onMounted(() => {
        document.addEventListener('click', handleClickOutside)
    })
    
    onUnmounted(() => {
        document.removeEventListener('click', handleClickOutside)
    })
}
/**
 * 格式化增长率
 * @param {number} growth - 增长率数值
 * @returns {string} 格式化后的字符串，如 "+1.23%" 或 "-0.45%"
 */
export function formatGrowth(growth) {
  return growth > 0 ? `+${growth.toFixed(2)}%` : `${growth.toFixed(2)}%`
}

/**
 * 格式化保费（万元）
 * @param {number} premium - 保费数值（单位：元）
 * @returns {string} 格式化后的字符串
 */
export function formatPremium(premium) {
  return (premium / 10000).toFixed(2)
}

/**
 * 格式化数值（自动处理单位，用于轴标签）
 * @param {number} value - 数值
 * @returns {string|number}
 */
export function formatAxisValue(value) {
  const v = value / 10000
  if (v >= 1) return Math.round(v)
  if (v === 0) return 0
  return v.toFixed(1)
}

/**
 * 格式化主数值（支持保费和增速）
 * @param {Object} item - 数据项
 * @param {'premium'|'growth'} mainType - 主要类型
 * @returns {string} 格式化后的字符串
 */
export function formatMainValue(item, mainType) {
    const value = mainType === 'premium' ? item.p : item.g
    if (mainType === 'premium') {
        if (value >= 1000000) {
            return `¥${(value / 1000000).toFixed(1)}M`
        } else if (value >= 1000) {
            return `¥${(value / 1000).toFixed(1)}K`
        }
        return `¥${Math.round(value)}`
    } else {
        return value >= 0 ? `+${value.toFixed(1)}%` : `${value.toFixed(1)}%`
    }
}

/**
 * 格式化 Y 轴数值
 * @param {number} value - 数值
 * @param {'premium'|'growth'} mainType - 类型
 * @returns {string} 格式化后的字符串
 */
export function formatYAxisValue(value, mainType) {
    if (mainType === 'premium') {
        if (value >= 1000000) {
            return `¥${(value / 1000000).toFixed(1)}M`
        } else if (value >= 1000) {
            return `¥${(value / 1000).toFixed(1)}K`
        }
        return `¥${Math.round(value)}`
    }
    return value.toFixed(1)
}

/**
 * 格式化日期时间
 * @param {string|Date} dateString - 日期字符串或 Date 对象
 * @returns {string} 格式化后的日期时间
 */
export function formatDate(dateString) {
    const date = new Date(dateString)
    return date.toLocaleString('zh-CN', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit'
    })
}

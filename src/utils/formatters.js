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
 * 格式化数值（自动处理单位）
 * @param {number} value - 数值
 * @returns {string|number}
 */
export function formatAxisValue(value) {
  const v = value / 10000
  if (v >= 1) return Math.round(v)
  if (v === 0) return 0
  return v.toFixed(1)
}

export function formatDate(date) {
  const d = new Date(date)
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

export function formatGrowth(growth) {
  return growth > 0 ? `+${growth.toFixed(2)}%` : `${growth.toFixed(2)}%`
}

export function formatPremium(premium) {
  return Math.round(premium).toLocaleString()
}

export function formatAxisValue(value) {
  if (value >= 10000) return Math.round(value / 10000) + '万'
  if (value >= 1000) return (value / 1000).toFixed(1) + 'k'
  return Math.round(value)
}
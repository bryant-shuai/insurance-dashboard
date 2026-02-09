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
  return (premium / 10000).toFixed(2)
}

export function formatAxisValue(value) {
  const v = value / 10000
  if (v >= 1) return Math.round(v)
  if (v === 0) return 0
  return v.toFixed(1)
}
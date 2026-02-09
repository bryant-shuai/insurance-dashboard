import { use } from "echarts/core"
import { CanvasRenderer } from "echarts/renderers"
import { BarChart, TreemapChart } from "echarts/charts"
import {
  TitleComponent,
  TooltipComponent,
  GridComponent,
  DatasetComponent,
  TransformComponent,
  LegendComponent,
  ToolboxComponent
} from "echarts/components"

let isRegistered = false

export function useECharts() {
  if (!isRegistered) {
    use([
      CanvasRenderer,
      BarChart,
      TreemapChart,
      TitleComponent,
      TooltipComponent,
      GridComponent,
      DatasetComponent,
      TransformComponent,
      LegendComponent,
      ToolboxComponent
    ])
    isRegistered = true
  }
}

/**
 * 计算 nice interval 和 max 值
 * @param {number[]} data - 数据数组
 * @param {number} splitNumber - 分割数量，默认 5
 * @returns {{ interval: number, max: number }}
 */
export function useNiceInterval(data, splitNumber = 5) {
  const dataMax = Math.max(...data)
  const dataMin = Math.min(0, Math.min(...data))
  const span = dataMax - dataMin
  
  if (span <= 0 || !isFinite(span)) {
    return { interval: 1, max: dataMax + 1 }
  }
  
  const rawInterval = span / splitNumber
  const exponent = Math.floor(Math.log10(rawInterval))
  const exp10 = Math.pow(10, exponent)
  const f = rawInterval / exp10
  
  let nf
  if (f < 1.5) nf = 1
  else if (f < 2.5) nf = 2
  else if (f < 4) nf = 3
  else if (f < 7) nf = 5
  else nf = 10
  
  const interval = nf * exp10
  const originalMax = Math.ceil(dataMax / interval) * interval
  const max = originalMax + interval
  
  return { interval, max }
}

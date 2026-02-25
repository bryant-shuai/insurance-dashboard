import express from 'express'
import cors from 'cors'
import multer from 'multer'
import { createRequire } from 'module'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const require = createRequire(import.meta.url)
const XLSX = require('xlsx')

// FastGPT 配置
const FASTGPT_API_URL = 'https://api.fastgpt.in/api/v1/chat/completions'
const FASTGPT_API_KEY = 'fastgpt-bRqj49fNjPdfLASbuKuA3r2ylzqaXfNSgfNZaAGzxaQfdouRVCVLSj7FUeD'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb', parameterLimit: 1000000 }))

const uploadDir = path.join(__dirname, 'uploads')
const dataDir = path.join(__dirname, 'data')
const datasetsFile = path.join(dataDir, 'datasets.json')

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now()
    const random = Math.floor(Math.random() * 10000)
    const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8')
    const ext = path.extname(originalName)
    cb(null, `${timestamp}-${random}${ext}`)
  }
})

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase()
    if (['.xlsx', '.xls', '.csv'].includes(ext)) {
      cb(null, true)
    } else {
      cb(new Error('只支持 .xlsx, .xls, .csv 格式的文件'))
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024
  },
  preservePath: false
})

function ensureDirectories() {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true })
  }
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }
  if (!fs.existsSync(datasetsFile)) {
    fs.writeFileSync(datasetsFile, JSON.stringify([], null, 2))
  }
}

function getDatasets() {
  try {
    if (fs.existsSync(datasetsFile)) {
      const data = fs.readFileSync(datasetsFile, 'utf-8')
      return JSON.parse(data)
    }
    return []
  } catch (error) {
    console.error('读取数据集失败:', error)
    return []
  }
}

function saveDatasets(datasets) {
  try {
    const data = JSON.stringify(datasets, null, 2)
    fs.writeFileSync(datasetsFile, data, 'utf8')
    return true
  } catch (error) {
    console.error('保存数据集失败:', error)
    return false
  }
}

function parseExcelFile(filePath) {
  try {
    let json = []
    let rawHtml = ''

    const ext = path.extname(filePath).toLowerCase()

    if (ext === '.csv') {
      const content = fs.readFileSync(filePath, 'utf8')
      const lines = content.split('\n').filter(line => line.trim())
      json = lines.map(line => {
        return line.split(',').map(cell => cell.trim())
      })

      console.log('CSV文件解析完成，行数:', json.length)

      let tableHtml = '<table border="0" cellpadding="0" cellspacing="0">'
      json.forEach(row => {
        tableHtml += '<tr>'
        row.forEach(cell => {
          tableHtml += `<td>${cell}</td>`
        })
        tableHtml += '</tr>'
      })
      tableHtml += '</table>'
      rawHtml = tableHtml
    } else {
      const workbook = XLSX.readFile(filePath)
      const sheet = workbook.Sheets[workbook.SheetNames[0]]
      json = XLSX.utils.sheet_to_json(sheet, { header: 1 })
      rawHtml = XLSX.utils.sheet_to_html(sheet)
        .replace('<table>', '<table border="0" cellpadding="0" cellspacing="0">')
    }

    console.log('解析文件内容，前5行:')
    for (let i = 0; i < Math.min(5, json.length); i++) {
      console.log(`第${i}行:`, json[i])
    }

    let headerIdx = -1
    let metricIdx = -1

    for (let i = 0; i < Math.min(20, json.length); i++) {
      const row = json[i] || []
      const str = row.join(' ')
      console.log(`检查第${i}行: "${str}"`)
      if (str.includes('非车险')) {
        headerIdx = i
        console.log(`找到表头行: ${i}`)
      }
      if (str.includes('本期累计') || str.includes('同比增长')) {
        metricIdx = i
        console.log(`找到指标行: ${i}`)
      }
    }

    console.log(`表头行索引: ${headerIdx}, 指标行索引: ${metricIdx}`)

    if (headerIdx === -1 || metricIdx === -1) {
      throw new Error('表头识别失败')
    }

    const headers = json[headerIdx]
    const metrics = json[metricIdx]
    const colMap = {}
    const maxCol = Math.max(headers.length, metrics.length)
    const insurances = []
    const companies = {}

    for (let i = 2; i < headers.length; i++) {
      const header = headers[i]
      if (header && !['地区', '公司名称'].includes(header)) {
        const insName = header.trim()
        if (!insurances.includes(insName)) {
          insurances.push(insName)
          colMap[insName] = {}
        }
      }
    }

    let insIndex = 0
    for (let i = 2; i < metrics.length; i++) {
      const metric = metrics[i]
      if (metric && insIndex < insurances.length) {
        const insName = insurances[insIndex]
        const metricStr = metric.toString().trim()
        if (metricStr.includes('本期累计')) {
          colMap[insName].p = i
        } else if (metricStr.includes('同比增长')) {
          colMap[insName].g = i
          insIndex++
        }
      }
    }

    console.log('列映射:', colMap)
    console.log('险种列表:', insurances)

    for (let i = metricIdx + 1; i < json.length; i++) {
      const row = json[i]
      if (!row || row.length < 2) continue
      const region = row[0] || ''
      const name = row[1] || ''
      if (region.includes('合计') || name.includes('合计') || !name) continue

      const fullName = region ? `${region}-${name}` : name
      companies[fullName] = {}

      insurances.forEach(ins => {
        const map = colMap[ins]
        if (map && map.p !== undefined) {
          let p = parseFloat(row[map.p]) || 0
          let gStr = map.g !== undefined ? String(row[map.g]).replace('%', '') : '0'
          let g = parseFloat(gStr)
          if (isNaN(g)) g = 0
          companies[fullName][ins] = { premium: p, growth: g }
        }
      })
    }

    insurances.sort((a, b) => a === '非车险' ? -1 : 1)

    return { insurances, companies, rawHtml }
  } catch (error) {
    throw error
  }
}

app.get('/api/datasets', (req, res) => {
  try {
    const datasets = getDatasets()
    res.json(datasets)
  } catch (error) {
    res.status(500).json({ error: '获取数据集失败' })
  }
})

function computeAdvancedAnalysis(dataset) {
  const { companies, insurances } = dataset
  if (!companies || Object.keys(companies).length === 0) return dataset

  const result = { ...dataset }

  const marketInsight = {}
  const targetInsurances = insurances && insurances.length > 0 ? insurances : ['非车险']

  for (const ins of targetInsurances) {
    const entries = Object.entries(companies)
      .map(([name, data]) => ({
        company: name,
        premium: data[ins]?.premium || 0,
        growth: data[ins]?.growth || 0
      }))
      .filter(e => e.premium > 0)
      .sort((a, b) => b.premium - a.premium)

    if (entries.length === 0) continue

    const totalPremium = entries.reduce((sum, e) => sum + e.premium, 0)
    const top4Premium = entries.slice(0, 4).reduce((sum, e) => sum + e.premium, 0)
    const cr4 = parseFloat(((top4Premium / totalPremium) * 100).toFixed(1))

    let marketType = '竞争型'
    if (cr4 > 60) marketType = '高度集中型'
    else if (cr4 > 30) marketType = '中度集中型'

    const topCompanies = entries.slice(0, 5).map(e => ({
      company: e.company,
      premium: e.premium,
      growth: e.growth
    }))

    marketInsight[ins] = {
      total_premium: totalPremium,
      cr4,
      market_type: marketType,
      top_companies: topCompanies,
      company_count: entries.length
    }
  }

  result.market_insight = marketInsight

  const bcgInsurance = '非车险'
  const bcgEntries = Object.entries(companies)
    .map(([name, data]) => ({
      name,
      premium: data[bcgInsurance]?.premium || 0,
      growth: data[bcgInsurance]?.growth || 0
    }))
    .filter(e => e.premium > 0)
    .sort((a, b) => b.premium - a.premium)

  const bcgTotal = bcgEntries.reduce((sum, e) => sum + e.premium, 0)

  // 只用保费前80%的公司计算阈值，排除尾部小公司的噪音
  const cumulativeLimit = bcgTotal * 0.8
  let cumSum = 0
  const mainEntries = bcgEntries.filter(e => {
    if (cumSum >= cumulativeLimit) return false
    cumSum += e.premium
    return true
  })

  const growthValues = mainEntries.map(e => e.growth).filter(g => !isNaN(g)).sort((a, b) => a - b)
  const shareValues = mainEntries.map(e => (e.premium / bcgTotal) * 100).sort((a, b) => a - b)

  const median = arr => arr.length > 0 ? arr[Math.floor(arr.length / 2)] : 0

  const medianGrowth = median(growthValues)
  const medianShare = median(shareValues)

  const growthThreshold = medianGrowth
  const shareThreshold = medianShare

  result.bcg_matrix = bcgEntries.map(e => {
    const share = (e.premium / bcgTotal) * 100
    const highGrowth = e.growth >= growthThreshold
    const highShare = share >= shareThreshold

    let quadrant = '瘦狗'
    if (highGrowth && highShare) quadrant = '明星'
    else if (!highGrowth && highShare) quadrant = '奶牛'
    else if (highGrowth && !highShare) quadrant = '野猫'

    return {
      name: e.name,
      x: parseFloat(share.toFixed(2)),
      y: parseFloat(e.growth.toFixed(2)),
      z: e.premium,
      quadrant
    }
  })

  const avgGrowth = growthValues.length > 0
    ? parseFloat((growthValues.reduce((s, g) => s + g, 0) / growthValues.length).toFixed(2))
    : 0

  result.summary = {
    total_companies: bcgEntries.length,
    total_premium: bcgTotal,
    avg_growth: parseFloat(medianGrowth.toFixed(2)),
    max_growth: growthValues.length > 0 ? parseFloat(Math.max(...growthValues).toFixed(2)) : 0,
    min_growth: growthValues.length > 0 ? parseFloat(Math.min(...growthValues).toFixed(2)) : 0,
    growth_threshold: parseFloat(growthThreshold.toFixed(2)),
    share_threshold: parseFloat(shareThreshold.toFixed(2))
  }

  return result
}

app.get('/api/datasets/:id', (req, res) => {
  try {
    const datasets = getDatasets()
    const dataset = datasets.find(d => d.id === req.params.id)
    if (!dataset) {
      return res.status(404).json({ error: '数据集不存在' })
    }
    const enriched = computeAdvancedAnalysis(dataset)
    res.json(enriched)
  } catch (error) {
    console.error('获取数据集失败:', error)
    res.status(500).json({ error: '获取数据集失败' })
  }
})

app.post('/api/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '没有上传文件' })
    }

    const decodedOriginalName = Buffer.from(req.file.originalname, 'latin1').toString('utf8')
    console.log('上传的文件名:', decodedOriginalName)
    console.log('保存的文件名:', req.file.filename)

    let insurances = []
    let companies = {}
    let rawHtml = ''

    try {
      const result = parseExcelFile(req.file.path)
      insurances = result.insurances
      companies = result.companies
      rawHtml = result.rawHtml
    } catch (error) {
      console.error('解析文件失败:', error)
    }

    const fileName = decodedOriginalName.replace(/\.[^/.]+$/, '')
    const datasetId = Date.now().toString()

    const newDataset = {
      id: datasetId,
      name: fileName,
      fileName: req.file.filename,
      insurances,
      companies,
      rawHtml,
      createdAt: new Date().toISOString()
    }

    const datasets = getDatasets()
    datasets.push(newDataset)
    saveDatasets(datasets)

    res.json(newDataset)
  } catch (error) {
    console.error('上传文件失败:', error)
    res.status(500).json({ error: error.message || '上传文件失败' })
  }
})

app.delete('/api/datasets/:id', (req, res) => {
  try {
    const datasets = getDatasets()
    const index = datasets.findIndex(d => d.id === req.params.id)

    if (index === -1) {
      return res.status(404).json({ error: '数据集不存在' })
    }

    const dataset = datasets[index]
    if (dataset.fileName) {
      const filePath = path.join(uploadDir, dataset.fileName)
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
      }
    }

    datasets.splice(index, 1)
    saveDatasets(datasets)

    res.json({ success: true })
  } catch (error) {
    console.error('删除数据集失败:', error)
    res.status(500).json({ error: '删除数据集失败' })
  }
})

app.put('/api/datasets/:id', (req, res) => {
  try {
    const { name } = req.body
    if (!name) {
      return res.status(400).json({ error: '名称不能为空' })
    }

    const datasets = getDatasets()
    const dataset = datasets.find(d => d.id === req.params.id)

    if (!dataset) {
      return res.status(404).json({ error: '数据集不存在' })
    }

    dataset.name = name
    saveDatasets(datasets)

    res.json(dataset)
  } catch (error) {
    console.error('更新数据集失败:', error)
    res.status(500).json({ error: '更新数据集失败' })
  }
})

app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body

    if (!message) {
      return res.status(400).json({ error: '消息不能为空' })
    }

    console.log('收到聊天消息:', message)

    try {
      console.log('调用 FastGPT API:', FASTGPT_API_URL)

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 120000)

      const response = await fetch(FASTGPT_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${FASTGPT_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          chatId: Date.now().toString(),
          stream: false,
          detail: false,
          messages: [
            {
              role: 'user',
              content: message
            }
          ]
        }),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      console.log('FastGPT 响应状态:', response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('FastGPT API 错误:', response.status, errorText)
        return res.status(response.status).json({ error: `FastGPT API 错误: ${response.status}` })
      }

      const data = await response.json()
      console.log('FastGPT 响应:', JSON.stringify(data, null, 2))

      let result = ''
      if (data.choices && data.choices[0]?.message?.content) {
        result = data.choices[0].message.content
      } else if (data.message) {
        result = data.message
      } else {
        result = '抱歉，我没有理解您的问题，请换一种方式提问。'
      }

      res.send(result)
    } catch (apiError) {
      if (apiError.name === 'AbortError') {
        console.error('FastGPT API 调用超时')
        res.status(500).json({ error: 'FastGPT API 调用超时，请稍后重试' })
      } else {
        console.error('FastGPT API 调用失败:', apiError.message, apiError.cause)
        res.status(500).json({ error: `FastGPT API 错误: ${apiError.message}` })
      }
    }
  } catch (error) {
    console.error('处理聊天请求失败:', error)
    res.status(500).json({ error: '服务器内部错误' })
  }
})

app.listen(PORT, () => {
  ensureDirectories()
  console.log(`服务器运行在 http://localhost:${PORT}`)
  console.log(`上传目录: ${uploadDir}`)
  console.log(`数据目录: ${dataDir}`)
})

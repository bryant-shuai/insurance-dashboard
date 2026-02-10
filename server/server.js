import express from 'express'
import cors from 'cors'
import multer from 'multer'
import { createRequire } from 'module'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const require = createRequire(import.meta.url)
const XLSX = require('xlsx')

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
    // 解码原始文件名，处理中文乱码问题
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
    
    // 检查文件扩展名
    const ext = path.extname(filePath).toLowerCase()
    
    if (ext === '.csv') {
      // 对于CSV文件，使用fs读取并指定UTF-8编码
      const content = fs.readFileSync(filePath, 'utf8')
      
      // 手动解析CSV
      const lines = content.split('\n').filter(line => line.trim())
      json = lines.map(line => {
        // 简单的CSV解析，处理逗号分隔
        return line.split(',').map(cell => cell.trim())
      })
      
      console.log('CSV文件解析完成，行数:', json.length)
      
      // 生成简单的HTML表格
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
      // 对于Excel文件，使用XLSX库
      const workbook = XLSX.readFile(filePath)
      const sheet = workbook.Sheets[workbook.SheetNames[0]]
      json = XLSX.utils.sheet_to_json(sheet, { header: 1 })
      
      // 生成HTML表格
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
      // 只要行中包含"本期累计"或"同比增长"，就认为是指标行
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
    let tempIns = ''
    const maxCol = Math.max(headers.length, metrics.length)
    const insurances = []
    const companies = {}

    // 重新构建列映射，处理CSV格式
    // CSV格式：地区,公司名称,险种1,险种2,...
    // 指标行：本期累计,同比增长,本期累计,同比增长,...
    // 每个险种对应两列：本期累计和同比增长
    
    // 从表头行提取险种列表（从第2列开始）
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

    // 从指标行提取每个险种的列索引
    // 指标行的结构：本期累计,同比增长,本期累计,同比增长,...
    // 每个险种对应两列：本期累计和同比增长
    // 使用险种索引来跟踪当前处理的险种
    let insIndex = 0
    
    // 遍历指标行，从第2列开始（跳过地区和公司名称列）
    for (let i = 2; i < metrics.length; i++) {
      const metric = metrics[i]
      
      if (metric && insIndex < insurances.length) {
        const insName = insurances[insIndex]
        const metricStr = metric.toString().trim()
        
        if (metricStr.includes('本期累计')) {
          colMap[insName].p = i
        } else if (metricStr.includes('同比增长')) {
          colMap[insName].g = i
          insIndex++ // 只有处理完同比增长后才移动到下一个险种
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

app.get('/api/datasets/:id', (req, res) => {
  try {
    const datasets = getDatasets()
    const dataset = datasets.find(d => d.id === req.params.id)
    if (!dataset) {
      return res.status(404).json({ error: '数据集不存在' })
    }
    res.json(dataset)
  } catch (error) {
    res.status(500).json({ error: '获取数据集失败' })
  }
})

// 获取分析数据（与生产一致）
app.get('/api/analysis/:id', (req, res) => {
  try {
    const datasets = getDatasets()
    const dataset = datasets.find(d => d.id === req.params.id)
    
    if (!dataset) {
      return res.status(404).json({ error: '数据集不存在' })
    }

    const companies = dataset.companies || {}
    const primaryInsurance = '非车险'

    // 提取非车险数据
    const nonAutoData = {}
    Object.entries(companies).forEach(([key, value]) => {
      if (value[primaryInsurance]) {
        nonAutoData[key] = value[primaryInsurance]
      }
    })

    // 计算统计指标
    let totalPremium = 0
    let totalGrowth = 0
    let count = 0
    
    Object.values(nonAutoData).forEach(item => {
      totalPremium += item.premium || 0
      totalGrowth += item.growth || 0
      count++
    })
    
    const avgGrowth = count > 0 ? (totalGrowth / count).toFixed(2) : 0
    const avgShare = 100 / count

    // 构造BCG矩阵数据 — 使用平均增速和平均份额作为阈值
    const bcgMatrix = Object.entries(nonAutoData).map(([key, value]) => {
      const premium = value.premium || 0
      const growth = value.growth || 0
      const share = totalPremium > 0 ? (premium / totalPremium) * 100 : 0

      let quadrant = '瘦狗'
      if (growth >= avgGrowth && share >= avgShare) {
        quadrant = '明星'
      } else if (growth < avgGrowth && share >= avgShare) {
        quadrant = '奶牛'
      } else if (growth >= avgGrowth && share < avgShare) {
        quadrant = '野猫'
      }
      
      return {
        name: key.split('-').pop() || key,
        x: parseFloat(share.toFixed(2)),
        y: parseFloat(growth.toFixed(2)),
        z: premium,
        quadrant,
        premium,
        growth,
        share: parseFloat(share.toFixed(2))
      }
    })

    // CR4
    const topCompanies = [...bcgMatrix]
      .sort((a, b) => b.z - a.z)
      .slice(0, 4)
    const cr4 = Math.round(topCompanies.reduce((sum, item) => sum + item.share, 0))

    const analysisData = {
      id: dataset.id,
      name: dataset.name,
      market_insight: {
        '非车险': {
          total_premium: totalPremium,
          avg_growth: parseFloat(avgGrowth),
          market_type: cr4 > 60 ? '高度集中' : cr4 > 30 ? '中度集中' : '分散竞争',
          cr4: cr4,
          top_companies: topCompanies.map(item => ({
            company: item.name,
            premium: item.z,
            growth: item.y,
            share: item.share
          }))
        }
      },
      bcg_matrix: bcgMatrix,
      summary: {
        total_premium: totalPremium,
        avg_growth: parseFloat(avgGrowth),
        company_count: count,
        market_type: cr4 > 60 ? '高度集中' : cr4 > 30 ? '中度集中' : '分散竞争',
        cr4: cr4
      },
      createdAt: dataset.createdAt
    }

    res.json(analysisData)
  } catch (error) {
    console.error('获取分析数据失败:', error)
    res.status(500).json({ error: '获取分析数据失败' })
  }
})

app.post('/api/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '没有上传文件' })
    }

    // 解码原始文件名，处理中文乱码问题
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

app.listen(PORT, () => {
  ensureDirectories()
  console.log(`🚀 服务器运行在 http://localhost:${PORT}`)
  console.log(`📁 上传目录: ${uploadDir}`)
  console.log(`📊 数据目录: ${dataDir}`)
})

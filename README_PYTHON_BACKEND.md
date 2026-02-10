# 保险驾驶舱 - Python后端

## 项目结构

```
insurance-dashboard/
├── server/                  # Python后端服务
│   ├── app.py              # Flask主应用
│   ├── excel_parser.py     # Excel/CSV文件解析器
│   ├── requirements.txt    # Python依赖包
│   ├── data/               # 数据存储目录
│   │   └── datasets.json   # 数据集元数据
│   └── uploads/            # 上传文件存储目录
├── src/                    # 前端源码
├── dist/                   # 构建产物
└── vite.config.js         # Vite配置
```

## 后端API接口

### 数据集管理
- `GET /api/datasets` - 获取所有数据集列表
- `GET /api/datasets/<id>` - 获取特定数据集详情
- `POST /api/upload` - 上传Excel/CSV文件
- `PUT /api/datasets/<id>` - 更新数据集名称
- `DELETE /api/datasets/<id>` - 删除数据集

### 分析接口
- `GET /api/analysis/<id>` - 获取数据分析结果（BCG矩阵、市场洞察等）

## 部署说明

### 本地开发

1. 安装Python依赖：
```bash
cd server
pip install -r requirements.txt
```

2. 启动后端服务：
```bash
python app.py
```

3. 启动前端开发服务：
```bash
npm run dev
```

### 生产部署

使用Gunicorn部署：
```bash
cd server
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:3001 app:app
```

## 技术栈

- **后端**: Python 3.11+, Flask 3.0
- **数据处理**: pandas 2.1, openpyxl 3.1
- **前端**: Vue 3, Vite 5
- **通信**: RESTful API, CORS支持

## 功能特性

- ✅ Excel/CSV文件上传解析
- ✅ 自动识别表头和数据结构
- ✅ BCG矩阵分析
- ✅ 市场集中度计算(CR4)
- ✅ 四象限分类（明星、奶牛、野猫、瘦狗）
- ✅ 数据集管理（增删改查）
- ✅ 中文文件名支持
- ✅ 完全兼容原有前端界面

## 注意事项

1. 后端服务默认运行在端口3001
2. 前端通过Vite代理访问 `/api` 路径
3. 上传文件大小限制：10MB
4. 支持文件格式：.xlsx, .xls, .csv
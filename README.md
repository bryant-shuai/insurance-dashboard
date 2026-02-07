# 保险驾驶舱 V6.7 (Vue 3 版本)

这是将原始 HTML 文件转换为 Vue 3 项目的版本。

## 项目结构

```
insurance-dashboard/
├── src/
│   ├── components/          # Vue 组件
│   │   ├── AnalysisPage.vue    # 深度分析页面
│   │   ├── BarChart.vue        # 柱状图组件
│   │   ├── ControlPanel.vue    # 控制面板组件
│   │   ├── OverviewPage.vue    # 全景概览页面
│   │   ├── RawDataPage.vue     # 原始数据页面
│   │   ├── TopNavbar.vue       # 顶部导航栏
│   │   └── UploadOverlay.vue   # 上传遮罩层
│   ├── stores/
│   │   └── dataStore.js     # 状态管理（使用 Vue 3 响应式 API）
│   ├── utils/
│   │   └── excelParser.js   # Excel 文件解析工具
│   ├── App.vue              # 主应用组件
│   ├── main.js              # 应用入口
│   └── style.css            # 全局样式
├── index.html
├── package.json
└── vite.config.js
```

## 技术栈

- **Vue 3** - 使用 Composition API
- **Vite** - 快速的构建工具
- **Chart.js** - 图表库
- **chartjs-plugin-datalabels** - Chart.js 数据标签插件
- **xlsx** - Excel 文件解析库

## 安装与运行

```bash
# 安装依赖
npm install

# 开发模式运行
npm run dev

# 构建生产版本
npm run build

# 预览构建结果
npm run preview
```

## 功能特性

1. **全景概览** - 显示保费规模 TOP10 和增长速度 TOP10 的柱状图
2. **深度分析** - 查看单个公司的分险种数据透视
3. **原始数据** - 显示上传的 Excel 原始表格数据
4. **关注公司** - 可选择关注特定公司，强制入榜并高亮显示
5. **险种筛选** - 支持按不同险种筛选数据

## 数据格式要求

上传的 Excel 文件应包含：
- 表头行包含 "非车险" 关键字
- 指标行包含 "本期累计" 和 "同比增长" 关键字
- 数据行包含地区和公司名称

## 组件说明

| 组件 | 说明 |
|------|------|
| UploadOverlay | 文件上传遮罩层，用于上传 Excel 数据文件 |
| TopNavbar | 顶部导航栏，包含标签页切换和数据切换按钮 |
| ControlPanel | 控制面板，包含险种筛选和关注公司选择 |
| OverviewPage | 全景概览页，包含两个柱状图 |
| AnalysisPage | 深度分析页，包含公司列表和详情图表 |
| RawDataPage | 原始数据页，显示 Excel 表格 |
| BarChart | 可复用的柱状图组件 |

## 状态管理

使用 Vue 3 的 reactive 和 ref 进行状态管理：

- state - 存储解析后的保险数据
- focusCompanies - 关注的公司列表
- currentIns - 当前选中的险种
- currentTab - 当前标签页索引

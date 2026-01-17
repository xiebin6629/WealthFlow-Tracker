<div align="center">

# 💰 WealthFlow Tracker

**一款现代化的个人财富管理与 FIRE（财务自由提前退休）规划工具**

[![React](https://img.shields.io/badge/React-19.2.0-61DAFB?logo=react&logoColor=white)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.2-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-CDN-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

[功能特性](#-功能特性) • [快速开始](#-快速开始) • [技术栈](#-技术栈) • [项目结构](#-项目结构) • [使用指南](#-使用指南)

</div>

---

## 📖 简介

**WealthFlow Tracker** 是一款专为投资者设计的个人财富管理应用，帮助您追踪投资组合、规划财务自由目标，并利用 AI 获取智能投资分析。支持多种资产类别（ETF、股票、加密货币、公积金等），提供实时价格更新、投资组合再平衡建议以及 FIRE 目标预测。

## ✨ 功能特性

### 📊 投资组合管理
- **多资产类别支持** - ETF、股票、加密货币、现金储蓄、货币市场基金、公积金（EPF）等
- **多币种支持** - 支持 USD 和 MYR，自动汇率转换
- **实时价格更新** - 通过 Gemini AI 获取最新资产价格
- **盈亏追踪** - 自动计算每项资产的成本、市值和收益率

### 🎯 FIRE 财务自由规划
- **目标进度追踪** - 实时显示距离财务自由目标的进度
- **投资预测模型** - 基于年龄、月投资额、预期收益率等参数预测财务自由时间
- **EPF 公积金整合** - 将公积金纳入整体退休规划
- **安全提款率计算** - 支持自定义提款率（4% 规则等）

### ⚖️ 智能再平衡
- **目标配置** - 为每项资产设定理想配置比例
- **再平衡建议** - 自动生成买入/卖出建议以达到目标配置
- **偏离度分析** - 直观显示当前配置与目标的偏差

### 🤖 AI 智能分析
- **Gemini AI 集成** - 利用 Google Gemini 获取实时市场数据
- **投资组合分析** - AI 驱动的投资建议和市场洞察
- **数据来源追踪** - 显示 AI 分析的信息来源

### ☁️ 数据同步与备份
- **🔥 Firebase 实时同步（新）** - 多设备实时数据同步，手机电脑无缝切换
- **Google Drive 云备份** - 安全保存数据到您的 Google Drive
- **本地数据导出/导入** - JSON 格式备份与恢复
- **本地存储** - 数据自动保存到浏览器本地存储

### 🌐 无服务器部署支持
- **GitHub Pages 部署** - 免费托管静态网站
- **Cloudflare Workers 代理** - 安全调用 AI API，不暴露密钥
- **多来源股价数据** - 支持 Gemini AI、Yahoo Finance、CoinGecko 等

### 📈 年度记录追踪
- **历史投资记录** - 记录每年的投资、储蓄和公积金金额
- **市场基准对比** - 追踪 VOO 等基准的年度回报
- **趋势分析** - 可视化展示财富增长历程

## 🚀 快速开始

### 环境要求

- **Node.js** 18.0 或更高版本
- **npm** 或 **yarn** 包管理器
- **Gemini API Key** - 用于 AI 功能（可选）

### 安装步骤

1. **克隆仓库**
   ```bash
   git clone https://github.com/your-username/wealthflow-tracker.git
   cd wealthflow-tracker
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **配置 API 密钥**
   
   在 `.env.local` 文件中设置您的 Gemini API 密钥：
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

4. **启动开发服务器**
   ```bash
   npm run dev
   ```

5. **访问应用**
   
   打开浏览器访问 `http://localhost:5173`

### 构建生产版本

```bash
npm run build
npm run preview
```

## 🛠️ 技术栈

| 技术 | 用途 |
|------|------|
| **React 19** | 前端 UI 框架 |
| **TypeScript** | 类型安全的 JavaScript |
| **Vite** | 下一代前端构建工具 |
| **TailwindCSS** | 实用优先的 CSS 框架 |
| **Recharts** | React 图表库 |
| **Lucide React** | 现代图标库 |
| **Firebase** | 实时数据库 + 身份认证 |
| **Google Gemini** | AI 智能分析服务 |
| **Cloudflare Workers** | API 代理服务 |
| **GitHub Pages** | 静态网站托管 |

## 📁 项目结构

```
WealthFlow-Tracker/
├── components/              # React 组件
│   ├── AssetTable.tsx      # 资产列表与管理
│   ├── Dashboard.tsx       # 仪表盘概览
│   ├── FireProjection.tsx  # FIRE 预测计算器
│   ├── RebalanceView.tsx   # 再平衡建议视图
│   └── YearlyRecords.tsx   # 年度记录管理
├── services/               # 外部服务集成
│   ├── driveService.ts     # Google Drive 同步
│   ├── firebaseService.ts  # Firebase 实时数据库
│   ├── priceService.ts     # 股价获取服务
│   └── geminiService.ts    # Gemini AI 服务
├── cloudflare-worker/      # Cloudflare Worker 代码
│   ├── src/index.ts        # Worker 入口
│   └── wrangler.toml       # Wrangler 配置
├── .github/workflows/      # GitHub Actions
│   └── deploy.yml          # 自动部署工作流
├── App.tsx                 # 主应用组件
├── types.ts                # TypeScript 类型定义
├── constants.ts            # 初始配置与常量
├── index.html              # HTML 入口
├── index.tsx               # React 入口
├── index.css               # 全局样式
├── vite.config.ts          # Vite 配置
└── package.json            # 项目依赖
```

## 📚 使用指南

### 添加资产

1. 导航到 **资产** 标签页
2. 点击 **添加资产** 按钮
3. 填写资产信息：代码、名称、类别、币种、数量、平均成本等
4. 设置目标配置比例（可选）
5. 保存更改

### 设置 FIRE 目标

1. 进入 **设置** 或 **FIRE 预测** 页面
2. 配置财务自由目标金额
3. 设置当前年龄、月投资额、预期收益率
4. 查看预测的财务自由达成时间

### 获取 AI 分析

1. 确保已配置 Gemini API 密钥
2. 点击 **刷新价格** 更新所有资产的当前价格
3. 点击 **AI 分析** 获取投资组合的智能分析报告

### 云同步数据

1. 点击 **登录 Google** 连接您的 Google 账户
2. 使用 **保存到云端** 备份数据
3. 使用 **从云端加载** 恢复数据

## 🔒 隐私与安全

- 所有数据默认存储在您的浏览器本地
- 云同步数据仅保存到您自己的 Google Drive
- 支持隐私模式隐藏敏感数值
- API 密钥仅在本地使用，不会上传到任何服务器

## 🚀 部署到 GitHub Pages

详细的部署指南请参阅 **[DEPLOYMENT.md](DEPLOYMENT.md)**，包括：

1. 配置 Firebase 实现多设备数据同步
2. 部署 Cloudflare Worker 获取实时股价
3. 部署应用到 GitHub Pages

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

---

<div align="center">

**用 ❤️ 构建，助您实现财务自由**

</div>

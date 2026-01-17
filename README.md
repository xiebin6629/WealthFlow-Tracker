<div align="center">

# 💰 WealthFlow Tracker

**一款现代化的个人财富管理与 FIRE（财务自由提前退休）规划工具**

[![React](https://img.shields.io/badge/React-19.2.0-61DAFB?logo=react&logoColor=white)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.2-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Firebase](https://img.shields.io/badge/Firebase-Firestore-FFCA28?logo=firebase&logoColor=black)](https://firebase.google.com/)

[在线演示](https://xiebin6629.github.io/WealthFlow-Tracker/) • [功能特性](#-功能特性) • [快速开始](#-快速开始) • [使用指南](#-使用指南)

</div>

---

## 📖 简介

**WealthFlow Tracker** 是一款专为投资者设计的个人财富管理应用，帮助您追踪投资组合、规划财务自由目标，并利用 AI 获取智能投资分析。支持多种资产类别（ETF、股票、加密货币、公积金等），提供实时价格更新、投资组合再平衡建议以及 FIRE 目标预测。

### 🌟 核心亮点

- 🔥 **Firebase 云同步** - 手机电脑数据实时同步
- 🤖 **Gemini AI** - 一键获取实时股价和投资分析
- 📊 **FIRE 规划** - 预测财务自由达成时间
- 🆓 **完全免费** - 无需后端服务器，零成本部署

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
- **用户自备 API Key** - 免费使用，每个用户独立配额

### ☁️ 数据同步与备份
- **🔥 Firebase 实时同步** - 多设备实时数据同步，手机电脑无缝切换
- **本地数据导出/导入** - JSON 格式备份与恢复
- **自动本地保存** - 数据自动保存到浏览器本地存储

### 📈 年度记录追踪
- **历史投资记录** - 记录每年的投资、储蓄和公积金金额
- **市场基准对比** - 追踪 VOO 等基准的年度回报
- **趋势分析** - 可视化展示财富增长历程

## 🚀 快速开始

### 在线使用（推荐）

直接访问：**https://xiebin6629.github.io/WealthFlow-Tracker/**

### 本地开发

```bash
# 克隆仓库
git clone https://github.com/xiebin6629/WealthFlow-Tracker.git
cd WealthFlow-Tracker

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

访问 `http://localhost:3000`

## 📚 使用指南

### 第一步：获取 Gemini API Key（免费）

1. 访问 **[Google AI Studio](https://aistudio.google.com/app/apikey)**
2. 使用 Google 账号登录
3. 点击 **"Create API Key"**
4. 复制生成的 Key

### 第二步：配置应用

1. 打开应用，在左侧边栏找到 **"Global Settings"**
2. 在 **"Gemini API Key"** 输入框粘贴您的 Key
3. 设置财务自由目标金额等参数

### 第三步：启用云同步（可选）

1. 在 **"Firebase 云同步"** 区域
2. 点击 **"使用 Google 登录"**
3. 授权完成后，数据将自动同步到云端

### 第四步：开始使用

- 点击 **"+ Add Asset"** 添加您的资产
- 点击 **"Refresh Prices"** 获取实时价格
- 点击 **"AI Analyst"** 获取投资分析

## 🛠️ 技术栈

| 技术 | 用途 |
|------|------|
| **React 19** | 前端 UI 框架 |
| **TypeScript** | 类型安全的 JavaScript |
| **Vite** | 下一代前端构建工具 |
| **TailwindCSS** | 实用优先的 CSS 框架 |
| **Recharts** | React 图表库 |
| **Firebase** | 实时数据库 + 身份认证 |
| **Google Gemini** | AI 智能分析服务 |
| **GitHub Pages** | 静态网站托管 |

## 📁 项目结构

```
WealthFlow-Tracker/
├── components/              # React 组件
│   ├── AssetTable.tsx      # 资产列表与管理
│   ├── Dashboard.tsx       # 仪表盘概览
│   ├── FireProjection.tsx  # FIRE 预测计算器
│   ├── FirebaseSyncPanel.tsx # Firebase 同步面板
│   └── YearlyRecords.tsx   # 年度记录管理
├── services/               # 外部服务集成
│   ├── firebaseService.ts  # Firebase 实时数据库
│   └── geminiService.ts    # Gemini AI 服务
├── .github/workflows/      # GitHub Actions
│   └── deploy.yml          # 自动部署工作流
├── App.tsx                 # 主应用组件
├── firebase.config.ts      # Firebase 配置
├── types.ts                # TypeScript 类型定义
└── package.json            # 项目依赖
```

## 🔒 隐私与安全

- ✅ 所有数据默认存储在您的浏览器本地
- ✅ 云同步数据仅保存到您自己的 Firebase 账户
- ✅ API Key 存储在您自己的浏览器/账户中，不会上传到任何第三方
- ✅ 支持隐私模式隐藏敏感数值
- ✅ 开源代码，完全透明

## 💰 费用说明

| 服务 | 费用 |
|------|------|
| **GitHub Pages** | 🆓 免费 |
| **Firebase Firestore** | 🆓 免费（每天 20K 读写） |
| **Gemini API** | 🆓 免费（每天 1500 次请求） |

**结论：个人使用完全免费！**

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

---

<div align="center">

**用 ❤️ 构建，助您实现财务自由**

[⭐ Star this repo](https://github.com/xiebin6629/WealthFlow-Tracker) if you find it useful!

</div>

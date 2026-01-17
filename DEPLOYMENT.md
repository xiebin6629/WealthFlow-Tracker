# 🚀 WealthFlow Tracker 部署指南

本指南将帮助您将 WealthFlow Tracker 部署到 GitHub Pages，并配置云端数据同步和实时股价获取功能。

## 📋 目录

1. [架构概览](#架构概览)
2. [第一步：配置 Firebase（云数据库）](#第一步配置-firebase云数据库)
3. [第二步：部署 Cloudflare Worker（股价 API）](#第二步部署-cloudflare-worker股价-api)
4. [第三步：部署到 GitHub Pages](#第三步部署到-github-pages)
5. [第四步：配置应用](#第四步配置应用)
6. [故障排除](#故障排除)

---

## 架构概览

```
┌─────────────────────────────────────────────────────────────┐
│                     您的设备（手机/电脑）                      │
│                           ↓                                  │
│              GitHub Pages (静态网页托管)                      │
│                    ↙           ↘                            │
│     Firebase Firestore      Cloudflare Worker               │
│      (实时数据同步)           (股价 API 代理)                 │
│           ↓                       ↓                         │
│    Google 账号登录            Gemini AI API                 │
└─────────────────────────────────────────────────────────────┘
```

**核心优势：**
- ✅ 全部免费（Firebase 和 Cloudflare 都有充足的免费额度）
- ✅ 多设备实时同步
- ✅ 安全（API Key 存储在 Cloudflare，不暴露给前端）

---

## 第一步：配置 Firebase（云数据库）

### 1.1 创建 Firebase 项目

1. 访问 [Firebase Console](https://console.firebase.google.com/)
2. 点击 **"添加项目"** 或 **"Create a project"**
3. 输入项目名称，如 `wealthflow-tracker`
4. 可以禁用 Google Analytics（可选）
5. 点击 **"创建项目"**

### 1.2 启用 Authentication（身份验证）

1. 在左侧菜单选择 **"Authentication"**
2. 点击 **"开始"**
3. 在 **"Sign-in method"** 标签页中
4. 启用 **"Google"** 登录提供商
5. 填写项目公开名称和支持电子邮件
6. 点击 **"保存"**

### 1.3 创建 Firestore 数据库

1. 在左侧菜单选择 **"Firestore Database"**
2. 点击 **"创建数据库"**
3. 选择 **"生产模式"**（之后配置规则）
4. 选择一个靠近您的区域（如 `asia-southeast1` 或 `asia-east1`）
5. 点击 **"完成"**

### 1.4 配置安全规则

1. 在 Firestore 页面点击 **"规则"** 标签
2. 将规则替换为：

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 用户只能访问自己的数据
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

3. 点击 **"发布"**

### 1.5 获取 Firebase 配置

1. 点击左上角的 **齿轮图标** → **"项目设置"**
2. 滚动到 **"您的应用"** 部分
3. 点击 **"Web"** 图标（</> 符号）
4. 输入应用昵称（如 `WealthFlow Web`）
5. 不需要勾选 Firebase Hosting
6. 点击 **"注册应用"**
7. 复制显示的配置代码：

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

**保存这个配置！** 之后需要在应用设置中填入。

### 1.6 配置 OAuth 授权域名

1. 在 Firebase Console 中，进入 **Authentication** → **Settings**
2. 点击 **"Authorized domains"** 标签
3. 添加您的 GitHub Pages 域名：
   - `your-username.github.io`
   
---

## 第二步：部署 Cloudflare Worker（股价 API）

### 2.1 创建 Cloudflare 账户

1. 访问 [Cloudflare Dashboard](https://dash.cloudflare.com/sign-up)
2. 注册并登录

### 2.2 安装 Wrangler CLI

打开终端，运行：

```bash
npm install -g wrangler
```

### 2.3 登录 Cloudflare

```bash
wrangler login
```

这会打开浏览器让您授权。

### 2.4 进入 Worker 目录并安装依赖

```bash
cd cloudflare-worker
npm install
```

### 2.5 设置 Gemini API Key

运行以下命令并按提示输入您的 API Key：

```bash
wrangler secret put GEMINI_API_KEY
```

> 💡 获取 Gemini API Key: 访问 [Google AI Studio](https://aistudio.google.com/app/apikey)

### 2.6 部署 Worker

```bash
wrangler deploy
```

部署成功后，会显示 Worker URL，格式类似：
```
https://wealthflow-price-api.your-subdomain.workers.dev
```

**保存这个 URL！** 之后需要在应用设置中填入。

### 2.7 测试 Worker

```bash
curl https://wealthflow-price-api.your-subdomain.workers.dev/api/health
```

应该返回：
```json
{"status":"ok","timestamp":"2024-01-17T..."}
```

---

## 第三步：部署到 GitHub Pages

### 3.1 修改 Vite 配置

编辑 `vite.config.ts`，添加 base 路径：

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // 替换为您的仓库名
  base: '/WealthFlow-Tracker/',
  // ... 其他配置
});
```

### 3.2 创建 GitHub Actions 工作流

创建文件 `.github/workflows/deploy.yml`：

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: ['main']
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: 'pages'
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
      
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: ./dist

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

### 3.3 启用 GitHub Pages

1. 将代码推送到 GitHub
2. 访问仓库 → **Settings** → **Pages**
3. 在 **"Build and deployment"** 下选择 **"GitHub Actions"**
4. 等待 Actions 运行完成

您的应用将在 `https://your-username.github.io/WealthFlow-Tracker/` 上线。

---

## 第四步：配置应用

在部署好的应用中，进入 **设置** 页面，配置以下内容：

### 4.1 Firebase 配置

在设置中找到 "Firebase Configuration" 部分，填入：

```json
{
  "apiKey": "您的 Firebase API Key",
  "authDomain": "your-project.firebaseapp.com",
  "projectId": "your-project",
  "storageBucket": "your-project.appspot.com",
  "messagingSenderId": "123456789",
  "appId": "1:123456789:web:abc123"
}
```

### 4.2 Worker URL 配置

在设置中找到 "Price API Worker URL" 部分，填入：

```
https://wealthflow-price-api.your-subdomain.workers.dev
```

### 4.3 登录并同步

1. 点击 **"使用 Google 登录"**
2. 授权应用访问
3. 您的数据将自动同步到云端

现在您可以在手机和电脑上使用同一个 Google 账号登录，数据将实时同步！

---

## 故障排除

### ❌ Firebase 登录失败

**问题**: 弹出窗口被阻止或域名未授权

**解决方案**:
1. 允许浏览器弹出窗口
2. 确保在 Firebase Console → Authentication → Settings → Authorized domains 中添加了您的域名

### ❌ Worker 返回错误

**问题**: 获取股价时出现错误

**解决方案**:
1. 检查 Gemini API Key 是否正确设置：`wrangler secret list`
2. 查看 Worker 日志：`wrangler tail`
3. 确保 API Key 有足够配额

### ❌ CORS 错误

**问题**: 浏览器控制台显示 CORS 错误

**解决方案**:
1. 确保 Worker 代码中的 CORS headers 正确
2. 重新部署 Worker

### ❌ 数据未同步

**问题**: 不同设备数据不一致

**解决方案**:
1. 确保两台设备都登录了同一个 Google 账号
2. 检查 Firestore 规则是否正确
3. 刷新页面或手动点击同步

---

## 📊 费用估算

| 服务 | 免费额度 | 预估使用量 | 
|------|----------|------------|
| **Firebase Firestore** | 20K 读/天, 20K 写/天 | 每天约 50-100 次读写 |
| **Firebase Auth** | 无限 | 每次登录 |
| **Cloudflare Workers** | 10万 请求/天 | 每天约 10-50 次 |
| **GitHub Pages** | 无限 | 静态托管 |

**结论**: 个人使用完全在免费额度内，无需付费。

---

## 🔒 安全说明

- ✅ Gemini API Key 安全存储在 Cloudflare Workers，不暴露给前端
- ✅ Firebase 规则限制用户只能访问自己的数据
- ✅ 所有通信使用 HTTPS 加密
- ✅ Google OAuth 2.0 安全登录

---

如有问题，请在 GitHub Issues 中提出！

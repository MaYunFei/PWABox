# 📦 PWABox - 微应用百宝箱 (Zero-Build PWA Hub)

[![GitHub Repo](https://img.shields.io/badge/GitHub-MaYunFei%2FPWABox-black?logo=github)](https://github.com/MaYunFei/PWABox)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Zero Build](https://img.shields.io/badge/Build-Zero--Build-emerald)](#)
[![PWA Ready](https://img.shields.io/badge/PWA-Installable-indigo)](#)

> **为普通人与 AI 量身打造的“零构建”微应用工厂与百宝箱。**  
> 🔗 开源主页：[https://github.com/MaYunFei/PWABox](https://github.com/MaYunFei/PWABox)  
> 无需安装 Node.js，无需编译打包，不写一条终端命令。利用 AI，一句话就能生成一个独立可安装的桌面/手机 PWA 小工具！

---

## ✨ 核心特性

- 🚀 **100% 免编译 (Zero-Build)**：纯原生 HTML + CSS + JS，拉下来双击就能跑，浏览器打开即用。
- 📱 **独立 PWA 离线安装**：
  - 访问主页，可将整个“百宝箱”安装为 App。
  - 进入任何一个小工具，**都能单独“添加到主屏幕”**，成为手机/电脑上独立的全屏 App，互不干扰！
- 💻 **双模自适应与 4K 超宽大屏**：遵循《Refactoring UI》与 Apple HIG 规范，手机端全屏沉浸零滚动条，桌面端强制双栏/仪表盘并消除视觉下坠。
- 🎨 **工业级设计审美**：基于 Google Labs《DESIGN.md》标准与 Refactoring UI，8pt 间距网格、同心圆角嵌套、单重音配色，拒绝土味界面。
- ☁️ **Cloudflare 极速托管**：Git 仓库绑定 Cloudflare Pages，0 配置全球秒级分发。
- 🤖 **AI 行为宪法 (`AGENTS.md`)**：没有隐藏的点文件，AI 打开项目即可严格遵守设计与架构规范。

---

## 🧭 目录结构一览

```text
PWABox/
├── AGENTS.md                  # 🌟 核心宪法：约束 AI 免编译、独立子 PWA 与设计规范
├── README.md                  # 本说明文档
├── index.html                 # 导航大厅（微应用卡片展示、分类检索、深浅色模式）
├── 404.html                   # 智能容错自愈页（访问错误路径时 3 秒自动回跳首页）
├── manifest.json              # 大厅 PWA 清单
├── sw.js                      # 离线 Service Worker 缓存脚本
├── icon.svg                   # 大厅精美无损矢量图标
│
└── apps/                      # 所有的独立微应用都在这里
    ├── dino/                  # 示例应用 1：Chrome 经典断网小恐龙跑酷
    │   ├── index.html
    │   ├── app.js
    │   ├── manifest.json
    │   └── icon.svg
    │
    ├── pomodoro/              # 示例应用 2：极简番茄钟
    │   ├── index.html
    │   ├── app.js
    │   ├── manifest.json      # 独立 scope，支持单独安装
    │   └── icon.svg
    │
    └── todo/                  # 示例应用 3：轻记待办
        ├── index.html
        ├── app.js
        ├── manifest.json
        └── icon.svg
```

---

## 🚀 本地极速测试（真机局域网秒开）

本项目贴心地内置了免安装依赖的局域网测试服务：

- **方式一（双击即用）**：
  - **Mac / Linux**：双击 `start.sh`
  - **Windows**：双击 `start.bat`
- **方式二（终端命令）**：
  ```bash
  python3 serve.py
  ```
- **方式三（直接让 AI 帮忙）**：
  - 对 AI 说：“帮我启动本地测试服务”，AI 会自动运行并打印访问地址。

启动后：
1. 电脑浏览器会自动弹出打开：`http://localhost:8000`
2. 终端会清晰打印出你的**手机局域网 IP**（如 `http://192.168.1.5:8000`），拿起连着同一 Wi-Fi 的手机直接访问，即可测试添加到手机桌面！

### 第 1 步：获取项目
在 GitHub 上点击绿色的 **「Use this template」**（使用此模板）新建你自己的仓库，或直接下载 ZIP 解压。

### 第 2 步：让 AI 为你打造新工具
在 Cursor、Claude Code、Windsurf、VSCode 或你习惯的任何 AI 编辑器中打开本文件夹，直接对 AI 说：

> 💬 **小白通用咒语：**  
> *“请阅读根目录的 `AGENTS.md`。我想做一个【在这里写你的需求，如：喝水打卡工具 / 极简记账本 / 汇率转换器】。请在 apps 目录下创建独立微应用，生成专属矢量图标与独立 manifest，并自动在 index.html 导航大厅中完成注册。”*

AI 将自动遵循规范，为你一步到位生成并挂载好新的小工具！

---

## ☁️ 部署到 Cloudflare Pages（小白一分钟教程）

你的小工具不需要服务器，通过 Cloudflare Pages 免费全球加速上线：

1. 登录 [Cloudflare 控制台](https://dash.cloudflare.com/)，在左侧菜单点击 **Workers 和 Pages** -> **Pages**。
2. 点击 **连接到 Git（Connect to Git）**，选中你的 `PWABox` 仓库。
3. 在设置页面的构建配置中：
   - **框架预设（Framework preset）**：选择 `None`
   - **构建命令（Build command）**：**保持完全留空**
   - **构建输出目录（Build output directory）**：填写 `/`（或者保持默认）
4. 点击 **保存并部署（Save and Deploy）**。
5. 🇨🇳 **针对中国大陆用户的极速访问建议**：
   - Cloudflare Pages 默认赠送的 `xxx.pages.dev` 在国内部分地区可能被干扰。
   - **强烈建议**：在 Cloudflare 项目设置里的 **「Custom domains（自定义域）」** 绑定一个你自己的域名（如 `tools.yourname.com`），无需备案即可在国内享受 CDN 直连秒开体验！

---

## ⌨️ 效率快捷键

- **`/` 或 `⌘K` (`Ctrl+K`)**：任何时候一键唤起搜索栏，快速定位应用。
- **`Esc`**：清空搜索框、失焦，或关闭弹窗。

---

## 🗑️ 自带的 3 个示例项目，请大胆删除！

PWABox 默认附带的「断网小恐龙」、「极简番茄钟」、「轻记待办」，**仅仅是作为功能体验与 AI 代码规范的脚手架参考**！

**我们强烈鼓励你打造 100% 属于自己的专属百宝箱**：
- 一旦 AI 为你做好了你真正需要的工具，完全可以对 AI 潇洒地说一句：
  > 💬 *“帮我把默认的 3 个示例应用（小恐龙、番茄钟、待办）全部删掉。”*
- AI 会立刻根据 `AGENTS.md` 规范，彻底清除对应目录并从大厅抹去登记，为你留出一个干净纯粹的极简工具箱。
- **关于应用排序**：完全由 AI 自动编排！最新创建的工具默认排在最前；需要调整顺序时，一句话告诉 AI（例如“把待办排在第一个”）即可，无需手动折腾拖拽。

---

## 📲 如何在手机上安装为独立 App？

1. 在手机自带浏览器（iPhone Safari / Android Chrome）打开你的网址。
2. **安装整个百宝箱**：在首页点击浏览器的“分享”按钮 -> 选择 **「添加到主屏幕」**。
3. **单独安装某个小工具**：点击进入小工具（例如番茄钟）-> 点击浏览器的“分享”按钮 -> 选择 **「添加到主屏幕」**。此时手机桌面上将出现该工具专属的图标和名字，点开就是独立全屏 App！

---

## 💡 开源作者后续如何维护？

1. **规则升级**：在实践中若发现 AI 偶尔犯小错误，只需在 `AGENTS.md` 补上一句约束。
2. **扩充官方应用**：闲暇时用 AI 搓出更多好看好玩的小应用丢进 `apps/` 目录，丰富默认百宝箱。
3. **数据安全**：所有工具均使用隔离的 `localStorage`，并在界面中提供了“本地数据导出与恢复”功能，即使换手机也不丢数据。

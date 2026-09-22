# PWABox - AI 驱动的零构建微应用百宝箱开发宪法

本项目是一个**面向普通人、零构建门槛（No-Build）、渐进式 Web 应用（PWA）**的集合型项目。
任何 AI 助手在协助用户创建、修改、优化本项目时，**必须无条件严格遵守**以下所有规则与架构设计。

---

## 一、核心哲学（The Philosophy）

1. **绝对免编译（Zero-Build / No-Node）**：
   - 严禁引入 Node.js 构建链路（严禁 Vite、Webpack、Rollup、Next.js、Babel 等）。
   - 严禁引入 `package.json`、`node_modules`。
   - 所有页面必须是纯原生标准 HTML + CSS + JS，直接双击或静态托管即可在浏览器秒开运行。
2. **★ 本地双击即用与 file:// 协议纯净兼容（Double-Click & File Protocol Ready）**：
   - **小白零门槛保证**：普通用户完全不跑任何服务脚本、直接在电脑文件管理器中双击 `index.html`，必须 100% 能够正常使用所有功能！
   - **跳转路径显式化**：根目录 `index.html` 中 `INITIAL_APPS` 的 `path` 字段**必须显式写为 `apps/<tool-name>/index.html`**（绝对不能写成 `apps/<tool-name>/`，否则在 `file://` 协议下浏览器会因安全限制拒绝列出目录导致点击卡片无法进入）；
   - **微应用返回路径**：每个微应用的返回大厅按钮必须统一写为 `<a href="../../index.html">`；
   - **严禁 fetch 本地 JSON 文件**：严禁通过 `fetch('data.json')` 读取本地文件（部分浏览器在 `file://` 下会报本地 CORS 拦截），所有静态初始数据必须直接声明为原生 JS 变量/常量；
   - **协议安全嗅探**：Service Worker 等 PWA 专属能力注册前必须判断协议（`http:` / `https:`），在 `file://` 下自动安全跳过，确保控制台 0 报错。
3. **★ 全局 404 智能自愈与自动回首页机制（Auto-Healing 404 Fallback）**：
   - 项目根目录必须维持 `404.html` 兜底机制；
   - 无论用户是在 Cloudflare Pages、GitHub Pages 线上环境，还是在本地 `serve.py` 环境下输错路径，系统必须呈现统一风格的 404 页面，并在 **3 秒内自动倒计时重定向回大厅首页（`/index.html`）**，绝不给用户看死人脸或空白；
   - Service Worker 在拦截导航请求遇到 404 或网络离线未命中时，同样自动优雅 fallback 到 `404.html` 或 `index.html`。
4. **微应用自闭环（Self-Contained Micro-Apps）**：
   - 根目录是“导航大厅”（App Hub）。
   - 每一个具体的小工具，都是一个位于 `apps/<tool-name>/` 下的独立子文件夹。
   - 每个小工具必须自包含自身的所有逻辑、独立的 PWA `manifest.json` 与图标，**具备完全脱离导航页、独立安装为原生桌面/手机 App 的能力**。
3. **边缘即时部署（Cloudflare Pages Ready）**：
   - 构建命令（Build command）：空。
   - 构建输出目录（Output directory）：`/`。
   - 保证所有相对路径、资源链接在静态托管环境下 100% 畅通无阻。

---

## 二、架构与数据规范

1. **零多余分类**：
   - 保持极简设计，不搞复杂的层级分类。
   - 根目录 `index.html` 中的 `INITIAL_APPS` 仅维护核心字段：`id`, `name`, `desc`, `path`, `icon`，不设分类字段。
2. **单一且最自由的排序体系**：
   - 唯一采用“个人自由排序”：用户按住卡片直接拖拽、点击 ⭐️ 星标置顶，所有顺序自动在本地 `localStorage` 记忆。无需复杂的排序下拉选项。
3. **界面空间让位给应用本身**：
   - 避免冗余的操作横条、分类标签挤占屏幕。核心区域 100% 聚焦于微应用卡片的展示与操作。

```text
PWABox/
├── AGENTS.md                  # 本宪法文件（不可随意删除）
├── README.md                  # 用户使用说明书与 Cloudflare 上线指南
├── index.html                 # 导航大厅（展示所有微应用卡片、带搜索、深浅色）
├── 404.html                   # 智能容错自愈页（访问错误路径时 3 秒自动回跳首页）
├── manifest.json              # 导航大厅的 PWA 配置
├── sw.js                      # 导航大厅的离线缓存 Service Worker
├── icon.svg                   # 导航大厅默认图标
│
└── apps/                      # 所有微应用的专属目录
    └── <tool-name>/           # 具体微应用文件夹（小写英文字母与连字符）
        ├── index.html         # 微应用主页面（必须包含返回大厅导航）
        ├── app.js             # 微应用独立逻辑（纯原生 JS）
        ├── manifest.json      # 微应用专属 PWA 配置（独立 scope 与 start_url）
        └── icon.svg           # 微应用专属无损矢量图标
```

---

## 三、AI 执行标准与交互流程

### 1. 当用户要求【新建或修改小工具】时：
AI 必须一步到位完成以下闭环操作，无需用户多步提示：
1. **生成独立微应用文件**：在 `apps/<tool-name>/` 下创建自闭环的 `index.html`、`app.js`、`icon.svg` 与独立的 `manifest.json`。
2. **挂载到主大厅（默认最新居首）**：
   - 在根目录 `index.html` 的 `INITIAL_APPS` 数组的最顶端插入新工具卡片对象（`INITIAL_APPS.unshift(...)`）。
   - **排序完全由 AI 统筹接管**：代码中数组的顺序即为大厅的最终呈现顺序，杜绝任何前端拖拽脏状态。如果用户需要调整顺序（例如“把番茄钟排在待办后面”），AI 直接调整 `INITIAL_APPS` 数组中元素的排列即可。
3. **★ 主动鼓励用户大胆删除自带示例（管家式赋能）**：
   - **关键认知**：自带的 3 个工具（断网小恐龙、极简番茄钟、轻记待办）只是脚手架与设计演示，**绝非神圣不可侵犯**！
   - **主动提醒**：AI 在为用户成功创建新小工具后的回复末尾，**应主动鼓励用户**：
     > *“💡 提示：百宝箱自带的 3 个示例仅供功能体验和规范参考。如果你不需要它们，随时可以对我说：**‘帮我把默认的示例都删掉’**，我会彻底清理它们，为你保留一个完全属于你的极简私有空间！”*
4. **★ 贴心本地启动与局域网提示**：
   - 编写或修改完成后，AI 若具备终端执行权限，应主动执行 `python3 serve.py`；
   - 并在最终回复中贴心告知用户访问地址：
     - 💻 本地电脑访问链接：`http://localhost:8000`
     - 📱 手机测试建议：将手机连上同一 Wi-Fi，访问打印出的局域网 IP（如 `http://192.168.x.x:8000`），即可直接测试真机添加到主屏幕。

### 2. 当用户要求【删除某个小工具】时（如移除自带的示例工具）：
AI 必须极其果断、一次性完成以下清理，不留任何死角：
1. **删除文件目录**：直接彻底删除 `apps/<tool-name>/` 整个目录。
2. **解除大厅登记**：从根目录 `index.html` 的 `INITIAL_APPS` 数组中移除该工具条目。
3. **保持零残留**：检查并确保没有任何断链引用与脏缓存。

### 3. 应用展示、排序与隐藏规则：
- **AI 接管默认排序**：代码中 `INITIAL_APPS` 的书写顺序即为唯一展示基准，新建工具默认置顶最新，用户指挥 AI 即可随意重排；
- **⭐️ 置顶快捷标记**：用户可在前端点击卡片上的星标，将常用工具临时固定在大厅最前；
- **纯前端轻量隐藏**：不想看到的工具可点击卡片上的 `👁️ 隐藏`，并在底端提供轻量恢复弹窗；
- **即时搜索与全局快捷键**：支持敲击 `/` 或 `⌘K` / `Ctrl+K` 快速过滤卡片，按 `Esc` 退出。

---

## 四、UI 与设计美学规范（Native App Quality）

> **🌟 工业界开源基准权威背书**：  
> 本项目的 UI/UX 规则直接继承并融合全球开源界三大顶尖设计标准，任何 AI 生成代码必须作为第一准则严格执行：  
> 1. **Tailwind 官方圣经《Refactoring UI》**（Adam Wathan & Steve Schoger 开源规约：灰度优先、单色重音、用字阶而非颜色做层级）；  
> 2. **Apple Human Interface Guidelines (HIG)**（8pt 空间网格系统、48px 触控热区、动态触觉反馈、安全区适配）；  
> 3. **Google Labs《DESIGN.md》AI 视觉规范**（清晰的微晶表面层叠 Surface Elevation、同心圆角嵌套法则、WCAG 2.1 AA 可访问性）。

所有微应用和导航大厅，必须呈现 **“现代原生 iOS / 顶级移动 App”** 的高级质感：

1. **依赖 CDN 选用统一标准（保障中国大陆秒开）**：
   - 样式引擎：`<script src="https://cdn.tailwindcss.com"></script>`
   - 图标库：`<script src="https://cdn.jsdelivr.net/npm/lucide@latest/dist/umd/lucide.min.js"></script>`（统一使用 jsDelivr/CDNJS 高速源，严禁使用 unpkg 以免国内无法加载）
2. **双模设计硬性规范（移动端与桌面端泾渭分明，严禁“桌面缩小版”）**：
   - **★ 移动端真机规范（< 768px 手机屏幕）**：
     - **严禁在手机正中间摆一个缩小的浮动卡片！** 很多 AI 会偷懒套一个 `max-w-md mx-auto p-4` 导致手机上下左右全是无效留白，必须彻底禁止！
     - **全屏沉浸（100dvh）**：移动端外层必须使用 `h-[100dvh] flex flex-col justify-between overflow-hidden` 100% 满屏填满真机视口。
     - **★ 轻量应用“零滚动条”铁律（Zero Page Scrollbar）**：
       - **对于单功能轻量应用（时钟、番茄钟、计时器、小游戏、计算器、转换器等）**：在手机上必须**单屏锁死，绝对严禁出现页面纵向滚动条或上下拖拽晃动**！辅助面板（设置滑块、历史记录）在桌面端双栏展开，在手机端必须收纳为弹窗或紧凑胶囊，保证主界面 100% 单屏完整容纳；
       - **对于列表型应用（待办、记账、笔记等）**：主视口与外壳依然锁定禁止整页滚动，仅允许列表容器内部使用 `overflow-y-auto min-h-0` 局部平滑滚动。
     - **大拇指黄金热区（Thumb-friendly）**：主要操作（开始、切换、下蹲、添加、重置等）必须布局在屏幕下半段方便单手大拇指点击。触控靶区尺寸必须 `≥ 48x48px`。
     - **防双击缩放与弹簧死锁**：必须配置 `viewport-fit=cover, maximum-scale=1.0, user-scalable=no` 与 `touch-action: manipulation`。
     - **安全区内衬**：顶部 `pt-[env(safe-area-inset-top)]`，底部 `pb-[env(safe-area-inset-bottom)]`。
   - **★ 桌面端/宽屏与 4K 高清大屏规范（≥ 768px 及 2K/4K 屏幕）**：
     - **坚决禁止写死过窄的容器（如 max-w-md 或 max-w-4xl）！** 否则在 4K 或宽屏显示器上，中间只有局促的一小条，两侧出现巨大的荒漠死白留白；
     - **4K 宽屏自适应延展与视口连续性铁律（Layout Grid Continuity & Max-Width Parity）**：
       - **★ 严禁在进入微应用后宽度突然变窄！** 导航大厅与所有微应用的顶层外壳，必须强制使用完全一致的宽度与内边距规约：`max-w-7xl 2xl:max-w-[1680px] w-full mx-auto px-4 sm:px-6 lg:px-10`；
       - 用户无论在大厅还是在任何微应用之间来回切换，左右边缘基准线与导航栏位置必须**像素级平滑对齐**，彻底消除“点进工具后画面瞬间缩水”的剧烈割裂出戏感；
       - 大厅卡片网格配置 `sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4`，在 4K 屏上气势磅礴地排满 4 列；
       - 微应用内部核心组件（如时钟字体 `2xl:text-[10rem]`、画布视口）在大屏下自适应等比舒展；
     - **★ 桌面端强制双栏/仪表盘铁律（Dual-Column Mandate）**：
       - **严禁在桌面端只放一个居中的孤零零单栏小卡片/单盒子！**（很多 AI 写小游戏只写一个居中 Canvas，写计算器只写一个居中数字框，导致在 4K 宽屏上极其窄小寒酸，必须彻底杜绝！）
       - **必须强制采用双栏（Dual-column，如 8:4 或 7:5）电竞/专业工作台布局**：
         - **左栏**：核心交互舞台（游戏主画布、时钟大表盘、主输入区等）；
         - **右栏**：专业仪表盘看板（生涯战绩、历史流水、按键图鉴、参数配置等）；
       - **响应式协同**：在移动端（`< 768px`），右栏自动隐藏或收纳为底部浮层，确保手机端单屏极致沉浸、零滚动条；桌面端/4K 屏则双栏横向铺开，视野饱满；
     - **★ 桌面端黄金光学中心法则（Optical Center vs Visual Sagging）**：
       - **严禁在桌面端对核心工作台使用绝对垂直居中（如 `my-auto`、`items-center`）！**（绝对物理居中会导致界面在宽屏/大屏上产生严重的“视觉下坠（Visual Sagging）”，顶部空旷虚无，下方局促下坠）；
       - 桌面端必须遵循人眼生理视线落点的**“光学视觉中心（约在屏幕上方 38.2%~45% 黄金区间）”**；
       - 外层采用 `md:justify-start`，主体采用 `md:my-0 md:mt-4~md:mt-6 2xl:mt-8` 自上而下自然延展，使大表盘、任务看板等抬头即见，气势端正；
     - 键盘快捷键完备（空格、回车、方向键、Esc 等）。

3. **★ 经典工业级通用 UI/UX 设计准则（Universal Design System Principles）**：
   - **8pt 空间网格韵律（8pt Spacing Grid）**：
     - 所有内边距（padding）、外边距（margin）和元素间距（gap）严格取 4 的倍数与 8 的阶梯（`p-1: 4px`, `p-2: 8px`, `p-3: 12px`, `p-4: 16px`, `p-6: 24px`, `p-8: 32px`, `p-12: 48px`），严禁任意乱造自定义数值，确保严谨的节奏感。
   - **克制色彩与单重音品牌色（One Accent Rule & WCAG AA）**：
     - **严禁五颜六色的彩虹调色盘！** 每个微应用只允许挑选 **1 个核心主重音色（Primary Accent）**（如番茄钟的 `rose/red`、待办的 `sky/indigo`、游戏的 `amber`）；
     - 其余 90% 的页面结构、背景、文字必须使用沉稳统一的**单色中性灰阶（Neutral / Slate 系列）**；
     - 必须满足 WCAG 2.1 AA 级对比度（普通正文对比度 ≥ 4.5:1，严禁浅灰底搭配亮灰字导致难以辨识）。
   - **字阶与字重分级（Typographic Scale & Weight）**：
     - 依靠“字号梯度与字重”建立清晰的信息层级，而非给不同文字涂抹不同颜色：
       - **Hero / 核心大数字**：`text-4xl ~ text-8xl 2xl:text-[10rem] font-black tracking-tight font-mono`；
       - **一级标题 / 模块头**：`text-base sm:text-lg font-bold text-neutral-900 dark:text-white`；
       - **二级正文 / 选项文本**：`text-xs sm:text-sm font-medium text-neutral-600 dark:text-neutral-300`；
       - **三级辅助 / 快捷键 / 元数据**：`text-[11px] sm:text-xs font-mono text-neutral-400 dark:text-neutral-500`。
   - **同心圆角嵌套数学律（Corner Radius Hierarchy）**：
     - 严格遵循 `外层圆角 > 内层圆角` 的自然嵌套几何规律，杜绝内大外小的突兀感：
       - 外层大弹窗/模态框：`rounded-3xl` (24px)；
       - 主体卡片/工作台面板：`rounded-2xl` (16px)；
       - 内部按钮/输入框/交互块：`rounded-xl` (12px)；
       - 内部小徽章/极小标签：`rounded-lg` (8px) 或 `rounded-full`。
   - **暗黑模式微晶层级深度（Dark Mode Surface Elevation）**：
     - **严禁全屏死黑（Pure #000000）！** 死黑会导致容器与背景粘成一片、丢失立体空间；
     - 采用现代微晶层叠体系：
       - 底层画布基底：`bg-neutral-950` (#0a0a0a)；
       - 一级卡片容器：`bg-white dark:bg-neutral-900/80`，搭配半透明微边框 `border border-neutral-200/80 dark:border-neutral-800/80`；
       - 二级嵌套面板/输入框内衬：`bg-neutral-50 dark:bg-neutral-950/60`；
       - 浮层/弹窗：叠加 `backdrop-blur-md shadow-2xl`。
   - **行动按钮三级层级体系（Button Action Hierarchy）**：
     - **Primary（主行动点）**：全屏仅允许 1~2 个最关键的高饱和实色大按钮（如开始计时、创建任务、跳跃），吸引绝对视线；
     - **Secondary（次级操作）**：中性浅底微边框按钮（如重置、设置、切换），安静内敛；
     - **Ghost / Icon（幽灵/纯图标按钮）**：平时透明，悬浮时微微高亮，用于返回、关闭与辅助控制；
     - **触控反馈全家桶**：所有可点项必须具有按压微缩 `active:scale-[0.97]` 与平滑过渡 `transition-all duration-150`。
   - **瞬时动效律（Micro-Interactions）**：
     - 所有折叠、切换、Hover 动效时长严格限制在 `150ms ~ 200ms`（`transition-all duration-150 ease-out`），绝对禁止超过 300ms 的拖沓长动画，保持原生客户端般的利落响应。
4. **原生 App 触感与独立运行隔离（Standalone App Mode）**：
   - **★ 独立安装检测与沉浸感保障**：
     - 当微应用在浏览器中被访问时，左上角显示【返回大厅】按钮。
     - **当该微应用被用户添加到桌面作为独立 App（Standalone）打开时，必须自动彻底隐藏【返回大厅】按钮与【安装按钮】！**
     - 实现方式：通过 CSS 媒体查询 `@media (display-mode: standalone)` 以及 JS `window.navigator.standalone`，给返回按钮和安装按钮标记类名并在独立模式下隐藏，确保独立 App 拥有纯粹的原生质感。
   - 禁止文字在点击时被误选蓝底：`-webkit-user-select: none; user-select: none;`（输入框除外）。
   - 去除移动端点击高亮暗影：`-webkit-tap-highlight-color: transparent;`。
   - 所有按钮与卡片必须具有触控反馈：`active:scale-[0.97] transition-all duration-150`。
   - 界面圆角推荐：卡片 `rounded-2xl`，按钮 `rounded-xl`，弹窗 `rounded-3xl`。
5. **深浅色主题：全局联动 + 独立覆盖架构（Global Cascading with Local Override）**：
   - **★ 全局联动体验机制**：
     - 用户在导航大厅切换深浅色时，必须作为全局基准（`pwabox_theme_global`），并瞬时广播同步给所有已注册的微应用；
     - 微应用加载时，优先读取自身独立的 `pwabox_<tool-name>_theme`，若未独立手动设置过，**必须无缝自动继承大厅的全局基准 `pwabox_theme_global`**（保证用户在首页切深色，点进任何小工具深浅色完全一致！）；
     - 微应用必须监听 `window.addEventListener('storage', ...)`，实现跨标签页在大厅切换色彩时，应用内秒级无刷新平滑变色。
   - **★ 状态显性化（清晰区分“自动”与“手动”）**：
     - 严禁让用户猜测当前是自动还是手动！
     - 外观切换控件必须清晰反映当前模式：
       - 跟随系统模式：图标必须显示为电脑监视器（`monitor`），并明确指示系统联动状态。
       - 手动深色模式：图标显示为月亮（`moon`）。
       - 手动浅色模式：图标显示为太阳（`sun`）。
     - 切换时应提供轻量下拉菜单或即时胶囊 Toast 提示（如：“已切换至：跟随系统” / “已锁定深色”），让普通人一目了然。
   - **双色样式必须完备**：背景、文字、卡片、输入框必须兼顾深浅两套设计。

---

## 五、数据存储与状态一致性铁律（UI & State Sync）

1. **用户设置与开关必须持久化（LocalStorage）**：
   - 凡是用户在界面上可操作的开关与偏好（如：**音效静音/开启**、**深浅色主题**、**自定义时长**、**过滤模式**等），**严禁仅保存在内存变量中！**
   - 必须统一加上专用前缀持久化存储：`localStorage.setItem('pwabox_<tool-name>_<key>', value)`。
2. **★ 首屏渲染必须与持久化状态 100% 同步（严禁状态脱节！）**：
   - **典型恶性 Bug**：刷新页面后，变量虽然从存储中读出了“已静音”，但 HTML 模板里写死的图标仍然是“有声音的喇叭”，导致用户看到界面图标与真实状态相反！
   - **硬性要求**：页面 JS 初始化（DOMContentLoaded 或脚本末尾）**必须主动调用一次 UI 同步函数**（如 `updateSoundUI()`、`applyTheme()`），强制根据 `localStorage` 中的实际值渲染对应的图标（如 `volume-x` vs `volume-2`）、高亮与文案。
3. **★ 动态图标切换禁忌（Lucide Dynamic Icon Pitfall）**：
   - **常见致命陷阱**：在 JS 里对已被 Lucide 处理过的节点直接写 `iconEl.setAttribute('data-lucide', 'pause')` 并 `lucide.createIcons()`。Lucide 首次运行后已将 `<i>` 节点替换为了 `<svg>`，后续调用 `setAttribute` **完全不会重新渲染！导致按钮图标永远不更新**！
   - **强制标准解法**：动态图标必须被包裹在容器盒子中（如 `<span id="iconBox"><i data-lucide="..."></i></span>`），动态切换时通过 `iconBox.innerHTML = '<i data-lucide="new-icon" class="..."></i>'` 重新注入模板，再调用 `lucide.createIcons({ root: iconBox })` 进行瞬时重绘。
4. **支持数据导入/导出（贴心设计）**：
   - 涉及重要记录的工具（记账、待办等），必须在设置或角落提供一个“导出 JSON / 恢复数据”的轻量弹窗，方便用户跨设备备份。
4. **PWA 离线运行**：
   - 基础 Service Worker 必须实现静态资源 Cache-First 或 Stale-While-Revalidate，确保断网时已访问的工具依然能够打开使用。

---

## 六、代码质量戒律

1. 保持代码整洁纯粹，不写过时的 `var`，统一使用 ES6+（`const`, `let`, 箭头函数, 解构赋值, 模板字符串）。
2. 每一个微应用都是独立的可执行成品，严禁留下 `// TODO: 这里由用户自行实现` 等未完成占位代码。
3. 纯原生原生实现所有动画与状态流转，优先使用轻巧、稳定、跨浏览器兼容的 API。

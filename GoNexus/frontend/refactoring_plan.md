# GopherAI 前端重构计划书

当前前端（特别是 `AIChat.vue`）存在逻辑高度耦合、视觉风格陈旧且难以维护的问题。本计划旨在 `sandbox` 目录中构建一个现代、精美且易于维护的新版前端。

## 需要用户确认

> [!IMPORTANT]
> 请审阅以下架构和视觉风格提案。
> 我们需要决定是继续使用 Element Plus 构建新 UI，还是使用 **原生 CSS (Vanilla CSS)** 构建一套更独特、高端的“玻璃拟态 (Glassmorphism)”设计。原生 CSS 能提供更精细的动画和审美控制。

## 待办与开放问题

> [!IMPORTANT]
> **技术栈已确定**：我们将从 Vue 切换到 **React + TypeScript + Tailwind CSS**。
> **视觉目标**：打造极致的“玻璃拟态 (Glassmorphism)”和“大厂感”UI，优先使用 **Shadcn/UI** 配合 **Framer Motion**。

> [!WARNING]
> 1. **主题偏好**：你更倾向于深色模式（类似 Claude/ChatGPT）还是浅色模式？
> 2. **工程化**：我们将使用 `Vite` 作为构建工具，`Zustand` 管理状态。

## 设计宣言 (Design Manifesto)

我们将采用“提示词驱动设计”的思路，为 GopherAI 注入灵魂。

**设计目标 (Design Prompt)**：
> "构建一个**深邃且极具未来感**的 AI 聊天界面。采用 **Obsidian Dark** 主题，配合侧边栏的 **极简玻璃拟态 (Glassmorphism)** 效果。聊天区域使用渐变描边的对话气泡，底部输入框设计成悬浮的 **胶囊感 (Sleek Capsule)** 造型。加入 **微发光 (Subtle Glow)** 动效来表示 AI 正在思考，使用 **Framer Motion** 实现消息弹出时的弹性缩放效果。"

**视觉核心**：
- **基调**：深邃、智能、冷静且富有生命力。
- **色彩**：Obsidian (背景) + Indigo (主色) + Subtle Neon (装饰)。
- **交互**：强调“空间感”，消息从输入框自然流入对话流。

## 拟定架构

我们将在 `sandbox` 目录中先行构建，验证无误后再替换 `GoNexus/vue-frontend`。

### 1. 设计系统与技术选型
- **核心框架**: React 18 (Vite 驱动)
- **样式方案**: Tailwind CSS + Shadcn/UI (提供高端原始组件)
- **动效引擎**: Framer Motion (实现丝滑交互)
- **字体系统**: Inter / Outfit (提升阅读质感)
- **视觉风格**: 深度定制的玻璃拟态，支持 HSL 动态主题色

### 2. 组件拆分 (React 版)
将逻辑从视图中彻底分离：
- **`sandbox/src/pages/ChatPage.tsx`**: 整体页面容器。
- **`sandbox/src/components/chat/`**:
  - `ChatSidebar.tsx`: 会话管理侧边栏。
  - `MessageList.tsx`: 消息渲染流。
  - `ChatInput.tsx`: 支持自动高度、Markdown 预览的输入框。
- **`sandbox/src/components/ui/`**: 存放 Shadcn/UI 生成的基础原子组件。

### 3. 数据层与状态管理
- **Service 层**: 封装 Axios 和 EventSource (SSE) 逻辑，返回 Observable 或 Promise 流。
- **状态管理**: 使用 **Zustand** 管理全局 UI 状态，**React Query** 管理服务端数据缓存。
- **内容处理**: 使用 `react-markdown` 配合 `shiki` 实现代码高亮，支持公式渲染。

## 执行阶段 (Step-by-Step Execution)

### 第一阶段：工程基座搭建 (Infrastructure)
1. **[Step 1] 初始化 Vite 项目**：在 `sandbox` 中创建 React + TypeScript 项目。
2. **[Step 2] 配置 Tailwind & Shadcn/UI**：安装依赖，初始化 `components.json`，导入首批原子组件（Button, Input, ScrollArea）。
3. **[Step 3] 建立全局样式 (Theming)**：在 `global.css` 中配置 Obsidian Dark 主题色值、Glassmorphism 通用类以及字体变量。
4. **[Step 4] 集成 Markdown 引擎**：配置 `react-markdown` 渲染器，集成 `shiki` 实现代码块的高端语法高亮。

### 第二阶段：核心布局与视觉 (UI & Layout)
1. **[Step 5] 构建 App Shell**：实现响应式的双栏布局，左侧为可收缩的玻璃态侧边栏，右侧为对话主区域。
2. **[Step 6] 开发侧边栏组件**：实现 `SessionList` 和 `SessionItem`，包含会话切换动画。
3. **[Step 7] 开发聊天气泡 (Message Bubbles)**：设计 AI 与用户的差异化气泡，加入 Framer Motion 的进入动效。
4. **[Step 8] 重写输入框组件 (Floating Input)**：实现悬浮胶囊造型，支持高度自适应和 Shift+Enter 换行。

### 第三阶段：逻辑与流式传输 (Data & SSE)
1. **[Step 9] 搭建状态管理 (Zustand)**：建立 `useChatStore` 统一管理会话状态、消息历史及模型选择。
2. **[Step 10] 封装 API Service**：编写 `chatService.ts`，统一处理普通请求与 SSE 流式解析逻辑。
3. **[Step 11] 对接 SSE 流式渲染**：实现“打字机”式的实时更新逻辑，确保与 Zustand 状态同步时不出现性能抖动。
4. **[Step 12] RAG 文件上传联调**：迁移并美化文档上传组件，对接后端 `/file/upload` 接口。

### 第四阶段：细节打磨与迁移 (Polish & Deployment)
1. **[Step 13] 引入 Framer Motion 全局动画**：为页面切换、列表删除添加细腻的微动效。
2. **[Step 14] 响应式适配**：优化移动端显示，实现侧边栏抽屉式切换。
3. **[Step 15] 最终验证与合并**：对比原版 Vue 项目，确认功能无损后，准备整体迁移回 `vue-frontend`（或直接替换）。

## 验证计划

### 手动验证
- **连接性**：确保新前端能正确读取 `GoNexus` 后端提供的会话列表。
- **稳定性**：验证 SSE 在网络波动时的异常处理（断连重试）。
- **美观度**：对照“设计宣言”，检查阴影、模糊度和发光效果是否符合预期。

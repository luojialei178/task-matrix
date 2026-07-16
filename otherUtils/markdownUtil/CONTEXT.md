# Markdown 编辑器开发上下文

## 当前版本

迭代版离线 Markdown 编辑器 / 浏览器，目标环境为 Chrome 125+，浏览器通过 `file://` 直接运行。当前版本提供可调双栏、实时预览和自动目录。

## 实现约束

- 交付主体为单个 `markdown-editor.html`
- 原生 HTML、CSS、JavaScript，零外部依赖、零网络依赖
- UI 延续现有 JSON 工具：macOS 风格、默认深色、双主题 class、紧凑双栏
- 正文不持久化；`localStorage` 仅保存 `markdown-editor-theme`
- 不修改或依赖 `jsonUtil`、`logUtil`、任务矩阵及仓库根文件

## 主要实现

- `textarea` 作为源文编辑器，输入事件同步更新预览
- `FileReader` 读取 `.md`、`.markdown`、`.txt`，支持文件选择和拖放
- 原生块级解析器处理标题、段落、代码块、引用、列表、任务、分隔线、表格
- 原生行内解析器处理强调、删除线、链接、图片和行内代码
- 渲染前转义用户原文，仅解析器生成受控 HTML
- 标题生成唯一锚点和可折叠目录，支持重复标题及中文标题
- 桌面双栏使用原生 Pointer Events 分隔条，鼠标与触摸可拖动，比例限制 20%～80%；支持左右方向键、Shift 大步进、Home/End 和双击恢复 50:50
- 分隔条使用 `role="separator"`、方向、控制目标及动态 `aria-valuenow`/`aria-valuetext`；拖动期间禁止文本选择，结束或取消后恢复
- 760px 以下切换单栏并隐藏分隔条；双栏比例仅保留在页面内存，不持久化正文或布局
- 文件载入后为干净状态；编辑、Tab 缩进和清空会进入未保存状态

## 安全决策

- 所有 Markdown 原生 HTML 标签按文本显示，`script` 不可能进入可执行 DOM
- 链接采用协议白名单逻辑，拒绝脚本、数据、文件及未知自定义协议
- 图片 data URL 仅接受 PNG/JPEG/GIF/WebP Base64，不接受 SVG data URL
- 相对图片渲染为警告提示，避免 `file://` 路径行为不一致
- 外部 HTTP(S) 链接使用 `noopener noreferrer`

## 维护注意

功能或行为变化时同步更新本目录 `README.md` 和本文件。不要引入构建流程、第三方解析库或正文持久化。验证重点包括 HTML/JavaScript 语法、危险协议拦截、原生 HTML 转义、文件拖放、可拖动分隔条、目录、响应式布局和深浅主题。

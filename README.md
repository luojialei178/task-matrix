# 轻量级单文件工具集

本仓库用于维护可在纯内网或离线环境直接运行的浏览器小工具。所有工具以极致轻量、无需安装、便于复制分发为首要目标。

## 工程原则

1. **单文件交付**：每个工具的功能、样式和脚本必须内联在一个 HTML 文件中。
2. **零运行时依赖**：不得依赖 Node.js、构建工具、框架、CDN 或外部网络资源，浏览器直接打开即可使用。
3. **离线优先**：工具必须适用于纯内网和无网络环境，目标浏览器为 Chrome 125+。
4. **轻量实现**：优先使用原生 HTML、CSS 和 JavaScript，避免引入不必要的库、文件和抽象。
5. **JSON 持久化**：需要保存、迁移或备份的数据，统一通过 JSON 文件导入和导出；不得新增数据库或服务端依赖。浏览器 localStorage 仅可作为本机临时便利缓存，JSON 是可移植数据的标准格式。
6. **独立目录**：每个工具使用独立目录，工具之间不得产生运行时耦合。
7. **文档同步**：功能、数据结构或使用方式变化时，应同步更新对应目录的 `README.md` 和 `CONTEXT.md`。

## 目录说明

```text
.
├── README.md                         # 工程总览与统一规范
├── task-matrix/                      # 核心工具：任务优先级矩阵
│   ├── task-matrix.html              # 单文件工具本体
│   ├── task-matrix.json              # JSON 数据示例或备份
│   ├── README.md                     # 工具说明
│   └── CONTEXT.md                    # 历史上下文或会话总结
└── otherUtils/                       # 其他独立辅助工具
    ├── jsonUtil/                     # JSON 格式化、压缩、转义与反转义工具
    │   ├── json-formatter.html       # 单文件工具本体
    │   ├── README.md                 # 工具说明
    │   └── CONTEXT.md                # 开发上下文与版本记录
    ├── markdownUtil/                 # Markdown 编辑、预览与打印工具
    │   ├── markdown-editor.html      # 单文件工具本体
    │   ├── README.md                 # 工具说明
    │   └── CONTEXT.md                # 开发上下文与版本记录
    └── logUtil/                      # 文本日志与 Java 异常分析工具
        ├── log-analyzer.html         # 单文件工具本体
        ├── README.md                 # 工具说明
        └── CONTEXT.md                # 开发上下文与版本记录
```

## 工具说明

- **task-matrix**：二维任务优先级矩阵，支持任务卡片、拖拽、动态行列、主题切换及 JSON 导入导出。
- **otherUtils**：非核心但可独立使用的开发与办公辅助工具集合。
- **otherUtils/jsonUtil**：JSON 格式化工具，支持格式化、压缩、转义、反转义、容错提示及双向数据同步。
- **otherUtils/markdownUtil**：Markdown 编辑器与浏览器，支持文件拖放、实时预览、目录导航及打印为 PDF。
- **otherUtils/logUtil**：离线日志分析器，支持大文件分块读取、筛选统计、Java 异常归组及结果导出。

## 统一命名规范

- 工具目录和 HTML 主文件使用语义明确的英文名称；HTML 文件使用 `kebab-case`，例如 `json-formatter.html`。
- 每个工具的使用说明统一命名为 `README.md`。
- 每个工具的开发记录、版本历史、上下文、交接或会话总结统一命名为 `CONTEXT.md`，不得混用 `CHANGELOG.md`、`session-summary.md`、`context-summary.md` 等名称。
- 示例或持久化数据文件使用 JSON，名称应与工具主文件一致，例如 `task-matrix.json`。
- 临时命令或操作说明如确需保留，统一使用 `COMMANDS.md`；空文件不应提交。
- 系统生成文件（如 `.DS_Store`）不得纳入版本控制。

## 新增工具检查清单

新增工具时，至少提供 `<tool-name>.html` 和 `README.md`；涉及数据保存时提供 JSON 导入/导出；存在开发记录、版本历史或交接信息时统一使用 `CONTEXT.md`。提交前确认工具可离线打开、无外部请求、无控制台错误，并验证主要功能在 Chrome 125+ 可用。

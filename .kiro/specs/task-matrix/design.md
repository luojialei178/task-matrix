# 任务优先级矩阵工具 — 技术设计文档

## 技术栈

- **单文件 HTML**：所有 CSS、JS、HTML 内联在 `task-matrix.html` 中
- **运行环境**：浏览器（Chrome 125+），无需 Node.js 或任何构建工具
- **存储**：`localStorage`（5 个 key）
- **依赖**：零外部依赖

---

## 文件结构

```
task-matrix.html          # 唯一产出文件
.kiro/specs/task-matrix/  # Spec 文档
  requirements.md
  design.md
  tasks.md
.kiro/steering/           # 上下文规则
  project.md
```

---

## 数据模型

### localStorage Keys

| Key | 类型 | 说明 |
|-----|------|------|
| `task-matrix-v6` | `State` | 主数据（任务、扩展数量） |
| `task-matrix-theme` | `string` | `'dark'` \| `'light'` |
| `task-matrix-rownames` | `string[]` | 每个逻辑行的自定义名称 |
| `task-matrix-roworder` | `number[]` \| `null` | 视觉行 → 逻辑行的映射 |

### State 结构

```ts
interface State {
  extraCols: number;           // 扩展列数量
  extraRows: number;           // 扩展行数量
  cells: Record<string, Task[]>; // key: "r{logicalRow}-c{col}"
}

interface Task {
  text: string;
  done: boolean;
}
```

### 行索引设计

```
视觉位置 r  →  逻辑索引 logicalRow(r) = rowOrder[r]
数据 key    =  `r${logicalRow(r)}-c${c}`
颜色 class  =  rowCls(r)  // 始终按视觉位置，不跟数据走
```

拖拽换行只交换 `rowOrder` 中两个视觉位置的值，颜色、CSS class 不变。

---

## 组件架构

```
body
├── header                    # 44px，毛玻璃
│   ├── header-left           # 标题 + 主题圆点
│   └── header-btns           # 清除/导出/导入
├── layout
│   ├── y-axis-wrap           # 竖排标签
│   └── main
│       ├── x-axis-bar        # 横轴说明
│       └── grid-scroll
│           └── grid          # CSS Grid
│               ├── corner    # 左上角空格
│               ├── col-hdr   # 列标题 × N
│               ├── expand-col-btn
│               ├── row-hdr   # 行标题（可拖拽/双击编辑）
│               ├── cell      # 任务单元格 × N×M
│               │   ├── task-card × K
│               │   │   ├── task-check
│               │   │   ├── task-text
│               │   │   └── task-del
│               │   ├── task-input (动态)
│               │   └── add-btn
│               └── expand-row-btn
└── footer                    # 图例 + 提示
```

---

## CSS Grid 布局

```css
grid-template-columns: 64px repeat(N, 1fr) 32px
/* 64px = 行标题宽度 */
/* N = 5 + extraCols */
/* 1fr = 列宽平均分配，随窗口和扩展数量动态变化 */
/* 32px = 扩展列按钮 */
```

每行在 grid 中占 `2 + N + 1` 个格子：`row-hdr + cell×N + spacer`

---

## 主题系统

- `body.dark` / `body.light` class 控制全部样式
- CSS 变量 `--card-bg`、`--card-border`、`--card-done-bg` 在每个单元格 class 上定义，任务卡片通过 `var()` 继承
- Header/Footer 使用 `backdrop-filter: saturate(180%) blur(20px)`

---

## 拖拽实现

### 任务卡片拖拽
- `dragstart`：setData `text/plain` = `{fromKey, idx}`
- `drop` on cell：解析 data，从源 key splice，push 到目标 key

### 行拖拽
- 全局变量 `dragFromRow` 记录拖拽源行
- `drop` on row-hdr：swap `rowOrder[from]` ↔ `rowOrder[to]`，重建 grid
- 通过 `dragFromRow !== null` 判断当前是否在拖行，避免与卡片拖拽冲突

---

## 数据导入导出

```
导出：JSON.stringify({state, rowNames, rowOrder}) → Blob → <a download>
导入：FileReader.readAsText → JSON.parse → 验证结构 → confirm → 写入 localStorage → buildGrid()
```

---

## 关键函数索引

| 函数 | 说明 |
|------|------|
| `buildGrid()` | 清空并重建整个 grid DOM |
| `renderCellContent(cell, key)` | 渲染单个单元格内容 |
| `makeCard(key, idx)` | 创建一个任务卡片元素 |
| `setupDrop(cell)` | 为单元格绑定任务拖拽 drop 事件 |
| `setupRowDrag(rh, r)` | 为行标题绑定行拖拽事件 |
| `startEditRowName(rh, lbl, r)` | 启动行标题内联编辑 |
| `deleteExtCol(ci)` | 删除扩展列，重排 cells |
| `deleteExtRow(vr)` | 删除扩展行，重排 rowOrder |
| `applyTheme(t)` | 切换 dark/light class |
| `ensureRowOrder()` | 确保 rowOrder 长度匹配当前行数 |

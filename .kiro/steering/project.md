# 工程说明

本工程专门维护一个单文件桌面小工具：**任务优先级矩阵**。

## 唯一产出文件

```
task-matrix.html
```

所有功能、样式、逻辑均内联在这一个 HTML 文件中，零外部依赖，浏览器直接打开使用。

## 工具功能概述

- 二维矩阵：纵轴任务优先级（P1~P5，高→低），横轴事项优先级（P1~P5，高→低）
- 任务卡片：添加、完成勾选、删除、跨格拖拽
- 行拖拽换位：颜色按视觉位置固定，只换数据
- 动态扩展行列，扩展项可删除
- 行标题双击编辑
- 深色/浅色主题切换（macOS 风格，毛玻璃效果）
- 任务卡片背景继承单元格颜色
- 导出/导入 JSON，localStorage 自动保存

## 技术约束

- 单文件 HTML，不引入任何外部 JS/CSS 库
- 兼容 Chrome 125+
- 不使用 Node.js、构建工具、框架
- 样式使用 CSS 变量 + 双主题 class（`body.dark` / `body.light`）

## 修改原则

- 修改前先阅读 `task-matrix.html` 当前内容，不做假设
- 功能改动同步更新 `.kiro/specs/task-matrix/` 下的相关文档
- 保持代码内联、紧凑风格，避免不必要的空行和注释
- localStorage key 当前为 `task-matrix-v6`（如破坏性改动数据结构需升版本号）

## Spec 文档位置

```
.kiro/specs/task-matrix/requirements.md  # 功能需求
.kiro/specs/task-matrix/design.md        # 技术设计
.kiro/specs/task-matrix/tasks.md         # 任务列表（含 Backlog）
```

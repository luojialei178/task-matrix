# JSON 格式化工具

单文件 HTML 工具，用于 JSON 数据的格式化、压缩、转义操作。

## 功能

- **格式化**：将压缩的 JSON 转为缩进 2 空格的易读格式
- **压缩**：将 JSON 压缩为单行（去除所有空白）
- **转义**：将 JSON 转为字符串形式（双引号转义为 `\"`）
- **反转义**：将转义后的 JSON 字符串还原为对象并格式化
- **复制输出**：一键复制处理结果到剪贴板
- **快捷键**：Cmd/Ctrl + Enter 快速格式化

## 使用

```bash
open -a "Google Chrome" json-formatter.html
```

或直接双击 `json-formatter.html` 用浏览器打开。

## 技术

- 单文件 HTML
- 零依赖
- 深色主题（macOS 风格）
- 实时状态提示

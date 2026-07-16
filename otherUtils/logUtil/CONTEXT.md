# 开发上下文

## 当前交付

V2 交付仅为 `log-analyzer.html`、`README.md`、`CONTEXT.md`。HTML 零依赖，Chrome 125+ 可通过 `file://` 运行；日志、模板、筛选、书签均只驻留内存，localStorage 唯一键为主题 `log-analyzer-theme-v2`。标题主题按钮复用 Markdown 工具的 10×10 圆点、hover、`:focus-visible` 与 ARIA 规范。

## 数据与批次

- 每文件 250 MB 上限、2 MB `Blob.slice()`、fatal `TextDecoder`，自动严格 UTF-8 后回退 GB18030/GBK。编码检测样本允许末尾未完成多字节字符，由正式流式解码跨块校验；空文件记录为 UTF-8/所选编码、文本/所选格式的零记录来源。批次在临时数组完成解析、排序和索引后原子提交。
- 自动格式以前 40 个非空行中 JSON 对象占比 80% 判定 JSONL。自动 JSONL 坏行生成 `format=jsonl-invalid` 并累计警告；显式 JSONL 坏行中止批次。
- 事件统一字段为 timestamp/timestampMs、level、thread、logger、message、traceId、requestId、spanId、userId、orderId、method、path、status、durationMs（`duration` 仅兼容别名）、source、format、fields、raw。
- 文件元数据记录名称、字节数、输入类型、实际编码/格式和坏 JSONL 行数；粘贴记录为 paste。

## 查询与聚合

查询使用 tokenizer + 递归下降闭包，不使用 `eval`。支持普通词、隐式 AND、`-`/NOT、OR、括号、引号、指定字段前缀和 `costMs` 数值比较；长度 2,000 字符、200 token。动态日志内容始终以 `textContent` 或安全按钮写入 DOM。

Trace 以 `traceId || requestId` 聚合并计算事件数、最高级别、起止、跨度、来源服务。异常组键仍是“根因类型 + 去行号首个业务帧”，另统计首末时间与关联链路。业务包前缀在解析时参与业务帧选择。性能统一读取 `durationMs`，直方图自动选分钟/小时并把桶数限制到 120。

## 模板安全边界

模板支持 `regex` 与 `jsonl`。regex 限 pattern 500 字符、flags `i/m/u`、50 个捕获组和固定规范字段映射，单行正则输入最多 200,000 字符；拒绝环视、反向引用、明显嵌套量词、重复分支量词与高风险通配组合。每行模板解析有 try/catch，失败回退 `headerInfo`/内置文本事件。这是启发式基础防护，不是形式化证明，也不能保证任意获准正则都具有恒定运行时间。模板导入上限 1 MB，不持久化。

## 导出与隐私

报告包含元数据、过滤条件、警告、级别/性能统计、异常组、慢事件、Trace 摘要、带备注和事件摘要的书签及匹配事件。脱敏处理手机号、邮箱、Authorization/Bearer、token/apiKey/password/cookie、IP、常见 userId 和长数字；对报告嵌套字符串及书签备注同样处理。脱敏明确为尽力而为，不保证完全。

## 已知限制

- 主线程分块并定期 yield，未使用 Worker；超长单行、大对象、全量报告仍可能短时阻塞并造成内存峰值。
- 文本头、HTTP 字段、服务名和异常业务帧依赖常见命名/启发式；稳定私有格式应使用模板。
- 正则黑名单只能拦截明显风险，不等价于完整复杂度分析或沙箱；不接收脚本。
- 未实现跨刷新会话、用户自定义脱敏规则、图表图片导出或网络协作；不要把这些描述为现有能力。

## 维护约束

保持单 HTML、无网络、无外部资源、Chrome 125+ 与安全 DOM。功能变更同步更新本目录 README/CONTEXT；不得修改其他工具目录。
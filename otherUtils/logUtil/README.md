# 离线日志分析器 V2

`log-analyzer.html` 是面向 Chrome 125+ 的纯离线、零依赖单 HTML 工具，可直接由 `file://` 打开。解析、筛选、聚合、书签和导出都在当前页面内存中完成；localStorage 只保存主题。

## 输入与解析

- 支持多选/拖放 `.log`、`.txt`、`.jsonl` 和粘贴；每文件上限 250 MB，以 2 MB 分块严格解码 UTF-8、GBK 或 GB18030，批次全部成功后才原子提交。空文件也作为零记录来源写入批次元数据。
- 标题旁主题控件沿用 Markdown 工具的 10×10 像素圆点规范，支持悬停、键盘焦点与原生按钮激活；刷新后仅通过 `log-analyzer-theme-v2` 恢复深浅主题。
- 自动或显式选择文本/JSONL。显式 JSONL 的坏行会中止批次并指出行号；自动判断为 JSONL 后的坏行保留为 `jsonl-invalid`，状态栏及报告记录警告数。
- 文本与 JSONL 统一生成 time、level、thread、logger、message、traceId、requestId、spanId、userId、orderId、method、path、status、durationMs；兼容常见别名（含 `@timestamp`、severity、class、msg、uri/url、costMs 等）。
- 多行 Java 异常合并，保留根因链和首个业务帧；业务包前缀可配置，详情可折叠框架/JDK 栈帧。异常组显示次数、首次/最后和关联链路数。

## 查询、上下文与分析

高级查询支持普通关键词、空格隐式 `AND`、前缀 `-` 取反，以及 `level:/trace:/request:/logger:/thread:/source:/exception:/method:/path:/status:`。`costMs > >= < <=` 可写作 `costMs>=100`；同时保留显式 `AND/OR/NOT`、括号、引号、`field.xxx` 和字面比较，不使用 `eval`。

```text
payment level:ERROR -logger:health costMs>=100
trace:"abc-1" OR request:req-9
method:POST path:/orders status:500
```

- 上下文范围可选 ±10/20/50，并可按全局、同线程或同 Trace/Request 展示；每条上下文按钮可定位回结果。
- Trace 面板按 traceId（缺失时 requestId）聚合，显示事件数、最高级别、起止、跨度、来源服务；详情按时间展示可点击链路。
- 慢请求阈值可设，显示慢数量、最大、平均、P50/P90/P95/P99及可点击最慢排行。Top N 支持 Logger、线程、来源、链路、异常、HTTP path/status，点击生成查询。
- 时间直方图按跨度选择分钟或小时桶并限制桶数，同时显示总量与 ERROR，点击桶设置时间筛选。
- 聚类归一化 UUID、十六进制 ID、IP、数字、引号内容和耗时；显示次数、首次/最后，点击可筛选。最多处理当前 50,000 条并输出 200 簇。

## 安全正则模板

默认模板展示 `mode: "regex"`、`pattern`、`flags` 和 `captures`（time/level/thread/logger/message/traceId 等捕获组编号）。正则最长 500 字符，flags 仅允许 `i/m/u`，捕获组最多 50，正则处理单行最多 200,000 字符；拒绝环视、反向引用、明显嵌套量词、重复分支量词和高风险通配组合。每行解析均捕获错误并回退内置文本解析器。该检查只是基础防护，不是形式化安全证明。另支持 `mode: "jsonl"` 点分字段路径；模板 JSON 可导入导出但不持久化。

## 导出、脱敏与限制

文本和 JSON 报告可选脱敏；规则覆盖中国手机号、邮箱、Authorization/Bearer，以及大小写不敏感的 token/apiKey/password/cookie 常见 `=`/`:` 形式。**脱敏尽力而为，不保证完全，请在导出前复核。** 报告包含文件/粘贴元数据、格式与编码、过滤条件、警告、统计、异常组、慢事件、链路摘要、书签备注及事件摘要。

解析仍是启发式：私有文本格式、服务字段命名和组织特有敏感信息可能无法完整识别。主线程会定期让出，但超大 JSON 对象、极长单行和报告导出仍可能占用较多内存；250 MB 是读取硬限制，不代表所有机器都能稳定处理同等膨胀数据。无有效时间的事件排在有效时间之后，时间筛选会排除它们。工具不发起网络请求，不恢复跨刷新会话，也不提供用户自定义脱敏规则。
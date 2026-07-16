# Requirements Document

## Introduction

`log-util` V2 是面向纯内网与离线环境的浏览器端日志分析器。V2 以 `otherUtils/logUtil/log-analyzer.html` 单 HTML 文件交付，支持多文件与粘贴输入、文本和 JSONL 解析、UTF-8/GBK/GB18030 解码、组合筛选与高级查询、Trace 与上下文分析、异常归组、受限聚类、会话书签、统计分析及脱敏导出。V2 在 Chrome 125+ 中通过 `file://` 运行，在浏览器主线程执行分块处理并定期让出事件循环，不持久化日志正文。

## Glossary

- **Log_分析器**：本特性提供的离线浏览器端日志分析工具。
- **工具目录**：仓库相对路径 `otherUtils/logUtil/`。
- **主文件**：工具目录中的 `log-analyzer.html`。
- **配套文档**：工具目录中的 `README.md` 与 `CONTEXT.md`。
- **单_HTML_交付**：主文件内联全部运行所需 HTML、CSS 和 JavaScript 的交付方式。
- **外部依赖**：运行时从主文件外加载的脚本、样式、字体、框架、库、服务或网络资源。
- **Chrome_125_及以上版本**：主版本号不低于 125 的 Google Chrome 浏览器。
- **日志正文**：用户输入的原始日志文本以及从原始日志文本产生的记录正文、字段值、备注或导出内容。
- **会话**：当前页面打开期间驻留内存的日志记录、元数据、筛选状态、聚合结果与书签集合。
- **旧会话**：新输入批次开始前已经成功提交的会话。
- **输入批次**：用户一次选择或拖放的一个或多个文件，或者一次提交的粘贴文本。
- **原子提交**：输入批次全部读取、解码、解析、排序与索引成功后一次替换旧会话的提交语义。
- **日志文件**：扩展名为 `.log`、`.txt` 或 `.jsonl` 的本地文件，或者浏览器识别为文本或 JSON 的本地文件。
- **单文件上限**：250 MiB，即 262,144,000 字节。
- **读取块**：从文件连续读取的不超过 2 MiB 的字节区段。
- **主线程分块_yield**：Log_分析器在浏览器主线程分块读取与解析，并在处理期间周期性让出事件循环的处理模型。
- **字符编码**：UTF-8、GBK 或 GB18030 文本编码。
- **自动编码检测**：优先严格解码 UTF-8，失败后尝试 GB18030 与 GBK 的编码选择过程。
- **文本模式**：按日志起始行与连续附属行组成多行日志记录的解析模式。
- **JSONL**：每个非空行应为一个 JSON 对象的行式日志格式。
- **自动_JSONL**：自动格式模式对样本非空行进行对象占比判断后选择的 JSONL 解析模式。
- **显式_JSONL**：用户在格式控件中明确选择的 JSONL 解析模式。
- **JSONL_坏行**：无法解析为 JSON 对象的 JSONL 非空行。
- **日志记录**：Log_分析器的显示、筛选、聚合、书签与导出单位，包含原始正文、来源、格式和识别字段。
- **识别字段**：`timestamp`、`level`、`thread`、`logger`、`message`、`traceId`、`requestId`、`spanId`、`userId`、`orderId`、`method`、`path`、`status` 与 `durationMs`。
- **有效时间**：能够转换为时间戳的 `timestamp` 字段。
- **时间线顺序**：有效时间记录按时间升序排列、相同有效时间按输入顺序排列、无有效时间记录在有效时间记录之后按输入顺序排列的顺序。
- **Java_异常**：包含以 `Exception`、`Error` 或 `Throwable` 结尾的异常类型以及可选 Java 栈帧、`Caused by` 或 `Suppressed` 内容的日志记录。
- **根因类型**：Java_异常因果链中的末端异常类型。
- **业务栈帧**：优先匹配用户配置业务包前缀、否则排除常见 JDK 与框架包后的首个 Java 栈帧。
- **异常组键**：根因类型与移除源代码行号后的首个业务栈帧组成的键。
- **组合筛选**：级别、关键字、来源、起止时间、高级查询和侧栏聚合选择共同作用的筛选机制。
- **高级查询**：由字面关键词、字段条件、比较运算符、逻辑运算符、括号和引号组成且不执行用户脚本的查询表达式。
- **Trace_Key**：优先使用 `traceId`，缺失时使用 `requestId` 的链路聚合键。
- **上下文**：选中日志记录之前与之后的相邻日志记录集合。
- **消息聚类**：对消息中的 UUID、长十六进制标识、IP、数字、引号值与耗时值归一化后按模板归组的分析功能。
- **模板正则单行上限**：200,000 个 JavaScript 字符；超过上限的行不进入用户模板正则并回退内置文本解析。
- **会话书签**：绑定日志记录并仅在当前会话内存中保存的可编辑备注。
- **脱敏**：导出前对已定义敏感模式执行替换的尽力处理，脱敏结果不构成完整匿名化保证。
- **主题参考页**：仓库相对路径 `otherUtils/markdownUtil/markdown-editor.html`。
- **主题圆点**：主题参考页中 `.theme-dot` 所定义的小圆点按钮视觉、交互与键盘焦点规范。
- **品牌区域**：页面标题左侧包含图标、标题与主题控件的区域。
- **持久化存储**：页面刷新或关闭后仍可保留数据的 localStorage、sessionStorage、IndexedDB、Cookie、Cache Storage 或文件系统存储。
- **V2_验证集**：用于验收 V2 要求的自动化测试、静态检查与 Chrome 125+ 手工场景集合。

## Requirements

### Requirement 1: 单文件离线交付

**User Story:** 作为离线环境用户，我希望日志分析器无需安装或联网即可运行，以便在受限环境中分析本地日志。

#### Acceptance Criteria

1. THE Log_分析器 SHALL 将主文件作为唯一包含运行功能的 HTML 文件。
2. THE Log_分析器 SHALL 将全部运行所需结构、样式与脚本内联在主文件中。
3. THE Log_分析器 SHALL 使用零外部依赖。
4. WHILE 网络不可用, THE Log_分析器 SHALL 通过 `file://` 提供 V2 全部运行功能。
5. THE Log_分析器 SHALL 支持 Chrome_125_及以上版本。
6. WHEN Log_分析器的功能、边界或使用方式发生变化, THE Log_分析器 SHALL 同步更新配套文档。
7. WHEN Log_分析器被维护, THE Log_分析器 SHALL 保持工具目录以外工具的实现文件不变。

### Requirement 2: 多来源输入与批次原子性

**User Story:** 作为日志分析者，我希望一次载入多个来源且失败或取消时保留已有结果，以便安全地合并排查数据。

#### Acceptance Criteria

1. WHEN 用户启动文件选择操作, THE Log_分析器 SHALL 允许用户选择一个或多个日志文件。
2. WHEN 用户向输入区域拖放一个或多个日志文件, THE Log_分析器 SHALL 按拖放批次载入全部日志文件。
3. WHEN 用户提交非空粘贴文本, THE Log_分析器 SHALL 将粘贴文本作为单一来源输入批次处理。
4. WHEN 输入批次全部完成读取、解码、解析、排序与索引, THE Log_分析器 SHALL 原子提交输入批次并替换旧会话。
5. WHILE 输入批次正在处理, THE Log_分析器 SHALL 提供可触发的取消批次操作。
6. IF 用户取消输入批次, THEN THE Log_分析器 SHALL 清理输入批次的临时结果并保留旧会话。
7. IF 输入批次中的任一文件读取、解码或解析失败, THEN THE Log_分析器 SHALL 清理输入批次的临时结果并保留旧会话。
8. IF 输入批次包含不受支持的文件, THEN THE Log_分析器 SHALL 显示对应文件名与拒绝原因并保留旧会话。
9. IF 输入批次包含大于单文件上限的文件, THEN THE Log_分析器 SHALL 显示对应文件名与 250 MiB 限制并保留旧会话。
10. WHEN 输入批次成功提交, THE Log_分析器 SHALL 记录每个来源的名称、字节数、输入类型、实际编码、实际格式与 JSONL_坏行数量。

### Requirement 3: 编码与格式策略

**User Story:** 作为处理多来源日志的用户，我希望工具明确处理常见中文编码和 JSONL 坏行，以便获得可预测的解析结果。

#### Acceptance Criteria

1. WHERE 用户选择 UTF-8、GBK 或 GB18030, WHEN Log_分析器读取输入, THE Log_分析器 SHALL 使用所选字符编码执行严格解码。
2. WHERE 用户选择自动编码检测, WHEN Log_分析器读取输入, THE Log_分析器 SHALL 按 UTF-8、GB18030 与 GBK 的候选策略选择可严格解码的字符编码。
3. IF 输入无法使用候选字符编码严格解码, THEN THE Log_分析器 SHALL 显示解码失败状态并保留旧会话。
4. WHERE 用户选择文本模式, WHEN Log_分析器解析输入, THE Log_分析器 SHALL 按文本模式处理输入。
5. WHERE 用户选择显式_JSONL, WHEN Log_分析器解析输入, THE Log_分析器 SHALL 按显式_JSONL处理每个非空行。
6. WHERE 用户选择自动格式, WHEN 前 40 个非空样本行中至少 80% 为 JSON 对象, THE Log_分析器 SHALL 将来源识别为自动_JSONL。
7. WHERE 用户选择自动格式, WHEN JSON 对象样本占比低于 80%, THE Log_分析器 SHALL 将来源识别为文本模式。
8. WHERE 输入采用显式_JSONL, IF Log_分析器遇到 JSONL_坏行, THE Log_分析器 SHALL 报告来源名称与一基行号并终止输入批次。
9. WHERE 输入采用自动_JSONL, WHEN Log_分析器遇到 JSONL_坏行, THE Log_分析器 SHALL 将原始坏行保留为 `jsonl-invalid` 日志记录。
10. WHERE 输入采用自动_JSONL, WHEN 输入批次提交, THE Log_分析器 SHALL 在会话状态与 JSON 报告中显示 JSONL_坏行总数。
11. WHEN Log_分析器处理空文件, THE Log_分析器 SHALL 将空文件记录为零条日志记录的来源而不产生解析错误。

### Requirement 4: 统一日志记录与时间线

**User Story:** 作为日志分析者，我希望不同格式生成一致且可追溯的记录，以便跨来源筛选和分析。

#### Acceptance Criteria

1. WHEN 文本模式识别到日志起始行, THE Log_分析器 SHALL 创建包含起始行及连续附属行的日志记录。
2. WHEN 文本模式遇到无法归入已有起始行的非空文本, THE Log_分析器 SHALL 按输入顺序保留对应文本为日志记录。
3. WHEN JSONL 非空行是 JSON 对象, THE Log_分析器 SHALL 将对应 JSON 对象转换为一条日志记录。
4. WHEN Log_分析器创建日志记录, THE Log_分析器 SHALL 保留日志记录的完整原始正文、来源名称与实际格式。
5. WHEN 输入包含识别字段或常见字段别名, THE Log_分析器 SHALL 将对应值映射到识别字段。
6. WHEN 日志级别为 `WARNING`, THE Log_分析器 SHALL 将日志级别归一化为 `WARN`。
7. WHEN 日志级别为 `SEVERE` 或 `ERR`, THE Log_分析器 SHALL 将日志级别归一化为 `ERROR`。
8. WHEN 输入批次包含多个来源, THE Log_分析器 SHALL 将全部来源的日志记录合并为一个时间线。
9. WHEN 输入批次成功解析, THE Log_分析器 SHALL 按时间线顺序排列日志记录。
10. WHEN 两条日志记录具有相同有效时间, THE Log_分析器 SHALL 按文件选择顺序与来源内原始顺序保持稳定排序。
11. WHEN 日志记录缺少有效时间, THE Log_分析器 SHALL 将日志记录排在全部有效时间记录之后。

### Requirement 5: 组合筛选与高级查询

**User Story:** 作为日志分析者，我希望组合使用基础筛选和安全高级查询，以便准确定位目标事件。

#### Acceptance Criteria

1. WHEN 用户启用一个或多个级别, THE Log_分析器 SHALL 匹配具有任一已启用级别的日志记录。
2. WHEN 用户输入关键字, THE Log_分析器 SHALL 对日志记录完整原始正文执行不区分大小写的字面子串匹配。
3. WHEN 用户选择来源, THE Log_分析器 SHALL 匹配来源名称等于所选来源的日志记录。
4. WHEN 用户设置时间起点或时间终点, THE Log_分析器 SHALL 按包含边界的时间区间匹配具有有效时间的日志记录。
5. WHEN 时间筛选处于活动状态且日志记录缺少有效时间, THE Log_分析器 SHALL 从结果中排除对应日志记录。
6. WHEN 两个或以上组合筛选条件处于活动状态, THE Log_分析器 SHALL 仅显示同时满足全部活动条件的日志记录。
7. WHEN 用户重置筛选, THE Log_分析器 SHALL 恢复全部级别并清除关键字、来源、时间、高级查询与侧栏聚合条件。
8. WHEN 用户提交高级查询, THE Log_分析器 SHALL 支持普通字面关键词、空格隐式 `AND`、显式 `AND`、`OR`、`NOT`、前缀 `-`、括号与单引号或双引号值。
9. WHEN 用户提交字段查询, THE Log_分析器 SHALL 支持 `level`、`trace`、`request`、`logger`、`thread`、`source`、`exception`、`method`、`path`、`status`、`format` 与 `field.<路径>` 字段。
10. WHEN 用户提交耗时查询, THE Log_分析器 SHALL 支持 `costMs` 或 `duration` 与 `>`、`>=`、`<`、`<=`、`=`、`!=` 的数值比较。
11. WHEN 用户提交字段包含查询, THE Log_分析器 SHALL 使用 `:` 执行不区分大小写的字面包含比较。
12. WHEN 高级查询超过 2,000 个字符或 200 个 token, THE Log_分析器 SHALL 拒绝高级查询并显示限制原因。
13. IF 高级查询包含未闭合引号、缺失括号、缺失比较值或未允许字段, THEN THE Log_分析器 SHALL 显示查询错误并保留错误提交前的筛选结果。
14. WHILE Log_分析器编译或执行高级查询, THE Log_分析器 SHALL 将查询内容限制为字面比较与逻辑组合。

### Requirement 6: 上下文与 Trace 分析

**User Story:** 作为分布式系统维护者，我希望围绕事件查看上下文和 Trace，以便还原问题发生过程。

#### Acceptance Criteria

1. WHEN 用户选择一条日志记录, THE Log_分析器 SHALL 显示日志记录的完整正文、识别字段与上下文入口。
2. WHERE 上下文数量为 10、20 或 50, WHEN 用户查看上下文, THE Log_分析器 SHALL 显示选中记录前后各不超过所选数量的记录。
3. WHERE 上下文范围为全局, WHEN 用户查看上下文, THE Log_分析器 SHALL 从完整时间线选择相邻记录。
4. WHERE 上下文范围为同线程且选中记录具有线程, WHEN 用户查看上下文, THE Log_分析器 SHALL 仅从相同线程选择相邻记录。
5. WHERE 上下文范围为同 Trace 且选中记录具有 Trace_Key, WHEN 用户查看上下文, THE Log_分析器 SHALL 仅从相同 Trace_Key 选择相邻记录。
6. WHEN 用户选择上下文事件, THE Log_分析器 SHALL 定位并显示对应日志记录。
7. WHEN 日志记录具有 Trace_Key, THE Log_分析器 SHALL 按 Trace_Key 聚合 Trace。
8. WHEN Log_分析器显示 Trace 摘要, THE Log_分析器 SHALL 显示事件数、最高级别、起止时间、跨度与来源集合。
9. WHEN 用户选择 Trace, THE Log_分析器 SHALL 按有效时间与稳定输入顺序显示 Trace 事件入口。

### Requirement 7: Java 异常归组与堆栈详情

**User Story:** 作为 Java 系统维护者，我希望按根因与业务位置聚合异常，以便识别重复故障模式。

#### Acceptance Criteria

1. WHEN 日志记录包含 Java_异常, THE Log_分析器 SHALL 提取异常因果链、根因类型与 Java 栈帧。
2. WHEN Java_异常包含匹配用户配置业务包前缀的栈帧, THE Log_分析器 SHALL 选择首个匹配栈帧作为业务栈帧。
3. WHEN Java_异常不包含匹配用户配置业务包前缀的栈帧, THE Log_分析器 SHALL 选择首个非 JDK 且非常见框架栈帧作为业务栈帧。
4. WHEN Log_分析器识别 Java_异常, THE Log_分析器 SHALL 使用异常组键聚合异常记录。
5. WHEN 两条 Java_异常具有相同根因类型与归一化业务栈帧, THE Log_分析器 SHALL 将两条 Java_异常归入同一异常组。
6. WHEN Log_分析器显示异常组, THE Log_分析器 SHALL 显示出现次数、首次时间、最后时间与关联 Trace 数量。
7. WHEN 用户查看 Java_异常详情, THE Log_分析器 SHALL 显示异常链、根因与首个业务栈帧。
8. WHEN 用户查看 Java_异常详情, THE Log_分析器 SHALL 将 JDK 与常见框架栈帧放入可展开区域。
9. WHEN 用户选择异常组, THE Log_分析器 SHALL 使用异常组键筛选时间线结果。

### Requirement 8: 受限消息聚类

**User Story:** 作为日志分析者，我希望归并参数不同但结构相同的消息，以便发现高频事件模板。

#### Acceptance Criteria

1. WHEN 用户启动消息聚类, THE Log_分析器 SHALL 使用当前非空筛选结果作为聚类输入。
2. WHEN 用户启动消息聚类且当前筛选结果为空, THE Log_分析器 SHALL 使用当前会话全部日志记录作为聚类输入。
3. WHEN Log_分析器生成聚类键, THE Log_分析器 SHALL 归一化 UUID、长十六进制标识、IP、数字、引号值与耗时值。
4. WHEN Log_分析器执行消息聚类, THE Log_分析器 SHALL 仅聚类级别不低于 `INFO` 的记录。
5. IF 聚类输入超过 50,000 条日志记录, THEN THE Log_分析器 SHALL 拒绝运行聚类并显示 50,000 条限制。
6. WHEN 聚类输入不超过 50,000 条日志记录, THE Log_分析器 SHALL 返回按数量降序排列的至多 200 个聚类。
7. WHEN Log_分析器显示聚类, THE Log_分析器 SHALL 显示聚类模板、记录数、级别集合、首次时间与最后时间。
8. WHEN 用户选择聚类, THE Log_分析器 SHALL 使用聚类键筛选时间线结果。

### Requirement 9: 书签与会话行为

**User Story:** 作为日志分析者，我希望在当前排查会话中标记事件并添加备注，以便快速回访关键记录。

#### Acceptance Criteria

1. WHEN 用户为日志记录创建书签, THE Log_分析器 SHALL 将书签绑定到对应日志记录。
2. WHEN 用户保存书签备注, THE Log_分析器 SHALL 将备注限制为前 1,000 个字符。
3. WHEN 用户编辑书签, THE Log_分析器 SHALL 更新对应日志记录的书签备注。
4. WHEN 用户删除书签, THE Log_分析器 SHALL 从当前会话书签集合移除对应书签。
5. WHEN Log_分析器显示已加书签的记录, THE Log_分析器 SHALL 在时间线与书签面板提供可区分标识。
6. WHEN 用户选择书签面板中的书签, THE Log_分析器 SHALL 定位并显示对应日志记录。
7. WHEN 新输入批次成功提交或用户清空会话, THE Log_分析器 SHALL 清空旧会话的书签。
8. WHILE 当前页面保持打开且会话未被替换, THE Log_分析器 SHALL 保留会话书签。

### Requirement 10: 统计与交互式分析

**User Story:** 作为日志分析者，我希望查看数量、耗时和维度分布，以便快速判断问题规模与热点。

#### Acceptance Criteria

1. WHEN 会话成功提交, THE Log_分析器 SHALL 显示总记录数、各标准级别记录数、含耗时记录数与来源数。
2. WHEN 筛选结果发生变化, THE Log_分析器 SHALL 基于筛选结果更新直方图、耗时统计与 Top N。
3. WHEN 筛选结果包含有效时间, THE Log_分析器 SHALL 生成至多 120 个按分钟或小时跨度合并的时间桶。
4. WHEN Log_分析器显示时间桶, THE Log_分析器 SHALL 同时显示总记录数量与 `ERROR` 及以上记录数量。
5. WHEN 用户选择时间桶, THE Log_分析器 SHALL 将时间筛选设置为对应时间桶的包含边界。
6. WHEN 筛选结果包含 `durationMs`, THE Log_分析器 SHALL 显示样本数、慢事件数、最大值、平均值、P50、P90、P95 与 P99。
7. WHEN Log_分析器显示最慢事件排行, THE Log_分析器 SHALL 提供可定位到对应日志记录的入口。
8. WHEN 用户选择 Logger、线程、来源、Trace、异常、HTTP path 或 HTTP status 维度, THE Log_分析器 SHALL 显示指定数量范围 1 至 50 的 Top N。
9. WHEN 用户选择 Top N 非空项, THE Log_分析器 SHALL 生成并应用对应字段的字面高级查询。

### Requirement 11: 文本与 JSON 报告导出

**User Story:** 作为日志分析者，我希望导出当前匹配结果与分析摘要，以便离线共享和继续处理。

#### Acceptance Criteria

1. WHEN 筛选结果非空且用户启动文本导出, THE Log_分析器 SHALL 生成 UTF-8 编码的 `log-analysis-filtered.log`。
2. WHEN Log_分析器生成文本导出, THE Log_分析器 SHALL 按时间线顺序包含筛选结果的完整原始正文。
3. WHEN 筛选结果非空且用户启动 JSON 报告导出, THE Log_分析器 SHALL 生成 schema 为 `offline-log-analyzer-v2` 的 `log-analysis-report.json`。
4. WHEN Log_分析器生成 JSON 报告, THE Log_分析器 SHALL 包含来源元数据、活动筛选、警告、统计、异常组、慢事件、Trace 摘要、书签与匹配记录。
5. WHEN 筛选结果为空, THE Log_分析器 SHALL 将文本导出与 JSON 报告导出保持为不可用状态。
6. WHEN Log_分析器完成导出, THE Log_分析器 SHALL 释放用于下载的临时对象 URL。

### Requirement 12: 导出脱敏

**User Story:** 作为处理敏感日志的用户，我希望导出时默认替换常见敏感值，以便降低误分享风险。

#### Acceptance Criteria

1. WHEN Log_分析器初始化导出控件, THE Log_分析器 SHALL 默认启用脱敏。
2. WHERE 脱敏已启用, WHEN Log_分析器导出文本, THE Log_分析器 SHALL 对每条导出正文应用脱敏。
3. WHERE 脱敏已启用, WHEN Log_分析器导出 JSON 报告, THE Log_分析器 SHALL 对报告中嵌套字符串与书签备注应用脱敏。
4. WHERE 脱敏已启用, WHEN 导出内容包含邮箱、中国大陆手机号、Authorization、Bearer、Cookie、token、API key、password、IP、常见用户标识或 13 至 19 位数字, THE Log_分析器 SHALL 使用对应占位值替换匹配内容。
5. WHERE 用户关闭脱敏, WHEN Log_分析器执行导出, THE Log_分析器 SHALL 保留筛选结果中的原始值。
6. WHEN Log_分析器生成 JSON 报告, THE Log_分析器 SHALL 记录脱敏启用状态与“尽力而为，不保证完全”的复核提示。
7. WHEN Log_分析器显示导出功能说明, THE Log_分析器 SHALL 提示用户在分享前复核脱敏结果。

### Requirement 13: 安全解析模板

**User Story:** 作为使用私有日志格式的用户，我希望配置受约束的解析模板，以便映射组织特有字段而不执行脚本。

#### Acceptance Criteria

1. WHEN 用户提交 regex 模板, THE Log_分析器 SHALL 要求模板包含 `pattern`、允许的 `flags` 与识别字段捕获组映射。
2. WHEN 用户提交 JSONL 模板, THE Log_分析器 SHALL 要求模板包含识别字段到点分字段路径的映射。
3. IF regex 模板的 pattern 为空或超过 500 个字符, THEN THE Log_分析器 SHALL 拒绝模板并显示限制原因。
4. IF regex 模板的 flags 包含 `i`、`m`、`u` 之外的值或重复值, THEN THE Log_分析器 SHALL 拒绝模板并显示限制原因。
5. IF regex 模板包含超过 50 个捕获组、环视、反向引用、明显嵌套量词、重复分支量词或高风险通配回溯结构, THEN THE Log_分析器 SHALL 拒绝模板并显示结构原因。
6. IF 模板映射包含非识别字段或非法路径, THEN THE Log_分析器 SHALL 拒绝模板并显示映射原因。
7. WHEN 已接受模板无法解析输入行, THE Log_分析器 SHALL 将对应输入行回退到内置文本解析结果。
8. WHEN 用户导入模板文件, THE Log_分析器 SHALL 将模板文件大小限制为 1 MiB。
9. WHEN 用户导出有效模板, THE Log_分析器 SHALL 生成不含日志正文的 JSON 文件。
10. WHILE Log_分析器处理模板, THE Log_分析器 SHALL 将模板内容限制为数据与正则表达式而不执行模板脚本。
11. WHERE 已接受模板采用 regex 模式, IF 输入行超过模板正则单行上限, THEN THE Log_分析器 SHALL 跳过用户模板正则并将该行回退到内置文本解析结果。

### Requirement 14: 大文件处理、进度与虚拟列表

**User Story:** 作为处理大型日志的用户，我希望工具在明确边界内分块工作并持续响应，以便观察进度或取消批次。

#### Acceptance Criteria

1. WHEN Log_分析器读取非空日志文件, THE Log_分析器 SHALL 使用连续读取块处理日志文件。
2. WHEN 日志文件大小等于 262,144,000 字节, THE Log_分析器 SHALL 接受日志文件进入读取流程。
3. IF 日志文件大小大于 262,144,000 字节, THEN THE Log_分析器 SHALL 在读取前拒绝日志文件。
4. WHILE 输入批次正在读取或解析, THE Log_分析器 SHALL 使用主线程分块_yield处理模型。
5. WHILE 输入批次正在读取或解析, THE Log_分析器 SHALL 在每个读取块完成后更新批次序号、来源名称、编码、格式与来源进度。
6. WHILE 输入批次正在读取、逐行解析或建立索引, THE Log_分析器 SHALL 周期性让出浏览器事件循环。
7. WHILE 输入批次正在处理, THE Log_分析器 SHALL 保持取消批次操作可触发直至收到取消请求。
8. WHEN 筛选结果超出结果视口容量, THE Log_分析器 SHALL 使用虚拟列表显示结果。
9. WHILE 虚拟列表处于活动状态, THE Log_分析器 SHALL 仅创建可见行与可见范围前后各至多 10 行的日志行元素。
10. WHEN 用户滚动或调整视口尺寸, THE Log_分析器 SHALL 按时间线顺序更新虚拟列表可见范围。

### Requirement 15: 隐私与会话存储边界

**User Story:** 作为处理敏感日志的用户，我希望日志正文只驻留当前页面会话，以便避免跨会话残留与网络外传。

#### Acceptance Criteria

1. WHILE Log_分析器处理日志正文, THE Log_分析器 SHALL 将日志正文限制在当前页面内存与用户主动生成的下载文件中。
2. WHILE Log_分析器处理日志正文, THE Log_分析器 SHALL 省略向持久化存储写入日志正文的操作。
3. WHILE Log_分析器处理日志正文, THE Log_分析器 SHALL 省略由日志正文触发的网络请求。
4. WHEN 用户清空或重置会话, THE Log_分析器 SHALL 释放当前会话中的日志记录、元数据、聚合结果与书签引用。
5. WHEN 当前页面刷新或关闭, THE Log_分析器 SHALL 不提供恢复已关闭会话日志正文的能力。
6. WHERE Log_分析器保存主题偏好, THE Log_分析器 SHALL 将 localStorage 内容限制为键 `log-analyzer-theme-v2` 与值 `dark` 或 `light`。
7. WHILE 用户未执行导出操作, THE Log_分析器 SHALL 省略创建包含日志正文的本地文件。

### Requirement 16: 与仓库一致的主题圆点和标题

**User Story:** 作为现有工具用户，我希望日志分析器沿用仓库统一的主题圆点交互，以便获得一致且可访问的主题切换体验。

#### Acceptance Criteria

1. WHEN 页面呈现品牌区域, THE Log_分析器 SHALL 仅显示品牌图标、“日志分析器 V2”标题与紧邻标题的主题圆点。
2. THE Log_分析器 SHALL 使用原生 `button` 元素实现主题圆点。
3. THE Log_分析器 SHALL 为主题圆点应用主题参考页 `.theme-dot` 的 10×10 CSS 像素尺寸、零内边距、零边框、50% 圆角、`currentColor` 背景与指针光标样式。
4. WHEN 指针悬停主题圆点, THE Log_分析器 SHALL 按主题参考页在 150 毫秒过渡中将主题圆点缩放至 1.35 倍。
5. WHEN 主题圆点获得 `:focus-visible` 焦点, THE Log_分析器 SHALL 显示 2 CSS 像素 `#0a84ff` 轮廓与 2 CSS 像素轮廓偏移。
6. THE Log_分析器 SHALL 为主题圆点设置 `aria-label="切换主题"` 与 `title="切换深色 / 浅色主题"`。
7. WHEN 键盘用户聚焦主题圆点并按下 Space 或 Enter, THE Log_分析器 SHALL 切换深色主题与浅色主题。
8. WHEN 用户触发主题切换, THE Log_分析器 SHALL 在 `body.dark` 与 `body.light` 之间切换并保存主题标识。
9. WHEN Log_分析器重新打开, THE Log_分析器 SHALL 应用已保存的有效主题标识。
10. IF 已保存主题标识缺失或无效, THEN THE Log_分析器 SHALL 应用深色主题。
11. WHILE 任一主题处于活动状态, THE Log_分析器 SHALL 对输入、筛选、统计、时间线、侧栏、详情与高级分析区域应用对应主题变量。

### Requirement 17: 操作状态与安全呈现

**User Story:** 作为日志分析者，我希望操作结果和动态日志内容被清楚且安全地呈现，以便理解当前状态并避免日志内容改变界面结构。

#### Acceptance Criteria

1. WHEN Log_分析器正在读取、解析、取消、筛选、聚类、导出或发生错误, THE Log_分析器 SHALL 显示对应操作状态。
2. WHEN 操作状态发生变化, THE Log_分析器 SHALL 使用页面状态区、进度区或提示消息呈现新状态。
3. WHEN Log_分析器将日志正文、字段、来源名称、查询值或书签备注写入页面, THE Log_分析器 SHALL 将动态内容呈现为文本而不解释为 HTML。
4. WHEN Log_分析器没有已提交会话, THE Log_分析器 SHALL 显示选择文件、拖放或粘贴的空状态。
5. WHEN 已提交会话没有匹配结果, THE Log_分析器 SHALL 显示调整筛选或高级查询的空结果状态。
6. WHEN 日志记录具有时间、级别、来源、线程或 logger, THE Log_分析器 SHALL 在时间线中以可区分字段显示对应值。

### Requirement 18: V2 验证覆盖

**User Story:** 作为维护者，我希望 V2 通过覆盖关键边界的验证集合，以便在继续完善功能时发现行为回归。

#### Acceptance Criteria

1. WHEN V2_验证集验收主文件, THE V2_验证集 SHALL 验证现有文本解析、字段提取、稳定时间线、组合筛选、统计与虚拟列表能力。
2. WHEN V2_验证集验收主题交互, THE V2_验证集 SHALL 对照主题参考页验证主题圆点的 DOM 位置、视觉尺寸、悬停、键盘激活、焦点轮廓、可访问名称与主题持久化。
3. WHEN V2_验证集验收标题区域, THE V2_验证集 SHALL 验证品牌区域未呈现“单文件 · 离线 · 零依赖”附加文案。
4. WHEN V2_验证集验收输入批次, THE V2_验证集 SHALL 分别验证多文件成功提交、任一来源失败回滚与取消后保留旧会话。
5. WHEN V2_验证集验收高级查询, THE V2_验证集 SHALL 覆盖隐式 AND、显式布尔优先级、括号、引号、取反、字段别名、`field.<路径>`、耗时边界比较与无效表达式。
6. WHEN V2_验证集验收上下文与 Trace, THE V2_验证集 SHALL 覆盖全局、同线程、同 Trace 三种上下文范围以及 Trace 摘要和事件定位。
7. WHEN V2_验证集验收异常与聚类, THE V2_验证集 SHALL 覆盖异常组键稳定性、业务栈帧选择、聚类归一化、50,000 条输入边界与 200 簇输出边界。
8. WHEN V2_验证集验收书签, THE V2_验证集 SHALL 覆盖创建、编辑、删除、定位、会话替换清理与 JSON 报告包含书签备注。
9. WHEN V2_验证集验收导出, THE V2_验证集 SHALL 覆盖筛选顺序、UTF-8 文本、JSON schema、脱敏启用与关闭、嵌套字符串脱敏及脱敏提示。
10. WHEN V2_验证集验收字符编码, THE V2_验证集 SHALL 使用 UTF-8、GBK 与 GB18030 夹具验证自动检测、显式选择、跨读取块字符与严格解码失败。
11. WHEN V2_验证集验收 JSONL, THE V2_验证集 SHALL 分别验证自动_JSONL坏行保留告警与显式_JSONL坏行终止回滚。
12. WHEN V2_验证集验收文件边界, THE V2_验证集 SHALL 覆盖空文件、读取块边界、恰好 250 MiB、超过 250 MiB 一字节与多个接近上限文件的取消场景。
13. WHEN V2_验证集验收隐私边界, THE V2_验证集 SHALL 验证日志正文未进入持久化存储且日志处理未触发网络请求。
14. WHEN V2_验证集验收交付约束, THE V2_验证集 SHALL 在 Chrome_125_及以上版本离线打开主文件并验证零外部依赖与零控制台错误。
15. IF V2_验证集发现要求行为失败, THEN THE V2_验证集 SHALL 记录可复现输入、操作步骤、预期结果与实际结果。

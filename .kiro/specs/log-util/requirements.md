# Requirements Document

## Introduction

`log-util` 是一个面向纯内网和离线环境的浏览器端日志分析工具。首版以单个 HTML 文件交付，支持通过文件选择、拖放和粘贴载入常见文本日志与 Java 异常堆栈，提供字段识别、组合过滤、异常智能归组、统计摘要和过滤结果导出。工具面向约 100 MiB 的本地日志文件，使用分块读取、后台解析和虚拟化展示，并且不持久化日志内容。工具实现目录固定为 `/Users/mac/Downloads/task-matrix/otherUtils/logUtil/`，与 `jsonUtil` 相互独立。

## Glossary

- **Log_工具**：本特性提供的浏览器端日志分析工具。
- **工具目录**：绝对路径 `/Users/mac/Downloads/task-matrix/otherUtils/logUtil/`。
- **JSON_工具目录**：绝对路径 `/Users/mac/Downloads/task-matrix/otherUtils/jsonUtil/`。
- **单文件_HTML**：工具目录中的 `log-util.html`，包含 Log_工具的全部结构、样式和脚本。
- **说明文档**：工具目录中的 `README.md`。
- **外部依赖**：运行时从单文件_HTML 外加载的脚本、样式、字体、框架、库、服务或网络资源。
- **Chrome_125_及以上版本**：主版本号不低于 125 的 Google Chrome 浏览器。
- **日志文本**：用户通过文件选择、拖放或粘贴提供的 UTF-8 纯文本内容。
- **常见文本日志**：由单行或多行日志记录组成的日志文本，可包含时间、级别、线程、类名、消息和 Java 异常堆栈。
- **日志记录**：一个起始日志行及其后续连续附属行构成的显示、过滤和导出单位。
- **起始日志行**：包含可识别时间或可识别级别字段、并开启一条日志记录的文本行。
- **附属行**：起始日志行之后、不满足起始日志行条件且归属于同一日志记录的文本行。
- **Java_异常堆栈**：包含异常头、`at` 栈帧以及可选的 `Caused by`、`Suppressed` 或省略帧行的多行 Java 异常文本。
- **JSON_Lines**：两个或以上非空行分别构成完整 JSON 值的文本格式。
- **可识别时间**：符合 `yyyy-MM-dd HH:mm:ss[.SSS]`、`yyyy-MM-dd'T'HH:mm:ss[.SSS][Z|±HH:mm]` 或 `MM-dd HH:mm:ss[.SSS]` 形式的时间字段，其中方括号部分为可选部分。
- **可识别级别**：不区分大小写的 `TRACE`、`DEBUG`、`INFO`、`WARN`、`WARNING`、`ERROR`、`FATAL` 或 `SEVERE` 字段；`WARNING` 归一化为 `WARN`，`SEVERE` 归一化为 `ERROR`。
- **线程**：由方括号包围的线程名称字段，或位于可识别级别之后、类名之前的线程名称字段。
- **类名**：日志记录起始行中表示记录器来源的 Java 简单类名或点分限定类名。
- **未结构化记录**：无法识别时间、级别、线程和类名，但仍保留原始文本的日志记录。
- **关键字过滤**：对日志记录完整原始文本执行不区分大小写的字面子串匹配。
- **时间过滤**：按包含起点和终点的时间区间匹配具有可识别时间的日志记录。
- **级别过滤**：按一个或多个可识别级别匹配日志记录。
- **过滤结果**：同时满足当前关键字过滤、时间过滤和级别过滤条件的日志记录集合。
- **异常类型**：Java 异常头中首个以 `Exception`、`Error` 或 `Throwable` 结尾的点分限定类型名称。
- **业务栈帧**：Java 异常堆栈中首个类名不以 `java.`、`javax.`、`jdk.`、`sun.`、`com.sun.`、`org.springframework.`、`org.apache.` 或 `kotlin.` 开头的 `at` 栈帧。
- **归一化首个业务栈帧**：业务栈帧的点分限定类名与方法名，移除源文件名、源代码行号、`Native Method` 和 `Unknown Source` 信息。
- **异常归组键**：异常类型与归一化首个业务栈帧的组合；缺少业务栈帧时使用异常类型与“无业务栈帧”的组合。
- **统计摘要**：总日志记录数、当前过滤结果数、当前过滤结果级别分布、异常记录数、异常组数和可识别时间范围的集合。
- **大型日志文件**：文件大小不超过 100 MiB 的本地日志文件，1 MiB 等于 1,048,576 字节。
- **分块读取**：按多个连续字节区段读取大型日志文件，而非一次读取整个文件。
- **后台解析**：在浏览器主界面线程之外解析日志文本。
- **虚拟化展示**：仅为可见结果及相邻缓冲区创建页面记录元素的展示方式。
- **会话数据**：当前页面打开期间保存在内存中的日志文本、日志记录、识别字段、异常信息和过滤结果。
- **持久化存储**：页面关闭后仍可保留数据的 localStorage、sessionStorage、IndexedDB、Cookie、Cache Storage 或文件系统存储。
- **参考界面**：`JSON_工具目录/json-formatter.html` 与用户提供的界面附图所体现的紧凑 macOS 风格、圆角面板、系统字体、蓝色主操作和深浅主题视觉语言。

## Requirements

### Requirement 1: 独立离线交付


**User Story:** 作为离线环境用户，我希望获得独立的单文件日志工具，以便无需安装、联网或改动既有 JSON 工具即可分析日志。

#### Acceptance Criteria

1. THE Log_工具 SHALL 将单文件_HTML 和说明文档放置在工具目录中。
2. THE Log_工具 SHALL 将全部运行功能、样式和脚本内联在单文件_HTML 中。
3. THE Log_工具 SHALL 在运行时使用零外部依赖。
4. WHILE 网络不可用, THE Log_工具 SHALL 提供全部首版功能。
5. THE Log_工具 SHALL 支持 Chrome_125_及以上版本。
6. WHEN Log_工具被开发或维护, THE Log_工具 SHALL 保持 JSON_工具目录中的文件内容不变。
7. WHEN Log_工具发生功能或使用方式变化, THE Log_工具 SHALL 同步更新说明文档。

### Requirement 2: 日志输入

**User Story:** 作为日志分析者，我希望通过文件选择、拖放或粘贴载入日志，以便使用适合当前工作方式的输入途径。

#### Acceptance Criteria

1. WHEN 用户启动文件选择操作, THE Log_工具 SHALL 打开允许选择一个本地文件的文件选择器。
2. WHEN 用户选择包含日志文本的文件, THE Log_工具 SHALL 载入日志文本并开始解析。
3. WHEN 用户向页面拖放一个包含日志文本的文件, THE Log_工具 SHALL 载入日志文本并开始解析。
4. WHEN 用户向日志输入区域粘贴日志文本, THE Log_工具 SHALL 载入日志文本并开始解析。
5. IF 用户选择或拖放多个文件, THEN THE Log_工具 SHALL 显示错误原因并保留当前会话数据。
6. IF 浏览器无法将输入文件解码为 UTF-8 日志文本, THEN THE Log_工具 SHALL 显示错误原因并保留当前会话数据。
7. IF 输入内容符合 JSON_Lines, THEN THE Log_工具 SHALL 显示“不支持 JSON Lines”状态并省略日志解析结果。
8. WHEN 用户载入空日志文本, THE Log_工具 SHALL 显示零条日志记录的空状态。

### Requirement 3: 日志解析与字段识别

**User Story:** 作为日志分析者，我希望工具自动识别日志结构，以便无需预先配置格式即可查看关键字段。

#### Acceptance Criteria

1. WHEN 日志文本包含起始日志行, THE Log_工具 SHALL 按原始顺序创建日志记录。
2. WHEN 起始日志行之后包含附属行, THE Log_工具 SHALL 将附属行并入对应日志记录。
3. WHEN 日志记录包含可识别时间, THE Log_工具 SHALL 提取可识别时间作为日志记录的时间字段。
4. WHEN 日志记录包含可识别级别, THE Log_工具 SHALL 提取并归一化可识别级别作为日志记录的级别字段。
5. WHEN 日志记录包含线程, THE Log_工具 SHALL 提取线程作为日志记录的线程字段。
6. WHEN 日志记录包含类名, THE Log_工具 SHALL 提取类名作为日志记录的类名字段。
7. WHEN 日志文本包含 Java_异常堆栈, THE Log_工具 SHALL 将完整 Java_异常堆栈保留在所属日志记录中。
8. WHEN 日志文本包含无法归入起始日志行的文本, THE Log_工具 SHALL 按原始顺序保留对应文本为未结构化记录。
9. IF 日志记录缺少任一可识别字段, THEN THE Log_工具 SHALL 使用“未识别”状态表示对应字段并保留日志记录原始文本。

### Requirement 4: 组合过滤

**User Story:** 作为日志分析者，我希望按关键字、时间和级别筛选日志，以便缩小问题排查范围。

#### Acceptance Criteria

1. WHEN 用户提供关键字过滤值, THE Log_工具 SHALL 仅在过滤结果中包含满足关键字过滤的日志记录。
2. WHEN 用户提供时间过滤起点或终点, THE Log_工具 SHALL 仅在过滤结果中包含满足时间过滤的日志记录。
3. WHEN 时间过滤处于活动状态且日志记录缺少可识别时间, THE Log_工具 SHALL 从过滤结果中排除对应日志记录。
4. WHEN 用户选择一个或多个级别过滤值, THE Log_工具 SHALL 在过滤结果中包含满足任一所选级别的日志记录。
5. WHEN 关键字过滤、时间过滤或级别过滤中的两个或以上条件处于活动状态, THE Log_工具 SHALL 在过滤结果中包含同时满足全部活动条件的日志记录。
6. WHEN 用户清除全部过滤条件, THE Log_工具 SHALL 按原始顺序显示全部日志记录。
7. WHEN 用户修改任一过滤条件, THE Log_工具 SHALL 在 300 毫秒内开始更新过滤结果。

### Requirement 5: Java 异常智能归组

**User Story:** 作为 Java 系统维护者，我希望相同根因位置的异常聚合显示，以便识别重复故障和主要故障模式。

#### Acceptance Criteria

1. WHEN Java_异常堆栈包含异常类型, THE Log_工具 SHALL 提取异常类型。
2. WHEN Java_异常堆栈包含业务栈帧, THE Log_工具 SHALL 提取归一化首个业务栈帧。
3. WHEN Java_异常堆栈包含异常类型, THE Log_工具 SHALL 生成异常归组键。
4. WHEN 两条或以上异常记录具有相同异常归组键, THE Log_工具 SHALL 将对应异常记录归入同一异常组。
5. WHEN 两条异常记录的异常类型或归一化首个业务栈帧不同, THE Log_工具 SHALL 将对应异常记录归入不同异常组。
6. WHEN 用户查看异常组, THE Log_工具 SHALL 显示异常归组键、记录数量和组内日志记录入口。
7. WHEN 过滤条件发生变化, THE Log_工具 SHALL 基于过滤结果重新计算异常组及记录数量。

### Requirement 6: 统计摘要

**User Story:** 作为日志分析者，我希望查看日志统计概览，以便快速评估数据规模、级别分布和异常集中度。

#### Acceptance Criteria

1. WHEN 日志解析产生结果, THE Log_工具 SHALL 显示总日志记录数和当前过滤结果数。
2. WHEN 过滤结果包含可识别级别, THE Log_工具 SHALL 显示当前过滤结果中每个可识别级别的记录数量。
3. WHEN 过滤结果包含 Java_异常堆栈, THE Log_工具 SHALL 显示异常记录数和异常组数。
4. WHEN 日志记录包含可识别时间, THE Log_工具 SHALL 显示全部日志记录中最早与最晚的可识别时间。
5. WHEN 过滤条件发生变化, THE Log_工具 SHALL 在过滤结果更新完成后的 300 毫秒内更新统计摘要。
6. WHEN 对应统计维度没有数据, THE Log_工具 SHALL 为对应统计值显示零或“未识别”状态。

### Requirement 7: 过滤结果导出

**User Story:** 作为日志分析者，我希望导出当前筛选出的原始日志，以便离线分享或继续处理。

#### Acceptance Criteria

1. WHEN 用户启动导出操作, THE Log_工具 SHALL 将过滤结果导出为 UTF-8 文本日志文件。
2. WHEN Log_工具生成导出文件, THE Log_工具 SHALL 保留每条日志记录的完整原始文本。
3. WHEN Log_工具生成导出文件, THE Log_工具 SHALL 保留过滤结果中的日志记录相对顺序。
4. WHEN Log_工具生成导出文件, THE Log_工具 SHALL 省略未包含在过滤结果中的日志记录。
5. WHEN 过滤结果为空且用户启动导出操作, THE Log_工具 SHALL 显示无可导出记录的状态。
6. WHEN 用户确认浏览器文件保存操作, THE Log_工具 SHALL 仅通过用户发起的导出操作创建日志文件。

### Requirement 8: 大型日志处理与交互性能

**User Story:** 作为处理大型日志的用户，我希望载入和浏览约 100 MiB 的日志时界面保持可操作，以便完成本地故障分析。

#### Acceptance Criteria

1. WHEN 用户载入大型日志文件, THE Log_工具 SHALL 使用分块读取获取文件内容。
2. WHEN 用户载入大型日志文件, THE Log_工具 SHALL 使用后台解析生成日志记录和识别字段。
3. WHILE 大型日志文件正在读取或解析, THE Log_工具 SHALL 至少每 1 秒更新一次处理进度或已处理字节数。
4. WHILE 大型日志文件正在读取或解析, THE Log_工具 SHALL 在用户操作输入控件后的 200 毫秒内显示对应交互状态。
5. WHEN 日志记录或过滤结果超出结果视口容量, THE Log_工具 SHALL 使用虚拟化展示呈现结果。
6. WHILE 虚拟化展示处于活动状态, THE Log_工具 SHALL 将页面中的日志记录元素数量限制为可见记录与相邻缓冲记录且总数不超过 500 条。
7. WHEN 用户滚动虚拟化展示结果, THE Log_工具 SHALL 保持日志记录的原始相对顺序。
8. IF 大型日志文件读取或解析失败, THEN THE Log_工具 SHALL 显示失败原因并释放本次载入产生的会话数据。

### Requirement 9: 日志隐私与离线边界

**User Story:** 作为处理敏感日志的用户，我希望日志内容仅停留在当前浏览器会话中，以便降低敏感信息残留或外传风险。

#### Acceptance Criteria

1. WHILE Log_工具处理日志文本, THE Log_工具 SHALL 将会话数据限制在当前页面内存中。
2. WHILE Log_工具处理日志文本, THE Log_工具 SHALL 省略向持久化存储写入会话数据的操作。
3. WHILE Log_工具处理日志文本, THE Log_工具 SHALL 省略由日志文本、日志记录或识别字段触发的网络请求。
4. WHEN 用户载入新的日志文本, THE Log_工具 SHALL 释放上一份日志文本对应的会话数据。
5. WHEN 用户执行清空操作, THE Log_工具 SHALL 释放当前会话数据并显示空状态。
6. WHEN 当前页面关闭, THE Log_工具 SHALL 不提供恢复已关闭页面会话数据的能力。
7. WHERE Log_工具保存主题偏好, THE Log_工具 SHALL 将持久化内容限制为不含会话数据的主题标识。

### Requirement 10: 紧凑深浅主题界面

**User Story:** 作为日志分析者，我希望使用与现有工具一致的紧凑深浅主题界面，以便高密度查看日志并保持操作体验一致。

#### Acceptance Criteria

1. THE Log_工具 SHALL 提供符合参考界面的深色主题和浅色主题。
2. WHEN 用户启动主题切换操作, THE Log_工具 SHALL 在深色主题和浅色主题之间切换。
3. WHILE 深色主题处于活动状态, THE Log_工具 SHALL 对输入控件、过滤控件、统计摘要、异常组和结果视口应用深色主题。
4. WHILE 浅色主题处于活动状态, THE Log_工具 SHALL 对输入控件、过滤控件、统计摘要、异常组和结果视口应用浅色主题。
5. WHILE 任一主题处于活动状态, THE Log_工具 SHALL 使用不同颜色值区分 TRACE、DEBUG、INFO、WARN、ERROR 和 FATAL 级别。
6. WHEN 页面视口为 1440×900 CSS 像素, THE Log_工具 SHALL 在无页面水平滚动的状态下同时显示标题区、日志输入入口、过滤控件、统计摘要和结果视口。
7. WHEN Log_工具正在读取、解析、过滤、导出或遇到错误, THE Log_工具 SHALL 在页面中显示对应操作状态。
8. WHEN 日志记录包含时间、级别、线程或类名字段, THE Log_工具 SHALL 在结果视口中以可区分的字段样式显示对应字段。
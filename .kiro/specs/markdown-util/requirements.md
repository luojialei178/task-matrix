# Requirements Document

## Introduction

`markdown-util` 是一个面向纯内网和离线环境的单文件 Markdown 源文编辑与预览工具。首版范围限定为双栏实时预览、本地 `.md` 文件载入、目录导航、已确认 Markdown 语法渲染、受限图片展示、打印与浏览器保存 PDF，以及深浅主题。工具实现目录固定为 `/Users/mac/Downloads/task-matrix/otherUtils/markdownUtil/`，并与既有 `jsonUtil` 保持隔离。

## Glossary

- **Markdown_工具**：本特性提供的浏览器端 Markdown 编辑与预览工具。
- **工具目录**：绝对路径 `/Users/mac/Downloads/task-matrix/otherUtils/markdownUtil/`。
- **JSON_工具目录**：绝对路径 `/Users/mac/Downloads/task-matrix/otherUtils/jsonUtil/`。
- **单文件_HTML**：工具目录中的 `markdown-util.html`，包含 Markdown_工具的全部结构、样式和脚本。
- **说明文档**：工具目录中的 `README.md`，记录 Markdown_工具的用途、打开方式、操作方式和兼容性。
- **开发上下文文档**：工具目录中的 `CONTEXT.md`，记录 Markdown_工具的范围、技术约束和开发交接信息。
- **外部依赖**：运行时从单文件_HTML 外加载的脚本、样式、字体、框架、库、服务或其他资源。
- **Chrome_125_及以上版本**：主版本号不低于 125 的 Google Chrome 浏览器。
- **Markdown_源文本**：用户在编辑区输入或从 Markdown_文件载入的原始 Markdown 文本。
- **编辑区**：供用户输入和修改 Markdown_源文本的左侧区域。
- **预览区**：显示 Markdown_源文本渲染结果的右侧区域。
- **实时预览**：编辑区内容变化后，无需额外操作即可更新预览区的行为。
- **Markdown_文件**：文件扩展名为 `.md` 且扩展名匹配不区分大小写的本地文本文件。
- **文件选择器**：Chrome_125_及以上版本提供的本地文件选择界面。
- **拖放区域**：接收用户拖入 Markdown_文件的页面区域。
- **错误提示**：页面内显示的文件载入失败原因信息。
- **目录导航**：根据 Markdown 标题生成并用于定位预览区对应标题的导航结构。
- **首版_Markdown_语法**：标题、段落、无序列表、有序列表、任务列表、引用、链接、围栏代码块、表格和分隔线语法的集合。
- **原生_HTML**：Markdown_源文本中以 HTML 标签形式书写的内容。
- **转义显示**：将特殊字符作为可见文本呈现，且不创建特殊字符描述的 HTML 元素或执行代码。
- **Markdown_图片**：使用 `![替代文本](图片地址)` 语法描述的图片。
- **本地相对图片**：图片地址不含协议、主机信息或 `data:` 前缀的 Markdown_图片。
- **图片_Data_URL**：以 `data:image/` 开头并将图片数据编码在地址中的 URL。
- **图片不可加载提示**：在预览区代替图片显示的明确文本状态，包含“图片不可加载”文字和图片替代文本。
- **页面操作控件**：用于文件选择、打印和主题切换的页面控件。
- **打印界面**：Chrome_125_及以上版本提供的打印设置界面。
- **打印视图**：打印界面使用的页面布局。
- **PDF_文件**：通过打印界面的“保存为 PDF”操作产生的文档文件。
- **文档输出入口**：用于产生打印件或 PDF_文件的页面操作控件。
- **独立_HTML_导出**：将当前 Markdown 渲染结果另存为新 HTML 文件的功能。
- **深色主题**：以深色背景和浅色文字为主的视觉方案。
- **浅色主题**：以浅色背景和深色文字为主的视觉方案。

## Requirements

### Requirement 1: 独立离线交付

**User Story:** 作为离线环境用户，我希望获得独立的单文件工具和配套文档，以便无需安装、联网或改动既有 JSON 工具即可使用。

#### Acceptance Criteria

1. THE Markdown_工具 SHALL 将单文件_HTML、说明文档和开发上下文文档放置在工具目录中。
2. THE Markdown_工具 SHALL 将全部运行功能、样式和脚本内联在单文件_HTML 中。
3. THE Markdown_工具 SHALL 在运行时使用零外部依赖。
4. WHILE 网络不可用, THE Markdown_工具 SHALL 提供全部首版功能。
5. THE Markdown_工具 SHALL 支持 Chrome_125_及以上版本。
6. WHEN Markdown_工具的功能、范围或使用方式发生变化, THE Markdown_工具 SHALL 同步更新说明文档和开发上下文文档。
7. WHEN Markdown_工具被开发或维护, THE Markdown_工具 SHALL 保持 JSON_工具目录中的文件内容不变。

### Requirement 2: 双栏编辑与实时预览

**User Story:** 作为文档编辑者，我希望同时查看 Markdown_源文本和渲染结果，以便即时确认文档效果。

#### Acceptance Criteria

1. WHEN 单文件_HTML 打开, THE Markdown_工具 SHALL 同时显示左侧编辑区和右侧预览区。
2. WHEN 编辑区内容变化, THE Markdown_工具 SHALL 在 300 毫秒内更新预览区。
3. WHEN 编辑区内容为空, THE Markdown_工具 SHALL 显示空白预览区。
4. WHEN Markdown_源文本产生垂直溢出, THE Markdown_工具 SHALL 允许编辑区和预览区分别垂直滚动。

### Requirement 3: Markdown 文件载入

**User Story:** 作为文档编辑者，我希望通过选择或拖入 `.md` 文件载入内容，以便继续编辑已有文档。

#### Acceptance Criteria

1. WHEN 用户启动文件选择操作, THE Markdown_工具 SHALL 打开仅允许单选 Markdown_文件的文件选择器。
2. WHEN 用户在文件选择器中选择 Markdown_文件, THE Markdown_工具 SHALL 将文件文本载入编辑区并更新预览区。
3. WHEN 用户向拖放区域拖入一个 Markdown_文件, THE Markdown_工具 SHALL 将文件文本载入编辑区并更新预览区。
4. IF 用户选择或拖入扩展名不是 `.md` 的文件, THEN THE Markdown_工具 SHALL 显示错误提示并保留当前编辑区内容。
5. IF 用户向拖放区域拖入多个文件, THEN THE Markdown_工具 SHALL 显示错误提示并保留当前编辑区内容。
6. IF Chrome_125_及以上版本无法读取 Markdown_文件, THEN THE Markdown_工具 SHALL 显示错误提示并保留当前编辑区内容。

### Requirement 4: 首版 Markdown 渲染

**User Story:** 作为文档编辑者，我希望预览已确认的 Markdown 语法，以便检查文档结构和格式。

#### Acceptance Criteria

1. WHEN 编辑区包含一级至六级标题语法, THE Markdown_工具 SHALL 在预览区渲染对应层级的标题。
2. WHEN 编辑区包含段落语法, THE Markdown_工具 SHALL 在预览区渲染段落。
3. WHEN 编辑区包含无序列表或有序列表语法, THE Markdown_工具 SHALL 在预览区渲染对应列表。
4. WHEN 编辑区包含任务列表语法, THE Markdown_工具 SHALL 在预览区渲染与 Markdown_源文本勾选状态一致的只读复选框。
5. WHEN 编辑区包含引用语法, THE Markdown_工具 SHALL 在预览区渲染引用块。
6. WHEN 编辑区包含链接语法, THE Markdown_工具 SHALL 在预览区渲染具有对应链接文字和地址的可点击链接。
7. WHEN 编辑区包含围栏代码块语法, THE Markdown_工具 SHALL 在预览区以保留空白和换行的代码块渲染内容。
8. WHEN 编辑区包含表格语法, THE Markdown_工具 SHALL 在预览区渲染表头和数据行。
9. WHEN 编辑区包含分隔线语法, THE Markdown_工具 SHALL 在预览区渲染分隔线。
10. IF 首版_Markdown_语法中的特殊字符位于围栏代码块内, THEN THE Markdown_工具 SHALL 将特殊字符作为代码文本显示。

### Requirement 5: HTML 转义与图片边界

**User Story:** 作为离线环境用户，我希望预览转义原生 HTML 并限制图片来源，以便获得可控的本地渲染行为。

#### Acceptance Criteria

1. WHEN 编辑区包含原生_HTML, THE Markdown_工具 SHALL 在预览区转义显示原生_HTML。
2. WHEN 编辑区包含可执行的原生_HTML, THE Markdown_工具 SHALL 将可执行内容作为文本显示。
3. WHEN 编辑区包含本地相对图片, THE Markdown_工具 SHALL 在预览区显示图片不可加载提示。
4. WHEN 编辑区包含引用图片_Data_URL 的 Markdown_图片, THE Markdown_工具 SHALL 在预览区显示图片_Data_URL 编码的图片。
5. WHILE Markdown_工具渲染预览区, THE Markdown_工具 SHALL 将自动载入的图片来源限制为图片_Data_URL。

### Requirement 6: 目录导航

**User Story:** 作为长文档阅读者，我希望使用自动生成的目录，以便快速定位文档章节。

#### Acceptance Criteria

1. WHEN 编辑区包含一级至六级标题, THE Markdown_工具 SHALL 按标题出现顺序生成目录导航。
2. WHEN 标题层级发生变化, THE Markdown_工具 SHALL 按标题级别更新目录导航的嵌套层级。
3. WHEN 标题文本或标题顺序发生变化, THE Markdown_工具 SHALL 在预览区更新后的 300 毫秒内更新目录导航。
4. WHEN 用户选择目录导航中的标题项, THE Markdown_工具 SHALL 将预览区滚动到对应标题。
5. WHEN 多个标题具有相同文本, THE Markdown_工具 SHALL 为每个目录导航项关联对应的标题位置。
6. WHEN 编辑区不包含标题, THE Markdown_工具 SHALL 显示空目录导航状态。

### Requirement 7: 打印与浏览器保存 PDF

**User Story:** 作为文档使用者，我希望打印渲染结果或通过浏览器保存 PDF_文件，以便分发文档的静态版本。

#### Acceptance Criteria

1. THE Markdown_工具 SHALL 提供打印操作作为唯一文档输出入口。
2. WHEN 用户启动打印操作, THE Markdown_工具 SHALL 打开打印界面。
3. WHILE 打印视图处于活动状态, THE Markdown_工具 SHALL 仅将预览区的渲染文档纳入打印输出。
4. WHILE 打印视图处于活动状态, THE Markdown_工具 SHALL 隐藏编辑区、目录导航和文档输出入口。
5. WHEN 用户在打印界面选择保存为 PDF, THE Markdown_工具 SHALL 允许 Chrome_125_及以上版本完成 PDF_文件保存。
6. THE Markdown_工具 SHALL 省略独立_HTML_导出功能。

### Requirement 8: 深浅主题

**User Story:** 作为文档编辑者，我希望切换深浅主题，以便适应不同的阅读环境。

#### Acceptance Criteria

1. THE Markdown_工具 SHALL 提供深色主题和浅色主题。
2. WHEN 用户启动主题切换操作, THE Markdown_工具 SHALL 在深色主题和浅色主题之间切换。
3. WHILE 深色主题处于活动状态, THE Markdown_工具 SHALL 对编辑区、预览区、目录导航和页面操作控件应用深色主题。
4. WHILE 浅色主题处于活动状态, THE Markdown_工具 SHALL 对编辑区、预览区、目录导航和页面操作控件应用浅色主题。
5. WHILE 任一主题处于活动状态, THE Markdown_工具 SHALL 为编辑区文字、预览区文字和页面操作控件文字提供与对应背景不同的颜色值。
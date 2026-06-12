# LLM Token 管控平台 - 开发会话总结
# 日期：2026-06-05

---

## 一、项目现状

- 工程名：llm-app-portal（内网 Python FastAPI 项目）
- 常规增删改查接口已在内网基本开发完成
- 已完成：套餐/增量包 CRUD、用量统计查询、API Key 管理
- 待完成：OA 审批系统接入（留待后续，需内网 OA 接口文档）

---

## 二、已确认的关键设计决策

### 认证方式
- 本系统无 current_user / token 认证机制
- 身份由前端控制，通过工号（employeenum）传入 Request Body 判断身份
- 后端接口无需任何认证依赖注入，无 Header 认证

### employeenum 使用规范
- 用户侧接口（非 admin）：apply/my 等接口 body 中必填；list 接口可选传入，传入时返回该用户的启用状态
- 管理员接口：grant/detail 必填；list/count/trend 可选筛选
- 禁止 Header 中出现 employeenum

### 数据库表变更
- users 表保留 api_key 字段
- user_model_plan / user_model_pkg 去掉 api_key 冗余字段
- user_model_usage_daily / monthly 去掉 api_key 字段
- API Key 刷新只操作 users.api_key，不同步其他表

### 接口规范
- 全部 POST 方法，无 GET/PUT/DELETE
- 所有列表/查询接口支持分页（page/page_size）
- 所有接口需要 summary 和 description 参数
- OA 审批通过回调接收，不轮询

---

## 三、已完成功能（内网，无需重新开发）

- 套餐列表、申请、我的套餐
- 增量包列表、申请、我的增量包
- OA 审批回调接口（/oa/callback）、审批进度查询（/oa/status）
- API Key 查看、刷新（基于 users 表）
- 用量曲线、客户端统计
- 管理员：套餐/增量包 CRUD、用户列表/详情、手动开通
- 用户侧套餐/增量包列表支持传 employeenum 查询启用状态

---

## 四、待完成

- OA 审批系统接入（call_oa_submit 伪代码目前留白）
  - 需要：OA 接口地址、请求格式、认证方式、回调报文结构
- 对照验证（见 skill 第十四章）

---

## 五、Skill 文件

- 路径：`/Users/mac/Downloads/aitokenpy/llm-token-mgmt.md`
- 当前版本：v5.1（持续更新中）
- 用途：内网 Kimi 2.5 驱动 OpenCode 开发的指导文档

---

## 六、Kiro 配置

- 模式：Autopilot 已开启
- Trust：Security > Workspace > Trust: Startup Prompt 设为 never

---

## 七、关于「Understood 不执行」问题

Kiro 回复 Understood 但不执行，原因是上下文 token 接近限制时模型只做确认不执行操作。
解决方式：重新开启对话，或明确说「立刻执行」触发操作。

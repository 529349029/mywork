# 数据表格

## META
- agent: hermes
- scenario: standard
- tier: standard
- generated: 2026-05-06
- scale_version: 10.0
- doc: HERMES.md

## COMMANDS
dev: python -m uvicorn main:app --reload
build: pip install -e .
test: pytest
lint: ruff check .
typecheck: mypy .

## TECH_STACK
- Python
- pandas
- openpyxl
- AI API

## CODE_RULES
[ENFORCED] 使用 type hints，函数必须有参数和返回类型标注
[ENFORCED] 禁止空 catch 块
[ENFORCED] 禁止硬编码密钥

## ARCH_CONSTRAINTS
[ENFORCED] 项目结构: app/ 或 src/，入口文件明确
[GUIDE] 配置通过环境变量 + pydantic Settings 管理

## WORKFLOW
- tier: standard | mode: standard
- step_1: 探索 → 读本文档 + 扫代码 + 找技能 + 矛盾分析
- step_2: 规划 → 需求精炼 + 影响分析 + 契约定义
- step_3: 执行 → TDD(RED→GREEN→REFACTOR)，禁止同时写代码和测试
- step_4: 验证 → lint全绿 + test全过 + typecheck无错，工具验证不可脑补
- step_5: 沉淀 → 泛化检查 + 经验文档化 + AI Slop自检

## GATES
- G1: 探索完成 → 已读文件数 >= 3
- G2: 规划完成 → 计划文档含功能边界+异常契约+回滚方案
- G3: TDD合规 → 测试文件先于实现文件存在
- G4: Lint通过 → ruff check . exit code = 0
- G5: 测试通过 → pytest exit code = 0

## SKILLS
- scale-methodology: SCALE 求是方法论 → 安装: `npx skills add scale-os/scale-workflows`

## RED_LINES
- R1: 零数据丢失 → migration必须有down方法
- R2: 零静默失败 → 禁止空catch块
- R3: 零硬编码密钥 → 敏感信息走环境变量
- R4: 零幻觉 → 不确定标[UNCERTAIN]
- R5: 零甩锅 → 声称"环境问题"前必须验证

<!-- SCALE OS v10.0 · HERMES.md · 项目特定 · 详见全局提示词获取方法论 -->
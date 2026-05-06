# SCALE OS 安装指引 · Hermes Agent

> 项目: 数据表格 | 生成: 2026-05-06

## 注意事项

- 本指引为**分步手动操作指引**，不提供一键安装脚本
- 标注 **[项目级]** 的文件应提交到 git，标注 **[全局级]** 的文件不应提交
- 所有 MCP 服务器安装命令均基于确认可用的包名
- 如遇问题，请参照对应 Agent 的官方文档

### 前置条件: Linux

```bash
# 安装 Node.js 和 pnpm
sudo apt update && sudo apt install -y nodejs npm
npm install -g pnpm
```

### 安装 Python 依赖

```bash
sudo apt install -y python3 python3-pip
pip install uv
```

### Step 1: 创建 .scale/ 目录 [项目级]

```bash
mkdir -p .scale
```

创建 SCALE OS 工作流状态目录，该目录应添加到 `.gitignore`。

### Step 2: 保存知识文档 [项目级]

将生成的 `HERMES.md` 内容保存到项目根目录。

请参照 Hermes Agent 官方文档确认知识文档的放置位置和命名。

### Step 3: 保存配置文件 [项目级]

将生成的配置文件保存到 Hermes Agent 对应的配置目录。

> **注意**: Hermes Agent 的具体配置文件位置和格式，请参照官方文档。
> 生成的配置为通用 JSON 格式，可能需要根据官方文档调整。

### Step 4: 保存工作流状态 [项目级]

```bash
# 将生成的 workflow.json 内容保存到 .scale/workflow.json
```

### Step 5: 配置 Hooks [项目级]

Hermes Agent 暂不支持外部 Hooks 配置，请使用技能包内置 Hook 机制。

### Step 6: 更新 .gitignore [项目级]

```bash
grep -q "\.scale" .gitignore 2>/dev/null || echo ".scale/" >> .gitignore
```

### Step 7: 安装核心技能包 [全局级]

核心技能包: **hermes-skills**

```bash
参照 Hermes 官方文档
```

### Step 8: 安装选中的跨平台技能 [全局级]

**SCALE 求是方法论**：
```bash
npx skills add scale-os/scale-workflows
```

### Step 9: 验证安装

```bash
ruff check . 2>/dev/null && echo "✅ lint 通过" || echo "⚠️ lint 未通过（可能需要先安装依赖）"
pytest 2>/dev/null && echo "✅ test 通过" || echo "⚠️ test 未通过（可能需要先安装依赖）"
```

---

*由 SCALE OS Configurator v10.0 生成 · 推荐工作流: 探索 → 规划 → 执行 → 验证 → 沉淀*
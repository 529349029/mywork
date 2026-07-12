127.0.0.1:7890是代理，访问外网用得上
# Hermes 链上监控系统 — 日志规范标准 V1.0

> **适用范围**：Hermes 链上 DEX 交易、套利、监听、审计脚本
> **目标**：可读版 + 完整链上数据版双轨日志，便于实时监控与生产级排错

---

## 一、核心原则

### 1. 双轨日志原则

- **可读版**：用于实时监控，人类友好（symbol / 短地址）
- **完整版**：用于排查 bug、回放交易、链上验证，**禁止截断地址**

### 2. 防御性编程

- 使用 `map(str, x)` 防止 `join` 时报错
- 日志中不得包含隐式截断逻辑（如 `[:10] + '..'`）

---

## 二、字段命名规范

| 字段 | 含义 | 示例 |
|---|---|---|
| `Path` | 人类可读路径（symbol / label） | `USDT -> BUSD -> WBNB` |
| `Tokens` | 完整 token 地址 | `0x55d3... -> 0xe9e7... -> 0xbb4C...` |
| `Pools` | 完整 pool 地址 | `0x...abc -> 0x...def -> 0x...123` |
| `Block` | 区块号 | `41234567` |
| `Tx` | 交易哈希 | `0xabc123...` |

---

## 三、标准代码模板

### 1. 基础写法（推荐）

```python
_lab = lambda a: _addr_label(a, token_symbols)

log(f"[CROSS-DEX-EXEC] Path: {' -> '.join(_lab(t) for t in token_path)}")
log(f"[CROSS-DEX-EXEC] Tokens: {' -> '.join(token_path)}")
log(f"[CROSS-DEX-EXEC] Pools: {' -> '.join(pool_path)}")
```

### 2. 防御性写法（更安全）

```python
_lab = lambda a: _addr_label(a, token_symbols)

log(f"[CROSS-DEX-EXEC] Path: {' -> '.join(_lab(t) for t in token_path)}")
log(f"[CROSS-DEX-EXEC] Tokens: {' -> '.join(map(str, token_path))}")
log(f"[CROSS-DEX-EXEC] Pools: {' -> '.join(map(str, pool_path))}")
```

### 3. 完整执行日志（含 Block / Tx）

```python
log(f"[CROSS-DEX-EXEC] Block: {block_number}")
log(f"[CROSS-DEX-EXEC] Tx: {tx_hash}")
log(f"[CROSS-DEX-EXEC] Path: {' -> '.join(_lab(t) for t in token_path)}")
log(f"[CROSS-DEX-EXEC] Tokens: {' -> '.join(map(str, token_path))}")
log(f"[CROSS-DEX-EXEC] Pools: {' -> '.join(map(str, pool_path))}")
```

---

## 四、日志标签规范

统一使用 **大写中括号前缀**，同一执行链路保持相同 tag：

| 标签 | 使用场景 |
|---|---|
| `[CROSS-DEX-EXEC]` | 跨 DEX 交易执行 |
| `[CROSS-DEX-FETCH]` | 池子数据抓取 |
| `[REVERT-MONITOR]` | 交易回滚监控 |
| `[INIT-POOLS]` | 池子初始化 |
| `[AUDIT]` | 审计相关 |

### 示例

```python
log(f"[REVERT-MONITOR] Detected revert at block {block_number}")
log(f"[INIT-POOLS] Loading pools from cache...")
log(f"[AUDIT] Suspicious pool detected: {pool_address}")
```

---

## 五、禁止事项（红线）

| # | 禁止行为 | 原因 |
|---|---|---|
| 1 | `p[:10] + '..'` 截断地址 | 排查 bug 时无法定位完整地址 |
| 2 | 日志中缺少 Block / Tx 上下文 | 无法回放交易、复现问题 |
| 3 | `join` 不加 `map(str, ...)` | 对象类型变化时报错，日志炸裂 |
| 4 | 不同模块使用不一致的日志前缀 | `grep` 无法一键定位问题链路 |

---

## 六、预期输出示例

```
[CROSS-DEX-EXEC] Block: 41234567
[CROSS-DEX-EXEC] Tx: 0xabc123def456...
[CROSS-DEX-EXEC] Path: USDT -> BUSD -> WBNB
[CROSS-DEX-EXEC] Tokens: 0x55d398326f99059fF775485246999027B3197955 -> 0xe9e7CEA3DedcA5984780bafc599bD69ADd087D56 -> 0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c
[CROSS-DEX-EXEC] Pools: 0x1234...abc -> 0x5678...def -> 0x9abc...123
```

---

## 七、日志文件命名

- 日志文件名必须取自当前源文件名（`Path(__file__).stem`），**不得写死**
- 日志目录由 `.env` 中的 `LOG_DIR` 控制，不随脚本改变
- 示例：`scan_arb.py` → `logs/scan_arb.log`
- 以上规则同样适用于 `.ts` 和 `.js` 文件

---

## 八、使用说明

### 适用场景

- ✅ **Code Review Checklist**：提交 PR 前逐项核对
- ✅ **AI Prompt**：喂给 Cursor / ChatGPT / Copilot 作为上下文
- ✅ **团队规范统一**：新成员 onboarding 必读
- ✅ **日志审计**：`grep [CROSS-DEX-EXEC]` 一键定位

### 版本记录

| 版本 | 日期 | 变更 |
|---|---|---|
| V1.0 | 2026-07-12 | 初始版本，定义双轨日志原则与标准模板 |
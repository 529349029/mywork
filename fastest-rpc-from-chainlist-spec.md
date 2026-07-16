# RPC Fast Track — Chainlist 各链最快 RPC 节点技能

> 设计文档 v1.0 — 2026-06-06

## 1. 概述

从 [chainlist.org](https://chainlist.org) 获取所有 EVM 主网的 RPC 列表，实时测速后输出每个链最快的 HTTPS RPC 和 WSS RPC，生成 `.md` 和 `.yaml` 文件供其他技能/脚本/服务使用。

## 2. 技能信息

- **技能名**: `rpc-fast-track`
- **安装路径**: `~/.hermes/profiles/auditor/skills/rpc-fast-track/`
- **输出文件**:
  - `~/workspace/fastest_rpcs.md` — 人读（Markdown 表格）
  - `~/workspace/fastest_rpcs.yaml` — 机器读（YAML）

## 3. 数据源

- **URL**: `https://chainlist.org/rpcs.json`
- **数据量**: 2776 条链（含主网 + 测试网）
- **数据结构**（每条链）:
  ```json
  {
    "name": "Ethereum Mainnet",
    "chainId": 1,
    "chain": "ETH",
    "rpc": [
      { "url": "https://rpc.nodeflare.app/eth/public", "tracking": "none" },
      { "url": "wss://ethereum-rpc.publicnode.com", "tracking": "none" }
    ],
    "nativeCurrency": { "name": "Ether", "symbol": "ETH", "decimals": 18 },
    "explorers": [...],
    "tvl": 84423750187.09,
    "chainSlug": "ethereum",
    "isTestnet": false,
    "shortName": "eth"
  }
  ```

## 4. 处理逻辑

### 4.1 过滤条件
- `isTestnet` 不等于 `true`（仅主网）
- `rpc` 数组不为空（至少有一个 RPC URL）

### 4.2 RPC 分类
- **HTTPS**: URL 以 `http://` 或 `https://` 开头
- **WSS**: URL 以 `wss://` 或 `ws://` 开头

### 4.3 测速方案
- **请求**: 发送 `{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}`
- **超时**: 5 秒/RPC
- **并发**: 20 个异步请求同时进行（`aiohttp` + `asyncio`）
- **延迟计算**: 从发送到收到响应的 wall-clock 时间（毫秒）
- **排序**: 每条链按延迟升序取第 1 名
- **隐私标记**: 保留 tracking 字段（none/yes/limited），表格中展示

### 4.4 WSS 特殊处理
- WSS URL 需要 WebSocket 握手，用 `websockets` 库
- 建连后立即发 `eth_chainId`，收到响应后断开
- 超时 5s

## 5. 输出格式

### 5.1 fastest_rpcs.md（人读）

```markdown
# Fastest RPC Nodes (from Chainlist)

> 数据来源: [chainlist.org/rpcs.json](https://chainlist.org/rpcs.json)
> 生成时间: 2026-06-06T12:00:00Z
> 全主网: ~800+ 条链，每条链遍历所有 RPC 实时测速取最快

| # | ChainID | Chain | Symbol | TVL | Fastest HTTPS | Latency | Tracking | Fastest WSS | Latency |
|---|---------|-------|--------|-----|--------------|---------|----------|------------|---------|
| 1 | 1 | Ethereum Mainnet | ETH | $84.4B | https://eth.drpc.org | 45ms | none | wss://eth.drpc.org | 48ms |
| 2 | 56 | BNB Smart Chain | BNB | $7.5B | https://... | 120ms | limited | - | - |
```

- 按 TVL 降序排列
- Latency 列显示毫秒数
- WSS 无结果则显示 `-`
- Tracking 显示隐私标记

### 5.2 fastest_rpcs.yaml（机器读）

```yaml
# Fastest RPC Nodes (from Chainlist)
# Generated: 2026-06-06T12:00:00Z

1:
  name: "Ethereum Mainnet"
  chain: "ETH"
  symbol: "ETH"
  decimals: 18
  chainId: 1
  tvl: 84423750187.09
  explorer_url: "https://etherscan.io"
  fastest_https:
    url: "https://eth.drpc.org"
    latency_ms: 45
    tracking: "none"
  fastest_wss:
    url: "wss://eth.drpc.org"
    latency_ms: 48
    tracking: "none"

56:
  name: "BNB Smart Chain Mainnet"
  chain: "BNB"
  symbol: "BNB"
  decimals: 18
  chainId: 56
  tvl: 7500000000.0
  explorer_url: "https://bscscan.com"
  fastest_https:
    url: "https://..."
    latency_ms: 120
    tracking: "limited"
  fastest_wss: null
```

## 6. 脚本结构

```
~/.hermes/profiles/auditor/skills/rpc-fast-track/
├── SKILL.md                    # 技能描述
└── scripts/
    └── measure_rpcs.py         # 主脚本 — Python 3.12+
```

### SKILL.md 内容

```yaml
---
name: rpc-fast-track
description: Chainlist 各链最快 RPC 节点查询 — 从 chainlist.org 获取 RPC 列表，实时测速后输出最快节点
category: blockchain
---

# rpc-fast-track

## 用法

```bash
python3 ~/.hermes/profiles/auditor/skills/rpc-fast-track/scripts/measure_rpcs.py
```

输出到 `~/workspace/fastest_rpcs.md` + `~/workspace/fastest_rpcs.yaml`。

## 依赖

- aiohttp
- websockets
- pyyaml

## 原理

1. GET `https://chainlist.org/rpcs.json` 获取全量链数据
2. 过滤出主网（isTestnet=false）+ 有 RPC 的链
3. 每链并发 20 个异步请求测速所有 RPC（eth_chainId）
4. HTTPS 和 WSS 各自取最快
5. 按 TVL 降序输出
```

### measure_rpcs.py 伪代码

```python
import asyncio, aiohttp, websockets, json, yaml, os, time

# 配置
CHAINLIST_URL = "https://chainlist.org/rpcs.json"
OUTPUT_MD = os.path.expanduser("~/workspace/fastest_rpcs.md")
OUTPUT_YAML = os.path.expanduser("~/workspace/fastest_rpcs.yaml")
CONCURRENCY = 20  # 同时 20 条请求
TIMEOUT = 5       # 每条 RPC 超时 5s
PROXY = "http://127.0.0.1:7890"  # 外网请求走 Clash

# 1. 获取数据
chains = fetch_json(CHAINLIST_URL, proxy=PROXY)

# 2. 过滤主网
mainnets = [c for c in chains if not c.get("isTestnet") and c.get("rpc")]

# 3. 异步测速
async def measure_rpc(session, url):
    start = time.perf_counter()
    try:
        if url.startswith("http"):
            async with session.post(url, json=rpc_req, timeout=TIMEOUT) as resp:
                await resp.json()
        elif url.startswith("ws") or url.startswith("wss"):
            async with websockets.connect(...):
                ...
        latency = (time.perf_counter() - start) * 1000
        return {"url": url, "latency_ms": round(latency, 0)}
    except:
        return None

# 4. 按链分组，每条链并发测所有 RPC
results = {}
for chain in mainnets:
    rpcs = chain["rpc"]
    https = [r for r in rpcs if r["url"].startswith("http")]
    wss = [r for r in rpcs if r["url"].startswith("ws")]
    
    # 并发测速
    https_results = await batch_measure(https, CONCURRENCY)
    wss_results = await batch_measure(wss, CONCURRENCY)
    
    best_https = min(https_results, key=lambda x: x["latency_ms"]) if https_results else None
    best_wss = min(wss_results, key=lambda x: x["latency_ms"]) if wss_results else None
    
    cid = chain["chainId"]
    results[cid] = {
        "name": chain["name"],
        "symbol": chain["nativeCurrency"]["symbol"],
        "fastest_https": best_https,
        "fastest_wss": best_wss,
        "tvl": chain.get("tvl", 0),
    }

# 5. 生成 MD 表格 + YAML
generate_markdown(results)
generate_yaml(results)
```

## 7. 注意事项

1. **代理**: 所有外网请求走 Clash（`http://127.0.0.1:7890`）
2. **大文件**: rpcs.json 约 10MB+，用流式或一次性下载解析
3. **耗时估计**: ~800 链 × 平均 15 RPC = 12,000 请求 ÷ 20 并发 = 约 5-10 分钟
4. **失败处理**: 测速失败的 RPC 跳过，链至少有一个成功的 RPC 才输出
5. **WSS 限制**: WSS 建连后立即断开，不支持 wss 的节点直接超时报错

# 🏗️ Solidity 绝对专家成长路线图

> 生成时间：2026-03-31
> 目标：能写出安全、高效、可审计的合约；能发现并利用漏洞；理解 EVM 底层。

---

## 阶段一：地基（2-4 周）

### 必须掌握的基础

- Solidity 语法全集：数据类型、函数修饰符、事件、错误处理
- 合约生命周期：部署、调用、销毁
- ABI 编码/解码
- `msg.sender` / `msg.value` / `tx.origin` 的区别和陷阱
- `storage` vs `memory` vs `calldata` 的本质区别（gas 优化核心）

### 工具链

| 工具 | 说明 | 链接 |
|------|------|------|
| Foundry | 推荐首选，更接近底层 | https://book.getfoundry.sh |
| Hardhat | 主流开发框架 | https://hardhat.org |
| Remix IDE | 快速验证想法，在线使用 | https://remix.ethereum.org |
| OpenZeppelin Contracts | 标准库，必须熟读 | https://github.com/OpenZeppelin/openzeppelin-contracts |

### 实践任务

- 手写 ERC-20、ERC-721、ERC-1155（**不借助 wizard**）
- 实现一个简单的 DEX（AMM 原理）
- 写一个多签钱包

---

## 阶段二：安全（专家与普通开发者的分水岭）

### 必须能闭眼说出的漏洞类型

| 漏洞类型 | 经典案例 | 损失 |
|----------|---------|------|
| Reentrancy（重入攻击） | The DAO hack | $60M |
| Integer Overflow（整数溢出） | BEC Token | 数亿美元 |
| Access Control（权限控制） | Parity Wallet | $30M |
| Flash Loan Attack（闪电贷攻击） | 无数 DeFi 协议 | 持续发生 |
| Oracle Manipulation（预言机操纵） | Mango Markets | $114M |
| Signature Replay（签名重放） | 多个跨链桥 | 数亿美元 |
| Delegatecall Proxy（代理漏洞） | Parity Multisig | $150M |
| Frontrunning / MEV | 普遍存在 | 持续发生 |

### 闯关练习资源（按顺序完成）

| 资源 | 说明 | 链接 |
|------|------|------|
| Ethernaut | OpenZeppelin 出品，闯关式漏洞练习，**必做全部关卡** | https://ethernaut.openzeppelin.com |
| Damn Vulnerable DeFi | 更接近真实 DeFi 攻击场景 | https://www.damnvulnerabledefi.xyz |
| BlockSec CTF 题库 | 收集历年区块链 CTF 题目 | https://github.com/blockthreat/blocksec-ctfs |

---

## 阶段三：EVM 底层（真正的护城河）

### 核心知识点

- **EVM 字节码**：能读懂反编译结果
- **Opcodes**：SLOAD/SSTORE 的 gas 成本，CALL vs DELEGATECALL vs STATICCALL
- **Storage Layout**：slot 计算、packed variables、mapping 的存储位置
- **内联汇编（Yul/Assembly）**：在 Solidity 里写 assembly 块优化 gas
- **合约创建过程**：initcode vs runtime code

### 工具

| 工具 | 说明 | 链接 |
|------|------|------|
| evm.codes | 每个 opcode 的详细说明与 gas 成本 | https://www.evm.codes |
| Tenderly | 交易追踪，逐步查看每一步执行 | https://tenderly.co |
| Heimdall | 合约反编译工具 | https://github.com/Jon-Becker/heimdall-rs |

---

## 阶段四：DeFi 协议深度研究

> 原则：读**源码**，不是文档。读完后用 Foundry 写 fork 测试，模拟攻击场景。

| 协议 | 学习重点 | 源码地址 |
|------|---------|---------|
| Uniswap V2 → V3 → V4 | AMM 进化历程，理解流动性机制 | https://github.com/Uniswap |
| Aave V2 → V3 | 借贷协议，利率模型，清算机制 | https://github.com/aave/aave-v3-core |
| Compound | 利率模型，cToken 机制 | https://github.com/compound-finance/compound-protocol |
| Curve | 稳定币 AMM，StableSwap 算法 | https://github.com/curvefi/curve-contract |
| MakerDAO | CDP 机制，DAI 稳定币原理 | https://github.com/makerdao/dss |

---

## 阶段五：审计实战

### 参与路径

| 平台 | 说明 | 链接 |
|------|------|------|
| Code4rena | 公开审计比赛，有奖金池 | https://code4rena.com |
| Sherlock | 审计比赛 + 保险协议 | https://www.sherlock.xyz |
| Solodit | 汇集所有主流审计公司历史报告，必读 | https://solodit.xyz |
| Immunefi | 最大的 Web3 Bug Bounty 平台 | https://immunefi.com |

---

## 补充学习资源

| 资源 | 类型 | 链接 |
|------|------|------|
| Solidity 官方文档 | 文档 | https://docs.soliditylang.org |
| Foundry Book | 文档 | https://book.getfoundry.sh |
| Smart Contract Security Field Guide | 安全指南 | https://scsfg.io |
| Secureum Bootcamp | 免费安全课程 | https://secureum.xyz |
| Patrick Collins Solidity 课程（YouTube） | 视频教程 | https://www.youtube.com/@PatrickAlphaC |
| RareSkills（高级 Solidity 博客） | 博客 | https://www.rareskills.io |
| Noxx（EVM 深度解析） | 博客 | https://noxx.substack.com |

---

## 每日学习节奏建议

```
30 min  读一份真实审计报告（Solodit）
60 min  写代码 / 做 CTF 题
30 min  读协议源码
```

---

## 一句话总结

> 学 Solidity 语法只需一周，但成为专家需要你**主动找漏洞、读源码、参与真实审计**。
> 没有捷径，但路径很清晰。行动比计划更重要。

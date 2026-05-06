# 🛡️ 区块链智能合约安全漏洞清单（白帽子审计用）

> 版本：v1.0  
> 用途：合约审计快速参考 / Code4rena 竞赛备查 / Foundry PoC 模板对照

---

## 目录

1. [重入攻击（Reentrancy）](#1-重入攻击reentrancy)
2. [价格预言机操纵（Oracle Manipulation）](#2-价格预言机操纵oracle-manipulation)
3. [闪电贷攻击（Flash Loan Attacks）](#3-闪电贷攻击flash-loan-attacks)
4. [访问控制漏洞（Access Control）](#4-访问控制漏洞access-control)
5. [签名重放攻击（Signature Replay / Permit）](#5-签名重放攻击signature-replay--permit)
6. [交易抢跑 / MEV（Front-Running / Sandwich）](#6-交易抢跑--mevfront-running--sandwich)
7. [代理模式 / Delegatecall 漏洞](#7-代理模式--delegatecall-漏洞)
8. [数学精度 / 舍入错误](#8-数学精度--舍入错误)
9. [治理攻击（Governance Attack）](#9-治理攻击governance-attack)
10. [跨链桥攻击（Bridge Attacks）](#10-跨链桥攻击bridge-attacks)
11. [拒绝服务 / Gas 耗尽（DoS）](#11-拒绝服务--gas-耗尽dos)
12. [闪电铸 / ERC-4626 相关漏洞](#12-闪电铸--erc-4626-相关漏洞)
13. [自毁 / 合约自杀漏洞](#13-自毁--合约自杀漏洞)
14. [区块信息依赖 / 随机数可预测](#14-区块信息依赖--随机数可预测)
15. [未检查的外部调用](#15-未检查的外部调用)
16. [存储槽冲突（Storage Collision）](#16-存储槽冲突storage-collision)
17. [ERC 代币兼容性陷阱](#17-erc-代币兼容性陷阱)
18. [时间戳依赖](#18-时间戳依赖)
19. [前端 + 签名钓鱼](#19-前端--签名钓鱼)
20. [经济模型 / 激励错配](#20-经济模型--激励错配)

---

## 1. 重入攻击（Reentrancy）

| 项目 | 内容 |
|---|---|
| **风险等级** | 🔴 致命 |
| **经典案例** | The DAO Hack（$60M）, UniswapV1, Lendf.me |
| **攻击原理** | 外部合约在接收到 ETH/ERC20 后回调攻击者的 fallback/receive，在原合约状态更新前再次进入敏感函数 |
| **攻击条件** | 转账在前、状态修改在后；未加互斥锁 |
| **可能损失** | 合约资金全部被盗 |

### 变体

- **单函数重入** — 同一个函数被递归调用
- **跨函数重入** — 函数 A 调外部，外部回调函数 B
- **只读重入** — 利用重入时的中间状态操纵价格/借贷（2022 BNB Chain 多起）
- **ERC-777 回调重入** — `tokensToSend` / `tokensReceived` hooks

### ✅ 防御

- **Checks-Effects-Interactions（CEI）模式**
  ```solidity
  // ✅ 先检查 → 改状态 → 再转账
  require(balances[msg.sender] >= amount);
  balances[msg.sender] -= amount;
  (bool ok, ) = msg.sender.call{value: amount}("");
  require(ok);
  ```
- `ReentrancyGuard`（OpenZeppelin）`nonReentrant` 修饰器
- 转账用 WETH 代替 ETH（ERC20 默认无 fallback）
- 全部外部调用后置

---

## 2. 价格预言机操纵（Oracle Manipulation）

| 项目 | 内容 |
|---|---|
| **风险等级** | 🔴 致命 |
| **经典案例** | bZx（$55M）, Mango Markets（$117M）, Euler（$197M） |
| **攻击原理** | 攻击者通过大额交易或闪电贷瞬时操纵 DEX 池价格，影响依赖该价格的借贷/清算/衍生品合约 |
| **攻击条件** | 合约直接读取池子现货价格作为输入，无时间权重 |
| **可能损失** | 全部流动性被平仓或套利 |

### 常见场景

- 借贷协议清算价格
- 合成资产抵押率
- 套利机器人触发条件
- NFT 地板价喂价

### ✅ 防御

- 使用 **Chainlink 去中心化预言机**（多源聚合）
- 使用 **TWAP（时间加权平均价格）**，窗口 ≥ 30 分钟
- 加入 **偏差检查**：当前价与上次价偏差超过 X% 则暂停
- **滑点限制**：交易前后价格变化超限则 revert
- 相同资产可以使用 **多源交叉验证**

---

## 3. 闪电贷攻击（Flash Loan Attacks）

| 项目 | 内容 |
|---|---|
| **风险等级** | 🟠 高危 |
| **经典案例** | Cream Finance（$130M）, Harvest Finance, PancakeBunny |
| **攻击原理** | 从 Aave/dYdX/Balancer 借出巨额资金（零抵押），利用资金量操纵链上价格/清算/投票，归还本金+手续费后提走利润 |
| **攻击条件** | 合约依赖瞬时价格或当前余额做逻辑判断 |
| **可能损失** | 协议全部 TVL |

### 典型攻击链

```
借闪电贷 → 操纵池子价格 → 触发清算/价格依赖 → 收割利润 → 还贷
```

### ✅ 防御

- **TWAP 天然抗闪电贷**（无法瞬时操纵）
- 不要用现货/瞬时池价作为核心逻辑
- 关键操作加时间锁（Timelock）
- 费率限制 + 单笔限额

---

## 4. 访问控制漏洞（Access Control）

| 项目 | 内容 |
|---|---|
| **风险等级** | 🔴 致命 |
| **经典案例** | Parity Multisig（$280M 冻结）, Nomad Bridge |
| **攻击原理** | 敏感函数（铸币、提取、升级、销毁）缺少权限检查，或初始化函数未锁定可被重调 |
| **攻击条件** | 未使用 `onlyOwner` / `AccessControl`；`initialize()` 无 `initializer` 修饰器 |
| **可能损失** | 合约完全失控 |

### ✅ 防御

- 用 **OpenZeppelin `Ownable` / `AccessControl`**
- 初始化加 `initializer`（可升级合约）
- 构造函数调用 `_disableInitializers()`
- 提现/铸币/销毁等操作需**多签**或**时间锁**
- 所有 `public` / `external` 函数检查是否需要权限

---

## 5. 签名重放攻击（Signature Replay / Permit）

| 项目 | 内容 |
|---|---|
| **风险等级** | 🟡 中危 |
| **经典案例** | Rari Capital, Permit 2（跨链场景） |
| **攻击原理** | 同一笔 EIP-712 签名在多条链或同一个合约的不同实例中被重复使用 |
| **攻击条件** | 签名中缺少 chainId / nonce / 合约地址 |
| **可能损失** | 用户资产被重复授权 |

### ✅ 防御

- 签名中**必须包含** `chainId`、`contract address`、`nonce`
- 使用 OpenZeppelin `EIP712`（自动处理 domain separator）
- 维护已用 nonce 列表，禁止重复使用
- 跨链场景注意 `chainId` 不同

---

## 6. 交易抢跑 / MEV（Front-Running / Sandwich）

| 项目 | 内容 |
|---|---|
| **风险等级** | 🟡 中危 — 🟠 高危（视损失程度） |
| **经典案例** | 三明治攻击（无处不在）, EigenPhi 公链交易 |
| **攻击原理** | 机器人监控 mempool，在用户交易前插入自己的交易（抢跑/推价），用户交易后再收割 |
| **攻击条件** | 合约依赖交易排序或公开暴露下单意图；无滑点保护 |

### 三明治攻击流程

```
机器人抢先买 → 价格推高 → 用户以高价成交 → 机器人立即卖出获利
```

### ✅ 防御

- 设置滑点保护（`amountOutMin`）
- 设置截止时间（`deadline`）
- commit-reveal 方案（拍卖场景）
- 鼓励用户使用 Flashbots / 私有 mempool
- 公平排序（FCFS + 隐藏细节直到 reveal）

---

## 7. 代理模式 / Delegatecall 漏洞

| 项目 | 内容 |
|---|---|
| **风险等级** | 🔴 致命 |
| **经典案例** | Parity Multisig（第二次）, Audius（$6M 损失后挽回） |
| **攻击原理** | delegatecall 在代理上下文中执行逻辑合约代码，可以修改代理合约的存储；若 `upgradeTo` 无权限控制，攻击者可升级成恶意合约 |
| **攻击条件** | 可升级代理未锁定初始化；存储布局不兼容；逻辑合约有自毁函数 |

### ✅ 防御

- UUPS: `upgradeTo` 必须加权限检查
- **存储布局不可变**：永远不要删除或改变已部署代理的状态变量顺序
- 使用 OpenZeppelin Upgrades 插件（自动检查兼容性）
- 逻辑合约调用 `_disableInitializers()`
- 逻辑合约不要留有 `selfdestruct` / `delegatecall` 到任意地址

---

## 8. 数学精度 / 舍入错误

| 项目 | 内容 |
|---|---|
| **风险等级** | 🟡 中危 — 🟠 高危（积累效应） |
| **经典案例** | Compound（COMP 奖励）, Venus, Yearn v1 |
| **攻击原理** | 除法先于乘法导致精度丢失，或向用户收四舍五入差价的累积 |
| **攻击条件** | 除法的时序错误；向零取整方向不利 |

### ✅ 防御

- 使用 Solidity 0.8+（内置溢出检查）
- 使用固定精度库：**PRBMath**、**Solmate**、OpenZeppelin `Math`
- 先乘后除：`a * b / c` 而非 `a / c * b`
- 四舍五入方向对合约有利（给用户少一点）

---

## 9. 治理攻击（Governance Attack）

| 项目 | 内容 |
|---|---|
| **风险等级** | 🔴 致命 |
| **经典案例** | Beanstalk Farms（$182M）, Compound Proposal 062 |
| **攻击原理** | 闪电贷借大量治理代币 → 快速通过恶意提案（转走资金/改参数）→ 还贷跑路 |
| **攻击条件** | 投票权重依赖当前余额（非快照）；无时间锁缓冲 |

### ✅ 防御

- 投票用**快照**（Snapshot 或链上 block 级别快照），不是当前余额
- 时间锁（Timelock）≥ 24h，给社区反应窗口
- 高值操作需**多签 + 时间锁双重保护**
- 投票权重折现（如 Quadratic Voting）

---

## 10. 跨链桥攻击（Bridge Attacks）

| 项目 | 内容 |
|---|---|
| **风险等级** | 🔴 致命（史上最高损失类型） |
| **经典案例** | Ronin（$622M）, Wormhole（$326M）, Nomad（$200M） |
| **攻击原理** | 伪造跨链消息 → 让目标链合约以为源链已锁定/销毁资金 → 释放资金 |
| **攻击条件** | 验证器签名机制被攻破；或代码逻辑允许绕过验证 |
| **可能损失** | 协议 TVL 清零 |

### ✅ 防御

- 验证器使用**经济安全模型**（stake 折损）
- **M-of-N 多签**，签名者不能在同一云服务（防单点）
- 跨链消息必须包含 `chainId + nonce + timestamp`
- 单笔限额 + 新链上线锁定交易量
- 定期安全审计 + 竞赛（Immunefi）

---

## 11. 拒绝服务 / Gas 耗尽（DoS）

| 项目 | 内容 |
|---|---|
| **风险等级** | 🟠 高危（功能停摆） — 🟡 中危 |
| **经典案例** | ENS 旧版竞拍, EOS 暂停 |
| **攻击原理** | 攻击者创建大量循环元素（地址/订单/代币），合约遍历时 gas 超出 block gas limit |
| **攻击条件** | 合约存在动态数组/映射的被遍历逻辑 |

### ✅ 防御

- 避免 for 循环遍历动态数组（用 mapping 替代）
- 若必须遍历，使用**分页模式**（传入 index + limit）
- **Pull over Push** — 让用户主动领取，合约不推送
- 使用 `EnumerableSet` 时注意元素数量上限

---

## 12. 闪电铸 / ERC-4626 相关漏洞

| 项目 | 内容 |
|---|---|
| **风险等级** | 🟠 高危 |
| **经典案例** | Yearn v1, Alchemix, 多起 ERC-4626 实现 |
| **攻击原理** | 利用 `previewDeposit` / `previewRedeem` 与实际行为的不一致，或通过捐赠（inflation attack）攻击 vault 份额计算 |
| **攻击条件** | vault 的 `convertToShares` 可被操纵；初始流动性不足 |

### 通胀攻击（Inflation Attack）

```
攻击者在 vault 未初始化时先捐大量底层资产 → 唯一LP份额被大幅稀释 → LP无法有效兑换
```

### ✅ 防御

- 使用 **OpenZeppelin ERC-4626**（内置捐赠防护）
- 首次铸币送最小份额（`10**decimals`）到 `address(0)`（分散化）
- `preview` 函数与 `deposit`/`redeem` 行为严格一致

---

## 13. 自毁 / 合约自杀漏洞

| 项目 | 内容 |
|---|---|
| **风险等级** | 🔴 致命 |
| **经典案例** | Parity Multisig 第二次灾难 |
| **攻击原理** | 逻辑合约中包含 `selfdestruct`，攻击者通过 delegatecall 调用它销毁代理合约 |
| **攻击条件** | 逻辑合约有 `selfdestruct` 或可调至 `selfdestruct` 的路径 |

### ✅ 防御

- 逻辑合约中**永远不放 `selfdestruct`**
- 逻辑合约不要有 `delegatecall(address(0))` 或类似任意地址调用
- 使用 OpenZeppelin 可升级合约模板（不含自毁）

---

## 14. 区块信息依赖 / 随机数可预测

| 项目 | 内容 |
|---|---|
| **风险等级** | 🟡 中危 — 🟠 高危（游戏/NFT/抽奖场景） |
| **经典案例** | 多个链上抽奖/Hash 游戏/盲盒合约被利用 |
| **攻击原理** | 矿工/验证者可以预知 `blockhash`、`block.timestamp`、`block.number`、`block.difficulty`，用来预测"随机"结果 |
| **攻击条件** | 随机数来源为链上可预测数据；无外部随机源（Chainlink VRF） |

### ✅ 防御

- 用 **Chainlink VRF（可验证随机函数）**
- 使用 commit-reveal 方案（用户先提交 hash，后揭示）
- 绝对不要单独用 `blockhash(block.number)`（退化为 0x0）
- **Never**: `uint random = uint(keccak256(abi.encodePacked(block.timestamp, block.difficulty)))`

---

## 15. 未检查的外部调用

| 项目 | 内容 |
|---|---|
| **风险等级** | 🟡 中危 |
| **经典案例** | King of the Ether, 大量 DeFi 早期合约 |
| **攻击原理** | 外部调用未检查返回值（`call` / `send`），即使失败也继续执行后续逻辑 |
| **攻击条件** | 使用了 `address.call()` 且没有检查 `success`；或使用了 `.send()`（固定 2300 gas 易失败） |

### ✅ 防御

- 总是检查返回值：
  ```solidity
  (bool ok, ) = to.call{value: amount}("");
  require(ok, "transfer failed");
  ```
- ERC20 推荐用 SafeERC20（`safeTransfer` / `safeTransferFrom`）
- ETH 转账推荐用 `call{value: amount}("")` 替代 `.transfer()` / `.send()`

---

## 16. 存储槽冲突（Storage Collision）

| 项目 | 内容 |
|---|---|
| **风险等级** | 🔴 致命 |
| **经典案例** | OpenZeppelin 可升级合约升级指南（配置错误案例） |
| **攻击原理** | 可升级合约的存储布局在升级后改变，新变量覆盖旧变量的存储槽，导致数据错乱或权限变更 |
| **攻击条件** | 在已有状态变量**之前**插入新变量；或删除/重命名变量 |

### ✅ 防御

- **永远不要改变已部署变量的顺序、类型、名称**
- 只能**追加**新变量到末尾（且保证不冲突）
- 使用 OpenZeppelin Upgrades 插件（`oz upgrade` 自动检测）
- 预留存储槽（`__gap[50]`）给未来升级

---

## 17. ERC 代币兼容性陷阱

| 项目 | 内容 |
|---|---|
| **风险等级** | 🟡 中危 — 🟠 高危（跨协议交互） |
| **经典案例** | USDT（不返回 bool）, AAVE/Compound 早期适配 |
| **攻击原理** | 各代币对 ERC 标准的实现不一致（返回值缺失、hook 行为、decimals 不同），导致协议整合出错 |
| **常见问题** | USDT 不返回 `bool`；UNI 支持 `permit` 而其他不支持；代币有转账手续费（Fee on Transfer）；ERC-777 回调重入 |

### ✅ 防御

- 总是用 **OpenZeppelin `SafeERC20`**（处理 USDT 等不标准返回）
- 对 Fee-on-Transfer 代币使用 `balanceOf` 前后差值（而非 `amount`）
- 不要信任 `decimals()` 的返回值（某些代币返回非标准值）
- 整合新代币前检查其实现标准

---

## 18. 时间戳依赖

| 项目 | 内容 |
|---|---|
| **风险等级** | 🟡 中危 |
| **经典案例** | Casino/博彩合约（可被矿工操纵 15s 窗口） |
| **攻击原理** | 依赖 `block.timestamp` 做关键逻辑判断（如竞拍结束时间、奖励触发），矿工可以将其调整 ±15 秒 |
| **攻击条件** | 时间戳被用于**精确**比较（==），或影响**资产分配** |

### ✅ 防御

- 时间戳只用于**宽松**范围判断（如 `>=`），不用于 `==`
- 关键时间逻辑用 `block.number` 替代（可预测，不可篡改时间）
- 不做依赖时间戳秒级的竞拍

---

## 19. 前端 + 签名钓鱼

| 项目 | 内容 |
|---|---|
| **风险等级** | 🟠 高危 |
| **经典案例** | BadgerDAO 前端攻击（$120M）, MSG.sender 钓鱼 |
| **攻击原理** | 攻击者注入恶意前端代码，诱导用户签署对攻击者有利的交易/EIP-712 消息 |
| **攻击条件** | 用户通过前端签署盲签（`eth_signTypedData` 不展示完整内容） |

### ✅ 防御（对用户/前端开发者）

- 用户在签署前检查合约交互的 **calldata**
- 使用硬件钱包 + 显示完整交易详情
- 前端部署使用 **子资源完整性（SRI）** + **CSP**
- 前端更新使用 **IPFS 哈希验证** + 时间锁

---

## 20. 经济模型 / 激励错配

| 项目 | 内容 |
|---|---|
| **风险等级** | 🟠 高危 |
| **经典案例** | Luna/UST 崩盘, Basis Cash, Titan/IRON |
| **攻击原理** | 协议经济模型设计缺陷导致正向反馈螺旋（如：收益率不可持续、veToken 集中度、流动性挖矿死亡螺旋） |
| **攻击条件** | 奖励 > 协议收入；单一角色可以无风险套利；死亡螺旋无熔断 |

### ✅ 防御

- **白帽子角度**：审计时重点检查经济参数边界
- 检查极端场景（100% 清算、所有人同时提现）
- 检查套利空间是否闭环（收益 > 成本时就是漏洞）
- 加熔断机制（利率高限、提现暂停、复苏模式）

---

## 📋 审计快速检查清单

| # | 检查项 | 风险 | 状态 |
|---|---|---|---|
| 1 | CEI 模式是否严格遵循？转账是否前置？ | 🔴 | ☐ |
| 2 | 价格来源是 TWAP 还是现货？可被闪电贷操纵？ | 🔴 | ☐ |
| 3 | 关键函数有没有权限控制？初始化锁定？ | 🔴 | ☐ |
| 4 | 代理升级存储布局是否兼容？升级函数有锁？ | 🔴 | ☐ |
| 5 | 签名消息包含 chainId + nonce？ | 🟠 | ☐ |
| 6 | 闪电贷能否绕过任何检查？ | 🟠 | ☐ |
| 7 | 治理投票权重是快照还是余额？ | 🟠 | ☐ |
| 8 | 四舍五入方向对谁有利？除法是否后置？ | 🟡 | ☐ |
| 9 | for 循环遍历数组能否被撑爆？ | 🟡 | ☐ |
| 10 | 自毁/任意 delegatecall 是否存在于合约树中？ | 🔴 | ☐ |
| 11 | 随机数来源是否可预测？ | 🟡 | ☐ |
| 12 | 外部调用是否检查返回值？ | 🟡 | ☐ |
| 13 | 所有 ERC20 是否使用 SafeERC20？ | 🟡 | ☐ |
| 14 | Fee-on-Transfer 代币是否用 balanceOf 差值？ | 🟡 | ☐ |
| 15 | 时间戳是否用于精确比较？ | 🟡 | ☐ |
| 16 | ERC-4626 是否有通胀攻击防护？ | 🟠 | ☐ |
| 17 | 跨链消息验证是否充分？ | 🔴 | ☐ |
| 18 | 经济模型极端场景是否经过压力测试？ | 🟠 | ☐ |

---

## 🔧 Foundry 测试建议

每打勾一个检查项，建议用 Foundry fuzz 测试验证：

```solidity
// 示例：重入测试
function test_Reentrancy() public {
    uint before = victim.balanceOf(address(this));
    // 用攻击合约递归调用 withdraw
    attacker.attack(address(victim));
    // 验证余额未被耗尽
    assertGe(victim.balanceOf(address(this)), before);
}
```

```solidity
// 示例：价格操纵测试（闪电贷）
function testFlashLoanPriceManipulation() public {
    uint borrowAmount = 1_000_000 ether;
    // 在池子里借大额操纵价格
    flashBorrowAndManipulate(borrowAmount);
    // 验证合约价格仍在合理范围
    assertApproxEqAbs(oracle.getPrice(), expectedPrice, 1e15);
}
```

---

> 📝 **下一步：** 可以直接把这个清单导入 Foundry 的 `test/` 目录作为测试模板，每次审计新合约时对着打钩。  
> 需要我把每一项都生成对应的 Foundry 测试模板脚本吗？

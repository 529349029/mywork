作为做区块链审计的同行，直接上经典案例拆解。`delegatecall` 的危险性核心只有一句话：**它借用外部代码逻辑，却在调用者自己的存储和身份上下文中执行**。这意味着外部代码可以任意覆写调用者的 `owner`、余额，甚至 `selfdestruct` 掉调用合约。历史上最惨痛的教学案例是 **2017年 Parity Multisig Wallet 两次黑客事件**，完美覆盖了“权限接管”和“自毁冻结”两种毁灭性场景。

---

## 一、Parity Multisig Wallet 架构背景

Parity 当时采用 **Library+Proxy（代理库）模式** 实现多签钱包，这是早期升级able proxy 的雏形：

- **WalletLibrary（库合约）**：部署一份，包含多签逻辑（`initWallet`, `execute`, `m_confirmAndCheck` 等）。
- **用户 Wallet Proxy（代理合约）**：每个用户部署一个轻量代理，通过 `delegatecall` 转发所有调用到共享的 `WalletLibrary` 执行。
- **关键点**：代理合约**自身存储**保存 `owners`、`m_required`、`m_dailyLimit` 等状态；逻辑代码在 Library 中运行，**读写的是代理合约的 storage**。

伪代码结构（简化）：
```solidity
// WalletProxy fallback
function() payable external {
    address _walletLibrary = walletLibrary;
    assembly {
        calldatacopy(0, 0, calldatasize())
        let result := delegatecall(gas(), _walletLibrary, 0, calldatasize(), 0, 0)
        returndatacopy(0, 0, returndatasize())
        switch result
        case 0 { revert(0, returndatasize()) }
        default { return(0, returndatasize()) }
    }
}
```

---

## 二、第一次攻击（2017年7月）：delegatecall 劫持 Owner

### 漏洞根因

1. **WalletLibrary 的 `initWallet` 是 public 且未加 `onlyUnInitialized` 防护**：
```solidity
function initWallet(address[] _owners, uint _required, uint _daylimit) public {
    initMultiOwned(_owners, _required);
    initDaylimit(_daylimit);
}
```
它可以**重复调用**，任意重置 `owners`。

2. **Library 逻辑通过 delegatecall 在 Proxy 存储执行**，但 `initWallet` 本身**没有区分“是谁在调用”**。
   - 如果是 Library 直接被外部调用（`msg.sender`=攻击者），改的是 Library 自己的 storage（危害较小）。
   - 如果是 **Proxy delegatecall 进 Library**，执行上下文是 **Proxy 的 storage** → 改的是**用户钱包的 owners**。

3. **Proxy fallback 无条件 delegatecall 到 Library**，且允许用户传入任意 calldata：
```solidity
else if (msg.data.length > 0)
    _walletLibrary.delegatecall(msg.data);
```
攻击者只需编码 `initWallet(attackerAsOwner)` 的 calldata 发送给 Proxy，Proxy 就会 delegatecall 到 Library 执行，把**代理钱包的 owner 改成攻击者**。

### 攻击流程（审计视角）

1. 攻击者选择一个未初始化的 Parity Multisig Wallet（或已部署但可重初始化，因无 initializer guard）。
2. 构造 calldata：`initWallet([attackerAddress], 1, 0)` → selector `0xe46dcfeb`。
3. 发送交易到目标 Wallet Proxy。
4. Proxy fallback 捕获 calldata，执行 `_walletLibrary.delegatecall(msg.data)`。
5. Library 的 `initWallet` 在 **Proxy storage 上下文** 运行：
   - `Slot 0 (m_numOwners / owners mapping)` 被覆写
   - 攻击者成为 sole owner of the wallet。
6. 攻击者调用 `execute()`（多签执行函数，现在他是唯一 owner），将钱包内 ETH 转出。

**损失**：约 **15.3万 ETH（~3000万美元）** 从多个高价值多签钱包（Eden、Swarm City等）被盗。

### 审计 Takeaway

- **delegatecall 进未初始化/可重初始化的逻辑 = 致命**。必须 `initializer` 修饰器 + `onlyProxy` 隔离。
- **Proxy fallback 不可盲目转发用户 calldata** 到逻辑合约，尤其当逻辑含敏感 setter。
- 公共初始化函数必须 `onlyOwner` 或 `onlyInitializing`，且 `initialized` flag 不可覆写。

---

## 三、第二次攻击（2017年11月）：Library 自毁冻结（史诗级）

这是区块链历史上最戏剧性的 `delegatecall + selfdestruct` 组合灾难。

### 漏洞根因

Parity 在第一次攻击后“修复”时犯了个更大错误：**WalletLibrary 本身也继承了多签逻辑，且暴露了 `kill()` 函数**：
```solidity
function kill(address _to) onlyManyOwners {
    selfdestruct(_to);
}
```
- `WalletLibrary` 是普通合约（非纯 library），部署后**有自己的存储和 owner**。
- 由于 `initWallet` 仍是 public，**Library 合约本身也可被初始化**。

### 攻击流程（devops199 白帽“误操作”）

1. **用户 `devops199`** 发现 WalletLibrary 未初始化，直接调用 Library 的 `initWallet([devops199], 1, 0)` **直接在 Library 地址上**。
   - 因为调用的是 Library 本身（非 delegatecall），`msg.sender=devops199`，Library 的 storage slot0 被改写为 devops199 为 owner。
2. devops199 现在成了 **WalletLibrary 的 owner**，调用 `kill(Library.address)` → `selfdestruct`。
3. **关键 EVM 语义**：`selfdestruct` 销毁的是**当前执行上下文的合约代码**。
   - Library 直接调用 `kill()` → Library 代码从链上删除。
4. **所有 Wallet Proxy 仍指向这个 Library 地址做 delegatecall**。
   - 当任何 Proxy fallback 尝试 `delegatecall` 到已销毁的 Library → **代码不存在** → 所有调用 revert。
5. **后果**：所有依赖该 Library 的 Wallet Proxy **永久不可用**，无法执行转账、无法升级逻辑、无法恢复。

**冻结资产**：约 **51.3万 ETH（~1.5亿美元）** 锁死在 587+ 个钱包中，至今无法取出。

### 为什么 delegatecall 放大了灾难？

- 如果是普通 `call`：Library 自毁只影响 Library 本身，Proxy 仍可换逻辑地址。
- 因为是 `delegatecall` 架构：**上百个 Proxy 共享一份逻辑地址**，逻辑消失 = 所有 Proxy 瘫痪。
- `selfdestruct` 在 delegatecall 上下文 = 销毁**调用者**，在直接调用 = 销毁**被调用库**，两者都致命。

---

## 四、其他现代案例（审计参考）

### 1. Furucombo (2021) — 任意 delegatecall 目标

Furucombo 允许批量 DeFi 操作，有个 `batch()` 函数可指定 `handler` 地址做 `delegatecall`：
```solidity
// 伪代码
for (...){
    handler.delegatecall(data);
}
```
假设 `handler` 是用户可控（未严格白itelist），攻击者部署恶意合约：
```solidity
contract Malicious {
    function doDelegateCall() external {
        // 改写 Furucombo 的 approval mapping / owner slot
        // 或直接 approveAll(attacker)
    }
}
```
攻击者为 `handler` 传入 Malicious 地址 → Furucombo delegatecall 执行 → 改写存储拿到资产审批。**损失 ~$14M**。

### 2. UXLINK (2025) — delegateCall 权限升级

Multi-sig 合约存在 `delegateCall` 函数，攻击者注入恶意 calldata 移除原 admin、添加自己为多签 owner，随后 mint 10万亿代币 + 盗取 $4M+ 资产。**delegatecall 上下文篡改多签存储 = 完全协议控制**。

---

## 五、审计 Checklist：delegatecall 红线

从 Parity 到现代 Proxy/Diamond，delegatecall 高危模式高度固定：

| 风险维度 | 审计关注点 | 缓解方案 |
|---------|-----------|---------|
| **Storage Collision** | Proxy 与逻辑合约 storage layout 不一致（变量顺序/类型错位） | 使用 EIP-1967 / OpenZeppelin Upgrades 插件，继承 `Initializable` 严格布局 |
| **Arbitrary Target** | `addr.delegatecall(data)` 中 `addr` 用户可控 | 硬编码逻辑地址 / 严格 whitelist / 禁止外部指定 target |
| **Uninitialized Logic** | 逻辑合约（或 Library）可被外部 init 夺权 | `initializer` + `onlyProxy` + 逻辑合约不可自调用初始化（immutable logic addr）|
| **Selfdestruct** | 逻辑含 `selfdestruct` 或被 delegatecall 触发 | 逻辑合约禁用 `selfdestruct`（Solidity 0.8.18+ 可用 `selfdestruct` 标记 deprecated），Proxy 禁止 delegatecall 到不可信实现 |
| **Fallback Blind Forward** | Proxy fallback 无 selector 过滤，转发任意 calldata | 使用 `TransparentProxy`（admin/user 分离）或 `UUPS` 带 upgrade guard |
| **Re-initialization** | `initialize()` 可多次调用 | `bool initialized` + `onlyInitializing` / OZ `Initializable` |
| **msg.sender 混淆** | delegatecall 保留原始 `msg.sender`，逻辑合约误用 `msg.sender` 做权限 | 逻辑合约用 `address(this)` 或 explicit `_msgSender()` 区分，Proxy 传 `msg.sender` 参数 |

---

## 六、一句话总结 for Auditor

> **`delegatecall` 不是“调用函数”，是“把别人的代码搬进自己家运行”：存储是你的，身份是你的，对方代码能 `sstore` 你的 owner、`selfdestruct` 你的合约、approve 你的资产。任何 user-controlled target、未初始化逻辑、storage 错位，都是 Critical。**  
> Parity 双杀（Owner 劫持 + Library 自毁冻结）是区块链安全史最佳 `delegatecall` 教学材料，建议反编译原代码逐行审计对比。

如果你在做具体项目审计（Proxy/Diamond/Minimal Proxy），我可以帮你梳理 **storage slot collision 检测脚本（Slither + foundry`）** 或 **delegatecall 危险模式 detector** 思路。
Swap 类项目（AMM DEX、聚合器、路由、限价单）的漏洞和借贷类有重叠，但因为核心是**"按价格公式搬动储备金"**，所以多了一大类**AMM 曲线/滑点/路由本身的逻辑坑**。历史上可归为 8 类，每一类配标志性案例。

## 1. 闪电贷 + AMM 现货价操纵（最经典）
Swap 池本身就是价格源，闪电贷借大钱砸/拉单池现货价，再在依赖该价格的另一处套利。
- **Uniswap V2 类"假 TWAP"利用（2022）**：攻击者借巨资在单块内扭曲某配对现货价，使依赖该池做喂价的上游协议算错兑换率，抽走约 170 万 USDC。
- **ElasticSwap（2022，~85 万）**：闪电贷操纵弹性供应代币池储备比例，add/remove liquidity 套走整个内部储备。
- **Redemption（2022，160 万）**：改版 Uniswap V2 的 swap 在 K 检查后才把 controller fee 从池里转出，闪电贷反复 swap 把池内价格抬三倍，跨池套利。

## 2. 重入与只读重入（ERC-777 / 回调钩子）
Swap 在 `safeTransfer` 往外打币时触发对端 token 的 hook，回调重入 `swap`/`removeLiquidity`/`getReserves`。
- **Uniswap + imBTC（2020，~140 万）**：imBTC 是 ERC-777，transfer 时回调重入 Uniswap 的 `tokenToEthSwapInput`，在储备更新前多次交换，池子被掏。
- **SushiSwap RouteProcessor2（2023，330 万）**：新路由合约没校验 `processRoute` 的 route 参数，把交易导向攻击者恶意池，`swapUniV3` 改 `lastCalledPool` 后回调通过权限检查，结合重入抽走已 approve 用户的币。
- **只读重入**：Beanstalk Wells 类案例里，`removeLiquidity` 先 `safeTransfer` 再 `_setReserves`，回调里读 `getReserves()` 拿到旧储备，下游依赖该视图的合约算错金额。

## 3. AMM 曲线 / Tick / 不变量计算错误（CLMM & 稳定币曲线重灾区）
这是 Swap 独有、借贷几乎没有的一类。
- **KyberSwap（2023，~4800 万）**：集中流动性 CLMM 里 `nearestCurrentTick` 在边界算错（`currentTick-1`），导致 one-to-zero swap 跨 tick 时流动性被**重复 mint**，攻击者用闪电贷先把池子压到特定 tick，再反向 swap 把"凭空多出来的流动性"换成 ETH/USDC。
- **Velodrome / 稳定币曲线（x³y+y³x≥k）**：`_k()` 里 `uint` 转换与四舍五入误差让极小输入换出极大输出，绕开 `K` 不变检查。
- **UraniumSwap / BurgerSwap**：仿 Uniswap V2 但改了定价函数，整数与精度处理出错，直接 `swap` 套走池子。
- **Balancer（2023，7000~1.28 亿）**：加权池公式边缘 case + 四舍五入，反复 swap 蚕食池子。

## 4. 路由 / 聚合器参数校验与审批滥用
聚合器（1inch、Sushi RouteProcessor、0x）比单纯池子多一层"用户→路由→多池"的转发，坑在**route 描述、approval、calldata 解析**。
- **SushiSwap RouteProcessor2**：上面第 2 类已讲，本质是 route 参数未校验 + approval 被冒用。
- **1inch Fusion 旧版（2025，TrustVolume 做市商~500 万）**：Yul 内联汇编里 `tokensAndAmounts` 数组长度字段在 calldata 末尾，构造嵌套订单递归调用 `fillOrderTo` 触发整数溢出破坏 EVM 内存，绕过 resolver 身份校验，转走限价单结算合约里用户的币。
- 通用坑：`permit` 签名被钓鱼、router 地址被前端替换、用户盲目 approve 给恶意新路由。

## 5. 手续费 / 分红 / 激励逻辑错误
- **Curve（2021，~1300 万）**：多池 fee 参数配置错误 + 稳定币互换路径可被反复利用抽走手续费层资产。
- **Uniswap V3 激励系统（WUSD.fi/GLOVE，2026）**：奖励按 swap 次数/量发放，攻击者循环往返刷量farm，抽走约 20 万奖励池。
- **LP 份额通胀**：向新 Pair 直接 transfer 资产拉高 `totalSupply` 单价，再用少量 LP 赎回超额底层（和借贷类份额通胀同源）。

## 6. 预言机依赖错位（Swap 池当喂价）
- 很多借贷/衍生品协议拿 Uniswap/V2 `getReserves` 当价格，但**Swap 协议自己也会被别的东西当预言机**。一旦某配对浅、被闪电贷拉盘，所有消费这个价格的系统一起爆。Mango、bZx 本质也吃了 DEX 现货价被操纵的亏。

## 7. 权限 / 初始化 / 升级失控
- **88mph 初始化遗漏**：构造函数名写错导致 init 函数公开，任何人可重初始化拿管理员权限（虽不是纯 swap 池，但 DEX 周边 stake/farm 合约常踩）。
- Router 合约部署后没放弃 owner，owner 能改 feeTo、白名单、暂停键 → 跑路或被动被黑。
- 代理升级权限没 timelock，admin 被钓鱼后换恶意逻辑（UPCX 等案例思路同样适用于 DEX 的 farm 合约）。

## 8. 前端 / 签名 / MEV（非合约但 Swap 用户最常中招）
- **Sandwich / 三明治攻击**：不是 bug，是 AMM 滑点机制的必然产物，攻击者前置买、后置卖吃你这笔 swap 的滑点。
- **DNS 劫持 + 假前端**：Curve 2022 年 DNS 被改，假站点骗用户签 approve，合约本身没漏但损失 57 万。
- **Permit 钓鱼**：诱导用户对恶意 spender 签 EIP-2612 permit，离线签完授权即清空。

---

## 速查表（Swap 专属 vs 通用）

| 类型 | Swap 里典型表现 | 代表案例 | 根因 |
|---|---|---|---|
| 闪电贷×现货价 | 单块拉池价跨池套利 | ElasticSwap / Redemption | 池价即预言机 |
| 重入/只读重入 | ERC-777 hook 重入 swap | Uniswap-imBTC / Beanstalk Wells | CEI 没守全 |
| AMM 曲线计算 | tick 边界重复 mint、K 检查被绕过 | KyberSwap / Velodrome / Uranium | 公式边缘 case |
| 路由/聚合器 | route 参数未校验、Yul 溢出 | Sushi RP2 / 1inch Fusion | calldata 解析 |
| 费/激励逻辑 | 往返刷奖励、fee 转出破坏 K | Curve 2021 / WUSD.fi | 经济参数错 |
| 预言机错位 | 别家拿本池当喂价被操纵 | 各类 fork 借贷连坐 | 单一现货源 |
| 权限/初始化 | 忘初始化、owner 没放弃 | 88mph 类 | RBAC 缺失 |
| 前端/MEV | 三明治、假前端、permit 钓 | Curve DNS / 通用钓鱼 | 不在合约层 |

## Swap 协议上线前多盯这几条
- `swap` / `add` / `remove` 全链路 **CEI + nonReentrant**，含 `getReserves` 等 view 的只读重入
- CLMM 重点测 **tick 边界、currentTick 落在边界、cross-tick 时 liquidity 净变动**
- 稳定币曲线 `_k()` 用**无损整数运算**跑 fuzzing，禁止 `uint(...)` 强转截断
- 路由合约：**route/path 白名单化、校验每个 hop 的 receiver、approval 用 permit2 而非无限 approve**
- 价格源：**自己池子不当别人预言机；别人要用就上 TWAP 且设单块偏离上限**
- 聚合器 Yul/汇编：**数组长度字段位置、offset 计算、溢出用 `SafeMath` 思路复查**

如果你是在做 DEX 审计 checklist，我可以把上面 8 类压成"AMM/swap 合约必跑的 15 条 invariant + 单元测试边界集"（比如 `x*y>=k` 在收 fee 前后、tick 交叉后、捐赠后是否仍成立），要的话我直接给。
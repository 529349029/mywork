

查证完成。基于 GitHub API 实测结果（搜索结果已附）+ 仓库 README 确认，给你一份有数据支撑的开源自律/锁机应用清单，按"和你需求的匹配度"排序。

## 开源自律/锁机应用清单（GitHub 实测）

### 第一梯队：真正能"锁"，且维护活跃

| 项目 | Star | 平台 | 功能与来源 |
|---|---|---|---|
| **curbox-app/curbox-android**（原 nethical6/curbox） | ★1192 | Android | 免费开源 App+网站屏蔽器。可屏蔽抖音/YouTube Shorts/TikTok Reels，有 app 计时、解锁机制自定义（超时后打开 app 的行为可设）、灰度模式（手机变黑白降低吸引力）。GPL-3.0，F-Droid 可直接安装，无需编译 |
| **SelfControlApp/selfcontrol** | 成熟老牌 | macOS | 定时屏蔽网站/邮箱服务器，**计时结束前重启电脑、删 app 都解不开**——和你"锁机不能反悔"的理念完全一致。只锁电脑，不锁手机 |
| **proginosko/LeechBlockNG** | 跨浏览器 | Firefox/Chrome | 可设最多 30 组屏蔽网站、固定时段+每日限额组合、**lockdown 立即锁定**、选项页可设密码防自己手贱。手机浏览器也能装 |
| **sun-xiangyuan12/yingkong（硬控）** | 新项目 | Android | 国产锁机：自定义锁定时间、**无障碍服务防绕过锁定**、网络拦截减少消息干扰、**开机自动恢复锁定**。功能最贴近国内锁机 App 的形态，托管在 gitcode.com（GitHub 镜像源，未确认 GitHub 原仓，标注 [UNCERTAIN]） |

第四行来源是 gitcode.com 的项目页，非 GitHub 直接页面——GitHub 上是否有同源仓库我没验证出来，你要用的话我可以再挖。

### 第二梯队：数字健康/时间管理（偏追踪，锁控能力弱）

- **1372Slash/Zenith** ★404 — Kotlin，Material Design 3 数字健康应用（Android）
- **NeoApplications/Neo-Wellbeing** ★216 — Kotlin，开源版 Digital Wellbeing 替代品，alpha 阶段
- **ApimorLabs/Reluct** ★95 — Kotlin，数字健康+生产力管理
- **code-with-the-italians/bundel** ★295 — Kotlin，减少分心的数字健康 app
- **cajdata/TapBlok** ★34 — Kotlin，通过"现实世界障碍"控屏幕时间的 Android 工具
- **MaherSaleem/stay-focused-chrome-extension** — 开源的 Chrome 聚焦扩展（WXT+Vue3+TS），替代已闭源的 StayFocusd（原 cowchimp/StayFocusd 仓库已 404，官方转闭源）

### 和你需求的匹配度结论（诚实版）

1. **开源界没有成熟的"罚金解锁"机制项目**。罚金是商业闭源 App（不做手机控、禅定空间等）的特色，GitHub 上没有高星项目实现"解锁即扣款"。开源项目的锁法靠的是**不可撤销的计时封锁**（SelfControl 重启也解不开），效果上等价于你的罚金——都是"反悔成本极高"。
2. **Android 真锁机选项很少且不成熟**：高星的 curbox 是屏蔽型（锁 app 而非锁全机），中文的 focuslock/硬控都是 MVP 或新项目，功能完整度风险自负。
3. **推荐组合拳**：手机继续用你现在的锁机 App（罚金机制它已经做对了），**用开源项目把电脑和其他设备补上**——SelfControl（Mac）或 LeechBlockNG（浏览器）锁电脑刷短剧的路径，curbox 装到 F-Droid 作为开源备份。

需要的话，我可以把 curbox 或 FocusLock 的源码拉到本地检查锁机实现是否真有防绕过能力（无障碍服务是否完整、能否被强杀绕过），或者帮你写个评估脚本对比这几个项目的最后提交时间与 issue 活跃度，判断哪个还活着。




实测验证完毕（用你的 token，读取未打印）。第一梯队地址如下，全部附实测活跃度数据：

## 第一梯队 GitHub 地址（实测验证）

### 1. curbox — Android 开源 App+网站屏蔽器 ⭐ 主力推荐
```
https://github.com/curbox-app/curbox-android
```
- ★1192 · GPL-3.0 · 未归档 · 最近推送 **2026-08-07**
- 屏蔽抖音/TikTok/YouTube Shorts、App 计时器、灰度模式、解锁规则可自定义
- F-Droid 可装，无需编译

### 2. SelfControl — macOS 不可撤销定时封锁
```
https://github.com/SelfControlApp/selfcontrol
```
- ★4385（第一梯队里 star 最高）· GPL-3.0 · 未归档 · 最近推送 2026-06-26
- 计时结束前重启电脑、删 App 都解不开

### 3. LeechBlock NG — 浏览器级屏蔽（手机/电脑通用）
```
Firefox 版：https://github.com/proginosko/LeechBlockNG        （★1057 · 推送 2026-08-12）
Chrome 版：https://github.com/proginosko/LeechBlockNG-chrome  （★124  · 推送 2026-08-16）
```
- MPL-2.0，两个都未归档，Chrome 版最近提交时间最新
- 30 组屏蔽规则、时段+时长组合、lockdown 立即锁定、选项页密码保护

### 4. 硬控（yingkong）—— 不在 GitHub 上
```
gitcode 地址：https://gitcode.com/sun-xiangyuan12/yingkong
```
- 实测 `sun-xiangyuan12/yingkong` 在 GitHub 返回 **404**，GitHub 全站搜索（yingkong / 硬控 锁机 / sun-xiangyuan12 三个关键词）均无对应仓库。
- 结论：这项目只托管在 gitcode（国内平台），不属于"GitHub 开源"，且 star/维护数据我无法从 GitHub 侧验证。要用它需自负维护风险。

---

**补充信息**：`proginosko/LeechBlock`（★70，旧版）和 `LeechBlockNG-edge`（★9）也存在，但 NG 已是主版本，旧版不用管。

顺带确认：你的 token 验证通过（40 位，API 请求全部成功，限流已解除）。之后的 GitHub 调研我都会直接用它。





实测结果齐了。结论先行：**按"不用折腾环境"排序：LeechBlockNG ≫ curbox > SelfControl（本机直接不可行）**。

## 本机环境实测（刚才探测的）

| 组件 | 状态 |
|---|---|
| Java 21 | ✅ 已有（openjdk 21.0.11） |
| Node 24 / npm 12 | ✅ 已有 |
| Python 3.12 | ✅ 已有 |
| Android SDK / adb / sdkmanager | ❌ 全无（ANDROID_HOME 未设置） |
| Gradle | ❌ 无全局（但项目自带 gradlew wrapper，会自动下载自己的版本，这不影响） |
| macOS / Xcode / CocoaPods | ❌ 不存在（WSL/Linux） |

## 逐个评估

### 1. LeechBlockNG — 零编译，改完即生效 ⭐ 最容易
```
环境要求：无。= 你本机已经全满足
```
- 纯 JavaScript/HTML/CSS 浏览器扩展，**没有构建步骤**。README 实测只有一条依赖：子目录放一份 jQuery UI（下载一个 zip 放进去）。
- 开发流程：clone → 浏览器 `about:debugging`（Firefox）或 `chrome://extensions` 开发者模式 → 加载已解压目录 → 改代码 → 点刷新。**改一行看一行**，无编译等待。
- 代价：只能锁**浏览器里的网站/网页版短剧**，锁不了抖音、红果这类 App 本体。
- 语言门槛：JS，你本机 node 环境完全够，甚至写完可以直接命令行跑单元测试。
- 注意：作者 PR 政策保守（README 原文：简单 bug/UI 修复才收，大改动不保证合入）——所以**要改就自己 fork**，别指望上游。

### 2. curbox-android — 手机端唯一能改"锁机逻辑"的，但要一次性装 SDK
```
环境缺口：Android SDK（约 1-2GB）+ 首次 Gradle 依赖下载
```
- 你已有 Java 21，gradle 用项目自带的 gradlew 自动下载，**唯一要装的就是 Android SDK 命令行工具**。
- 一次性配置（我可以给你写条自动脚本：下载 cmdline-tools → 装 platform-tools + platforms → 接受 license → build，全程约 15-30 分钟，代理走你现成的 127.0.0.1:7890）。
- 之后每次改动：`./gradlew assembleDebug`（首次 5-15 分钟，增量编译 1-3 分钟）→ adb 装到手机。
- 需求匹配度：能真正动手改"屏蔽抖音/解锁规则/计时"这些和你场景直接相关的东西。但要装 App 到手机测试，需要 USB 调试（adb）或模拟器。
- 踩坑提示：项目正在 kt-rewrite 大重构中（939 commits），分支多，二次开发建议锁定一个发布 tag 再改，别追 master。

### 3. SelfControl — 本机不可行，除非你有 Mac
```
环境要求：macOS + Xcode + CocoaPods —— WSL 上物理上无法编译
```
- 如果只是电脑上偶尔用，直接用现成 release 就行，不需要源码编译；**但想二次开发，就必须有一台 Mac**。没有就直接排除。

## 我的建议（决策权在你）

- **只是想改规则/界面/提示文案，或学浏览器扩展开发** → 选 LeechBlockNG，今天 clone 今天就能改出第一版。
- **目标是"手机端更强的锁机/罚金逻辑"，且愿意花 15-30 分钟跑一次 SDK 配置脚本** → 选 curbox，这是唯一和你"锁机+罚金"需求直接对得上的开源手机项目（罚金功能本身三者都没有，得自己写——curbox 的解锁规则扩展点最合适承载）。
- **说清楚你打算改什么**：改屏蔽逻辑？加罚金？改 UI？目标不同选型完全不一样。你定了方向，我可以直接帮你把对应项目的开发环境一条龙配好 + 定位要改的代码位置。



补上了——上一轮把它归入第一梯队时我说漏了，现在把它拉出来实测（刚 clone 到 /tmp 验证，全部硬证据）。

## yingkong（硬控）真实状态：实测结论

**先说结论：它不符合"维护活跃"——恰恰相反，它是单次提交的死项目，但代码极小、结构最透，二次开发反而最省事。**

### 实测硬证据（clone 自 gitcode，2026-02-09 最后提交）

| 项 | 实测值 |
|---|---|
| 最后提交 | `2026-02-09 15:09 "项目初始化"` —— **仅此一个 commit，半年零更新** |
| 真代码量 | **8 个 Java 文件，约 600 行，19.5KB**（全项目一眼可通读） |
| 核心机制 | LockPhone.java（175行，无障碍锁机+防绕过）· Network.java（69行，VPN 拦截联网）· BootReceiver.java（21行，开机恢复锁）· CoverView.java（45行，覆盖层） |
| 构建 | Gradle 8.14.3 wrapper 自带，minSdk 29 / targetSdk 36，Java 11 编译（你本机 Java 21 兼容） |
| 资源完整性 | ✅ res 齐全（strings/themes/layout/look_phone.xml），可编译，仓库里甚至有 `app-debug.apk` 产物 |
| 仓库卫生 | ❌ **242 个追踪文件里 182 个是 build 产物**（dex/class/jar/apk 全入库），.gitignore 只挡了 1 条 |
| Release/APK | ❌ 无 release 分发，要自己编译 |
| 平台 | gitcode（非 GitHub），star 185 / fork 186（fork>star，口径存疑） |

### 加入它后的"二次开发容易度"排序（含本机环境实测）

```
yingkong ≈ LeechBlockNG > curbox >> SelfControl(WSL不可行)
```

- **yingkong 的优势**：600 行代码，理解成本约 10 分钟；Android 原生**真锁机**（其他几个项目里唯一"锁全机+防绕过"的开源实现，和你现在锁机 App 的形态最像）；改动纯增量。
- **yingkong 的代价**：① 平台不在 GitHub，PR/issue 生态为零，你要自己 fork 出来维护；② 上游已死（半年无更新），等于你接手当长期维护者；③ 同样要装 Android SDK（一次性 15-30 分钟，和 curbox 相同门槛）。
- **对比 curbox**：curbox 代码量大 30 倍+（939 commits 重构中），但社区活跃、可 F-Droid 安装；yingkong 是要你独自续命但一眼看透。

### 我的建议（你拍板）

- **目标 = 最快跑通一个自己能改的锁机 App + 加罚金逻辑** → **yingkong**。600 行全读懂后，把"罚金/账单"逻辑挂进 LockPhone 或 MainActivity 都是小活，可能一个晚上出原型。
- **目标 = 长期在活跃社区基础上迭代** → curbox，接受它的大代码量和重构期。

你定了，我就把对应项目的 SDK 配置一条龙脚本跑起来（国内源+代理都配好），然后带你定位第一处要改的代码。


https://url.cloud.huawei.com/BLUjd60lOg
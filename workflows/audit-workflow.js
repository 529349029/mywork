export const meta = {
  name: "audit",
  description: "智能合约安全审计完整六阶段流水线 — Phase 0→5 自动编排"
};

const PROJECT_URL = args.url;
const PROJECT_NAME = args.name || PROJECT_URL.split('/').pop().replace(/\.git$/, '');
const PROXY = args.proxy || "http://127.0.0.1:7890";
const WORKSPACE = `~/workspace/${PROJECT_NAME}`;

const errors = [];
async function safePhase(name, fn) {
  try {
    return await fn();
  } catch (e) {
    errors.push({ phase: name, error: e.message });
    log(`⚠ ${name} 失败: ${e.message}，跳过继续`);
    return null;
  }
}

// === Phase 0: 情报收集 ===
phase("Phase 0: Recon");
const recon = await safePhase("Phase 0", () => agent(`
你是智能合约安全审计专家。执行 Phase 0 情报收集。

URL: ${PROJECT_URL}
工作目录: ${WORKSPACE}

步骤：
1. 分析 URL 类型（官网/DEX页/分享链接/社交账号/直接合约地址）
2. 找到 GitHub 则 git clone --depth 1 到 ${WORKSPACE}
3. 检测框架（foundry/hardhat/truffle）并编译
4. 搜索合约地址（本地 deployments/ script/ README/ 或爬官网/SPA）
5. 如有地址无源码：/home/administrator/.hermes/profiles/auditor/skills/web3/bscscan-source-extractor/scripts/fetch_source.py --chain <chain> --address <addr> --output ${WORKSPACE}/
6. 创建 地址说明.md

代理：export HTTP_PROXY=${PROXY} && export HTTPS_PROXY=${PROXY}
工具：forge=/home/administrator/.foundry/bin/forge

返回：{ "repoPath":"...", "addresses":[...], "chain":"...", "hasLocalSol":bool }
`));

if (!recon) return { project: PROJECT_NAME, errors, reportPath: null };

// === Phase 1: Slither ===
phase("Phase 1: Slither Scan");
const scan = await safePhase("Phase 1", () => agent(`
执行 Slither 静态分析。
路径: ${recon.repoPath}

命令：
/home/administrator/.local/bin/slither ${recon.repoPath}/src/ --foundry-out-directory ${recon.repoPath}/out/ --filter-paths "tests|mocks" --print human-summary --json ${recon.repoPath}/slither-report.json
/home/administrator/.local/bin/slither ${recon.repoPath}/src/ --detect naming-convention

过滤 false positive 后返回：{ "summary":"...", "findings":[...], "totalIssues":N }
`));

// === Phase 2: 9 方向并行审计 ===
phase("Phase 2: Manual Audit (9x parallel)");
const auditSpecs = [
  ["evm-audit-general", "Solidity 通用陷阱（外部调用、force-feeding、pause、read-only reentrancy、merkle tree）"],
  ["evm-audit-defi-lending", "借贷协议特有（抵押率、清算、坏账、利率累积）"],
  ["evm-audit-oracles", "预言机/价格操控（Chainlink staleness、TWAP、spot price）"],
  ["evm-audit-precision-math", "精度/舍入（fixed-point math、division ordering）"],
  ["evm-audit-erc4626", "份额操纵（inflation attack、share price manipulation）"],
  ["evm-audit-access-control", "权限/onlyOwner（centralization、privilege escalation）"],
  ["evm-audit-proxies", "升级/代理（UUPS、storage collision、initializer）"],
  ["evm-audit-flashloans", "闪电贷攻击面（flash loan governance、oracle manipulation）"],
  ["evm-audit-chain-specific", "链特有问题（L2 quirks、block.number）"]
];

const audits = await parallel(
  auditSpecs.map(([skill, focus]) => () => agent(`
加载 ${skill} 技能。项目: ${recon.repoPath} 地址: ${JSON.stringify(recon.addresses)}
方向: ${focus}

审计步骤：
1. 加载检查清单
2. 阅读 Solidity 合约
3. 逐项检查，记录漏洞：File, Line, 漏洞入口, Severity, Description, 可利用性
4. Critical/High 做 5 追问（参数来源、谁控制、分支逻辑、意图判断）

铁律：不假设 owner 私钥；依赖 owner 配置 → 设计缺陷

返回：{ "findings": [{ "file","line","entry","severity","description","exploitable","category" }] }
`))
);

// === Phase 2.5: 精度验证 ===
phase("Phase 2.5: Precision");
const precision = await safePhase("Phase 2.5", () => agent(`
精度专项。项目: ${recon.repoPath}

工具：roundme=/home/administrator/.cargo/bin/roundme, halmos=需 source /home/administrator/projects/python_first/.venv/bin/activate, forge=/home/administrator/.foundry/bin/forge

步骤：
1. roundme analyze（公式舍入方向）
2. halmos 符号执行
3. forge test --fuzz-runs 10000
4. 区分 Halmos 限制 vs 真实漏洞

返回：{ "roundme":{formulas,passed}, "halmos":{tests,passed}, "fuzz":{runs:10000,passed}, "vulnerabilities":[] }
`));

// === Phase 3: 链上验证 ===
phase("Phase 3: On-chain Verification");
const onchain = await safePhase("Phase 3", () => agent(`
链上验证。地址: ${JSON.stringify(recon.addresses)} 链: ${recon.chain}

工具：cast=/home/administrator/.foundry/bin/cast, 代理 --proxy ${PROXY}

查询：
1. oracle 价格源 (getSourceOfAsset)
2. oracle 价格 (getAssetPrice)
3. owner EOA vs 合约 (cast code)
4. 关键参数 (LTV/LT/Bonus, flashloan 费率)

依赖 owner 配置的风险 → 设计缺陷

返回：{ "ownerType":"EOA|Multisig", "oracleSource":"...", "parameters":{...}, "designFlaws":[...] }
`));

// === Phase 4: 报告 ===
phase("Phase 4: Report");
const report = await safePhase("Phase 4", () => agent(`
生成审计报告。

汇总数据：
- Recon: ${JSON.stringify(recon)}
- Slither: ${JSON.stringify(scan)}
- Audits: ${JSON.stringify(audits)}
- Precision: ${JSON.stringify(precision)}
- On-chain: ${JSON.stringify(onchain)}

格式要求：
1. Section 顺序：Header→评级→地址→漏洞(C→H→M→L)→链上验证→设计缺陷→工具链→修复→Footer
2. 每条漏洞必含：File, Line, 漏洞入口, Chain, Address(含URL), 可利用性, 能获利吗？, 能否造成重大损失？
3. 文件名：audit-v1-${PROJECT_NAME}-$(date +%Y%m%d_%H%M%S).md
4. 保存到 ~/workspace/audit/

返回：{ "path":"...", "critical":N, "high":N, "medium":N, "low":N }
`));

// === Phase 5: PoC ===
phase("Phase 5: Foundry PoC");
const poc = await safePhase("Phase 5", () => agent(`
Foundry PoC 复现。项目: ${recon.repoPath}
漏洞: ${JSON.stringify(audits)}

工具：forge=/home/administrator/.foundry/bin/forge

步骤：
1. 对 Critical/High 写 PoC（vm.deal, vm.prank）
2. 文件放 test/ 目录
3. forge test --fork-url <rpc> --match-contract PoC -vvv
4. 对比正常路径 vs 攻击路径

返回：{ "pocFiles":[...], "allPassed":bool }
`));

// === 汇总 ===
const allFindings = (audits || []).flatMap(a => a?.findings || []);
return {
  project: PROJECT_NAME,
  reportPath: report?.path,
  errors,
  summary: {
    critical: allFindings.filter(f => f.severity === "Critical").length,
    high: allFindings.filter(f => f.severity === "High").length,
    medium: allFindings.filter(f => f.severity === "Medium").length,
    low: allFindings.filter(f => f.severity === "Low").length
  }
};

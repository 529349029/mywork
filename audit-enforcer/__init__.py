"""audit-enforcer — 审计流程门控插件。

强制审计按 using-audit-v3-workflow 走（防跳步/防快速审计/防散落）：
- ``/audit start <url|org|dir>`` — 建统一审计目录 + 全量 clone（数量校验）+ 初始化状态机
- pre_tool_call 门控：
  - 写报告（audit-*.md）前检查前置：子项目地址说明.md + Slither + 人工审计检查表
  - git clone 目标必须在统一审计目录内
  - 自动标记 Phase 进度（地址说明/Slither/链上验证/报告）
- post_llm_call 软提醒：声称"审计完成"但状态未满 → 提示缺失项

审计目录识别（A+B）：
- A: 路径含 ``*-audit`` 目录名（如 alchemix-audit/）
- B: 目录内含 ``.audit-enforcer.json`` 标记文件
"""

import datetime
import json
import logging
import os
import re
import subprocess
from typing import Any

logger = logging.getLogger(__name__)

# ── 常量 ─────────────────────────────────────────────────────────
_STATE_FILE = ".audit-enforcer.json"
_AUDIT_DIR_RE = re.compile(r"(?:^|/)([^/]+-audit)(?:/|$)")
_REPORT_RE = re.compile(r"audit-[^/]*\.md$")   # 报告文件名：basename 以 audit- 开头（防目录名 audit- 前缀误匹配）
_ADDR_DOC = "地址说明.md"
_WORKSPACE = os.path.expanduser("~/workspace")
_GIT_PROXY = "http://127.0.0.1:7890"

# 锚点增强（2026-08-14，方案 A+B）：checklist 核对项结论的源码锚点
_ANCHOR_FILE_RE = re.compile(r"([\w.-]+\.sol):L?(\d+)")   # 文件.sol:行号（兼容 L 前缀——可机械验证）
_ANCHOR_FUNC_RE = re.compile(r"\b\w+\(\)")               # 函数名()（宽松锚点）

# 审计技能加载 → 标记 checklist_loaded（Phase 2）
_AUDIT_SKILL_PREFIXES = ("evm-audit-", "phase-2", "using-audit")

# 会话级加载记录（方案 C——2026-08-14）：本次进程加载过的审计技能。
# skill_view 时记录（无论项目）；新子项目创建（_sync 补注册）时继承——
# 解决"加载早于子项目创建 → 新项目缺标记"的时序问题（transit 案例）。
# 重启清空（内存）——新会话重新加载（准确——不继承历史会话）。
_SESSION_LOADED: set[str] = set()
_SESSION_CHECKLIST_FULL: set[str] = set()   # 会话级：references/checklist.md 已加载的技能（方案 C）
_SESSION_FILE = os.path.join(os.path.dirname(__file__), ".session-loaded.json")   # 落盘（key=session_id——重启恢复会话用）


def _session_persist(session_id: str) -> None:
    """落盘会话级加载记录（key=session_id——用户建议 2026-08-14：重启恢复会话时重建）。"""
    if not session_id:
        return
    data = {}
    if os.path.exists(_SESSION_FILE):
        try:
            data = json.load(open(_SESSION_FILE, encoding="utf-8"))
        except Exception:  # noqa: BLE001
            data = {}
    data[session_id] = {
        "loaded": sorted(_SESSION_LOADED),
        "checklist_full": sorted(_SESSION_CHECKLIST_FULL),
    }
    try:
        json.dump(data, open(_SESSION_FILE, "w", encoding="utf-8"))
    except Exception:  # noqa: BLE001
        pass


def _session_restore(session_id: str) -> None:
    """读盘重建（重启后恢复同一会话——内存空但盘上有记录）。"""
    if not session_id or not os.path.exists(_SESSION_FILE):
        return
    try:
        data = json.load(open(_SESSION_FILE, encoding="utf-8"))
        rec = data.get(session_id, {})
        _SESSION_LOADED.update(rec.get("loaded", []))
        _SESSION_CHECKLIST_FULL.update(rec.get("checklist_full", []))
    except Exception:  # noqa: BLE001
        pass

# 声称完成的关键词（post_llm_call 软提醒）
_COMPLETION_WORDS = ("审计完成", "审计完毕", "无独立可利用漏洞", "未发现漏洞", "审计结论")


def _now() -> str:
    return datetime.datetime.now(datetime.timezone.utc).isoformat()


# ── 审计目录识别 ─────────────────────────────────────────────────
def _find_audit_dir(path: str) -> str | None:
    """从路径中找 *-audit 目录（含绝对/相对）。

    返回 audit_dir 绝对路径；找不到返回 None。
    """
    if not path:
        return None
    norm = path.replace("\\", "/")
    m = _AUDIT_DIR_RE.search(norm)
    if not m:
        return None
    name = m.group(1)
    idx = norm.find(name)
    prefix = norm[:idx]
    if prefix.startswith("~"):
        prefix = os.path.expanduser(prefix)
    audit_dir = os.path.abspath(os.path.join(prefix, name))
    return audit_dir if os.path.isdir(audit_dir) else None


def _subproject_for_path(audit_dir: str, path: str) -> str | None:
    """路径中位于 audit_dir/<子项目>/ 下的子项目名；否则 None。"""
    norm = path.replace("\\", "/").rstrip("/")
    prefix = audit_dir.rstrip("/") + "/"
    if not norm.startswith(prefix):
        return None
    rest = norm[len(prefix):]
    sub = rest.split("/", 1)[0]
    if not sub or sub == ".audit-enforcer.json":
        return None
    return sub


# ── 状态机读写 ───────────────────────────────────────────────────
def _state_path(audit_dir: str) -> str:
    return os.path.join(audit_dir, _STATE_FILE)


def _load_state(audit_dir: str) -> dict | None:
    p = _state_path(audit_dir)
    if not os.path.exists(p):
        return None
    try:
        with open(p, encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:  # noqa: BLE001
        # 损坏/竞态写：备份 + 日志（不静默——否则懒初始化会重建丢进度）
        bak = p + ".corrupt.bak"
        try:
            os.replace(p, bak)
        except Exception:  # noqa: BLE001
            pass
        logger.warning("audit-enforcer: 状态机损坏 %s（已备份 %s）: %s", p, bak, e)
        return None


def _save_state(audit_dir: str, state: dict) -> None:
    with open(_state_path(audit_dir), "w", encoding="utf-8") as f:
        json.dump(state, f, indent=2, ensure_ascii=False)


def _new_subproject_state() -> dict:
    return {
        "addr_doc": {"done": False, "path": None},
        "p1_slither": {"done": False, "output": None, "n/a": True},   # 默认跳过（2026-08-14：11 仓库实测 0 真阳性——收效甚微——按需跑）
        "p2_manual": {"done": False, "checklist_loaded": False, "checklist_done": False, "checklist_full": [], "loaded_skills": [], "declared_skills": []},
        "p25_precision": {"done": False, "n/a": False},
        "p3_onchain": {"done": False, "n/a": True},   # 默认跳过，等指令
        "p4_report": {"done": False, "path": None},
        "p5_poc": {"done": False, "n/a": True},       # 默认跳过，等指令
    }


def _scan_subprojects(audit_dir: str) -> dict:
    """扫描 audit_dir 下含 src/ 的目录作为子项目。"""
    subs = {}
    if not os.path.isdir(audit_dir):
        return subs
    for d in sorted(os.listdir(audit_dir)):
        if os.path.isdir(os.path.join(audit_dir, d, "src")):
            subs[d] = _new_subproject_state()
    return subs


# ── 工具参数路径提取 ─────────────────────────────────────────────
def _extract_paths(tool_name: str, args: dict | None) -> list[str]:
    paths = []
    if not args:
        return paths
    if tool_name in ("write_file", "patch", "read_file"):
        if args.get("path"):
            paths.append(str(args["path"]))
    elif tool_name == "terminal":
        if args.get("workdir"):
            paths.append(str(args["workdir"]))
        cmd = str(args.get("command", ""))
        # 提取命令中出现的绝对路径/相对路径 token
        for m in re.finditer(r"(?:^|\s)([/~][\w./\-]+)", cmd):
            paths.append(m.group(1))
    elif tool_name == "skill_view":
        # 无路径——用虚拟标记（skill 名做路径匹配由调用方特判）
        paths.append("skill:" + str(args.get("name", "")))
    return paths


# ── 自动标记（正向，工具调用即标记）──────────────────────────────
def _auto_mark(state: dict, audit_dir: str, tool_name: str, args: dict) -> None:
    changed = False

    if tool_name == "write_file":
        path = str(args.get("path", ""))
        sub = _subproject_for_path(audit_dir, path)
        if sub and sub in state.get("subprojects", {}):
            sp = state["subprojects"][sub]
            if path.endswith(_ADDR_DOC):
                addr = sp.setdefault("addr_doc", {})
                addr["done"] = True
                addr["path"] = path
                changed = True
            elif _REPORT_RE.search(path):
                pr = sp.setdefault("p4_report", {})
                pr["done"] = True
                pr["path"] = path
                changed = True
            elif path.endswith("checklist-核对.md"):
                # checklist 核对记录落盘 → 标记（产出级证据——门控 7 前置）
                pm = sp.setdefault("p2_manual", {})
                pm["checklist_done"] = True
                changed = True

    elif tool_name == "terminal":
        cmd = str(args.get("command", ""))
        # 定位子项目：workdir 或命令中最近的 audit_dir 路径
        sub = None
        for p in _extract_paths("terminal", args):
            s = _subproject_for_path(audit_dir, p)
            if s:
                sub = s
                break
        if sub and sub in state.get("subprojects", {}):
            sp = state["subprojects"][sub]
            if "slither" in cmd:
                sp["p1_slither"]["done"] = True
                # 记录 slither 命令本身（不是整条命令开头——可能含 install/build 等前缀）
                idx = cmd.find("slither")
                sp["p1_slither"]["output"] = cmd[max(0, idx): idx + 120]
                changed = True
            elif re.search(r"cast\s+(call|code|send|storage)|eth_call|getcode", cmd):
                sp["p3_onchain"]["done"] = True
                sp["p3_onchain"]["n/a"] = False
                changed = True

    elif tool_name == "skill_view":
        name = str(args.get("name", ""))
        if name.startswith(_AUDIT_SKILL_PREFIXES):
            for sp in state.get("subprojects", {}).values():
                sp["p2_manual"]["checklist_loaded"] = True
                skills = sp["p2_manual"].setdefault("loaded_skills", [])
                if name not in skills:
                    skills.append(name)   # 记录已加载的 evm-audit-* 技能（Phase 2 门控用）
            changed = True

    if changed:
        _save_state(audit_dir, state)


# ── 门控判定 ─────────────────────────────────────────────────────
def _skill_dir_for(skill_name: str) -> str:
    """定位技能目录（skills 下递归查找 name/SKILL.md）。找不到返回空串。"""
    skills_root = os.path.join(os.path.expanduser("~"), ".hermes", "profiles", "auditor", "skills")
    for root, dirs, files in os.walk(skills_root):
        if skill_name in dirs:
            cand = os.path.join(root, skill_name)
            if os.path.exists(os.path.join(cand, "SKILL.md")):
                return cand
    return ""


def _check_anchor_validity(sub_dir: str, ck_content: str) -> list[str]:
    """行号有效性（机械检查）：文件.sol:行号 锚点 → 文件存在于子项目 + 行号 ≤ 文件行数。

    编造的行号（超文件范围/文件不存在）在此被抓——纯计算，不依赖 LLM 判断。
    """
    bad = []
    for m in _ANCHOR_FILE_RE.finditer(ck_content):
        fname, lineno = m.group(1), int(m.group(2))
        found = None
        for root, _, files in os.walk(sub_dir):
            if fname in files:
                found = os.path.join(root, fname)
                break
        if not found:
            bad.append(f"{fname}:{lineno}（文件不在子项目中）")
            continue
        try:
            total = sum(1 for _ in open(found, encoding="utf-8", errors="ignore"))
        except Exception:  # noqa: BLE001
            total = 0
        if lineno > total:
            bad.append(f"{fname}:{lineno}（文件仅 {total} 行——超范围=疑似编造）")
    return bad


def _check_report_gates(state: dict, audit_dir: str, path: str) -> str | None:
    sub = _subproject_for_path(audit_dir, path)
    if not sub:
        return None
    sp = state.get("subprojects", {}).get(sub)
    if not sp:
        return None

    # 1. 地址说明.md（0.3e 铁律——子项目级）
    addr_ok = sp.get("addr_doc", {}).get("done") or os.path.exists(
        os.path.join(audit_dir, sub, _ADDR_DOC)
    )
    if not addr_ok:
        return (
            f"**audit-enforcer**: 子项目 `{sub}` 的 `{_ADDR_DOC}` 未生成"
            "（Phase 0 0.3e 铁律——子项目级必做）。先生成地址说明.md 再写报告。"
        )

    # 2. Slither（Phase 1——默认 n/a 跳过，2026-08-14：11 仓库实测 0 真阳性——按需跑）
    if not sp.get("p1_slither", {}).get("done") and not sp.get("p1_slither", {}).get("n/a", False):
        return (
            f"**audit-enforcer**: 子项目 `{sub}` 的 Slither 未跑（Phase 1 必做——若跳过需先声明 n/a）。"
            "先跑 `slither .` 再写报告。"
        )

    # 3. 人工审计检查表（Phase 2 必做——主技能 + references/checklist.md 完整加载）
    if not sp.get("p2_manual", {}).get("checklist_loaded"):
        return (
            f"**audit-enforcer**: 子项目 `{sub}` 的审计检查表未加载（Phase 2 必做）。"
            "先加载 evm-audit-defi-lending / evm-audit-general 等 checklist 再写报告。"
        )
    # 3b. 每个声明技能的 references/checklist.md 必须已加载（2026-08-14：checklist.md 才是逐项检查表——SKILL.md 主体只是大纲）
    declared_here = sp.get("p2_manual", {}).get("declared_skills", [])
    full = set(sp.get("p2_manual", {}).get("checklist_full", []))
    missing_full = [
        s for s in declared_here
        if os.path.exists(os.path.join(
            _skill_dir_for(s), "references", "checklist.md"
        )) and s not in full
    ]
    if missing_full:
        return (
            f"**audit-enforcer**: 子项目 `{sub}` 声明技能 {', '.join(sorted(missing_full))} "
            "的逐项检查表未完整加载（references/checklist.md——该文件才是逐项检查项，SKILL.md 只是大纲）。"
            "先 skill_view 加载 references/checklist.md 再写报告。"
        )

    # 4. Phase 2 必加载技能（Routing Table 强制项——任何 EVM 合约必选）
    loaded = set(sp.get("p2_manual", {}).get("loaded_skills", []))
    required = {"evm-audit-general", "evm-audit-precision-math", "evm-audit-governance"}
    missing = sorted(required - loaded)
    if missing:
        return (
            f"**audit-enforcer**: 子项目 `{sub}` 的 Phase 2 必加载技能缺失："
            f"{', '.join(missing)}（Routing Table 任何合约必选——"
            "evm-audit-general 通用陷阱 + evm-audit-precision-math 精度强制项"
            " + evm-audit-governance 治理/金库经济模型强制项）。"
            "先加载再写报告。"
        )
    # 4b. 必加载技能的 references/checklist.md 也必须已加载（2026-08-14 收紧 A：通用技能也要求完整 checklist）
    full = set(sp.get("p2_manual", {}).get("checklist_full", []))
    missing_full4 = [
        s for s in sorted(required)
        if os.path.exists(os.path.join(_skill_dir_for(s), "references", "checklist.md"))
        and s not in full
    ]
    if missing_full4:
        return (
            f"**audit-enforcer**: 子项目 `{sub}` 的必加载技能 {', '.join(missing_full4)} "
            "逐项检查表未加载（references/checklist.md——2026-08-14 收紧：通用技能也要求完整 checklist）。"
            "先 skill_view 加载 references/checklist.md 再写报告。"
        )

    # 5. 技能声明检查（LLM 判断——必经步骤，2026-08-14 新增）
    declared = set(sp.get("p2_manual", {}).get("declared_skills", []))
    if not declared:
        return (
            f"**audit-enforcer**: 子项目 `{sub}` 未声明所需审计技能（Phase 2 必经步骤）。"
            "先调 audit_declare_skills 声明该子项目所需技能（LLM 通读源码后判断），"
            "再加载声明的技能（skill_view）后写报告。"
        )

    # 6. 声明技能必须已加载（防假声明——声明了没加载等于没做）
    missing_declared = sorted(declared - loaded)
    if missing_declared:
        return (
            f"**audit-enforcer**: 子项目 `{sub}` 声明了但未加载："
            f"{', '.join(missing_declared)}。先 skill_view 加载声明的技能再写报告。"
        )

    # 7. checklist 核对记录（产出级证据——2026-08-14 新增，方案 B）
    #    写报告前必须有 <子项目>/checklist-核对.md：每个声明技能一节、逐项 - [x]/[n/a]
    checklist_file = os.path.join(audit_dir, sub, "checklist-核对.md")
    if not os.path.exists(checklist_file):
        return (
            f"**audit-enforcer**: 子项目 `{sub}` 未完成 checklist 逐项核对"
            "（产出级证据——写 `<子项目>/checklist-核对.md`：每个声明技能一节，"
            "逐项 `- [x] 结论` / `- [n/a] 原因`）。先核对落盘再写报告。"
        )
    try:
        ck_content = open(checklist_file, encoding="utf-8").read()
    except Exception:  # noqa: BLE001
        return f"**audit-enforcer**: `{sub}/checklist-核对.md` 读取失败——检查文件"
    # 覆盖性：每个声明技能必须有核对节
    missing_sections = [s for s in sorted(declared) if f"## {s}" not in ck_content]
    if missing_sections:
        return (
            f"**audit-enforcer**: `{sub}/checklist-核对.md` 缺少核对节："
            f"{', '.join(missing_sections)}——每个声明技能都要逐项核对"
        )
    # 数量：至少 5 个核对项（防空文件/形式主义）
    import re as _re

    item_count = len(_re.findall(r"^\s*- \[(?:x|X|✅|n/a|N/A)\]", ck_content, _re.MULTILINE))
    if item_count < 5:
        return (
            f"**audit-enforcer**: `{sub}/checklist-核对.md` 核对项过少"
            f"（{item_count} < 5）——逐项核对后再写报告"
        )

    # 第 4 层：锚点覆盖（[x] 项 ≥50% 含源码锚点——n/a 项不计——2026-08-14 修正：n/a 无锚点合理）
    items = [
        l for l in ck_content.splitlines()
        if _re.match(r"^\s*- \[(?:x|X|✅|n/a|N/A)\]", l)
    ]
    x_items = [l for l in items if _re.match(r"^\s*- \[(?:x|X|✅)\]", l)]
    anchored = [l for l in x_items if _ANCHOR_FILE_RE.search(l) or _ANCHOR_FUNC_RE.search(l)]
    if x_items and len(anchored) < max(2, len(x_items) // 2):
        return (
            f"**audit-enforcer**: `{sub}/checklist-核对.md` 核对结论缺源码锚点"
            f"（{len(anchored)}/{len(x_items)} 项含锚点——需 ≥50%）——"
            "每项结论锚定真实代码位置（`文件.sol:行号` 或 `函数名()`）"
        )

    # 第 5 层：行号有效性（机械——编造超范围被抓）
    bad_anchors = _check_anchor_validity(os.path.join(audit_dir, sub), ck_content)
    if bad_anchors:
        return (
            f"**audit-enforcer**: `{sub}/checklist-核对.md` 锚点无效："
            f"{'; '.join(bad_anchors[:3])}——行号必须真实（≤文件行数）"
        )

    # 第 6 层：checklist 覆盖率（≥90%——2026-08-14 用户定 C：逐项核对——非摘要）
    #    遍历「声明技能 ∪ 必加载技能(required)」：required 虽强制加载+checklist，但若不声明，
    #    其 checklist 不会被覆盖核对——扩进遍历使其（含 governance 经济层段）亦 ≥90% 强制逐项核对
    for skill in sorted(set(declared_here) | required):
        skill_dir = _skill_dir_for(skill)
        ck_path = os.path.join(skill_dir, "references", "checklist.md")
        if not os.path.exists(ck_path):
            continue
        try:
            ck_items = len(_re.findall(r"^\s*- \[", open(ck_path, encoding="utf-8").read(), _re.MULTILINE))
        except Exception:  # noqa: BLE001
            continue
        if ck_items == 0:
            continue
        # 核对记录中该技能节的核对项数（## skill 节——到下一个 ## 前）
        section = ""
        sec_start = ck_content.find(f"## {skill}")
        if sec_start >= 0:
            sec_end = ck_content.find("\n## ", sec_start + 5)
            section = ck_content[sec_start:] if sec_end < 0 else ck_content[sec_start:sec_end]
        section_items = len(_re.findall(r"^\s*- \[", section, _re.MULTILINE))
        if section_items < ck_items * 0.9:
            return (
                f"**audit-enforcer**: `{sub}/checklist-核对.md` 的 `{skill}` 核对覆盖不足"
                f"（{section_items}/{ck_items}——需 ≥90%）——checklist 逐项核对（非摘要）后再写报告"
            )

    return None


def _check_clone_path(state: dict, audit_dir: str, cmd: str) -> str | None:
    """检查 git clone 的显式目标目录必须在审计主目录内。

    修复（2026-08-14）：`git clone --depth=1 <url>` 或 `git clone <url> <target>`——
    URL 和 --flag 及其参数不是 target（误判过：--depth 1 的 1、URL 本身被当目标）。
    只认第一个非 URL 非 flag 的位置参数（git clone <url> <target> 的 target）。
    """
    m = re.search(r"git\s+clone\s+(.+)$", cmd)
    if not m:
        return None
    parts = m.group(1).split()
    args = []
    skip_next = False
    for p in parts:
        if skip_next:
            skip_next = False
            continue
        if p.startswith("--") and "=" not in p:   # --depth 1 / --branch x（flag + 参数）
            skip_next = True
            continue
        if p.startswith("--"):                     # --depth=1 类（flag 内嵌参数）
            continue
        if p.startswith(("http://", "https://", "git@", "ssh://")):  # URL 不是 target
            continue
        args.append(p)
    if not args:
        return None
    dest = args[0]  # git clone <url> <target> 的显式 target
    dest_abs = os.path.abspath(os.path.expanduser(dest))
    if not dest_abs.startswith(audit_dir.rstrip("/") + "/"):
        return (
            f"**audit-enforcer**: `git clone` 目标 `{dest}` 不在统一审计目录 "
            f"`{audit_dir}/` 内。clone 必须直接进主目录（从源头集中，不散落）。"
        )
    return None


# ── hooks ────────────────────────────────────────────────────────
def _all_audit_dirs() -> list[str]:
    """扫描 workspace 下所有 *-audit 目录。"""
    dirs = []
    if os.path.isdir(_WORKSPACE):
        for d in sorted(os.listdir(_WORKSPACE)):
            if d.endswith("-audit") and os.path.isdir(os.path.join(_WORKSPACE, d)):
                dirs.append(os.path.join(_WORKSPACE, d))
    return dirs


def _sync_subprojects(state: dict, audit_dir: str) -> bool:
    """把 audit_dir 下实际存在的子项目（含 src/）合并进状态机。

    懒初始化可能在 clone 之前触发（subprojects 空）——之后 clone 完成，
    新子项目需动态补注册，否则 _auto_mark/_check_report_gates 找不到子项目
    导致标记/门控全部失效（morpho-audit 实测教训：subprojects:{} 卡死）。
    返回是否有变更（调用方负责保存）。
    """
    if not os.path.isdir(audit_dir):
        return False
    subs = state.setdefault("subprojects", {})
    changed = False
    for d in sorted(os.listdir(audit_dir)):
        sub_dir = os.path.join(audit_dir, d)
        has_src = os.path.isdir(os.path.join(sub_dir, "src"))
        has_sol = any(f.endswith(".sol") for f in os.listdir(sub_dir)) if os.path.isdir(sub_dir) else False
        has_sol_rec = False
        if not has_src and not has_sol and os.path.isdir(sub_dir):
            for root, _, files in os.walk(sub_dir):
                if any(f.endswith(".sol") for f in files):
                    has_sol_rec = True
                    break
        if d not in subs and (has_src or has_sol or has_sol_rec):
            subs[d] = _new_subproject_state()
            changed = True
    # 方案 C（2026-08-14）：会话级继承——新子项目（含懒初始化创建的——loaded 空）继承本次会话加载的技能
    # 解决"加载早于子项目创建 → 新项目缺标记"（transit 案例——不继承历史会话——按 session_id 落盘恢复）
    for sub, sp in subs.items():
        pm = sp.setdefault("p2_manual", {})
        if _SESSION_LOADED and not pm.get("loaded_skills"):
            pm["loaded_skills"] = sorted(_SESSION_LOADED)
            pm["checklist_loaded"] = True
            changed = True
        if _SESSION_CHECKLIST_FULL and not pm.get("checklist_full"):
            pm["checklist_full"] = sorted(_SESSION_CHECKLIST_FULL)
            changed = True
    # 产物恢复：子项目已有 地址说明.md → addr_doc done（文件级兜底的同步版）
    for sub, sp in subs.items():
        addr = sp.setdefault("addr_doc", {})
        if not addr.get("done") and os.path.exists(
            os.path.join(audit_dir, sub, _ADDR_DOC)
        ):
            addr["done"] = True
            addr["path"] = os.path.join(audit_dir, sub, _ADDR_DOC)
            changed = True
    return changed


def _on_pre_tool_call(tool_name: str = "", args: dict | None = None, **kw):
    """审计门控：拦截跳步工具调用；自动标记 Phase 进度。"""
    if args is None:
        return None

    _session_restore(kw.get("session_id", ""))   # 重启恢复会话：读盘重建会话级加载（方案 C 落盘）

    # skill_view 特判：加载审计技能（evm-audit-*/phase-2）→ 全局标记 checklist_loaded + 记录技能名
    # （skill_view 无路径可匹配审计目录，只能全局标记）
    if tool_name == "skill_view":
        name = str(args.get("name", ""))
        fpath = str(args.get("file_path", "") or "")
        is_checklist = "checklist" in fpath.lower()
        if name.startswith(_AUDIT_SKILL_PREFIXES):
            _SESSION_LOADED.add(name)   # 会话级记录（方案 C——无论项目）
        if is_checklist and name.startswith(_AUDIT_SKILL_PREFIXES):
            _SESSION_CHECKLIST_FULL.add(name)   # 会话级：checklist.md 已加载（方案 C）
        if _SESSION_LOADED or _SESSION_CHECKLIST_FULL:
            _session_persist(kw.get("session_id", ""))   # 落盘（key=session_id——重启恢复）
        if name.startswith(_AUDIT_SKILL_PREFIXES) or is_checklist:
            for ad in _all_audit_dirs():
                st = _load_state(ad)
                if st:
                    for sp in st.get("subprojects", {}).values():
                        pm = sp.setdefault("p2_manual", {})
                        pm["checklist_loaded"] = True
                        skills = pm.setdefault("loaded_skills", [])
                        if name.startswith(_AUDIT_SKILL_PREFIXES) and name not in skills:
                            skills.append(name)
                        # references/checklist.md 加载 → 记录 checklist_full（该技能的完整检查表已加载）
                        if is_checklist:
                            full = pm.setdefault("checklist_full", [])
                            if name not in full:
                                full.append(name)
                    _save_state(ad, st)
        return None

    audit_dir = None
    for p in _extract_paths(tool_name, args):
        audit_dir = _find_audit_dir(p)
        if audit_dir:
            break
    if not audit_dir:
        return None  # 非审计目录操作——零干扰

    state = _load_state(audit_dir)
    if not state:
        # 懒初始化：agent 按 workflow 建了 *-audit 目录但还没 /audit start——
        # 自动扫描子项目建状态机，门控立即生效（无需 slash 命令）
        state = {
            "project": os.path.basename(audit_dir).removesuffix("-audit"),
            "audit_dir": audit_dir,
            "started_at": _now(),
            "subprojects": _scan_subprojects(audit_dir),
        }
        _save_state(audit_dir, state)
        logger.info("audit-enforcer: 懒初始化状态机 %s", audit_dir)

    if _sync_subprojects(state, audit_dir):  # 动态补注册新子项目 + 产物恢复（有变更则保存）
        _save_state(audit_dir, state)
    _auto_mark(state, audit_dir, tool_name, args)  # 先标记，再检查

    if tool_name == "write_file":
        path = str(args.get("path", ""))
        if _REPORT_RE.search(path):
            violation = _check_report_gates(state, audit_dir, path)
            if violation:
                return {"action": "block", "message": violation}
    elif tool_name == "terminal":
        cmd = str(args.get("command", ""))
        if "git clone" in cmd:
            violation = _check_clone_path(state, audit_dir, cmd)
            if violation:
                return {"action": "block", "message": violation}

    return None


def _on_post_llm_call(response: str = "", **_):
    """软提醒：回复声称审计完成但状态未满 → 附缺失项提示。"""
    if not response:
        return None
    if not any(w in response for w in _COMPLETION_WORDS):
        return None

    # 收集所有审计目录（扫描 workspace 下 *-audit 目录）
    missing_lines = []
    if os.path.isdir(_WORKSPACE):
        for d in sorted(os.listdir(_WORKSPACE)):
            audit_dir = os.path.join(_WORKSPACE, d)
            if not d.endswith("-audit") or not os.path.isdir(audit_dir):
                continue
            state = _load_state(audit_dir)
            if not state:
                continue
            for sub, sp in state.get("subprojects", {}).items():
                if sp["p4_report"]["done"]:
                    continue  # 已完成的不提示
                gaps = []
                if not sp["addr_doc"]["done"]:
                    gaps.append("地址说明.md")
                if not sp["p1_slither"]["done"]:
                    gaps.append("Slither")
                if not sp["p2_manual"]["checklist_loaded"]:
                    gaps.append("检查表")
                if gaps:
                    missing_lines.append(f"- `{d}/{sub}` 缺: {', '.join(gaps)}")

    if missing_lines:
        return {
            "action": "inject",
            "message": (
                "**audit-enforcer 提醒**: 声称审计完成，但以下子项目状态未满：\n"
                + "\n".join(missing_lines)
            ),
        }
    return None


# ── audit_declare_skills 工具（Phase 2 技能声明——LLM 判断后调用）─────────
_DECLARE_SCHEMA = {
    "name": "audit_declare_skills",
    "description": (
        "声明某审计子项目所需的安全审计技能（Phase 2 必经步骤——"
        "LLM 通读源码后判断该子项目需要哪些 evm-audit-* 技能，调用本工具声明；"
        "不声明则后续写报告被门控拦截）。子项目名 + 技能名列表。"
    ),
    "parameters": {
        "type": "object",
        "properties": {
            "subproject": {
                "type": "string",
                "description": "子项目名（如 morpho-blue——位于 <项目>-audit/<子项目>/src）",
            },
            "skills": {
                "type": "array",
                "items": {"type": "string"},
                "description": "所需审计技能名列表（如 evm-audit-defi-lending、evm-audit-oracles）",
            },
        },
        "required": ["subproject", "skills"],
    },
}


def _locate_subproject(subproject: str) -> tuple[str | None, str]:
    """扫 workspace 所有 *-audit → 找含 subproject 的目录（src/ 或直接含 .sol 或递归含 .sol）。

    返回 (audit_dir, 状态)；歧义返回 ("AMBIGUOUS", subproject)，找不到返回 (None, subproject)。
    """

    def _has_sol_recursive(d: str) -> bool:
        for root, _, files in os.walk(d):
            if any(f.endswith(".sol") for f in files):
                return True
        return False

    hits = []
    for ad in _all_audit_dirs():
        sub_dir = os.path.join(ad, subproject)
        if os.path.isdir(os.path.join(sub_dir, "src")):
            hits.append(ad)
        elif os.path.isdir(sub_dir) and any(
            f.endswith(".sol") for f in os.listdir(sub_dir)
        ):
            hits.append(ad)   # 非标准结构：合约直接在子项目根（如 test-bep20）
        elif os.path.isdir(sub_dir) and _has_sol_recursive(sub_dir):
            hits.append(ad)   # 宽松：子项目存在 + 递归含 .sol（如 contracts/ 布局——transit-core-v5）
    if len(hits) == 1:
        return (hits[0], subproject)
    if len(hits) > 1:
        return ("AMBIGUOUS", subproject)
    return (None, subproject)


def _handle_declare_skills(args: dict | None = None, **kw) -> str:
    """audit_declare_skills handler：记录子项目声明的技能（去重）。

    签名与 mode-enforcer 一致（args dict + **kw 吸收 session_id 等运行时参数）。
    """
    if not args:
        return "audit_declare_skills: 需要 subproject 和 skills 参数"
    subproject = str(args.get("subproject", ""))
    skills = args.get("skills", []) or []
    if not subproject or not skills:
        return "audit_declare_skills: 需要 subproject 和 skills 参数"
    skills = [s for s in skills if isinstance(s, str) and s.strip()]
    if not skills:
        return "audit_declare_skills: skills 为空"

    audit_dir, sub = _locate_subproject(subproject)
    if audit_dir is None:
        return (
            f"audit_declare_skills: 未找到子项目 `{subproject}`"
            "（workspace 下无 <项目>-audit/<子项目>/src）——确认审计目录已建、子项目已 clone"
        )
    if audit_dir == "AMBIGUOUS":
        return (
            f"audit_declare_skills: 子项目名 `{subproject}` 在多个审计目录中存在——歧义，"
            "请确认目标审计目录"
        )

    state = _load_state(audit_dir)
    if not state:
        state = {
            "project": os.path.basename(audit_dir).removesuffix("-audit"),
            "audit_dir": audit_dir,
            "started_at": _now(),
            "subprojects": _scan_subprojects(audit_dir),
        }
    _sync_subprojects(state, audit_dir)

    sp = state.setdefault("subprojects", {}).setdefault(sub, _new_subproject_state())
    declared = sp.setdefault("p2_manual", {}).setdefault("declared_skills", [])
    added = [s for s in skills if s not in declared]
    declared.extend(added)
    _save_state(audit_dir, state)

    msg = f"✅ 已声明 `{sub}` 所需技能：{', '.join(declared)}"
    if added:
        msg += f"（新增 {len(added)} 个）"
    msg += "——请 skill_view 加载这些技能后再写报告"
    return msg


# ── /audit 命令 ──────────────────────────────────────────────────
def _derive_org(target: str) -> str:
    """从 URL/org 提取 org 名（github.com/org 场景）。"""
    t = target.strip().rstrip("/")
    m = re.search(r"github\.com/([^/]+)", t)
    if m:
        return m.group(1)
    return ""


def _find_github_from_site(url: str) -> str:
    """从官网页面提取 GitHub org（curl 页面 → 找 github.com 链接）。"""
    try:
        out = subprocess.run(
            ["curl", "-sL", "--max-time", "20", url],
            capture_output=True, text=True, timeout=30,
        ).stdout
    except Exception:  # noqa: BLE001
        return ""
    m = re.search(r"github\.com/([A-Za-z0-9_.-]+)", out)
    return m.group(1) if m else ""


def _derive_project(target: str) -> str:
    """从 URL/org/目录派生项目名（主目录名）。"""
    t = target.strip().rstrip("/")
    if os.path.isdir(t):
        return os.path.basename(t)
    if "github.com" in t:
        org = _derive_org(t)
        return org.replace("-finance", "").replace("-protocol", "").replace("-labs", "")
    m = re.search(r"https?://([\w.-]+)", t)
    if m:
        return m.group(1).split(".")[0]
    if "/" in t:
        return os.path.basename(t)   # 路径形式（目录可能未建）
    return t


def _clone_all(org: str, audit_dir: str) -> tuple[list[str], list[str]]:
    """GitHub API 全量枚举 → clone 进主目录 → 数量校验。

    返回 (cloned 子项目列表, failed 仓库列表)。
    """
    # 1. API 分页全量枚举
    repos: list[dict] = []
    page = 1
    while True:
        url = (
            f"https://api.github.com/orgs/{org}/repos"
            f"?per_page=100&page={page}&type=all"
        )
        try:
            out = subprocess.run(
                ["curl", "-s", url], capture_output=True, text=True, timeout=60
            ).stdout
        except Exception:  # noqa: BLE001
            break
        try:
            data = json.loads(out)
        except Exception:  # noqa: BLE001
            break
        if isinstance(data, dict):  # API 错误
            logger.warning("audit-enforcer: GitHub API 错误: %s", data.get("message"))
            break
        if not data:
            break
        repos.extend(data)
        if len(data) < 100:
            break
        page += 1

    targets = [r for r in repos if not r.get("fork")]
    total = len(targets)

    # 2. 逐个 clone（断点续 + 失败记录）
    failed: list[str] = []
    for r in targets:
        dest = os.path.join(audit_dir, r["name"], "src")
        if os.path.exists(dest):
            continue
        try:
            res = subprocess.run(
                [
                    "git", "-c", f"http.proxy={_GIT_PROXY}",
                    "clone", "--depth", "1", r["clone_url"], dest,
                ],
                capture_output=True, text=True, timeout=180,
            )
            if res.returncode != 0:
                failed.append(r["name"])
        except Exception as e:  # noqa: BLE001
            failed.append(f"{r['name']}({e})")

    # 3. 数量校验
    cloned = [d for d in os.listdir(audit_dir)
              if os.path.isdir(os.path.join(audit_dir, d, "src"))]
    logger.info(
        "audit-enforcer: 枚举 %d 仓库（非 fork）→ clone 成功 %d / 失败 %d",
        total, len(cloned), len(failed),
    )
    return cloned, failed


def _audit_start(target: str) -> str:
    """/audit start：解析目标 → 建主目录 + 枚举 clone + 状态机。"""
    if not target:
        return "/audit start 需要一个目标（官网 URL / GitHub org / 本地目录）"

    project = _derive_project(target)
    audit_dir = os.path.join(_WORKSPACE, f"{project}-audit")
    os.makedirs(audit_dir, exist_ok=True)

    # 用户给本地合约目录 → 移入主目录（集中）
    moved = []
    if os.path.isdir(target):
        base = os.path.basename(target.rstrip("/"))
        dest = os.path.join(audit_dir, base, "src")
        if not os.path.exists(dest):
            os.makedirs(os.path.dirname(dest), exist_ok=True)
            os.rename(target, dest)
            moved.append(base)

    # 枚举 + clone：优先 GitHub org；官网则尝试从页面提取 github 链接
    cloned, failed = [], []
    org = _derive_org(target)
    if not org and target.startswith("http"):
        org = _find_github_from_site(target)
    if org:
        cloned, failed = _clone_all(org, audit_dir)

    # 状态机
    state = {
        "project": project,
        "audit_dir": audit_dir,
        "started_at": _now(),
        "subprojects": _scan_subprojects(audit_dir),
    }
    _save_state(audit_dir, state)

    lines = [f"✅ 审计启动: {audit_dir}", ""]
    if moved:
        lines.append(f"已移入: {', '.join(moved)} → <子项目>/src/")
    if cloned:
        lines.append(f"已 clone: {', '.join(cloned)}")
    if failed:
        lines.append(f"⚠️ clone 失败（需重试）: {', '.join(failed)}")
    if not cloned and not moved and not state["subprojects"]:
        lines.append(
            "ℹ️ 官网未直接暴露 GitHub 链接——已建主目录+状态机。"
            "agent 将按 using-audit-v3-workflow Phase 0 继续情报收集"
            "（官网 → 搜索引擎/GitHub API 定位仓库 → 枚举 clone）。"
        )
        return "\n".join(lines)
    lines.append("")
    lines.append(f"子项目: {', '.join(state['subprojects'].keys()) or '(无——检查 src/ 目录)'}")
    lines.append("门控已生效——agent 将按 using-audit-v3-workflow 继续 Phase 0→4。")
    return "\n".join(lines)


def _audit_status(target: str = "") -> str:
    """/audit status：列出所有审计目录的子项目 Phase 进度。"""
    lines = []
    scan_dirs = []
    if target and os.path.isdir(target):
        scan_dirs.append(target)
    else:
        if os.path.isdir(_WORKSPACE):
            for d in sorted(os.listdir(_WORKSPACE)):
                if d.endswith("-audit"):
                    scan_dirs.append(os.path.join(_WORKSPACE, d))

    for audit_dir in scan_dirs:
        state = _load_state(audit_dir)
        if not state:
            lines.append(f"📂 {audit_dir} — 未初始化（无状态机）")
            continue
        lines.append(f"📂 {os.path.basename(audit_dir)}（{state.get('project', '?')}）")
        for sub, sp in sorted(state.get("subprojects", {}).items()):
            marks = []
            marks.append("✅" if sp["addr_doc"]["done"] else "⬜" + " 地址说明")
            marks.append("✅" if sp["p1_slither"]["done"] else "⬜" + " Slither")
            marks.append("✅" if sp["p2_manual"]["checklist_loaded"] else "⬜" + " 检查表")
            marks.append("✅" if sp["p4_report"]["done"] else "⬜" + " 报告")
            if not sp["p3_onchain"]["n/a"]:
                marks.append("✅" if sp["p3_onchain"]["done"] else "⬜" + " 链上")
            lines.append(f"  {sub}: {' '.join(marks)}")
    if not lines:
        return "未发现审计目录（workspace 下无 *-audit/）"
    return "\n".join(lines)


def _audit_phase_done(args: str) -> str:
    """/audit phase done <子项目> <phase>"""
    parts = args.split()
    if len(parts) < 2:
        return "用法: /audit phase done <子项目> <phase>（phase: addr_doc/p1_slither/p2_manual/p3_onchain/p4_report）"
    sub, phase = parts[0], parts[1]

    # 找包含该子项目的审计目录
    if os.path.isdir(_WORKSPACE):
        for d in sorted(os.listdir(_WORKSPACE)):
            if not d.endswith("-audit"):
                continue
            audit_dir = os.path.join(_WORKSPACE, d)
            state = _load_state(audit_dir)
            if state and sub in state.get("subprojects", {}):
                sp = state["subprojects"][sub]
                if phase not in sp:
                    return f"未知 phase: {phase}（可用: {', '.join(sp.keys())}）"
                sp[phase]["done"] = True
                _save_state(audit_dir, state)
                return f"✅ 已标记 {d}/{sub} → {phase} done"
    return f"未找到子项目 {sub}"


def _audit_reset(args: str) -> str:
    """/audit reset [<子项目>]：清状态。"""
    if not args:
        return "用法: /audit reset <子项目>（或指定完整审计目录）"
    return "reset 需要子项目名——暂未实现全局 reset"


def _on_audit_command(args: str = "") -> str:
    parts = args.split()
    if not parts:
        return (
            "**audit-enforcer** 用法:\n"
            "- `/audit start <官网URL|GitHub org|本地目录>` — 启动审计（建主目录+clone+状态机）\n"
            "- `/audit status [目录]` — 查看各子项目 Phase 进度\n"
            "- `/audit phase done <子项目> <phase>` — 手动标记 Phase 完成\n"
            "- `/audit reset <子项目>` — 重置状态"
        )
    cmd = parts[0]
    rest = " ".join(parts[1:])
    if cmd == "start":
        return _audit_start(rest)
    if cmd == "status":
        return _audit_status(rest)
    if cmd == "phase":
        # phase done <sub> <phase>
        if len(parts) >= 2 and parts[1] == "done":
            return _audit_phase_done(" ".join(parts[2:]))
        return "用法: /audit phase done <子项目> <phase>"
    if cmd == "reset":
        return _audit_reset(rest)
    # 用户可能忘了 start（如 /audit https://xxx）
    if cmd.startswith("http") or "/" in cmd or os.path.isdir(cmd):
        return (
            f"你想启动审计 `{cmd}`？用法是:\n"
            f"`/audit start {cmd}` — 启动审计（建主目录+clone+状态机）"
        )
    return f"未知子命令: {cmd}（用法: /audit start <url|org|dir> | status | phase done <sub> <phase> | reset）"


# ── 注册 ─────────────────────────────────────────────────────────
def register(ctx) -> None:
    ctx.register_command(
        name="audit",
        handler=_on_audit_command,
        description=(
            "启动/管理审计流程: /audit start <url|org|dir> | "
            "status | phase done <sub> <phase> | reset"
        ),
        args_hint="start <url|org|dir>|status|phase done <sub> <phase>|reset",
    )
    ctx.register_hook("pre_tool_call", _on_pre_tool_call)
    ctx.register_hook("post_llm_call", _on_post_llm_call)
    ctx.register_tool(
        name="audit_declare_skills",
        toolset="skills",
        schema=_DECLARE_SCHEMA,
        handler=_handle_declare_skills,
        check_fn=None,
        description="声明子项目所需审计技能（Phase 2 必经步骤——LLM 判断后调用）",
        emoji="📋",
    )
    logger.info("audit-enforcer loaded — 审计门控已就绪")

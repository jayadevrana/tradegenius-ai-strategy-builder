#!/usr/bin/env python3
"""Static sanity checker for common Pine Script v6 issues.

Usage:
    python scripts/pine_v6_guard.py path/to/script.pine
    python scripts/pine_v6_guard.py - < script.pine

Exit codes:
    0 = no errors found
    1 = one or more errors found
"""

from __future__ import annotations

import argparse
import re
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import List, Optional, Sequence, Tuple


REQUEST_FUNCS = [
    "request.security",
    "request.security_lower_tf",
    "request.currency_rate",
    "request.dividends",
    "request.splits",
    "request.earnings",
    "request.financial",
    "request.economic",
    "request.footprint",
    "request.seed",
]


@dataclass
class Finding:
    level: str
    code: str
    message: str
    line: Optional[int] = None


def line_number(text: str, pos: int) -> int:
    return text.count("\n", 0, pos) + 1


def normalize_ws(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


def mask_comments_and_strings(text: str) -> str:
    out: List[str] = []
    i = 0
    state = "code"
    quote = ""
    while i < len(text):
        ch = text[i]
        nxt = text[i + 1] if i + 1 < len(text) else ""
        if state == "code":
            if ch in ("'", '"'):
                state = "string"
                quote = ch
                out.append(" ")
                i += 1
            elif ch == "/" and nxt == "/":
                state = "line_comment"
                out.extend([" ", " "])
                i += 2
            elif ch == "/" and nxt == "*":
                state = "block_comment"
                out.extend([" ", " "])
                i += 2
            else:
                out.append(ch)
                i += 1
        elif state == "string":
            if ch == "\\" and i + 1 < len(text):
                out.extend([" ", " "])
                i += 2
            elif ch == quote:
                state = "code"
                out.append(" ")
                i += 1
            elif ch == "\n":
                state = "code"
                out.append("\n")
                i += 1
            else:
                out.append(" ")
                i += 1
        elif state == "line_comment":
            if ch == "\n":
                state = "code"
                out.append("\n")
                i += 1
            else:
                out.append(" ")
                i += 1
        else:
            if ch == "*" and nxt == "/":
                state = "code"
                out.extend([" ", " "])
                i += 2
            elif ch == "\n":
                out.append("\n")
                i += 1
            else:
                out.append(" ")
                i += 1
    return "".join(out)


def extract_call_spans(masked_text: str, func_name: str) -> List[Tuple[int, int]]:
    needle = func_name + "("
    spans: List[Tuple[int, int]] = []
    start = 0
    while True:
        pos = masked_text.find(needle, start)
        if pos == -1:
            break
        open_pos = pos + len(func_name)
        depth = 0
        end_pos: Optional[int] = None
        for i in range(open_pos, len(masked_text)):
            ch = masked_text[i]
            if ch == "(":
                depth += 1
            elif ch == ")":
                depth -= 1
                if depth == 0:
                    end_pos = i + 1
                    break
        if end_pos is None:
            break
        spans.append((pos, end_pos))
        start = end_pos
    return spans


def add_regex_findings(
    findings: List[Finding],
    text: str,
    pattern: str,
    level: str,
    code: str,
    message: str,
    flags: int = 0,
) -> None:
    for match in re.finditer(pattern, text, flags):
        findings.append(Finding(level, code, message, line_number(text, match.start())))


def detect_script_kind(masked_text: str) -> Tuple[Optional[str], List[Finding]]:
    findings: List[Finding] = []
    kinds = []
    for kind in ("indicator", "strategy", "library"):
        for match in re.finditer(r"(?<![A-Za-z0-9_])" + re.escape(kind) + r"\s*\(", masked_text):
            kinds.append((kind, match.start()))
    if not kinds:
        findings.append(Finding("error", "V6-002", "Missing indicator(), strategy(), or library() declaration."))
        return None, findings
    kinds.sort(key=lambda item: item[1])
    unique_kinds = {kind for kind, _ in kinds}
    if len(unique_kinds) > 1:
        findings.append(
            Finding(
                "warning",
                "V6-003",
                "Multiple declaration types detected. Verify the script only declares one primary type.",
            )
        )
    return kinds[0][0], findings


def analyze(text: str) -> Tuple[str, List[Finding]]:
    findings: List[Finding] = []
    masked = mask_comments_and_strings(text)

    if not re.search(r"(?m)^\s*//@version\s*=\s*6\b", text):
        findings.append(Finding("error", "V6-001", "Missing //@version=6 annotation.", 1))

    script_kind, kind_findings = detect_script_kind(masked)
    findings.extend(kind_findings)
    strategy_decl_match = re.search(r"(?<![A-Za-z0-9_])strategy\s*\(", masked)
    strategy_decl_line = line_number(text, strategy_decl_match.start()) if strategy_decl_match else None

    add_regex_findings(
        findings,
        masked,
        r"\btransp\s*=",
        "error",
        "V6-004",
        "Found removed v6 parameter `transp =`. Use color.new() instead.",
    )
    add_regex_findings(
        findings,
        masked,
        r"\bwhen\s*=",
        "error",
        "V6-005",
        "Found removed v6 order parameter `when =`. Wrap order calls in if blocks instead.",
    )
    add_regex_findings(
        findings,
        masked,
        r"\blinewidth\s*=\s*0\b",
        "error",
        "V6-006",
        "Found linewidth = 0. Pine v6 requires linewidth >= 1.",
    )
    add_regex_findings(
        findings,
        masked,
        r"\bvarip\b",
        "warning",
        "REP-001",
        "Found varip. This creates realtime-only state that cannot be reproduced cleanly on historical bars.",
    )
    add_regex_findings(
        findings,
        masked,
        r"\bbarstate\.isnew\b",
        "warning",
        "REP-002",
        "Found barstate.isnew. Historical and realtime behavior can differ.",
    )
    add_regex_findings(
        findings,
        masked,
        r"\btimenow\b",
        "warning",
        "REP-003",
        "Found timenow. Scripts using wall-clock time necessarily diverge between historical and realtime behavior.",
    )
    add_regex_findings(
        findings,
        masked,
        r"\boffset\s*=\s*-\d+\b",
        "warning",
        "REP-004",
        "Found a negative offset. Verify that the script is not plotting information earlier than it becomes known.",
    )

    if script_kind == "strategy":
        add_regex_findings(
            findings,
            masked,
            r"\balertcondition\s*\(",
            "error",
            "STR-001",
            "Found alertcondition() in a strategy. Use alert() and or order-fill alerts instead.",
        )
        if re.search(r"\bstrategy\.entry\s*\(", masked):
            if not re.search(r"\bstrategy\.(exit|close|close_all)\s*\(", masked):
                entry_match = re.search(r"\bstrategy\.entry\s*\(", masked)
                findings.append(
                    Finding(
                        "warning",
                        "STR-002",
                        "Strategy uses strategy.entry() but no exit or close logic was detected.",
                        line_number(text, entry_match.start()) if entry_match else strategy_decl_line,
                    )
                )
        if not re.search(r"\bcommission_type\s*=", masked) or not re.search(r"\bcommission_value\s*=", masked):
            findings.append(
                Finding(
                    "warning",
                    "STR-003",
                    "Strategy declaration does not explicitly set both commission_type and commission_value.",
                    strategy_decl_line,
                )
            )
        if not re.search(r"\bslippage\s*=", masked):
            findings.append(
                Finding(
                    "warning",
                    "STR-004",
                    "Strategy declaration does not explicitly set slippage.",
                    strategy_decl_line,
                )
            )
        if re.search(r"\bcalc_on_every_tick\s*=\s*true\b", masked):
            findings.append(
                Finding(
                    "warning",
                    "STR-005",
                    "calc_on_every_tick = true can make backtests diverge from live behavior.",
                    strategy_decl_line,
                )
            )
        if not re.search(r"\bmargin_long\s*=", masked) or not re.search(r"\bmargin_short\s*=", masked):
            findings.append(
                Finding(
                    "warning",
                    "STR-006",
                    "Strategy declaration does not explicitly set margin_long and margin_short. Pine v6 defaults are 100.",
                    strategy_decl_line,
                )
            )

    request_spans: List[Tuple[int, int, str]] = []
    for func_name in REQUEST_FUNCS:
        for start, end in extract_call_spans(masked, func_name):
            request_spans.append((start, end, masked[start:end]))

    unique_request_calls = {normalize_ws(chunk) for _, _, chunk in request_spans}
    if len(unique_request_calls) > 40:
        findings.append(
            Finding(
                "warning",
                "LIM-001",
                f"Detected {len(unique_request_calls)} distinct request.*() call shapes. Most plans allow only 40 unique calls.",
            )
        )
    if len(unique_request_calls) > 64:
        findings.append(
            Finding(
                "error",
                "LIM-002",
                f"Detected {len(unique_request_calls)} distinct request.*() call shapes. This likely exceeds even the 64-call Ultimate limit.",
            )
        )

    for start, _end, chunk in request_spans:
        if chunk.startswith("request.security(") and "lookahead = barmerge.lookahead_on" in chunk:
            lookahead_index = chunk.find("lookahead = barmerge.lookahead_on")
            before = chunk[:lookahead_index]
            if "[" not in before:
                findings.append(
                    Finding(
                        "warning",
                        "REP-005",
                        "request.security() uses lookahead_on without an obvious history offset before the lookahead argument. Verify confirmed higher-timeframe handling.",
                        line_number(text, start),
                    )
                )

    table_positions = re.findall(r"table\.new\s*\(\s*(position\.[A-Za-z_]+)", masked)
    if len(table_positions) > 9:
        findings.append(
            Finding(
                "warning",
                "LIM-003",
                f"Detected {len(table_positions)} table.new() calls. Only 9 chart table positions exist.",
            )
        )
    duplicate_positions = sorted({pos for pos in table_positions if table_positions.count(pos) > 1})
    for pos in duplicate_positions:
        findings.append(
            Finding(
                "warning",
                "LIM-004",
                f"Multiple tables target {pos}. Only the newest table at a given position will show.",
            )
        )

    return script_kind or "unknown", findings


def load_text(path_arg: str) -> str:
    if path_arg == "-":
        return sys.stdin.read()
    return Path(path_arg).read_text(encoding="utf-8")


def print_report(script_kind: str, findings: Sequence[Finding]) -> None:
    errors = [f for f in findings if f.level == "error"]
    warnings = [f for f in findings if f.level == "warning"]
    print("Pine V6 Guard report")
    print(f"Script type: {script_kind}")
    print(f"Errors: {len(errors)}")
    print(f"Warnings: {len(warnings)}")
    print()
    if not findings:
        print("No issues found by the static checker.")
        return
    for finding in sorted(findings, key=lambda item: (item.line is None, item.line or 0, item.level, item.code)):
        location = f"line {finding.line}" if finding.line is not None else "line ?"
        print(f"[{finding.level.upper()}] {finding.code} {location}: {finding.message}")


def main(argv: Optional[Sequence[str]] = None) -> int:
    parser = argparse.ArgumentParser(description="Static sanity checker for Pine Script v6.")
    parser.add_argument("path", help="Path to a Pine file, or - to read from stdin.")
    args = parser.parse_args(argv)

    try:
        text = load_text(args.path)
    except Exception as exc:
        print(f"Failed to read input: {exc}", file=sys.stderr)
        return 1

    script_kind, findings = analyze(text)
    print_report(script_kind, findings)
    return 1 if any(f.level == "error" for f in findings) else 0


if __name__ == "__main__":
    raise SystemExit(main())

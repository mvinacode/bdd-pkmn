# Investigator Skill

## Overview
The Investigator skill is used to gather deep context and perform rigorous analysis before any action is taken. It ensures that the agent understands the current state of the project, the broader implications of any proposed changes, and the fundamental reasons for any issues.

## When to Use
Use this skill when the user mentions:
- "analyze"
- "research"
- "how do I"
- "what's the best way"
- Any request requiring deep understanding of the project's current state or history.

## Instructions

This skill covers three distinct use cases. Identify which use case(s) apply to the current task and follow the corresponding parallel subagent workflow.

---

### Use Case 1: Context & History Analysis
Use when you need to understand the "What", "How", and "When" of the project environment.

**Dispatch Parallel Investigation Subagents:**
- **Subagent 1 (Structural Analysis)**: List files and analyze directory layout to identify the tech stack and organization.
- **Subagent 2 (Documentation Review)**: Read and summarize key files (`README.md`, `AGENT.md`, `CLAUDE.md`, etc.).
- **Subagent 3 (Temporal Context)**: Review recent activity (e.g., `git log -n 5`) to understand recent changes and project evolution.

**Synthesize:**
Combine the structural, documented, and historical findings into a unified context report.

---

### Use Case 2: Impact & Relationship Mapping
Use when you need to understand connections and predict the consequences of potential actions.

**Dispatch Parallel Investigation Subagents:**
- **Subagent 1 (Dependency Analysis)**: Map out how components (files, functions, data) are interconnected. Use search tools to find all references.
- **Subagent 2 (Constraint Mapping)**: Identify project rules, patterns, or architectural constraints that must be respected.
- **Subagent 3 (Downstream Prediction)**: Predict how a specific change might propagate through the system and affect unrelated parts.

**Synthesize:**
Provide a clear map of relationships and a "risk report" for any proposed actions.

---

### Use Case 3: Root Cause Investigation (Troubleshooting)
Use when an issue is reported and you need to find the "Why" behind the failure.

**Dispatch Parallel Investigation Subagents:**
- **Subagent 1 (Reproduction)**: Establish a consistent reproduction case (manual steps or a minimal failing test).
- **Subagent 2 (Trace Analysis)**: Examine logs, trace data flows, and analyze state transitions to locate the breakdown.
- **Subagent 3 (Interface Analysis)**: Investigate interactions between components and external systems to find boundary failures.

**Synthesize:**
Provide a definitive explanation of the root cause and the evidence supporting it. Do NOT make changes or propose fixes.

---

### Final Outcome
For any selected use case:
1. **Consolidate**: Combine all subagent reports into a cohesive analysis.
2. **Identify Gaps**: Highlight any missing information or contradictions.
3. **Report**: Deliver the findings as a purely analytical report. Do NOT modify the project or implement fixes.

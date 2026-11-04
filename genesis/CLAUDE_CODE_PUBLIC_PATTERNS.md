# Claude Code: public research and GENESIS implementation map

**Research snapshot:** 4 November 2026  
**Scope:** public Anthropic documentation and published product behaviour only.

## What can be researched

Anthropic publicly documents Claude Code's agent workflow, configuration layers, tools, hooks, permissions, MCP integrations, subagents and Agent SDK. This is sufficient to learn from the product's publicly described engineering patterns.

Private or unreleased source code, private repositories, internal prompts, credentials, and proprietary implementation details are not public documentation. GENESIS will not attempt to bypass access controls, obtain leaked material, scrape private systems or reproduce protected source code. We can implement independently designed equivalents based on documented behaviour and open standards.

## Publicly documented patterns

1. **Project instructions and rules** — `CLAUDE.md` and rules provide durable project-specific guidance. GENESIS equivalent: version-controlled system policy and project instructions, kept separate from untrusted retrieved documents.
2. **Skills** — reusable task-specific procedures. GENESIS equivalent: reviewed research playbooks with explicit inputs, outputs, source requirements and safety boundaries.
3. **Subagents** — focused specialist contexts with their own instructions, model choice and tool permissions. GENESIS equivalent: specialist role registry with task-scoped capabilities. The current 45 entries are role definitions, not 45 separately trained models.
4. **Hooks** — deterministic lifecycle callbacks for checks before/after tool use and other events. GENESIS equivalent: policy middleware, pre-tool validation, post-result schema validation, source checks and CI gates. Hooks must not execute arbitrary commands from model output.
5. **MCP** — standardised connection to external tools and data. GENESIS equivalent: typed, allowlisted public-source connectors and later approved internal connectors.
6. **Permission rules** — explicit allow/deny decisions for tools and paths. GENESIS equivalent: deny-by-default capabilities checked in deterministic code, with human approval for high-impact operations.
7. **Agent SDK / sessions** — programmatic agent orchestration and session handling. GENESIS equivalent: explicit workflow engine, bounded agent calls, request-scoped state, and a future resumable job system if required.

## What this means for GENESIS

- Keep policy outside model-controlled text.
- Keep external source content untrusted and inert; it cannot change tool permissions.
- Give each specialist only the tools needed for its task.
- Add deterministic hooks around every connector call.
- Keep an evidence ledger with publisher, URL, publication time, retrieval time, exact claim support and source independence.
- Require a verifier to reject unsupported claims.
- Evaluate changes with repeatable tasks and regression tests.
- Keep a human approval gate before sending research to Survival AI.
- Do not confuse multi-agent prompting with independent model consensus.

## Official public references

- Claude Code docs: https://code.claude.com/docs/en/overview
- Claude Code tools reference: https://code.claude.com/docs/en/tools
- Claude Code subagents: https://code.claude.com/docs/en/sub-agents
- Claude Code hooks: https://code.claude.com/docs/en/hooks
- Claude Code permissions: https://code.claude.com/docs/en/permissions
- Claude Code MCP: https://code.claude.com/docs/en/mcp
- Claude Agent SDK overview: https://code.claude.com/docs/en/agent-sdk/overview
- Anthropic public guide to instructions, skills, hooks and subagents: https://claude.com/blog/steering-claude-code-skills-hooks-rules-subagents-and-more
- Anthropic public subagent guidance: https://claude.com/resources/articles/subagents-in-claude-code
- Anthropic public power-user tips: https://support.claude.com/en/articles/14554000-claude-code-power-user-tips

## Research limitation

This document is based on public docs and published product descriptions, not an inspection of Claude Code's private implementation. It intentionally does not claim that internal source code was accessed or that a byte-for-byte clone is possible or appropriate.

---
name: panasa-typography-guard
description: Use this skill when working on the Panasa Internal Website and the user asks to check, review, enforce, or verify typography. It audits whether headings, titles, nav labels, and buttons use Lufga, and whether descriptions, body copy, supporting text, list text, and legal/footer text use Inter Variable.
---

# Panasa Typography Guard

Use this skill for typography audits on the Panasa Internal Website.

## Rules

- Headings, titles, nav labels, and buttons must use `Lufga`.
- Descriptions, body copy, supporting text, list text, and legal/footer text must use `Inter Variable`.

## Where to inspect first

- `src/css/`
- `src/index.html`
- `src/js/`
- `src/content/`
- `docs/` only if the task includes verifying the mirrored output
- `AGENTS.md` if page rules or typography scope need reconfirmation

## Audit workflow

1. Inspect shared/global typography selectors before section-specific styles.
2. Check whether heading elements and heading-like classes inherit or override `Lufga`.
3. Check whether paragraph, list, metadata, footer, and supporting-copy selectors inherit or override `Inter Variable`.
4. Flag weak patterns that can drift, such as mixed font-family declarations, overly broad selectors, or section CSS that overrides shared typography rules.
5. If runtime content changed, verify that typography-sensitive UI still follows the rule in both `src/` and mirrored `docs/` when relevant.

## Reporting

- Prioritize concrete mismatches and likely regressions.
- Include file paths and line references when possible.
- If no issue is found, say that explicitly and mention any residual risk, such as selectors relying on inheritance without a clear shared rule.

## Guardrails

- Do not restyle unrelated components during an audit.
- Do not edit files unless the user explicitly asks for fixes.
- Preserve Panasa naming and existing shared-component rules from `AGENTS.md`.

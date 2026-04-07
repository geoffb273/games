---
name: one-shot
description: Runs a full objective-to-PR workflow in an isolated git worktree with no routine follow-up questions. Use when the user wants autonomous plan-and-implement plus PR creation in one pass, especially for requests like one-shot, end-to-end, plan implement and open PR, or run in a new worktree.
---

# One-Shot

Execute the user's objective end-to-end in a fresh worktree, then open a PR, then clean up the worktree on success.

This skill orchestrates:
- [`.cursor/skills/autonomous-plan-implement/SKILL.md`](../autonomous-plan-implement/SKILL.md)
- [`.cursor/skills/create-pr/SKILL.md`](../create-pr/SKILL.md)

## Non-interactive contract

After the user provides the objective, do not ask routine follow-up questions.

- Proceed with deterministic defaults and record assumptions.
- Only stop for hard blockers: missing auth/credentials, permission denial, or unrecoverable environment constraints.
- On failure, return actionable diagnostics without asking what to do next.

## Deterministic defaults

Use these defaults unless the user already specified alternatives:

- Base branch: `main`, else `master`, else current branch.
- Feature branch: `oneshot/<yyyy-mm-dd>-<short-slug>-<rand4>`.
- Worktree path: `.worktrees/<feature-branch>`.
- PR base: same base branch selected above.
- Testing note in PR body: if no explicit tests were run, write `Not specified`.

## Workflow

1. Capture the user's objective as the single source of truth.
2. Detect base branch with deterministic fallback.
3. Create and switch to a new feature branch in a new worktree.
4. In that worktree, run autonomous plan-and-implement for the exact objective by following [`.cursor/skills/autonomous-plan-implement/SKILL.md`](../autonomous-plan-implement/SKILL.md).
5. In that same worktree, run PR creation by following [`.cursor/skills/create-pr/SKILL.md`](../create-pr/SKILL.md).
6. If PR creation succeeds, delete the created worktree.
7. Return branch, PR title, PR URL, assumptions, and cleanup status.

## Recommended command sequence

Use equivalent commands when needed; this is the default sequence.

```bash
# resolve base branch
if git show-ref --verify --quiet refs/heads/main; then
  BASE_BRANCH=main
elif git show-ref --verify --quiet refs/heads/master; then
  BASE_BRANCH=master
else
  BASE_BRANCH="$(git rev-parse --abbrev-ref HEAD)"
fi

# deterministic names
DATE="$(date +%F)"
SLUG="<objective-slug>"
RAND="$(LC_ALL=C tr -dc 'a-z0-9' </dev/urandom | head -c 4)"
FEATURE_BRANCH="oneshot/${DATE}-${SLUG}-${RAND}"
WORKTREE_PATH=".worktrees/${FEATURE_BRANCH}"

# create branch + worktree
mkdir -p .worktrees
git worktree add -b "${FEATURE_BRANCH}" "${WORKTREE_PATH}" "${BASE_BRANCH}"
```

## Failure and cleanup policy

- If implementation fails: stop, report failure details, and keep worktree for inspection.
- If PR creation fails: stop, report `gh`/git errors, and keep worktree for inspection.
- If PR succeeds: remove worktree (`git worktree remove <path>`), then report success.
- If cleanup fails after PR success: still return success plus exact cleanup command(s) for manual completion.

## Output contract

Always return:
- Objective (as received)
- Base branch
- Feature branch
- Worktree path
- PR title and URL (if created)
- Assumptions made
- Final status (`success`, `partial_success`, or `failed`)

## Notes

- Keep edits small and reviewable inside the worktree branch.
- Do not modify the behavior of the referenced skills unless explicitly requested.

---
name: gh-feature-branch-pr
description: Use GitHub CLI (gh) and git to ensure work is on a feature branch (create one if currently on main/master), summarize local changes, and create a pull request with a concise description. Excludes Plan.md from title/summary synthesis; embeds repository root Plan.md in the PR body when present. Use when the user wants to open a PR for current changes or asks to automate branch/PR workflow.
---

# GH Feature Branch & PR Helper

This skill guides the agent to use `git` and `gh` CLI to:

1. Analyze local changes and draft a short PR title/body
2. Verify the current branch is a feature branch (not `main`/`master`)
3. If needed, create and switch to a new feature branch
4. Create a GitHub pull request via `gh pr create`

Assumptions:

- The repo is already configured with a remote (typically `origin`)
- `gh` CLI is installed, authenticated, and authorized for the repo
- The user’s preferred default branch is `main` (fall back to `master` if `main` does not exist)

## When to use this skill

Use this skill when:

- The user asks to "create a PR", "open a PR", "turn this into a PR", or similar
- The user mentions "feature branch", "branch workflow", or "gh cli PR"
- You need to ensure work is not committed directly to `main`/`master` before opening a PR

## High-level workflow

1. **Summarize current changes**
2. **Detect current branch**
3. **If on `main`/`master`, create a new feature branch and switch to it**
4. **Stage and commit if requested**
5. **Push branch to remote**
6. **Create PR with `gh pr create` using an auto-generated title/body**
7. **Return PR URL and the generated summary**

---

## Detailed instructions

### 1. Analyze local changes

Use `git` to understand what has changed:

```bash
git status --short
git diff --stat
git diff
```

#### `Plan.md` (repository root)

Treat **`Plan.md`** at the repo root as planning notes, not the product change itself.

- For the **PR title** and **Summary** bullets, **do not** use `Plan.md` as the source of truth for what shipped. Synthesize from **code and config diffs that exclude `Plan.md`** so the PR headline matches implementation work.

When running diffs for that synthesis, pass a pathspec that omits the plan file (adjust the left-hand ref if you are comparing against `main`/`master` for an already-pushed branch, e.g. `main...HEAD`):

```bash
git diff --stat HEAD -- . ':!Plan.md'
git diff HEAD -- . ':!Plan.md'
```

If there are staged changes only, also run `git diff --cached --stat -- . ':!Plan.md'` and `git diff --cached -- . ':!Plan.md'`.

From the **excluded-Plan.md** diff output (plus `git status --short` for context), synthesize:

- A short description of what areas of the code were touched.
- Whether this looks like a bug fix, new feature, refactor, or minor tweak.

Use this analysis to draft:

- A **PR title** (one concise sentence, ~80 characters or less).
- 1–3 bullet points summarizing the main changes.

**PR body:** If `Plan.md` exists at the repository root, **read the file** and include its full contents in the description under a `## Plan` heading (after `## Summary`). For long plans, wrap the body in a `<details>` / `<summary>Plan.md</summary>` block so the summary stays scannable on GitHub.

### 2. Detect current branch

Use the `Shell` tool to run:

```bash
git rev-parse --abbrev-ref HEAD
```

Capture the STDOUT as `current_branch` (trim whitespace).

If the command fails:

- Inform the user that the current directory is not a git repository and stop this workflow.

### 3. Ensure you are on a feature branch

Treat `main` and `master` as protected default branches.

- If `current_branch` is **not** `main` or `master`, assume you are already on a feature branch and continue.
- If `current_branch` **is** `main` or `master`, create and switch to a new feature branch.

To create a new feature branch:

1. Derive a descriptive branch name from the task context
2. Normalize the name to lowercase and replace spaces or invalid characters with `-`.
3. Run:

```bash
git checkout -b <feature-branch-name>
```

If this fails because the branch already exists, run:

```bash
git checkout <feature-branch-name>
```

If both commands fail, report the error to the user and stop the workflow.

### 4. Commit changes if necessay

If the user requests a commit:

1. Stage files (or use a narrower pattern if the user specifies files):

```bash
git add .
```

2. Generate a commit message based on the same summary you’ll use for the PR title.

3. Create the commit:

```bash
git commit -m "<commit title>"
```

If the commit fails (for example, due to a pre-commit hook), explain the error to the user and stop the workflow. Do not bypass hooks automatically.

### 5. Push the feature branch

Ensure you are on the feature branch (from step 3), then run:

```bash
git push -u origin HEAD
```

If this fails due to authentication or permission issues, explain the error to the user and stop the workflow. Do not attempt force pushes.

### 6. Create the GitHub PR with `gh`

Use `gh pr create` with a generated title and body.

Example:

```bash
gh pr create \
  --title "<PR_TITLE>" \
  --body "$(cat <<'EOF'
## Summary
- <bullet 1>
- <bullet 2>

## Testing
- <how this was tested or "Not specified">

## Plan
<If Plan.md exists: paste full contents here, or use a details block for long files>
EOF
)"
```

If the repository uses a non-standard default branch and the user specifies it, add `--base <branch>`.

If `gh pr create` fails (for example, `gh` not authenticated or remote not configured), show the relevant error message to the user and stop the workflow.

### 7. Report the result

After successfully creating the PR, return to the user:

- The feature branch name.
- The PR title.
- The PR URL from `gh`.
- The short summary bullets you used.

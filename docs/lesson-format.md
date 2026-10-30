# Lesson content format

Each authored lesson lives at `content/lessons/<ID>.md`. It is UTF-8 Markdown
with the YAML subset below in its front matter. The importer treats the original
program requirement as a separate **Spec** view; the lesson explains how to
learn and demonstrate that program.

```yaml
---
id: FD-01
title: Git & npm Essentials
track: fd
level: beginner
estMinutes: 30
prerequisites: []
toolVersions:
  node: "20.x"
  git: "2.4x"
  npm: "10.x"
os: [windows, macos, linux]
---
```

The required sections are ordered as follows:

1. `Why this matters`
2. `What you will build`
3. `Before you start`
4. One or more `Step N: <title>` sections
5. `How it works`
6. `Verify against the requirements`
7. `Common errors`
8. `Try it yourself (optional)`
9. `Quiz`
10. `Recap` (exactly three bullets)

Use Markdown headings, lists, tables, emphasis, links, and inline code normally.
The viewer safely renders these elements and never inserts untrusted raw HTML.
The `- [ ]` progress checkbox in the source specification is omitted in the
Spec view because progress belongs to the learner, not the source file.

## Code fence conventions

| Purpose | Fence info string | Viewer behavior |
| --- | --- | --- |
| Bash command | `bash title="Terminal"` | Copyable terminal block |
| PowerShell command | `powershell title="Terminal"` | Copyable terminal block |
| OS alternatives | Add `tab="macOS / Linux"` or `tab="Windows PowerShell"` to consecutive fences | Shared tabs, choice saved locally |
| File | `js title="src/index.js" file` | Path header, line numbers, Copy file |
| Highlighted lines | Add `highlight="3,5-7"` to a file fence | Highlight selected line numbers |
| Expected output | `text title="Expected output"` | Labeled output block, not copied |
| Folder tree | `text title="Folder structure"` | Preformatted tree |
| Automated command | Add `verify="run"` to a bash or PowerShell fence, then put its expected output in the next fence | Executed in a temporary working directory and checked |
| Manual command | Add `verify="manual" manual checked YYYY-MM-DD OS` after checking, or `verify="manual" manual review required YYYY-MM-DD OS` while pending | Not executed automatically; never label pending work as checked |

Command prompts are not part of copied command text. Use `bash` for
macOS/Linux commands and `powershell` for Windows commands. Mark commands that
need a real account, network service, or interactive UI as manual rather than
making verification depend on credentials or external availability.

Every lesson has at least five quiz entries inside `## Quiz`:

```markdown
### Q1
type: mcq
question: What does `git add .` do?
options:
  - Saves a commit
  - Stages changed files
  - Uploads files
answer: 1
explanation: Staging selects changes for the next commit.
```

Supported question types are `mcq`, `tf`, and `predict`. Multiple-choice
answers use a zero-based option index. The viewer gives immediate feedback and
shows the explanation after an answer is selected.

`npm run lessons:lint` checks metadata, source IDs, section order, walkthrough
blocks, quiz/error/recap counts, and placeholder text. `npm run lessons:verify
FD-01` validates one lesson, writes its complete-file blocks into an isolated
temporary directory, executes blocks marked `verify="run"`, and checks their
expected output. Manual fences remain visible in the lesson but are not run.
Their date and OS metadata distinguish pending checks from checks actually
performed.
`npm run lessons:coverage` reports authored lessons against the 170 source
programs.

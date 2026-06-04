# Writing Task Breakdown

## Overview

Write comprehensive task breakdowns assuming the expert who is going to implement the specs has zero context for the project. Document everything they need to know: which existing files to check, which files to touch for each task and what changes to make to them. Give them the whole plan as bite-sized tasks. DRY. YAGNI. TDD.

**Announce at start:** "I'm using the task-breakdown skill to create a plan."

**Constraints:**
- Each task should have a last step that verifies the task was completed correctly
- The very last task should verify that after completing all tasks, the changes were applied correctly and as intended by the specs

**Leverage existing skills**
- Identify relevant skills (other than this one and `/subagent-task-execution`)
- Output: "I'll use the following skills to help you with the task breakdown: /skill1, /skill2, ..."
- Use the identified skills to create the task breakdown

**Presenting the tasks:**
- Once you have the full task breakdown, use a subagent to critique it for self-correction
- Present the tasks one-by-one to the user
- Present tasks based on their dependencies (task A before task B if B depends on A)
- Ask after each task whether it looks right so far
- Be ready to go back and clarify if something doesn't make sense
- When user confirms a task looks good, update `docs/YYYY-MM-DD-<feature-name>-tasks.md` with that task

## Bite-Sized Task Granularity

**Each step is one action (2-5 minutes):**
- "Write the failing test" - step
- "Run it to make sure it fails" - step
- "Implement the minimal code to make the test pass" - step
- "Run the tests and make sure they pass" - step

## Task Breakdown Document Header

**Every task breakdown MUST start with this header:**

```markdown
# [Task Name] Task Breakdown

**Goal:** [One sentence describing what this achieves]

**Approach:** [2-3 sentences about approach]

**Skills:** [List of skills to use]

**Tech Details:** [Key tools, services, technologies/libraries to use]

---
```

## Task Structure

```markdown
### Task N: [Component Name]

**Files:**
- Create: `exact/path/to/file.js`
- Modify: `exact/path/to/existing.js:123-145`
- Test: `tests/exact/path/to/test.js`

**Step 1: Write the failing test**
[code snippet]

**Step 2: Run test to verify it fails**
Run: `npm test tests/path/test.js`
Expected: FAIL

**Step 3: Write minimal implementation**
[code snippet]

**Step 4: Cleanup code changes**
Use available skills to cleanup code changes.

**Step 5: Review code changes**
Use available skills to review code changes.
Make sure code follows the project's coding standards and aligns with the specs.

**Step 6: Run test to verify it passes**
Run: `npm test tests/path/test.js`
Expected: PASS
```

## Remember
- Exact file paths always
- For coding tasks, complete code in task breakdown (not "add validation")
- Exact commands with expected output
- DRY, YAGNI, TDD

## Execution Handoff

After saving the task breakdown, offer task execution using `/subagent-task-execution`.

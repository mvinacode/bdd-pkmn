# Skills Editor Skill

## Description

This skill enables the agent to create and maintain "Agent Skills" - modular capabilities that extend the agent's functionality. It ensures that all skills follow the standardized directory structure and file format.

## When to Use

- When the user asks to "create a skill" or "add a capability".
- When the user wants to package a specific workflow.
- When modifying existing skills to add new resources or update instructions.

## Skill Structure Rules

Every skill must reside in its own directory and contain a `SKILL.md` file.

### 1. Directory Structure
```text
skill-name/
├── SKILL.md          # (Required) Main instructions and metadata
├── REFERENCE.md      # (Optional) Detailed API docs or reference material
├── FORMS.md          # (Optional) Specialized guides
└── scripts/          # (Optional) Executable scripts
    └── utility.py
```

### 2. SKILL.md Format
The `SKILL.md` file **must** start with YAML frontmatter, followed by markdown instructions.

**Frontmatter Requirements:**
- `name`: Max 64 chars, lowercase letters, numbers, and hyphens only.
- `description`: Max 1024 chars. Must explain **what** the skill does and **when** to use it.

**Content Sections:**
- `# [Skill Name]`
- `## Instructions`: Step-by-step guidance.
- `## Examples`: Concrete usage examples.

## Instructions - How to Create a Skill

### Step 1: Check for Similar Online Skills
Run a quick web-search to find any existing, similar skills online. If similar skills are found and the license allows reuse, prefer adapting them as a template and include a reference link.

### Step 2: Check for Existing Skills
Before creating a new skill, search for existing or similar local skills and reuse their structure, examples, and patterns as a starting point.

### Step 3: Create the Directory
Create a directory under `.claude/commands/` with a kebab-case name matching the skill's purpose.

### Step 4: Create the command file
Write the command `.md` file with the required sections.

**Template:**
```markdown
# My New Skill

## Instructions
[Clear, step-by-step guidance for the agent to follow]

## Examples
[Concrete examples of using this skill]
```

### Step 5: Add Supporting Files (Optional)
If the skill requires large reference texts or scripts, create separate files and reference them in the main file.

### Step 6: Highlight necessary environment variables (Optional)
If a skill's scripts require environment variables, list them clearly with the expected variable names.

## Best Practices

- **Progressive Disclosure**: Don't put everything in one file. Use it as an entry point that links to other files.
- **Concise Scripts**: When creating script files, keep them concise — clear purpose, small functions, minimal external dependencies.
- **Clear Triggers**: Ensure the description clearly states *when* the skill should be used.
- **Confirm changes**: Confirm changes with the user before executing any steps.

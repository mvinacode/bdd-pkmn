# Brainstorming Ideas Into Specs

## Overview

Help turn ideas into fully formed designs or specs through natural collaborative dialogue.

Use this skill before any creative or complex work and when user says "brainstorm", "design", "create specs" or similar.

Start by understanding the current project context. Then, ask questions one at a time to refine the idea. Once you understand what you're creating, analyze how the changes might impact the project, then present the specs in small sections (200-300 words), checking after each section whether it looks right so far.

## The Process

**Understanding the idea:**
- Check out the current project state first (files, docs, recent git commits)
- Ask questions one at a time to refine the idea
- Prefer multiple choice questions when possible, but open-ended is fine too
- Propose 2-3 different approaches as answers to a question, with trade-offs and your recommendation
- Only one question per message - if a topic needs more exploration, break it into multiple questions
- Only ask questions where the answer cannot be easily inferred from the project context
- Focus on understanding: purpose, constraints, success criteria

**Leverage existing skills**
- Identify relevant skills
- Use the identified skills to explore the idea

**Presenting the specs:**
- Once you believe you understand what you're building, present the specs
- Break it into sections of 200-300 words
- Ask after each section whether it looks right so far
- Cover all important aspects:
  - for coding projects: architecture, components, data flow, performance, security, async processing, error handling, testing
  - for non-coding projects: confirm the list of aspects to cover with the user
- Be ready to go back and clarify if something doesn't make sense

**IMPORTANT: No applying changes or any other actions until user confirms**
- Only explore, ask questions, and present specs
- Wait for explicit user confirmation before proceeding to task breakdown or applying any changes

## After the Specs

**Documentation:**
- Write the validated specs to `docs/YYYY-MM-DD-<topic>-specs.md`

**Detailed Execution Plan (if continuing):**
- Ask: "Ready to continue with a detailed task breakdown?"
- Use the /task-breakdown skill to create detailed task breakdown
- Do not start applying changes - only create the task breakdown document
- Wait for explicit user confirmation before applying any changes from the breakdown

## Key Principles

- **One question at a time** - Don't overwhelm with multiple questions
- **Multiple choice preferred** - Easier to answer than open-ended when possible
- **YAGNI ruthlessly** - Remove unnecessary features from all designs
- **Explore alternatives** - Always propose 2-3 approaches before settling
- **Incremental validation** - Present specs in sections, validate each
- **Be flexible** - Go back and clarify when something doesn't make sense
- **No premature actions** - Never start applying changes until user confirms the task breakdown

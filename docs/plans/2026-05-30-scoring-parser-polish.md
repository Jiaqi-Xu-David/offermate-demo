# Scoring Parser Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the demo credible under interviewer scrutiny by adding richer JD/resume parsing, detailed score explanations, job compensation fields, soft skills, language requirements, gender, watermarking, and a less vertically stretched layout.

**Architecture:** Keep the app static. Extend `matcher.js` with deterministic parsers and scoring explanation helpers. Update the UI to render parsed job/resume structures and detailed skill rows while compressing long panels with internal grids and scrollable work areas.

**Tech Stack:** HTML, CSS, vanilla JavaScript ES modules, Node.js `node:test`, GitHub Pages.

---

### Task 1: Parser And Score Tests

**Files:**
- Modify: `tests/matcher.test.mjs`

- [x] Test resume parsing returns gender, language, soft skills, and skill evidence.
- [x] Test JD parsing returns salary, hard skill levels, soft skills, and language requirements.
- [x] Test detailed skill rows explain SQL/Python/Tableau with JD requirement, resume evidence, and item scores.

### Task 2: Parser And Scoring Logic

**Files:**
- Modify: `src/matcher.js`

- [x] Add gender/language/soft-skill extraction to `parseResumeText`.
- [x] Add `parseJobDescription` and use it for seeded/admin jobs.
- [x] Add `getSkillMatchDetails` and `buildScoreExplanation`.
- [x] Preserve existing ranking behavior while adding detailed explanations.

### Task 3: UI Polish

**Files:**
- Modify: `index.html`
- Modify: `src/app.js`
- Modify: `styles.css`

- [x] Add top watermark with `@大卫德哈哈哈`.
- [x] Add gender to candidate/resume displays.
- [x] Show salary, soft skills, and language requirements on job cards and admin job cards.
- [x] Add detailed scoring table showing JD requirement, resume evidence, and item score.
- [x] Reduce vertical stretch using compact cards and scrollable panels.

### Task 4: Verify And Publish

**Files:**
- Modify only if verification exposes issues.

- [x] Run `npm test`.
- [x] Browser-check student mode and admin mode.
- [x] Commit and push to GitHub.
- [x] Confirm GitHub Pages contains the updated parser/scoring UI.

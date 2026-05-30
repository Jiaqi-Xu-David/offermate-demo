# Student/Admin IA Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Correct the demo information architecture so student view and admin view represent different real workflows instead of sharing student matching content.

**Architecture:** Keep one static page and a shared matching engine. Student mode renders resume, job JD cards, and compact student-facing matching analysis. Admin mode renders job management, submitted candidates, and recruiter-facing candidate/job routing insights.

**Tech Stack:** HTML, CSS, vanilla JavaScript ES modules, Node.js `node:test`, GitHub Pages.

---

### Task 1: Data And Rules

**Files:**
- Modify: `src/matcher.js`
- Modify: `tests/matcher.test.mjs`

- [x] Ensure every job has a full `description`, with extracted `tags` grounded in that JD.
- [x] Add candidate submission fixtures for admin view.
- [x] Add `buildAdminCandidateInsight(candidate, jobs)` for recruiter-facing recommendations.
- [x] Test that admin insight avoids student-facing language and includes submitted jobs plus alternate suitable roles.

### Task 2: UI Separation

**Files:**
- Modify: `index.html`
- Modify: `src/app.js`
- Modify: `styles.css`

- [x] Hide admin form completely in student mode.
- [x] Student job cards show JD description and extracted keywords.
- [x] Admin left/middle/right columns become job management, submitted candidates, and candidate routing insight.
- [x] Remove student-facing `优先投递`, `简历优化`, and resume advice from admin mode.
- [x] Compact the student right panel by grouping details.

### Task 3: Verification And Publish

**Files:**
- Modify only if checks expose issues.

- [x] Run `npm test`.
- [x] Browser-check student mode: no admin form, all job cards include JD text.
- [x] Browser-check admin mode: candidate list appears, selected candidate insight appears, no student advice text.
- [ ] Commit, push, and confirm GitHub Pages contains the corrected view.

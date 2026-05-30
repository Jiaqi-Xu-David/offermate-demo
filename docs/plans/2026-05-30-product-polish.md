# OfferMate Product Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the demo feel more like a product prototype by adding user/admin modes, explainable score dimensions, tailored resume snippets, and saved admin-added jobs.

**Architecture:** Keep the app static and dependency-free. Add pure matcher functions for score breakdowns and tailored resume snippet generation, then wire those functions into the existing vanilla JavaScript UI. Use `localStorage` only for admin-added jobs so the seeded demo remains deterministic.

**Tech Stack:** HTML, CSS, vanilla JavaScript ES modules, Node.js `node:test`, GitHub Pages.

---

### Task 1: Core Logic

**Files:**
- Modify: `src/matcher.js`
- Modify: `tests/matcher.test.mjs`

- [x] Add tests for `getScoreBreakdown(profile, job)` returning named dimensions whose points sum to the job score.
- [x] Add tests for `buildTailoredResumeSnippet(profile, job)` producing job-specific resume copy for data analysis and product operations roles.
- [x] Implement both functions and keep existing matching tests green.

### Task 2: Product UI

**Files:**
- Modify: `index.html`
- Modify: `src/app.js`
- Modify: `styles.css`

- [x] Add a segmented mode switch for `学生视角` and `管理员视角`.
- [x] In student mode, show resume, ranking, score breakdown, tailored snippet, and final report.
- [x] In admin mode, emphasize the JD form and saved admin-added roles.
- [x] Save admin-added jobs to `localStorage` and reload them on page start.

### Task 3: Verification And Publish

**Files:**
- Modify only if verification exposes issues.

- [x] Run `npm test`.
- [x] Verify the local UI in browser: default state, mode switch, tailored snippet generation, admin job persistence.
- [x] Commit and push to `main`.
- [x] Confirm GitHub Pages loads the updated demo.

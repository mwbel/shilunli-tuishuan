# 七曜运动统一导航实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 合并“七星轨迹”和“天体运动”为一个顶层入口，保留当地天球、每日地心运动、周年地心运动与七曜数据视图及旧链接兼容。

**Architecture:** 通过导航纯函数将旧路由解析到同一个页面索引；统一页面依据解析出的子视图选择现有页面组件。旧 URL 保持可读，新内部链接使用统一入口 URL。

**Tech Stack:** Next.js 15、React 19、TypeScript、Node `node:test`、npm。

**Spec:** `docs/superpowers/specs/2026-11-03-seven-motion-unified-navigation-design.md`

## Global Constraints

- 不改变历算、天体位置计算、星历 API 或数据源。
- 保留本地天球与地心运动的坐标语义差别。
- 保留旧 URL 和“七曜数据”入口。
- 在独立 Git worktree 中修改，不带入其他工作区的删除或未提交更改。

## Review Focus

- 历史 `tab=seven-stars&subtab=sun-earth-moon` 仍进入日月历象，不误归入七曜运动；由路由回归测试覆盖。
- `tab=annual-motion` 与旧 `tab=celestial-motion&motion=annual-motion` 均打开周年视运动；由路由回归测试覆盖。
- `tab=seven-stars&subtab=seven-data` 仍打开数据页；由路由回归测试覆盖。
- 默认 `/earth` 与未知 tab 仍指向十二宫图；保留现有默认路由测试。
- 本地天球名称清楚表达当地天空/地平坐标，不与地心视角混淆；由浏览器冒烟核对。

### Task 1: Unify the seven-motion navigation and view selection

**Files:**
- Modify: `frontend/src/features/earth/navigation.ts`
- Test: `frontend/src/features/earth/navigation.test.ts`
- Modify: `frontend/src/components/EarthNav/EarthNav.tsx`
- Modify: `frontend/src/components/EarthPageClient.tsx`
- Modify: `frontend/src/components/seven-stars/SevenStarsSpherePage.tsx`
- Modify: `frontend/src/features/sky-view/model.ts`
- Test: `frontend/src/features/sky-view/model.test.ts`
- Modify: `frontend/src/i18n/copy.ts` only if new labels need locale mappings

**Interfaces:**
- `resolveCelestialMotionView(tab, view, legacySubtab)` returns `local-sky | geocentric-motion | annual-motion | seven-data`.
- `getEarthPageIndex(tab, subtab)` maps all unified views to index `2`, except legacy `sun-earth-moon`, which remains index `3`; lunar phenomena use index `3`.
- `getEarthTabLabel(tab, subtab)` displays “七曜运动” for both legacy and canonical routes to the merged section.
- `getVisibleBodies(visibleIds)` returns `BODIES` in canonical order filtered by selected `BodyId`s; local-sky defaults to Sun and Moon.

- [ ] **Step 1: Add failing tests** for unified route/index labels and legacy aliases in `navigation.test.ts`, plus default Sun+Moon and individual body filtering in `model.test.ts`.
- [ ] **Step 2: Run focused tests** with `npx tsx --test src/features/earth/navigation.test.ts src/features/sky-view/model.test.ts`; confirm failures are missing unified resolver behavior and missing body filter, not test/runtime errors.
- [ ] **Step 3: Implement the route resolver and page index changes** in `navigation.ts`; update `EarthNav.tsx` and `EarthPageClient.tsx` to one entry with four subviews; add tested body filtering to the local-sky model and checkboxes in `SevenStarsSpherePage.tsx` so selected bodies and trails render together.
- [ ] **Step 4: Run focused tests** and confirm all route and body-selection expectations pass.
- [ ] **Step 5: Run `npm run check`, `npm run build`, and `git diff --check`; inspect the final diff and source-only status.**
- [ ] **Step 6: Browser smoke test** `/earth`, old seven-stars URL, old daily/annual geocentric URLs, and navigation between the four unified subviews; verify one top-level entry, checkbox-to-marker/trail response, and no page/runtime error.

## Delivery

After local verification, push the exact feature commit to both configured remotes (`origin` and `backup`) and redeploy the connected Zeabur service. Verify deployment status and revisit the live route. Never push existing user deletions or unrelated worktree changes.

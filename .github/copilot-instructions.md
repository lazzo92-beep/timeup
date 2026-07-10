# TimeUp - GitHub Copilot Instructions

> **Project**: TimeUp - Trello Power-Up for Time Tracking  
> **Stack**: Vanilla JavaScript (ES6+ modules), HTML5, CSS3  
> **Hosting**: GitHub Pages (static, client-side only)  
> **Storage**: Trello API (`t.set()` / `t.get()`)

---

## Core Architecture Rules

### Directory Structure (Mandatory)

- `src/services/` - Business logic & API interactions ONLY
- `src/ui/` - DOM manipulation ONLY (imports services)
- `src/utils/` - Pure functions, stateless utilities
- `views/` - HTML files for Trello Power-Up capabilities
- `styles/` - CSS with variables, BEM naming, view-specific styles

### Separation of Concerns (Critical)

- **Services**: Handle ALL business logic and data operations
  - `TrelloService.js` - Wraps ALL Trello API calls
  - `TimerService.js` - Timer state machine (start/stop/pause)
  - `StorageService.js` - Abstracts storage with error handling
  - `ChecklistService.js` - Checklist integration
  - `ReportService.js` - Report generation
- **UI Files**: Handle ONLY DOM manipulation
  - NO business logic in UI files
  - Import services, call their methods
  - Render data received from services
- **Utils**: Pure functions, no side effects, testable in isolation

### Module Pattern (ES6 Only)

```javascript
// ✅ Named exports for utilities
export const formatDuration = (ms) => {
  /* ... */
};

// ✅ Default export for services (singleton)
const TimerService = {
  /* methods */
};
export default TimerService;

// ❌ FORBIDDEN: No IIFE, no global namespace
```

---

## Code Style (Mandatory)

### JavaScript Standards

- Use `const` by default, `let` only when reassignment needed
- NEVER use `var`
- Prefer arrow functions for callbacks/utilities
- ALWAYS use `async/await` over `.then()` chains
- All modules are strict mode by default

### Error Handling (Critical for Trello API)

```javascript
// ✅ ALL Trello API calls MUST be wrapped in try/catch
export const getTimerData = async (t, cardId) => {
  try {
    const data = await t.get("card", "shared", "timerData");
    return data ?? { entries: [], isRunning: false };
  } catch (error) {
    console.error("[TimerService] Failed to get timer data:", error);
    return { entries: [], isRunning: false, error: true };
  }
};

// ❌ FORBIDDEN: Unhandled promises
```

### Service Return Pattern

ALL async service operations MUST return:

```typescript
{
  success: boolean;
  data?: any;
  error?: string;
}
```

### JSDoc (Required for All Exports)

```javascript
/**
 * Formats milliseconds into human-readable duration.
 * @param {number} ms - Duration in milliseconds
 * @param {Object} [options] - Formatting options
 * @param {boolean} [options.showSeconds=true] - Include seconds
 * @returns {string} Formatted duration (e.g., "2h 15m 30s")
 * @example
 * formatDuration(8130000) // "2h 15m 30s"
 */
export const formatDuration = (ms, options = {}) => {
  /* ... */
};
```

### Naming Conventions

- **Files**: `PascalCase.js` for services/classes, `camelCase.js` for utils
- **Functions**: `camelCase` (verbs: `getTimerData`, `startTimer`)
- **Constants**: `SCREAMING_SNAKE_CASE` (`MAX_TIMER_DURATION`)
- **CSS Classes**: BEM notation (`timer__button--active`)

---

## CSS Architecture

### CSS Variables (Mandatory)

ALWAYS use CSS custom properties from `styles/variables.css`:

```css
:root {
  /* Trello Atlas-inspired palette */
  --color-primary: #0079bf;
  --color-success: #61bd4f;
  --color-warning: #f2d600;
  --color-danger: #eb5a46;

  /* Typography */
  --font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto;
  --font-size-md: 14px;

  /* Spacing */
  --spacing-md: 16px;

  /* Borders & Shadows */
  --border-radius: 3px;
  --shadow-sm: 0 1px 2px rgba(9, 30, 66, 0.25);
}
```

### BEM Naming (Mandatory)

```css
.timer {
} /* Block */
.timer__display {
} /* Element */
.timer__button--active {
} /* Modifier */
```

### No Inline Styles (Strict)

```html
<!-- ❌ FORBIDDEN -->
<div style="color: red;">...</div>

<!-- ✅ CORRECT -->
<div class="timer__display timer__display--error">...</div>
```

---

## Pre-Commit Review Checklist

### 1. Security

- [ ] **XSS Prevention**: All external data escaped before HTML insertion
  - Use `textContent` instead of `innerHTML` when possible
  - If `innerHTML` required, escape: `"<>&` → `&lt;&gt;&amp;`
- [ ] No API keys, tokens, or secrets in code
- [ ] All user inputs validated

### 2. Error Handling

- [ ] **No silent failures** - All async operations handle errors
- [ ] **User notification required** - Failures must be communicated
  - Use `alert()` or better UI notification
  - Never just `console.error()` without user feedback
- [ ] Check for silent catch blocks: `catch(e) { return []; }` NOT acceptable

### 3. Performance

- [ ] **No redundant API calls in refresh loops**
  - Cache expensive data
  - Don't call `getChecklists()` every second
- [ ] **DOM operations minimized in loops**
  - Batch DOM updates
  - Use in-place updates to avoid losing input focus
- [ ] **Memory leaks checked**
  - Event listeners removed when elements destroyed
  - Intervals cleared when leaving view

### 4. Code Quality

- [ ] No trailing whitespace
- [ ] JSDoc for all public functions
- [ ] No unused CSS classes or dead JavaScript
- [ ] No duplicate code - extract to reusable functions
- [ ] All tests pass: `npm test`
- [ ] Coverage above 90%: `npm run test:coverage`

### 5. Development Phase Rules

- [ ] **No legacy bridges** - No migration logic for old data formats
  - Can reinstall/clear storage during development
  - Prioritize clean code over backward compatibility

### 6. Storage Optimization

- [ ] **Minimize storage footprint** - Trello has 4,096 char limit per key
  - Avoid redundant fields
  - Use concise key names
  - Enforce character limits on user text

---

## Common Patterns

### Proper Error Handling in UI

```javascript
// ❌ WRONG - Silent failure
const handleAction = async () => {
  await SomeService.doSomething(t);
  await refresh();
};

// ✅ CORRECT - User notification
const handleAction = async () => {
  const result = await SomeService.doSomething(t);
  if (!result.success) {
    alert(`Operation failed: ${result.error}`);
    return;
  }
  await refresh();
};
```

### XSS Prevention

```javascript
// ❌ WRONG - XSS vulnerability
html += `<span>${item.name}</span>`;

// ✅ CORRECT - Escape HTML
const escapeHtml = (str) =>
  str.replace(
    /[<>&"]/g,
    (c) =>
      ({
        "<": "&lt;",
        ">": "&gt;",
        "&": "&amp;",
        '"': "&quot;",
      })[c],
  );
html += `<span>${escapeHtml(item.name)}</span>`;
```

### Efficient Refresh

```javascript
// ❌ WRONG - API call every second
const refresh = async () => {
  const checklists = await ChecklistService.getChecklists(t); // Called every second!
  updateUI(checklists);
};

// ✅ CORRECT - Cache expensive calls
let cachedChecklists = null;
const refresh = async () => {
  updateUI(cachedChecklists);
};
const fullRefresh = async () => {
  cachedChecklists = await ChecklistService.getChecklists(t);
  await refresh();
};
```

### DOM Update Optimization

```javascript
// ❌ WRONG - Full rebuild loses focus
container.innerHTML = buildHTML(); // Destroys input focus!

// ✅ CORRECT - In-place updates
timeEl.textContent = newValue;
if (document.activeElement !== inputEl) {
  inputEl.placeholder = newPlaceholder;
}
```

---

## Trello Power-Up Specifics

### Storage Scopes

- `'card', 'shared'` - Data visible to all users on a card (timer entries)
- `'card', 'private'` - Data visible only to current user on a card
- `'board', 'shared'` - Board-wide settings (hourly rate, categories)
- `'member', 'private'` - User preferences (display format)

### Power-Up Initialization

```javascript
// index.html connector (src/main.js)
const t = TrelloPowerUp.initialize({
  "card-buttons": async (t) => [
    {
      /* config */
    },
  ],
  "card-badges": async (t) => [
    {
      /* config */
    },
  ],
  "card-back-section": async (t) => ({
    /* config */
  }),
});
```

### Dynamic Badges for Auto-Refresh

```javascript
// ✅ For real-time updates
badges.push({
  dynamic: async () => ({
    text: formatDuration(getCurrentElapsed()),
    color: "green",
    refresh: 30, // seconds between refreshes
  }),
});
```

---

## Data Models (TypeScript-Style)

```typescript
interface TimerData {
  entries: TimeEntry[];
  state: "idle" | "running" | "paused";
  currentEntry: CurrentEntry | null;
  estimatedTime: number | null; // milliseconds
}

interface TimeEntry {
  id: string; // "entry_{Date.now()}_{random9chars}"
  startTime: number; // Unix timestamp (ms)
  endTime: number; // Unix timestamp (ms)
  duration: number; // endTime - startTime - pausedDuration
  description: string;
  createdAt: number;
}

interface CurrentEntry {
  startTime: number;
  pausedDuration: number;
  elapsedBeforePause?: number;
}

interface BoardSettings {
  hourlyRate: number | null;
  currency: string;
  categories: string[];
}

interface UserPreferences {
  showSeconds: boolean;
  use24HourFormat: boolean;
  autoStartOnOpen: boolean;
}
```

---

## Forbidden Practices

1. ❌ No `var` keyword
2. ❌ No inline `<script>` logic
3. ❌ No inline styles
4. ❌ No unhandled promises
5. ❌ No global variables
6. ❌ No jQuery or external libraries
7. ❌ No build steps for core functionality
8. ❌ No hardcoded colors
9. ❌ No generic CSS class names
10. ❌ No functions without JSDoc

---

## Git Commit Guidelines

Use conventional commits: `feat:`, `fix:`, `docs:`, `style:`, `refactor:`

Example: `feat(card-badge): add time display`

---

## Testing Requirements

- All tests must pass: `npm test`
- Coverage must be ≥90%: `npm run test:coverage`
- Test files in `tests/` mirror `src/` structure
- Use `tests/mocks/trelloMock.js` for Trello API mocking

---

## Quick Reference

### Service APIs

```javascript
// StorageService
getData(t, scope, visibility, key, defaultValue?)
setData(t, scope, visibility, key, value)
getTimerData(t) → Promise<TimerData>
setTimerData(t, timerData) → Promise<boolean>

// TimerService
startTimer(t) → Promise<ServiceResult<TimerData>>
stopTimer(t, description?) → Promise<ServiceResult<TimerData>>
setEstimate(t, estimatedTimeMs) → Promise<ServiceResult>
deleteEntry(t, entryId) → Promise<ServiceResult>

// Utils
formatDuration(ms, options?) → string
formatTimestamp(timestamp, options?) → string
parseTimeString(timeStr) → number | null
```

### Constants

```javascript
TIMER_STATE.IDLE | RUNNING | PAUSED;
STORAGE_KEYS.TIMER_DATA | BOARD_SETTINGS;
TIME.SECOND | MINUTE | HOUR | DAY;
DEFAULTS.TIMER_DATA | BOARD_SETTINGS;
```

---

## Autonomous Operation Mode

### Allowed Actions (No Approval Required)

The AI agent is authorized to perform these actions autonomously:

- ✅ Create, read, edit, and delete files
- ✅ Run terminal commands (npm, serve, tests, etc.)
- ✅ Install npm packages
- ✅ Start/stop development servers
- ✅ Run tests and generate coverage reports
- ✅ Format and lint code
- ✅ Create directories and move files
- ✅ Execute any non-git terminal commands
- ✅ Debug and fix issues
- ✅ Refactor code
- ✅ Update documentation

### Restricted Actions (User Approval Required)

These actions REQUIRE explicit user approval:

- ⛔ **ALL git commands** (commit, push, pull, merge, rebase, etc.)
- ⛔ **Git repository operations** (init, clone, remote, etc.)
- ⛔ **Branch operations** (checkout, branch, switch)
- ⛔ **ANY command starting with `git`**

### Operating Guidelines

1. **Be proactive**: Execute file operations, tests, and commands as needed
2. **Work autonomously**: Complete tasks without asking for permission at each step
3. **Stop before git**: Always pause and inform user before ANY git operation
4. **Show what was done**: Summarize actions taken after completion
5. **Handle errors**: Retry failed operations automatically when reasonable

### Example Autonomous Workflow

```
User: "Add a pause timer feature"

Agent autonomous actions:
1. ✅ Read existing timer service
2. ✅ Create new pauseTimer method in TimerService.js
3. ✅ Update TimerUI.js to add pause button
4. ✅ Add CSS for pause button in components.css
5. ✅ Create test file: TimerService.test.js
6. ✅ Run npm test to verify
7. ✅ Run npm run test:coverage to check coverage
8. ⛔ STOP: "All changes complete. Ready to commit? (I'll wait for your git command)"
```

---

## When Generating Code

1. Check directory structure before creating files
2. Import services in UI files, never duplicate logic
3. Add new CSS variables to `variables.css` first
4. Create view-specific CSS in `styles/views/`
5. Export pure functions from utils, service objects from services
6. Always wrap Trello API calls in try/catch
7. Return `{ success, data?, error? }` from all service methods
8. Add JSDoc to all exports
9. Validate all input data with defaults
10. Test with `npm test` before committing
11. **Execute autonomously** - don't ask permission for non-git actions
12. **Stop before git** - always wait for user approval for git commands

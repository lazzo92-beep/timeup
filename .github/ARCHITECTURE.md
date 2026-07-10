# CI/CD Pipeline Architecture

## Complete Pipeline Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         DEVELOPER                                │
└────────────┬────────────────────────────────────────────────────┘
             │
             ├─→ Feature Branch
             │   git checkout -b feature/my-feature
             │   git commit -m "feat: add feature"
             │   git push
             │
             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      CI WORKFLOW (Automatic)                     │
├─────────────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Test & Coverage (Node 18.x, 20.x)                       │  │
│  │  ├─ npm ci                                                │  │
│  │  ├─ npm test                                              │  │
│  │  ├─ npm run test:coverage                                │  │
│  │  ├─ Verify 90%+ coverage threshold                       │  │
│  │  └─ Upload to Codecov                                    │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Code Quality Checks                                      │  │
│  │  ├─ Project structure validation                         │  │
│  │  ├─ console.log detection                                │  │
│  │  ├─ TODO/FIXME tracking                                  │  │
│  │  ├─ JSON validation                                      │  │
│  │  └─ npm audit                                            │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  PR Validation (if PR)                                    │  │
│  │  ├─ Check conventional commit format                     │  │
│  │  ├─ Validate branch naming                               │  │
│  │  └─ Flag critical file changes                           │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Security Scan                                            │  │
│  │  ├─ npm audit (moderate level)                           │  │
│  │  └─ Secret detection scan                                │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────┬───────────────────────────────────────────────────┘
              │
              ├─→  All Checks Pass → Create Pull Request
              │
              └─→  Any Check Fails → Fix Required
                                       │
                                       └─→ Push fixes → CI reruns
```

## Pull Request Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     PULL REQUEST CREATED                         │
└────────────┬────────────────────────────────────────────────────┘
             │
             ├─→ PR Template Auto-fills
             ├─→ Code Owners Auto-assigned (@vnicolas)
             ├─→ Labels Applied (automated)
             │
             ▼
┌─────────────────────────────────────────────────────────────────┐
│                  BRANCH PROTECTION CHECKS                        │
├─────────────────────────────────────────────────────────────────┤
│  Required Status Checks:                                         │
│  ├─  Test & Coverage (Node 20.x)                              │
│  ├─  Code Quality Checks                                      │
│  ├─  Security Scan                                            │
│  └─  PR Validation                                            │
│                                                                   │
│  Required Reviews:                                               │
│  └─  1 approval from Code Owner                               │
│                                                                   │
│  Additional Requirements:                                        │
│  ├─  Branch up to date with main                              │
│  └─  All conversations resolved                               │
└────────────┬────────────────────────────────────────────────────┘
             │
             ├─→ Developer Reviews Code
             ├─→ Approves PR
             │
             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      MERGE TO MAIN                               │
└────────────┬────────────────────────────────────────────────────┘
             │
             └─→ Branch Deleted Automatically
```

## Deployment Pipeline

```
┌─────────────────────────────────────────────────────────────────┐
│                    PUSH TO MAIN BRANCH                           │
└────────────┬────────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────────┐
│                 DEPLOY WORKFLOW (Automatic)                      │
├─────────────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Pre-deployment Tests                                     │  │
│  │  ├─ npm ci                                                │  │
│  │  ├─ npm run test:coverage                                │  │
│  │  └─ Verify coverage ≥90%                                 │  │
│  │     └─  Fail? → Abort Deployment                       │  │
│  └───────────────────────────────────────────────────────────┘  │
│                          │                                        │
│                          ├─→  Tests Pass                       │
│                          │                                        │
│  ┌───────────────────────▼───────────────────────────────────┐  │
│  │  Deploy to GitHub Pages                                   │  │
│  │  ├─ Create deployment package                            │  │
│  │  │  ├─ Copy: src/, styles/, views/                       │  │
│  │  │  ├─ Copy: index.html, privacy.html                    │  │
│  │  │  └─ Generate: manifest.json                           │  │
│  │  ├─ Validate deployment files                            │  │
│  │  ├─ Upload artifact                                      │  │
│  │  └─ Deploy to Pages                                      │  │
│  └───────────────────────────────────────────────────────────┘  │
│                          │                                        │
│  ┌───────────────────────▼───────────────────────────────────┐  │
│  │  Verify Deployment                                        │  │
│  │  ├─ Wait 30s for propagation                             │  │
│  │  ├─ Check accessibility (5 retries)                      │  │
│  │  └─ Report deployment URL                                │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────┬───────────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────────┐
│          LIVE AT: https://vnicolas.github.io/TimeUp/            │
└─────────────────────────────────────────────────────────────────┘
```

## Release Pipeline

```
┌─────────────────────────────────────────────────────────────────┐
│                   CREATE VERSION TAG                             │
│                   git tag v1.2.0                                 │
│                   git push origin v1.2.0                         │
└────────────┬────────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────────┐
│                 RELEASE WORKFLOW (Automatic)                     │
├─────────────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Create Release                                           │  │
│  │  ├─ npm ci                                                │  │
│  │  ├─ npm run test:ci                                      │  │
│  │  ├─ Extract version from tag                             │  │
│  │  ├─ Update package.json                                  │  │
│  │  └─ Generate changelog from commits                      │  │
│  └───────────────────────────────────────────────────────────┘  │
│                          │                                        │
│  ┌───────────────────────▼───────────────────────────────────┐  │
│  │  Create Release Package                                   │  │
│  │  ├─ Bundle: src/, styles/, views/, assets/               │  │
│  │  ├─ Create: manifest.json                                │  │
│  │  ├─ Create: README.md (installation guide)               │  │
│  │  └─ Create: timeup-v1.2.0.zip                            │  │
│  └───────────────────────────────────────────────────────────┘  │
│                          │                                        │
│  ┌───────────────────────▼───────────────────────────────────┐  │
│  │  Create GitHub Release                                    │  │
│  │  ├─ Tag: v1.2.0                                           │  │
│  │  ├─ Title: Release v1.2.0                                │  │
│  │  ├─ Body: Changelog + release notes                      │  │
│  │  ├─ Assets: timeup-v1.2.0.zip, package.json              │  │
│  │  └─ Publish release                                      │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────┬───────────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────────┐
│  RELEASE PUBLISHED                                               │
│  → Triggers Deploy Workflow                                     │
│  → Updates GitHub Pages                                         │
└─────────────────────────────────────────────────────────────────┘
```

## Maintenance Cycle

```
┌─────────────────────────────────────────────────────────────────┐
│          SCHEDULED: Every Monday 9:00 AM UTC                     │
└────────────┬────────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────────┐
│             MAINTENANCE WORKFLOW (Automatic)                     │
├─────────────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Dependency Check                                         │  │
│  │  ├─ npm ci                                                │  │
│  │  ├─ npm outdated                                          │  │
│  │  ├─ npm audit                                             │  │
│  │  └─ Generate maintenance-report.md                       │  │
│  │     └─ Archive (90 days)                                 │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Coverage Trend                                           │  │
│  │  ├─ npm run test:coverage                                │  │
│  │  ├─ Extract coverage metrics                             │  │
│  │  └─ Generate coverage-trend.md                           │  │
│  │     └─ Archive (365 days)                                │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Test Stability                                           │  │
│  │  ├─ Run tests 10 times                                   │  │
│  │  ├─ Calculate success rate                               │  │
│  │  ├─ Fail if < 90% success                                │  │
│  │  └─ Generate test-stability.md                           │  │
│  │     └─ Archive (90 days)                                 │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────┬───────────────────────────────────────────────────┘
              │
              └─→ Reports available in Actions → Artifacts
```

## Dependabot Cycle

```
┌─────────────────────────────────────────────────────────────────┐
│       SCHEDULED: Every Monday 9:00 AM UTC                        │
└────────────┬────────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    DEPENDABOT SCAN                               │
├─────────────────────────────────────────────────────────────────┤
│  ├─ Scan npm dependencies                                        │
│  ├─ Scan GitHub Actions versions                                │
│  ├─ Group minor/patch updates                                   │
│  └─ Create separate PRs for major updates                       │
└────────────┬────────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────────┐
│              CREATE AUTOMATED PULL REQUESTS                      │
├─────────────────────────────────────────────────────────────────┤
│  ├─ Title: chore(deps): update dependencies                      │
│  ├─ Labels: dependencies, automated                             │
│  ├─ Assignee: @vnicolas                                         │
│  └─ Auto-links: Package changelogs                              │
└────────────┬────────────────────────────────────────────────────┘
             │
             ├─→ CI Workflow Runs Automatically
             │   ├─ Tests
             │   ├─ Coverage
             │   └─ Security Scan
             │
             └─→ Developer Reviews & Merges
                 └─→ Deploy Workflow Triggers
```

## Key Decision Points

```
┌─────────────────────────────────────────────────────────────────┐
│                     DECISION FLOWCHART                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Tests Pass? ────NO────→ Block Merge / Deployment               │
│       │                                                           │
│      YES                                                          │
│       │                                                           │
│       ▼                                                           │
│  Coverage ≥90%? ───NO───→ Block Merge / Deployment              │
│       │                                                           │
│      YES                                                          │
│       │                                                           │
│       ▼                                                           │
│  Security OK? ───NO───→ Warn (Continue)                         │
│       │                                                           │
│      YES                                                          │
│       │                                                           │
│       ▼                                                           │
│  Branch Protected? ───YES───→ Require Approval                  │
│       │                                                           │
│       NO                                                          │
│       │                                                           │
│       ▼                                                           │
│   ALLOW MERGE / DEPLOYMENT                                     │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Coverage & Quality Gates

```
┌─────────────────────────────────────────────────────────────────┐
│                    QUALITY GATES                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌────────────────┐                                              │
│  │   THRESHOLD    │           CURRENT STATUS                     │
│  ├────────────────┤                                              │
│  │ Statements 90% │ ────→ 95.74%  (+5.74%)                   │
│  │ Branches   90% │ ────→ 91.38%  (+1.38%)                   │
│  │ Functions  90% │ ────→ 98.82%  (+8.82%)                   │
│  │ Lines      90% │ ────→ 95.59%  (+5.59%)                   │
│  │ Tests Pass 100%│ ────→ 100%     (284/284)                 │
│  │ Stability  90% │ ────→ Checked Weekly                        │
│  └────────────────┘                                              │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Integration Points

```
GitHub Repository
       │
       ├─→ GitHub Actions (CI/CD)
       │   ├─→ npm (Dependencies)
       │   ├─→ Jest (Testing)
       │   └─→ Codecov (Coverage)
       │
       ├─→ GitHub Pages (Hosting)
       │   └─→ https://vnicolas.github.io/TimeUp/
       │
       ├─→ Dependabot (Updates)
       │   └─→ Automated PRs
       │
       └─→ Branch Protection (Quality)
           └─→ Enforce Standards
```

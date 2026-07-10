# CI/CD Quick Reference Card

## Common Commands

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in CI mode
npm run test:ci

# Run tests in watch mode
npm run test:watch

# Validate everything
npm run validate
```

## 🌿 Branch Workflow

```bash
# Create feature branch
git checkout -b feature/my-feature

# Make changes, commit
git add .
git commit -m "feat: add my feature"

# Push (triggers CI)
git push origin feature/my-feature

# Create PR on GitHub
# → CI runs automatically
# → Review and merge
```

## Release Workflow

```bash
# Option 1: Git tag
git tag -a v1.2.0 -m "Release v1.2.0"
git push origin v1.2.0

# Option 2: GitHub UI
# Actions → Release → Run workflow → Enter version
```

## Check CI Status

```bash
# View on GitHub
https://github.com/vnicolas/TimeUp/actions

# View specific workflow
https://github.com/vnicolas/TimeUp/actions/workflows/ci.yml
```

## Debugging CI Failures

1. Go to **Actions** tab
2. Click on failed workflow
3. Click on failed job
4. Expand failed step
5. Read error logs

## Conventional Commits

```
feat: new feature
fix: bug fix
docs: documentation
style: formatting
refactor: code restructuring
test: test updates
chore: maintenance
perf: performance
```

## Coverage Thresholds

```
Minimum required:
├── Statements: 90%
├── Branches:   90%
├── Functions:  90%
└── Lines:      90%

Current status:
├── Statements: 95.74%
├── Branches:   91.38%
├── Functions:  98.82%
└── Lines:      95.59%
```

## Workflow Triggers

| Workflow    | Trigger                                |
| ----------- | -------------------------------------- |
| CI          | Push to any branch, PR to main/develop |
| Deploy      | Push to main, manual                   |
| Maintenance | Mondays 9 AM UTC, manual               |
| Release     | Version tags (v*.*.\*), manual         |

## Artifacts

| Artifact           | Workflow    | Location                       |
| ------------------ | ----------- | ------------------------------ |
| Coverage Report    | CI          | Actions → Workflow → Artifacts |
| Maintenance Report | Maintenance | Actions → Workflow → Artifacts |
| Coverage Trend     | Maintenance | Actions → Workflow → Artifacts |
| Test Stability     | Maintenance | Actions → Workflow → Artifacts |

## 🚨 Emergency Fixes

```bash
# Hotfix branch
git checkout main
git pull
git checkout -b hotfix/critical-issue

# Fix, commit, push
git add .
git commit -m "fix: critical issue"
git push origin hotfix/critical-issue

# Create PR to main
# → CI runs
# → Fast-track review
# → Merge to main
# → Auto-deploys
```

## 🔐 Required Checks

Before merge to main:

- All tests pass
- Coverage ≥90%
- No console.log statements
- JSON files valid
- No security vulnerabilities
- 1 approval from code owner

## 📍 Important URLs

```
Repository:   https://github.com/vnicolas/TimeUp
Actions:      https://github.com/vnicolas/TimeUp/actions
Releases:     https://github.com/vnicolas/TimeUp/releases
GitHub Pages: https://vnicolas.github.io/TimeUp/
Codecov:      https://codecov.io/gh/vnicolas/TimeUp
```

## Tips

- Run `npm test` before pushing
- Keep PRs small (< 500 lines)
- Use conventional commits
- Review CI logs for failures
- Update tests with code changes
- Monitor Dependabot PRs weekly

## Need Help?

1. Check [CI_CD_GUIDE.md](.github/CI_CD_GUIDE.md)
2. Check [SETUP_GUIDE.md](.github/SETUP_GUIDE.md)
3. Check workflow logs in Actions tab
4. Review error messages carefully

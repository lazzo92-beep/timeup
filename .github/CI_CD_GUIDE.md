# CI/CD Pipeline Documentation

## Overview

TimeUp uses GitHub Actions for continuous integration and deployment. Our CI/CD pipeline ensures code quality, runs comprehensive tests, and automatically deploys to GitHub Pages.

## 📋 Workflows

### 1. CI Workflow (`ci.yml`)

**Triggers:**

- Push to `main`, `develop`, or `feature/**` branches
- Pull requests to `main` or `develop`

**Jobs:**

#### Test & Coverage

- Runs on Node.js 18.x and 20.x (matrix testing)
- Executes all Jest tests
- Generates coverage reports
- Enforces 90%+ coverage threshold for:
  - Statements
  - Branches
  - Functions
  - Lines
- Uploads coverage to Codecov
- Archives coverage reports (30-day retention)

#### Code Quality Checks

- Validates project structure
- Checks for `console.log` statements (warns, doesn't fail)
- Scans for TODO/FIXME comments
- Validates JSON files
- Runs `npm audit` for vulnerabilities

#### Validate Pull Request

- Checks PR title format (conventional commits)
- Validates branch naming conventions
- Lists changed files
- Flags critical file modifications

#### Security Scan

- Runs comprehensive `npm audit`
- Scans for hardcoded secrets/tokens
- Checks for common security patterns

### 2. Deploy Workflow (`deploy.yml`)

**Triggers:**

- Push to `main` branch
- Manual workflow dispatch

**Jobs:**

#### Pre-deployment Tests

- Runs full test suite with coverage
- Blocks deployment if tests fail
- Blocks deployment if coverage < 90%

#### Deploy to GitHub Pages

- Creates clean deployment package
- Generates `manifest.json` for Trello Power-Up
- Validates deployment files
- Uploads to GitHub Pages
- Reports deployment URL

#### Verify Deployment

- Waits for propagation (30s)
- Checks deployment accessibility
- Retries up to 5 times

### 3. Maintenance Workflow (`maintenance.yml`)

**Triggers:**

- Weekly schedule (Mondays at 9:00 AM UTC)
- Manual workflow dispatch

**Jobs:**

#### Dependency Check

- Lists outdated packages
- Runs security audit
- Generates maintenance report
- Archives report (90-day retention)

#### Coverage Trend

- Tracks coverage metrics over time
- Archives historical data (365-day retention)

#### Test Stability

- Runs tests 10 times
- Calculates success rate
- Fails if success rate < 90%
- Archives stability reports

## 🔧 Dependabot Configuration

Automated dependency updates configured in `.github/dependabot.yml`:

- **npm dependencies:** Weekly updates on Mondays
- **GitHub Actions:** Weekly updates on Mondays
- Groups minor/patch updates together
- Auto-assigns to project owner
- Labels with `dependencies` and `automated`

## Status Badges

Add these to your README.md:

```markdown
[![CI](https://github.com/vnicolas/TimeUp/actions/workflows/ci.yml/badge.svg)](https://github.com/vnicolas/TimeUp/actions/workflows/ci.yml)
[![Deploy](https://github.com/vnicolas/TimeUp/actions/workflows/deploy.yml/badge.svg)](https://github.com/vnicolas/TimeUp/actions/workflows/deploy.yml)
[![codecov](https://codecov.io/gh/vnicolas/TimeUp/branch/main/graph/badge.svg)](https://codecov.io/gh/vnicolas/TimeUp)
```

## 🔐 Required Secrets

### Optional (for enhanced features):

- `CODECOV_TOKEN` - For coverage reporting to Codecov.io

### GitHub Pages:

No secrets required - uses `GITHUB_TOKEN` automatically

## 🌿 Branch Protection Rules

Recommended settings for `main` branch:

```yaml
Branch Protection Rules:
   Require pull request reviews before merging
     - Required approving reviews: 1
   Require status checks to pass before merging
     - Required checks:
       - Test & Coverage (Node 20.x)
       - Code Quality Checks
       - Security Scan
   Require branches to be up to date before merging
   Require conversation resolution before merging
   Include administrators (optional)
   Restrict pushes that create matching branches
```

To set up in GitHub:

1. Go to Settings → Branches
2. Click "Add branch protection rule"
3. Branch name pattern: `main`
4. Configure rules as above

## Conventional Commits

Our CI validates PR titles follow conventional commit format:

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style/formatting
- `refactor:` - Code refactoring
- `test:` - Test changes
- `chore:` - Maintenance tasks
- `perf:` - Performance improvements

Example: `feat(timer): add pause functionality`

## Branch Naming Convention

Branch names should follow this pattern:

- `feature/description` - New features
- `bugfix/description` - Bug fixes
- `hotfix/description` - Urgent production fixes
- `docs/description` - Documentation updates
- `refactor/description` - Code refactoring
- `test/description` - Test improvements
- `chore/description` - Maintenance tasks

Example: `feature/add-pause-button`

## 🚦 Workflow Status

You can monitor workflow runs:

- GitHub Actions tab: `https://github.com/vnicolas/TimeUp/actions`
- Specific workflow: Click on workflow name
- Download artifacts: Click on workflow run → Artifacts section

## Artifacts

Workflows generate these artifacts:

| Artifact                | Workflow    | Retention | Purpose                       |
| ----------------------- | ----------- | --------- | ----------------------------- |
| `coverage-report`       | CI          | 30 days   | Detailed HTML coverage report |
| `maintenance-report`    | Maintenance | 90 days   | Dependency & security audit   |
| `coverage-trend`        | Maintenance | 365 days  | Historical coverage metrics   |
| `test-stability-report` | Maintenance | 90 days   | Test reliability analysis     |

## Troubleshooting

### Tests failing in CI but pass locally

- Ensure Node.js version matches (18.x or 20.x)
- Check for timing-dependent tests
- Verify no hardcoded paths or environment assumptions

### Coverage threshold not met

- Run `npm run test:coverage` locally
- Check coverage report in `coverage/index.html`
- Add tests for uncovered lines

### Deployment fails

- Verify all tests pass
- Check GitHub Pages settings are enabled
- Ensure `gh-pages` branch exists (created automatically)

### Dependabot PRs failing

- Review dependency changes
- Update tests if APIs changed
- Check for breaking changes in release notes

## Best Practices

1. **Always run tests locally** before pushing
2. **Keep PRs small** and focused (< 500 lines)
3. **Update tests** when modifying code
4. **Review CI failures** immediately
5. **Keep dependencies updated** (review Dependabot PRs weekly)
6. **Monitor coverage trends** (don't let coverage drop)
7. **Use conventional commits** for better changelog generation

## Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Jest Documentation](https://jestjs.io/)
- [Codecov Documentation](https://docs.codecov.com/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [GitHub Pages](https://docs.github.com/en/pages)

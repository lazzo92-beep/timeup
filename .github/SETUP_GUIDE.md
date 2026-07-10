# GitHub Repository Setup Checklist

## Initial Setup (One-Time Configuration)

### 1. Enable GitHub Pages

1. Go to **Settings** → **Pages**
2. Under "Build and deployment":
   - Source: **GitHub Actions**
   - (New method, no need for gh-pages branch)
3. Click **Save**
4. Your site will be available at: `https://vnicolas.github.io/TimeUp/`

### 2. Configure Branch Protection

1. Go to **Settings** → **Branches**
2. Click **Add branch protection rule**
3. Branch name pattern: `main`
4. Enable these settings:

   #### Pull Request Requirements
   - **Require a pull request before merging**
   - Required approving reviews: **1**
   - Dismiss stale pull request approvals when new commits are pushed
   - Require review from Code Owners

   #### Status Checks
   - **Require status checks to pass before merging**
   - Require branches to be up to date before merging
   - Select required checks:
     - `Test & Coverage (20.x)`
     - `Code Quality Checks`
     - `Security Scan`
     - `Pre-deployment Tests` (for deploys)

   #### Additional Settings
   - **Require conversation resolution before merging**
   - **Require linear history** (optional, prevents merge commits)
   - **Include administrators** (optional)
   - **Restrict who can push to matching branches** (optional)

5. Click **Create**

### 3. Set Up Secrets (Optional but Recommended)

1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**

#### Codecov Integration (Optional)

- Name: `CODECOV_TOKEN`
- Value: Get from [codecov.io](https://codecov.io/) after signing up
- Purpose: Enhanced coverage reporting and trending

### 4. Configure Repository Settings

1. Go to **Settings** → **General**

   #### Features
   - Issues
   - Discussions (optional)
   - Projects (optional)
   - Actions

   #### Pull Requests
   - Allow merge commits
   - Allow squash merging (recommended)
   - Allow rebase merging
   - Always suggest updating pull request branches
   - Automatically delete head branches

### 5. Set Up Dependabot Alerts

1. Go to **Settings** → **Security** → **Code security and analysis**
2. Enable:
   - **Dependency graph** (should be on by default)
   - **Dependabot alerts**
   - **Dependabot security updates**

### 6. Configure Actions Permissions

1. Go to **Settings** → **Actions** → **General**
2. Under "Actions permissions":
   - Select: **Allow all actions and reusable workflows**
3. Under "Workflow permissions":
   - Select: **Read and write permissions**
   - **Allow GitHub Actions to create and approve pull requests**

### 7. Add Collaborators (if needed)

1. Go to **Settings** → **Collaborators and teams**
2. Click **Add people** or **Add teams**
3. Set appropriate permissions

### 8. Create Initial Labels

1. Go to **Issues** → **Labels**
2. Add these custom labels:

   | Label              | Color     | Description                |
   | ------------------ | --------- | -------------------------- |
   | `bug`              | `#d73a4a` | Something isn't working    |
   | `enhancement`      | `#a2eeef` | New feature or request     |
   | `dependencies`     | `#0366d6` | Dependency updates         |
   | `automated`        | `#34d058` | Automated by bots          |
   | `ci/cd`            | `#fbca04` | CI/CD related              |
   | `documentation`    | `#0075ca` | Documentation improvements |
   | `good first issue` | `#7057ff` | Good for newcomers         |
   | `help wanted`      | `#008672` | Extra attention needed     |
   | `priority: high`   | `#b60205` | High priority              |
   | `priority: low`    | `#e4e669` | Low priority               |

## Workflow Verification

### Test CI Pipeline

1. Create a test branch:

   ```bash
   git checkout -b test/ci-setup
   ```

2. Make a small change (e.g., add a comment)

3. Push and create a PR:

   ```bash
   git add .
   git commit -m "test: verify CI pipeline"
   git push origin test/ci-setup
   ```

4. Create PR on GitHub
5. Verify all checks run and pass:
   - Test & Coverage (Node 18.x)
   - Test & Coverage (Node 20.x)
   - Code Quality Checks
   - Validate Pull Request
   - Security Scan

### Test Deployment

1. Merge your first PR to `main`
2. Check **Actions** tab for:
   - CI workflow completes
   - Deploy workflow triggers
   - Pre-deployment tests pass
   - Deployment succeeds
3. Visit `https://vnicolas.github.io/TimeUp/` to verify

### Test Maintenance Workflow

1. Go to **Actions** → **Weekly Maintenance**
2. Click **Run workflow**
3. Select `main` branch
4. Click **Run workflow**
5. Verify it completes successfully
6. Check **Artifacts** for generated reports

## Monitoring & Dashboards

### GitHub Insights

1. Go to **Insights** → **Pulse**
   - Monitor weekly activity
   - Track merged PRs
   - View issue activity

2. Go to **Insights** → **Code frequency**
   - Track code additions/deletions over time

3. Go to **Insights** → **Dependency graph**
   - View dependencies
   - Check for vulnerabilities

### Codecov Dashboard (if configured)

1. Visit [codecov.io](https://codecov.io/)
2. Link your GitHub account
3. View coverage trends, graphs, and reports

## 🔔 Notifications

### Configure GitHub Notifications

1. Go to **Profile** → **Settings** → **Notifications**
2. Under "Watching":
   - Set up email preferences
   - Configure web notifications

### Set Up Custom Notifications (optional)

1. Go to **Settings** → **Webhooks**
2. Add webhook for:
   - Slack integration
   - Discord notifications
   - Custom endpoints

## First Release

When ready for your first release:

```bash
# Tag the release
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0
```

Or use GitHub UI:

1. Go to **Releases**
2. Click **Create a new release**
3. Tag version: `v1.0.0`
4. Release title: `Release v1.0.0`
5. Add description
6. Click **Publish release**

The Release workflow will automatically:

- Run all tests
- Create release package
- Generate changelog
- Create GitHub release
- Trigger deployment

## Verification Checklist

After setup, verify:

- [ ] GitHub Pages is deployed and accessible
- [ ] CI workflow runs on push/PR
- [ ] Branch protection prevents direct pushes to main
- [ ] Dependabot PRs are being created (check after a week)
- [ ] Coverage reports upload successfully
- [ ] All status checks appear in PRs
- [ ] Deployment workflow triggers on main merge
- [ ] Maintenance workflow runs weekly
- [ ] Issue templates appear when creating issues
- [ ] PR template appears when creating PRs

## 🆘 Troubleshooting

### CI Workflows Not Running

1. Check **Settings** → **Actions** → **General**
2. Ensure Actions are enabled
3. Check workflow file syntax with `yamllint`

### GitHub Pages Not Deploying

1. Check **Settings** → **Pages** is configured
2. Ensure **Actions** have write permissions
3. Check workflow logs for errors

### Coverage Upload Failing

1. Verify `CODECOV_TOKEN` is set (if using Codecov)
2. Check codecov.io for errors
3. Ensure coverage files are generated

### Branch Protection Too Strict

1. Temporarily disable rules for testing
2. Re-enable after verification
3. Consider excluding administrators initially

## Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [GitHub Pages Documentation](https://docs.github.com/en/pages)
- [Branch Protection Documentation](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)
- [Dependabot Documentation](https://docs.github.com/en/code-security/dependabot)

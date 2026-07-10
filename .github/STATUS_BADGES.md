# Status Badges for README

Add these badges to your main `README.md` to display CI/CD status:

## Recommended Badges

### Essential Badges

```markdown
<!-- CI/CD Status -->

[![CI Status](https://github.com/nikiitin/TimeUp/actions/workflows/ci.yml/badge.svg)](https://github.com/nikiitin/TimeUp/actions/workflows/ci.yml)
[![Deploy Status](https://github.com/nikiitin/TimeUp/actions/workflows/deploy.yml/badge.svg)](https://github.com/nikiitin/TimeUp/actions/workflows/deploy.yml)

<!-- Coverage (after Codecov setup) -->

[![codecov](https://codecov.io/gh/nikiitin/TimeUp/branch/main/graph/badge.svg)](https://codecov.io/gh/nikiitin/TimeUp)

<!-- Version -->

[![GitHub release](https://img.shields.io/github/release/nikiitin/TimeUp.svg)](https://github.com/nikiitin/TimeUp/releases)
[![License](https://img.shields.io/github/license/nikiitin/TimeUp.svg)](LICENSE)
```

### Optional Badges

```markdown
<!-- Maintenance -->

[![Maintenance](https://img.shields.io/badge/Maintained%3F-yes-green.svg)](https://github.com/nikiitin/TimeUp/graphs/commit-activity)
[![GitHub last commit](https://img.shields.io/github/last-commit/nikiitin/TimeUp.svg)](https://github.com/nikiitin/TimeUp/commits/main)

<!-- Dependencies -->

[![Dependencies Status](https://img.shields.io/david/nikiitin/TimeUp.svg)](https://github.com/nikiitin/TimeUp)
[![Known Vulnerabilities](https://snyk.io/test/github/nikiitin/TimeUp/badge.svg)](https://snyk.io/test/github/nikiitin/TimeUp)

<!-- Code Quality -->

[![Language grade: JavaScript](https://img.shields.io/lgtm/grade/javascript/g/nikiitin/TimeUp.svg?logo=lgtm&logoWidth=18)](https://lgtm.com/projects/g/nikiitin/TimeUp/context:javascript)
```

## Sample README Header

````markdown
# TimeUp

> Trello Power-Up for Time Tracking

[![CI Status](https://github.com/nikiitin/TimeUp/actions/workflows/ci.yml/badge.svg)](https://github.com/nikiitin/TimeUp/actions/workflows/ci.yml)
[![Deploy Status](https://github.com/nikiitin/TimeUp/actions/workflows/deploy.yml/badge.svg)](https://github.com/nikiitin/TimeUp/actions/workflows/deploy.yml)
[![codecov](https://codecov.io/gh/nikiitin/TimeUp/branch/main/graph/badge.svg)](https://codecov.io/gh/nikiitin/TimeUp)
[![GitHub release](https://img.shields.io/github/release/nikiitin/TimeUp.svg)](https://github.com/nikiitin/TimeUp/releases)
[![License](https://img.shields.io/github/license/nikiitin/TimeUp.svg)](LICENSE)

Track time spent on Trello cards with precision. Start, stop, pause timers, and generate detailed reports.

[Live Demo](https://vnicolas.github.io/TimeUp/) | [Documentation](.github/README.md) | [Changelog](CHANGELOG.md)

## Features

- **Timer Controls**: Start, stop, pause timers per card
- **Reports**: Generate detailed time reports
- **Checklist Integration**: Track time per checklist item
- **Cost Calculation**: Set hourly rates
- **Time Estimates**: Set and track against estimates
- **Mobile Friendly**: Works on all devices
- **Privacy First**: All data stored in Trello

## Quick Start

1. Install the Power-Up in your Trello board
2. Open any card
3. Click "Start Timer"
4. Track your time!

See [Installation Guide](docs/INSTALLATION.md) for detailed setup.

## Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Check coverage
npm run test:coverage

# Start dev server
npm start
```
````

See [Contributing Guide](CONTRIBUTING.md) for development setup.

## CI/CD Pipeline

This project uses GitHub Actions for:

- Automated testing on every push
- Automatic deployment to GitHub Pages
- Security scanning
- Weekly dependency updates
- Coverage tracking

See [CI/CD Guide](.github/CI_CD_GUIDE.md) for details.

## License

MIT © [Your Name](LICENSE)

````

## Badge Styles

Shields.io offers different styles:

```markdown
<!-- Flat (default) -->
![Badge](https://img.shields.io/badge/style-flat-green?style=flat)

<!-- Flat-Square -->
![Badge](https://img.shields.io/badge/style-flat--square-green?style=flat-square)

<!-- For-the-badge -->
![Badge](https://img.shields.io/badge/style-for--the--badge-green?style=for-the-badge)

<!-- Plastic -->
![Badge](https://img.shields.io/badge/style-plastic-green?style=plastic)
````

## Custom Badges

Create custom badges at [shields.io](https://shields.io/):

```markdown
<!-- Custom badge -->

![Custom](https://img.shields.io/badge/TimeUp-v1.0.0-blue?style=flat-square&logo=trello)

<!-- With emoji -->

![Status](https://img.shields.io/badge/status-%20active-success)
```

## Setup Instructions

### 1. GitHub Actions Badges

These work immediately after first workflow run. No setup needed.

```markdown
[![CI](https://github.com/nikiitin/TimeUp/actions/workflows/ci.yml/badge.svg)](https://github.com/nikiitin/TimeUp/actions/workflows/ci.yml)
```

### 2. Codecov Badge

Requires Codecov account:

1. Sign up at https://codecov.io
2. Add repository
3. Get token
4. Add `CODECOV_TOKEN` to GitHub secrets
5. Badge updates automatically

```markdown
[![codecov](https://codecov.io/gh/nikiitin/TimeUp/branch/main/graph/badge.svg)](https://codecov.io/gh/nikiitin/TimeUp)
```

### 3. Version Badge

Works automatically when you create releases:

```markdown
[![Version](https://img.shields.io/github/release/nikiitin/TimeUp.svg)](https://github.com/nikiitin/TimeUp/releases)
```

## Badge Placement

### Option 1: Top of README (Horizontal)

```markdown
# TimeUp

[![CI](badge1)] [![Deploy](badge2)] [![Coverage](badge3)]

Description...
```

### Option 2: Below Title (Vertical)

```markdown
# TimeUp

[![CI](badge1)]
[![Deploy](badge2)]
[![Coverage](badge3)]

Description...
```

### Option 3: In Table

```markdown
# TimeUp

| Status   | Badge                 |
| -------- | --------------------- |
| CI       | [![CI](badge1)]       |
| Deploy   | [![Deploy](badge2)]   |
| Coverage | [![Coverage](badge3)] |
```

## Recommended Minimum

Start with these 3 essential badges:

```markdown
[![CI](https://github.com/nikiitin/TimeUp/actions/workflows/ci.yml/badge.svg)](https://github.com/nikiitin/TimeUp/actions/workflows/ci.yml)
[![Deploy](https://github.com/nikiitin/TimeUp/actions/workflows/deploy.yml/badge.svg)](https://github.com/nikiitin/TimeUp/actions/workflows/deploy.yml)
[![License](https://img.shields.io/github/license/nikiitin/TimeUp.svg)](LICENSE)
```

## Badge Colors

Customize badge colors:

```markdown
<!-- Success -->

![Badge](https://img.shields.io/badge/tests-passing-brightgreen)

<!-- Warning -->

![Badge](https://img.shields.io/badge/coverage-85%25-yellow)

<!-- Error -->

![Badge](https://img.shields.io/badge/build-failing-red)

<!-- Info -->

![Badge](https://img.shields.io/badge/status-beta-blue)
```

## Next Steps

1. **After first workflow run**: CI and Deploy badges will show status
2. **After Codecov setup**: Coverage badge will show percentage
3. **After first release**: Version badge will show v1.0.0
4. **Update README.md**: Add chosen badges to your README

See [CI_CD_GUIDE.md](.github/CI_CD_GUIDE.md#status-badges) for more details.

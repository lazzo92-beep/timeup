#!/bin/bash

# CI/CD Setup Verification Script
# Checks that all CI/CD components are properly configured

# Don't exit on errors - we want to collect all results
set +e

echo "============================================"
echo "  TimeUp CI/CD Setup Verification"
echo "============================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Counters
PASS=0
WARN=0
FAIL=0

# Check function
check() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ PASS${NC}: $1"
        ((PASS++))
    else
        echo -e "${RED}❌ FAIL${NC}: $1"
        ((FAIL++))
    fi
}

warn() {
    echo -e "${YELLOW}⚠️  WARN${NC}: $1"
    ((WARN++))
}

info() {
    echo -e "ℹ️  $1"
}

section() {
    echo ""
    echo "----------------------------------------"
    echo "  $1"
    echo "----------------------------------------"
}

# 1. Check File Structure
section "File Structure"

[ -f ".github/workflows/ci.yml" ]
check "CI workflow exists"

[ -f ".github/workflows/deploy.yml" ]
check "Deploy workflow exists"

[ -f ".github/workflows/maintenance.yml" ]
check "Maintenance workflow exists"

[ -f ".github/workflows/release.yml" ]
check "Release workflow exists"

[ -f ".github/dependabot.yml" ]
check "Dependabot config exists"

[ -f ".github/CODEOWNERS" ]
check "CODEOWNERS file exists"

[ -f ".github/PULL_REQUEST_TEMPLATE.md" ]
check "PR template exists"

[ -d ".github/ISSUE_TEMPLATE" ]
check "Issue templates directory exists"

[ -f ".github/CI_CD_GUIDE.md" ]
check "CI/CD Guide exists"

[ -f ".github/SETUP_GUIDE.md" ]
check "Setup Guide exists"

# 2. Validate YAML Syntax
section "YAML Validation"

if command -v python3 &> /dev/null; then
    for file in .github/workflows/*.yml .github/dependabot.yml; do
        if python3 -c "import yaml; yaml.safe_load(open('$file'))" 2>/dev/null; then
            check "$(basename $file) is valid YAML"
        else
            check "$(basename $file) is valid YAML"
        fi
    done
else
    warn "Python3 not found - skipping YAML validation"
fi

# 3. Check package.json Scripts
section "Package Scripts"

if [ -f "package.json" ]; then
    if grep -q '"test:ci"' package.json; then
        check "test:ci script exists"
    else
        warn "test:ci script missing (optional)"
    fi

    if grep -q '"validate"' package.json; then
        check "validate script exists"
    else
        warn "validate script missing (optional)"
    fi

    if grep -q '"test"' package.json; then
        check "test script exists"
    else
        check "test script exists"
    fi

    if grep -q '"test:coverage"' package.json; then
        check "test:coverage script exists"
    else
        check "test:coverage script exists"
    fi
else
    check "package.json exists"
fi

# 4. Check Git Configuration
section "Git Configuration"

if git rev-parse --is-inside-work-tree &> /dev/null; then
    check "Git repository initialized"

    if git remote get-url origin &> /dev/null; then
        REMOTE=$(git remote get-url origin)
        if [[ $REMOTE == *"github.com"* ]]; then
            check "GitHub remote configured"
            info "Remote: $REMOTE"
        else
            warn "Remote is not GitHub - some features may not work"
        fi
    else
        warn "No remote configured - workflows won't trigger"
    fi

    if git branch --show-current &> /dev/null; then
        BRANCH=$(git branch --show-current)
        info "Current branch: $BRANCH"
    fi
else
    check "Git repository initialized"
fi

# 5. Check Node.js Environment
section "Node.js Environment"

if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    check "Node.js installed ($NODE_VERSION)"

    if [[ "$NODE_VERSION" == "v18."* ]] || [[ "$NODE_VERSION" == "v20."* ]] || [[ "$NODE_VERSION" == "v22."* ]]; then
        info "Node version compatible with CI matrix"
    else
        warn "Node version not in CI matrix (18.x, 20.x) - local results may differ"
    fi
else
    warn "Node.js not installed"
fi

if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    check "npm installed ($NPM_VERSION)"
else
    warn "npm not installed"
fi

# 6. Check Dependencies
section "Dependencies"

if [ -d "node_modules" ]; then
    check "node_modules directory exists"
else
    warn "node_modules not found - run 'npm install'"
fi

if [ -f "package-lock.json" ]; then
    check "package-lock.json exists"
else
    warn "package-lock.json missing - run 'npm install'"
fi

# 7. Run Quick Tests (optional)
section "Test Execution"

if command -v npm &> /dev/null && [ -d "node_modules" ]; then
    info "Running quick test check..."
    if npm test -- --passWithNoTests &> /dev/null; then
        check "Tests can execute"
    else
        warn "Tests failed or couldn't execute - check test configuration"
    fi
else
    warn "Skipping test execution (npm or node_modules missing)"
fi

# 8. Check Documentation
section "Documentation"

if [ -f "README.md" ]; then
    check "README.md exists"
else
    warn "README.md missing"
fi

if [ -f "LICENSE" ]; then
    check "LICENSE exists"
else
    warn "LICENSE missing"
fi

# 9. Summary
section "Summary"

echo ""
echo "Results:"
echo -e "  ${GREEN}✅ Passed: $PASS${NC}"
if [ $WARN -gt 0 ]; then
    echo -e "  ${YELLOW}⚠️  Warnings: $WARN${NC}"
fi
if [ $FAIL -gt 0 ]; then
    echo -e "  ${RED}❌ Failed: $FAIL${NC}"
fi
echo ""

if [ $FAIL -gt 0 ]; then
    echo -e "${RED}❌ Setup verification FAILED${NC}"
    echo "   Some critical components are missing."
    echo "   Please review the failures above."
    exit 1
elif [ $WARN -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Setup verification PASSED with warnings${NC}"
    echo "   CI/CD is functional but some optional components are missing."
    echo "   Review warnings above for improvements."
    exit 0
else
    echo -e "${GREEN}✅ Setup verification PASSED${NC}"
    echo "   All CI/CD components are properly configured!"
    echo ""
    echo "Next steps:"
    echo "  1. Push to GitHub: git push origin main"
    echo "  2. Enable GitHub Pages in repository settings"
    echo "  3. Configure branch protection rules"
    echo "  4. See .github/SETUP_GUIDE.md for details"
    exit 0
fi

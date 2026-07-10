# AI Assistant Configuration

This directory contains configuration files for AI assistants (GitHub Copilot, Cursor, etc.) to work effectively with the TimeUp project.

## 📁 Directory Structure

```
.github/
└── copilot-instructions.md    # GitHub Copilot main instructions

.vscode/
├── settings.json               # VSCode workspace settings
├── tasks.json                  # Predefined tasks (test, serve, deploy)
├── extensions.json             # Recommended extensions
└── project-knowledge.md        # Project context for AI

.copilot/
├── README.md                   # Copilot skills documentation
├── add-feature.skill.md        # Add new features workflow
├── debug.skill.md              # Debugging workflow
├── test.skill.md               # Testing workflow
├── serve-locally.skill.md      # Local development workflow
├── test-in-trello.skill.md     # Trello testing workflow
└── deploy.skill.md             # Deployment workflow

.agent/
├── rules.md                    # Pre-commit checklist
└── workflows/                  # Original workflow definitions

.antigravityrules               # Antigravity/Cursor rules (cross-compatible)
```

## 🚀 Quick Start

### For GitHub Copilot Users (VSCode)

1. **Install Extensions** (if not already installed):
   - GitHub Copilot
   - GitHub Copilot Chat
   - ESLint
   - Prettier

2. **Open the Project**:
   - VSCode will automatically load `.vscode/settings.json`
   - Copilot will read `.github/copilot-instructions.md`

3. **Use Copilot Chat**:

   ```
   @workspace How do I add a new timer feature?
   @workspace Use the add-feature skill to create a pause function
   @workspace Debug why the badge isn't updating
   ```

4. **Run Tasks**:
   - Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac)
   - Type "Tasks: Run Task"
   - Select a task: Test All, Serve Locally, etc.

### For Cursor Users

1. **Cursor Automatically Reads**:
   - `.cursorrules` (cross-compatible with other IDEs)
   - `.agent/rules.md`
   - `.agent/workflows/*.md`

2. **Use Cursor Chat**:
   ```
   @Rules What's the coding style for services?
   @Workflow /add-feature - create a timer pause function
   @Workflow /test - run all tests
   ```

### For Antigravity Users

1. **Antigravity Reads**:
   - `.antigravityrules`
   - `.agent/` directory

2. **Use Commands**:
   - Antigravity will automatically apply rules
   - Workflows are available in the workflows panel

## 📚 What Each File Does

### `.github/copilot-instructions.md`

**Primary instructions for GitHub Copilot in VSCode.**

- Core architecture rules
- Code style guidelines
- CSS patterns
- Pre-commit checklist
- Common patterns and anti-patterns
- Data models
- Quick reference

### `.vscode/settings.json`

**VSCode workspace configuration.**

- Copilot settings
- Editor preferences
- File associations
- Formatting rules
- Extension-specific settings

### `.vscode/tasks.json`

**Predefined tasks you can run:**

- `Test All` - Run all tests (Ctrl+Shift+B)
- `Test with Coverage` - Run tests with coverage report
- `Test Watch Mode` - Run tests in watch mode
- `Serve Locally` - Start local development server
- `Deploy to GitHub Pages` - Push to production

### `.vscode/project-knowledge.md`

**High-level project context for AI assistants.**

- Project overview
- Architecture principles
- File patterns
- Data models
- Common pitfalls
- Development workflow

### `.copilot/*.skill.md`

**Reusable workflows (skills) that Copilot can execute:**

- `add-feature.skill.md` - Step-by-step feature development
- `debug.skill.md` - Debugging patterns and solutions
- `test.skill.md` - Testing and coverage workflow
- `serve-locally.skill.md` - Local development setup
- `test-in-trello.skill.md` - Integration testing in Trello
- `deploy.skill.md` - Production deployment

## 🎯 How to Use Skills

### In GitHub Copilot Chat:

```
@workspace Use the add-feature skill to create a timer pause button
@workspace Run the debug skill to help with badge not updating
@workspace Execute the test skill before I commit
```

### In Cursor:

```
@Workflow /add-feature
@Workflow /debug
@Workflow /test
```

## 🔧 Customization

### Add New Skill

1. Create `.copilot/your-skill.skill.md`
2. Follow the format:

   ```markdown
   ---
   skill: your-skill-name
   description: What this skill does
   tags: [category, keywords]
   ---

   # Your Skill Name

   ## Purpose

   What problem this solves

   ## Steps

   1. First step
   2. Second step
      ...
   ```

### Update Rules

Edit `.github/copilot-instructions.md` for project-wide rules that apply to all code generation.

### Add Task

Edit `.vscode/tasks.json` to add new tasks:

```json
{
  "label": "Your Task",
  "type": "shell",
  "command": "your-command",
  "group": "build"
}
```

## 🤖 AI Assistant Capabilities

### Autonomous Operation Mode 🚀

This project is configured for **autonomous AI operation**:

**✅ Agent Can Do Autonomously (No Permission Needed):**

- Create, edit, and delete files
- Run terminal commands (npm, serve, tests)
- Install packages
- Start/stop servers
- Run tests and coverage
- Fix bugs and refactor code
- Update documentation
- Execute any non-git commands

**⛔ Agent Must Ask First (User Control):**

- **ALL git commands** (commit, push, pull, merge, etc.)
- Git repository operations
- Branch operations
- Anything starting with `git`

**Why This Setup?**

- Faster development - no micro-approvals needed
- Agent can iterate and test autonomously
- You maintain full control over version control
- Changes are tested before you commit

### GitHub Copilot (VSCode)

- ✅ Code completion
- ✅ Chat interface with @workspace
- ✅ Reads copilot-instructions.md
- ✅ Uses skills from .copilot/
- ✅ Context from project-knowledge.md
- ✅ **Autonomous execution enabled**

### Cursor

- ✅ Code completion
- ✅ Chat with @Rules and @Workflow
- ✅ Reads .cursorrules
- ✅ Uses .agent/workflows/
- ✅ Multi-file editing

### Antigravity

- ✅ Code completion
- ✅ Reads .antigravityrules
- ✅ Uses .agent/ directory
- ✅ Workflow panel integration

## 📖 Learning More

### For New Contributors

1. Read `.github/copilot-instructions.md` - Learn the coding style
2. Review `.copilot/add-feature.skill.md` - Understand the development workflow
3. Check `.agent/rules.md` - See the pre-commit checklist

### For AI Assistants

When generating code:

1. Follow `.github/copilot-instructions.md` rules strictly
2. Use skills as step-by-step guides
3. Check pre-commit checklist in `.agent/rules.md`
4. Reference data models in `copilot-instructions.md`

## 🔄 Cross-IDE Compatibility

This project is configured to work with multiple AI-powered IDEs:

| Feature   | VSCode + Copilot           | Cursor               | Antigravity          |
| --------- | -------------------------- | -------------------- | -------------------- |
| Rules     | ✅ copilot-instructions.md | ✅ .cursorrules      | ✅ .antigravityrules |
| Workflows | ✅ .copilot/\*.skill.md    | ✅ .agent/workflows/ | ✅ .agent/workflows/ |
| Chat      | ✅ @workspace              | ✅ @Rules, @Workflow | ✅ Built-in          |
| Tasks     | ✅ tasks.json              | ✅ tasks.json        | ✅ Custom            |
| Settings  | ✅ settings.json           | ✅ settings.json     | ✅ Shared            |

## 🆘 Troubleshooting

### Copilot Not Using Instructions

1. Verify `.github/copilot-instructions.md` exists
2. Reload VSCode window: `Ctrl+Shift+P` → "Reload Window"
3. Check Copilot status in bottom status bar
4. Try: `@workspace explain the project rules`

### Skills Not Working

1. Ensure files are in `.copilot/` directory
2. Check YAML frontmatter is correct
3. Reference skills with exact name: `@workspace use add-feature skill`

### Tasks Not Appearing

1. Open Command Palette: `Ctrl+Shift+P`
2. Type "Tasks: Run Task"
3. If empty, check `.vscode/tasks.json` is valid JSON

## 📝 Contributing

When adding new rules or skills:

1. Keep them concise and actionable
2. Use examples (✅ correct vs ❌ wrong)
3. Add JSDoc-style documentation
4. Test with actual AI assistant before committing
5. Update this README if adding new files

## 📄 License

Same as main project (MIT).

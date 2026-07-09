# Ijambo's Workspace

A well-organized development workspace for managing multiple projects, research, and learning tasks.

---

## 📁 Directory Structure

```
workspace/
├── 📂 projects/                    # Active development projects
│   ├── flask-landing-app/          # Flask app with dynamic proxy URLs
│   ├── flask-app-todo-sync/        # Flask app with todo sync feature
│   ├── react-button-component/     # React component project
│   └── .project-registry.json      # Master project registry
│
├── 📂 skills/                      # Reusable skill modules
│   ├── flask-app-builder/         # Flask app creation skill
│   ├── playwright-python-skill/    # Python Playwright testing skill
│   ├── project-organization/       # Project organization skill
│   ├── workspace-cleaner/          # Workspace cleanup skill
│   └── ...                        # Other skills
│
├── 📂 research/                    # Research outputs and reports
│   ├── raw/                        # Raw research data
│   └── reports/                    # Final research reports
│
├── 📂 sandbox-files/               # Exported sandbox artifacts
│   ├── flask-app/                  # Flask-related exports
│   ├── playwright/                 # Playwright-related exports
│   ├── nodejs-app/                 # Node.js-related exports
│   └── scripts/                    # Utility scripts
│
├── 📂 learning/                    # TypeScript/JavaScript learning
│   ├── typescript/                 # TypeScript exercises
│   ├── javascript/                 # JavaScript exercises
│   └── notes/                      # Learning notes
│
├── 📂 tools/                       # Utility tools and helpers
│   └── README.md                   # Tools documentation
│
├── 📂 docs/                        # General documentation
│   └── templates/                  # Reusable templates
│
├── README.md                       # This file
└── .gitignore                      # Git ignore rules
```

---

## 🎯 Folder Purposes

| Folder | Purpose |
|--------|---------|
| `projects/` | Active development projects with isolated structures |
| `skills/` | Reusable skill modules for automation |
| `research/` | Research outputs, raw data, and final reports |
| `sandbox-files/` | Exported artifacts from sandbox executions |
| `learning/` | TypeScript/JavaScript learning materials |
| `tools/` | Utility tools and helper scripts |
| `docs/` | General documentation and templates |

---

## 🚀 Quick Start

### Creating a New Project
1. Use the `project-organization` skill first
2. A dedicated folder will be created in `projects/`
3. Each project gets its own README.md and structure

### Running a Skill
1. Check `skills/` folder for available skills
2. Read the skill's `SKILL.md` for instructions
3. Follow the skill's workflow step-by-step

### Cleaning Up
1. Use the `workspace-cleaner` skill
2. Removes temporary `reports-*.md` files
3. Archives old `*.todos.json` files

---

## 📋 Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Project folders | `kebab-case` | `flask-landing-app` |
| Skill folders | `kebab-case-skill` | `playwright-python-skill` |
| Todo files | `project-name.todos.json` | `flask-app.todos.json` |
| Research files | `topic-research.md` | `CoT-prompting-research.md` |
| Scripts | `snake_case.py` | `stealth_test.py` |

---

## 🔧 Technology Stack

- **Languages:** Python, TypeScript, JavaScript, Node.js
- **Frameworks:** Flask, React, Playwright, Express
- **Tools:** Docker, Node.js, npm

> **User Preference:** Ijambo specifically loves coding in Node.js (in addition to TypeScript and JavaScript).
- **Skills:** 30+ reusable skill modules

---

## 📝 Active Projects

| Project | Status | Description |
|---------|--------|-------------|
| flask-landing-app | ✅ Active | Flask app with dynamic proxy URL handling |
| playwright-python-skill | ✅ Active | Python Playwright testing with stealth mode |
| TypeScript Learning | 📚 In Progress | Learning TypeScript and JavaScript |

---

## 🧹 Maintenance

### Before Starting New Work
1. Run workspace cleanup to remove temporary files
2. Check project registry for active projects
3. Review relevant skills before starting

### After Completing Tasks
1. Export sandbox files to appropriate folder
2. Update project README.md if needed
3. Archive completed research to `research/reports/`

---

## 📅 Created

- **Date:** 2026-03-13
- **User:** Ijambo
- **Purpose:** Organized workspace for multi-project development

---

## 🔗 Quick Links

- [Project Registry](projects/.project-registry.json)
- [Skills Directory](skills/README.md)
- [Research Archive](research/)
- [Sandbox Exports](sandbox-files/)
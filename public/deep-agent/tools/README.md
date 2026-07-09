# Custom Tools for Assistant

This folder contains custom tools created to enhance the assistant's capabilities.

## Available Tools

### 1. `file_copy`

**Purpose:** Copy files or directories within the workspace.

**Features:**
- Copy single files or entire directories recursively
- Optional overwrite protection (fails if destination exists, unless `overwrite: true`)
- Automatic creation of parent directories
- Path validation to prevent escaping workspace

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `source` | string | Yes | Source file or directory path |
| `destination` | string | Yes | Destination path |
| `overwrite` | boolean | No | Overwrite if destination exists (default: false) |

**Example Usage:**
```typescript
// Copy a file
await file_copy({
  source: "src/app.ts",
  destination: "src/app-backup.ts"
});

// Copy a directory
await file_copy({
  source: "templates/",
  destination: "templates-v2/",
  overwrite: true
});
```

---

### 2. `batch_edit`

**Purpose:** Apply the same find-and-replace operation across multiple files.

**Features:**
- Target files by glob pattern or explicit paths
- Dry run mode to preview changes before applying
- Match counting and preview generation
- Atomic processing (all or nothing approach)

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `pattern` | string | No* | Glob pattern to match files (e.g., `**/*.ts`) |
| `paths` | string[] | No* | Explicit list of file paths |
| `old_content` | string | Yes | Exact text to find |
| `new_content` | string | Yes | Text to replace with |
| `dry_run` | boolean | No | Preview only, don't modify (default: false) |

*Either `pattern` OR `paths` must be provided (mutually exclusive)

**Example Usage:**
```typescript
// Preview changes across all TypeScript files
await batch_edit({
  pattern: "**/*.ts",
  old_content: "oldFunctionName",
  new_content: "newFunctionName",
  dry_run: true
});

// Apply changes to specific files
await batch_edit({
  paths: ["src/app.ts", "src/utils.ts", "test/app.test.ts"],
  old_content: "import { oldApi }",
  new_content: "import { newApi }"
});
```

---

## Integration Instructions

To add these tools to your assistant:

### Step 1: Install Dependencies

```bash
npm install zod
```

### Step 2: Import Tools

In your tools configuration file:

```typescript
import { file_copy } from "./file_copy";
import { batch_edit } from "./batch_edit";

// Add to your tools array
const tools = [
  // ... existing tools
  file_copy,
  batch_edit,
];
```

### Step 3: Register with LLM Provider

```typescript
// For Claude/OpenAI integration
const toolDefinitions = [
  file_copy.definition,  // Contains name, description, schema
  batch_edit.definition,
];
```

---

## Safety Features

Both tools include:

- ✅ **Path validation** - Prevents access outside workspace
- ✅ **Error handling** - Graceful failure with descriptive messages
- ✅ **Logging** - All operations logged via `toolConfig.writer`
- ✅ **Preview mode** (batch_edit) - Dry run before actual changes

---

## Future Enhancements

Potential improvements for these tools:

### `file_copy`
- Preserve file permissions/metadata
- Progress reporting for large directories
- Copy verification (checksum comparison)

### `batch_edit`
- Regex pattern support
- Case-insensitive matching option
- Undo/rollback capability
- File backup before modification

---

## Testing

To test these tools:

```bash
# Run TypeScript compiler
npx tsc tools/file_copy.ts --noEmit
npx tsc tools/batch_edit.ts --noEmit

# Or use ts-node for runtime testing
npx ts-node tools/test-tools.ts
```

---

Created: 2026-03-12
Author: Assistant-2
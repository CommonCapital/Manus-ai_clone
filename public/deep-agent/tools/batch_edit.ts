const ROOT = process.cwd();
const BASE_DIR = path.join(ROOT, "public", "deep-agent");
const fs = require("fs");
const path = require("path");
const { z } = require("zod");

export const batch_edit = tool(
  async ({ pattern, old_content, new_content, paths, dry_run = false }, toolConfig: any) => {
    try {
      let targetFiles: string[] = [];

      // Determine target files: either from glob pattern or explicit paths
      if (pattern) {
        // Use glob pattern to find files
        const files = await findFilesByPattern(BASE_DIR, pattern);
        targetFiles = files;
      } else if (paths && paths.length > 0) {
        // Use explicit paths
        targetFiles = paths;
      } else {
        return JSON.stringify({
          error: "No targets specified",
          message: "Either 'pattern' or 'paths' must be provided",
        });
      }

      // Validate all paths are within BASE_DIR
      for (const filePath of targetFiles) {
        const fullPath = path.resolve(BASE_DIR, filePath);
        if (!fullPath.startsWith(BASE_DIR)) {
          return JSON.stringify({
            error: "Invalid path",
            message: `Path outside workspace: ${filePath}`,
          });
        }
      }

      // Process each file
      const results: Array<{
        file: string;
        matches: number;
        status: "success" | "not_found" | "error";
        preview?: string;
      }> = [];

      for (const filePath of targetFiles) {
        const fullPath = path.resolve(BASE_DIR, filePath);

        try {
          // Read file content
          const content = await fs.promises.readFile(fullPath, "utf-8");

          // Count matches
          const matches = countMatches(content, old_content);

          if (matches === 0) {
            results.push({
              file: filePath,
              matches: 0,
              status: "not_found",
            });
            continue;
          }

          // Create preview (first match with context)
          const preview = createPreview(content, old_content, new_content);

          if (dry_run) {
            // Don't actually modify, just report
            results.push({
              file: filePath,
              matches,
              status: "success",
              preview,
            });
          } else {
            // Perform the replacement
            const newFileContent = content.split(old_content).join(new_content);
            await fs.promises.writeFile(fullPath, newFileContent, "utf-8");

            results.push({
              file: filePath,
              matches,
              status: "success",
              preview,
            });
          }

        } catch (error: any) {
          if (error.code === "ENOENT") {
            results.push({
              file: filePath,
              matches: 0,
              status: "not_found",
            });
          } else {
            results.push({
              file: filePath,
              matches: 0,
              status: "error",
            });
          }
        }
      }

      // Calculate summary
      const summary = {
        total_files: targetFiles.length,
        files_modified: results.filter(r => r.status === "success" && !dry_run).length,
        files_previewed: results.filter(r => r.status === "success" && dry_run).length,
        files_not_found: results.filter(r => r.status === "not_found").length,
        files_error: results.filter(r => r.status === "error").length,
        total_matches: results.reduce((sum, r) => sum + r.matches, 0),
      };

      toolConfig.writer({
        batch_edit: "batch_edit",
        pattern: pattern || "explicit paths",
        old_content: old_content.substring(0, 50) + (old_content.length > 50 ? "..." : ""),
        new_content: new_content.substring(0, 50) + (new_content.length > 50 ? "..." : ""),
        summary,
      });

      return JSON.stringify({
        message: dry_run
          ? `Dry run complete: ${summary.total_matches} matches found in ${summary.files_previewed} files`
          : `Batch edit complete: ${summary.total_matches} replacements in ${summary.files_modified} files`,
        dry_run,
        summary,
        results,
      });

    } catch (error: any) {
      return JSON.stringify({
        error: "Batch edit failed",
        message: error.message,
      });
    }
  },
  {
    name: "batch_edit",
    description: `
Edit multiple files at once with the same find-and-replace operation.

This tool applies the same text replacement across multiple files efficiently,
saving time when refactoring or updating code across a project.

TARGETING FILES:
You can target files in two ways:

1. Using glob pattern:
   - pattern: "**/*.ts" (all TypeScript files)
   - pattern: "src/**/*.js" (all JS files in src)
   - pattern: "*.md" (all markdown files in root)

2. Using explicit paths array:
   - paths: ["src/app.ts", "src/utils.ts", "test/app.test.ts"]

FIND AND REPLACE:
- old_content: Exact text to find in each file
- new_content: Text to replace it with
- All occurrences in each file are replaced

DRY RUN:
- Set dry_run: true to preview changes without modifying files
- Returns match counts and previews for each file
- Use to verify before making actual changes

FILE BEHAVIOR:
- Files not containing old_content are skipped (not modified)
- Non-existent files are reported but don't cause errors
- All matching files are processed atomically

WHEN TO USE:
Use this tool when you need to:
- Rename variables/functions across multiple files
- Update import statements project-wide
- Replace deprecated API calls
- Fix typos across documentation
- Update configuration values

WHEN NOT TO USE:
- For single file edits (use edit_file instead)
- When different files need different replacements
- When you need regex patterns (not supported yet)

BEST PRACTICES:
- Always use dry_run: true first to preview changes
- Use specific patterns to avoid unintended modifications
- Double-check old_content is exactly what you want to replace
- Review results after completion
`,
    schema: z.object({
      pattern: z.string().optional().describe(
        "Glob pattern to match files. Example: '**/*.ts' for all TypeScript files, 'src/**/*.js' for JS files in src. Mutually exclusive with 'paths'."
      ),
      paths: z.array(z.string()).optional().describe(
        "Explicit list of file paths to edit. Example: ['src/app.ts', 'src/utils.ts']. Mutually exclusive with 'pattern'."
      ),
      old_content: z.string().describe(
        "Exact text to find and replace in each file. Must match exactly (case-sensitive)."
      ),
      new_content: z.string().describe(
        "Text to replace old_content with. Can be empty string to delete content."
      ),
      dry_run: z.boolean().optional().default(false).describe(
        "If true, preview changes without modifying files. Recommended before actual edit."
      ),
    }),
  }
);

// Helper function to find files by glob pattern
async function findFilesByPattern(baseDir: string, pattern: string): Promise<string[]> {
  const files: string[] = [];
  
  // Simple glob implementation for common patterns
  // For production, use a proper glob library like 'glob' or 'fast-glob'
  
  const patternParts = pattern.split("/");
  const isRecursive = pattern.includes("**");
  
  async function walk(dir: string, relativePath: string = ""): Promise<void> {
    const entries = await fs.promises.readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relPath = relativePath ? path.join(relativePath, entry.name) : entry.name;
      
      if (entry.isDirectory()) {
        // Skip node_modules and hidden directories
        if (entry.name === "node_modules" || entry.name.startsWith(".")) {
          continue;
        }
        await walk(fullPath, relPath);
      } else if (entry.isFile()) {
        // Check if file matches pattern
        if (matchesPattern(relPath, pattern)) {
          files.push(relPath);
        }
      }
    }
  }
  
  await walk(baseDir);
  return files;
}

// Helper function to check if path matches glob pattern
function matchesPattern(filePath: string, pattern: string): boolean {
  // Convert glob pattern to regex
  const regexPattern = pattern
    .replace(/\*\*/g, "<<<DOUBLE_STAR>>>")
    .replace(/\*/g, "[^/]*")
    .replace(/<<<DOUBLE_STAR>>>/g, ".*")
    .replace(/\./g, "\\.")
    .replace(/\?/g, ".");
  
  const regex = new RegExp(`^${regexPattern}$`);
  return regex.test(filePath);
}

// Helper function to count matches
function countMatches(content: string, search: string): number {
  let count = 0;
  let pos = 0;
  while ((pos = content.indexOf(search, pos)) !== -1) {
    count++;
    pos += search.length;
  }
  return count;
}

// Helper function to create preview
function createPreview(content: string, oldText: string, newText: string): string {
  const index = content.indexOf(oldText);
  if (index === -1) return "";
  
  const start = Math.max(0, index - 30);
  const end = Math.min(content.length, index + oldText.length + 30);
  
  const before = content.substring(start, index);
  const after = content.substring(index + oldText.length, end);
  
  return `...${before}[${oldText} → ${newText}]${after}...`;
}
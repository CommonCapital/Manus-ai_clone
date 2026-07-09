const ROOT = process.cwd();
const BASE_DIR = path.join(ROOT, "public", "deep-agent");
const fs = require("fs");
const path = require("path");
const { z } = require("zod");

export const file_copy = tool(
  async ({ source, destination, overwrite = false }, toolConfig: any) => {
    try {
      const sourcePath = path.resolve(BASE_DIR, source);
      const destPath = path.resolve(BASE_DIR, destination);

      // Prevent path escaping outside BASE_DIR
      if (!sourcePath.startsWith(BASE_DIR) || !destPath.startsWith(BASE_DIR)) {
        throw new Error("Invalid path: outside workspace");
      }

      // Check if source exists
      await fs.promises.access(sourcePath);

      // Check if destination exists (unless overwrite is true)
      if (!overwrite) {
        try {
          await fs.promises.access(destPath);
          return JSON.stringify({
            error: "Destination already exists",
            message: `File already exists at ${destination}. Use overwrite: true to replace it.`,
          });
        } catch (e) {
          // Destination doesn't exist, proceed
        }
      }

      // Get source stats to determine if file or directory
      const stats = await fs.promises.stat(sourcePath);

      if (stats.isDirectory()) {
        // Copy directory recursively
        await copyDirectory(sourcePath, destPath);
      } else {
        // Ensure destination directory exists
        const destDir = path.dirname(destPath);
        await fs.promises.mkdir(destDir, { recursive: true });

        // Copy file
        await fs.promises.copyFile(sourcePath, destPath);
      }

      toolConfig.writer({
        file_copy: "file_copy",
        source,
        destination,
        type: stats.isDirectory() ? "directory" : "file",
      });

      return JSON.stringify({
        message: `Successfully copied ${stats.isDirectory() ? "directory" : "file"} from ${source} to ${destination}`,
        source,
        destination,
        type: stats.isDirectory() ? "directory" : "file",
      });

    } catch (error: any) {
      if (error.code === "ENOENT") {
        return JSON.stringify({
          error: "Source not found",
          message: `Source file/directory does not exist: ${source}`,
        });
      }

      return JSON.stringify({
        error: "Copy failed",
        message: error.message,
      });
    }
  },
  {
    name: "file_copy",
    description: `
Copy a file or directory inside the project workspace.

This tool duplicates files or directories from one location to another within the workspace.

PATH USAGE:
You must provide:
1. Source path (file or directory to copy)
2. Destination path (where to copy to)

Both paths can be:
- Full relative paths: "src/utils/helpers.ts" → "src/utils/helpers-copy.ts"
- Simple filenames: "notes.md" → "notes-backup.md"

DIRECTORY BEHAVIOR:
- Directories are copied recursively (all contents included)
- Destination directory will be created if it doesn't exist

FILE BEHAVIOR:
- If destination file exists, use overwrite: true to replace it
- By default, copy fails if destination already exists (prevents accidental overwrites)
- Parent directories are created automatically

WHEN TO USE:
Use this tool when you need to:
- Create backups of important files
- Duplicate code files for refactoring
- Copy templates or boilerplate code
- Clone directory structures

WHEN NOT TO USE:
- Do not use for moving files (use file_move instead)
- Do not use for renaming (use file_move instead)

BEST PRACTICES:
- Check if destination exists before copying
- Use overwrite: true only when intentionally replacing files
- Use descriptive destination names for backups
`,
    schema: z.object({
      source: z.string().describe(
        "Source file or directory path to copy. Example: 'src/app.ts' or 'templates/'"
      ),
      destination: z.string().describe(
        "Destination path where the copy will be placed. Example: 'src/app-backup.ts' or 'templates-copy/'"
      ),
      overwrite: z.boolean().optional().default(false).describe(
        "If true, overwrite destination if it exists. Default: false (fails if destination exists)"
      ),
    }),
  }
);

// Helper function to copy directories recursively
async function copyDirectory(src: string, dest: string): Promise<void> {
  await fs.promises.mkdir(dest, { recursive: true });
  const entries = await fs.promises.readdir(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      await copyDirectory(srcPath, destPath);
    } else {
      await fs.promises.copyFile(srcPath, destPath);
    }
  }
}
import fs from "fs";
import path from "path";

export async function saveBase64Image(base64String: string): Promise<string> {
  try {
    if (!base64String.startsWith("data:image")) {
      throw new Error("Invalid base64 image format");
    }

    // Extract mime type
    const matches = base64String.match(/^data:image\/(\w+);base64,/);
    const ext = matches?.[1] || "png";

    // Remove base64 prefix
    const base64Data = base64String.replace(/^data:image\/\w+;base64,/, "");

    // Convert to buffer
    const buffer = Buffer.from(base64Data, "base64");

    // Generate filename
    const fileName = `screenshot_${Date.now()}.${ext}`;

    const outputDir = path.join(process.cwd(), "public", "images");

    // Ensure directory exists
    fs.mkdirSync(outputDir, { recursive: true });

    const filePath = path.join(outputDir, fileName);

    // Write file
    fs.writeFileSync(filePath, buffer);

    return fileName;
  } catch (error) {
    console.error("Failed to save image:", error);
    throw error;
  }
}



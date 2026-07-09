
import z from "zod";
import { tool } from "langchain";
import { saveBase64Image } from "../helper/saveBase64Image";

export const SendImageToAgentComputer = tool(
  async ({ imageBase64String }: { imageBase64String: string },toolConfig:any) => {
    try {
      if (!imageBase64String || typeof imageBase64String !== "string") {
        throw new Error("Invalid image name");
      }

       const imageName = await saveBase64Image(imageBase64String);
      

        toolConfig.writer({
          browser_image: "browser_image",
          src:`${process.env.NEXT_PUBLIC_APP_URL}/images/${imageName}`,
        });

      return "image send to agent computer"
    } catch (err: any) {
      return {
        success: false,
        error: err.message,
      };
    }
  },
  {
    name: "SendImageToAgentComputer",
    description: "Send an image to the agent computer by name. If you have multiple images, pass one by one",
    schema: z.object({
      imageBase64String: z
        .string()
        .describe("base64 image string "),
    }),
  }
);
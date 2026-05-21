"use server";

import { GoogleGenAI, Modality } from "@google/genai";
import { cookies } from "next/headers";
import Together from "together-ai";
import { UTFile } from "uploadthing/server";
import { utapi } from "@/app/api/uploadthing/core";
import { env } from "@/env";
import { auth } from "@/server/auth";
import { db } from "@/server/db";

export type ImageModelList = "gemini-3.1-flash-image-preview";

export async function generateImageAction(
  prompt: string,
  _model: ImageModelList = "gemini-3.1-flash-image-preview",
) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("You must be logged in to generate images");
  }

  // Resolve API key — prefer server env, fall back to user-supplied cookie key
  const cookieStore = await cookies();
  const apiKey = env.GEMINI_API_KEY ?? cookieStore.get("gemini_api_key")?.value;

  // Helper to run Together AI fallback
  const runTogetherFallback = async (primaryError: Error) => {
    if (!env.TOGETHER_AI_API_KEY) {
      console.warn("Together AI API Key is not configured for fallback.");
      throw primaryError;
    }

    console.log(
      "Gemini generation failed. Attempting Together AI FLUX fallback...",
    );
    const together = new Together({ apiKey: env.TOGETHER_AI_API_KEY });

    // Generate the image using Together AI Flux Schnell
    const response = (await together.images.create({
      model: "black-forest-labs/FLUX.1-schnell",
      prompt: prompt,
      width: 1024,
      height: 768,
      steps: 4,
      n: 1,
    })) as unknown as {
      data: {
        url: string;
      }[];
    };

    const imageUrl = response.data[0]?.url;
    if (!imageUrl) {
      throw new Error("Together AI did not return a valid image URL.");
    }

    // Download the image
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error("Failed to download image from Together AI");
    }

    const imageBlob = await imageResponse.blob();
    const imageBuffer = await imageBlob.arrayBuffer();

    // Generate a filename
    const filename = `${prompt.substring(0, 24).replace(/[^a-z0-9]/gi, "_")}_${Date.now()}.png`;

    // Upload to UploadThing for a permanent CDN URL
    const utFile = new UTFile([new Uint8Array(imageBuffer)], filename);
    const uploadResult = await utapi.uploadFiles([utFile]);

    if (!uploadResult[0]?.data?.ufsUrl) {
      console.error("Upload error:", uploadResult[0]?.error);
      throw new Error("Failed to upload Together AI fallback image to storage");
    }

    const permanentUrl = uploadResult[0].data.ufsUrl;

    // Persist to DB
    const generatedImage = await db.generatedImage.create({
      data: {
        url: permanentUrl,
        prompt,
        userId: session.user.id,
      },
    });

    return { success: true, image: generatedImage, error: undefined };
  };

  if (!apiKey) {
    // If Gemini key is missing, immediately try Together AI fallback before failing
    try {
      return await runTogetherFallback(
        new Error("Gemini API key is not configured."),
      );
    } catch (fallbackError) {
      throw new Error(
        "Both Gemini and Together AI configurations are missing. Please add a key in Settings.",
      );
    }
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-image-preview",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `Generate a high-quality, visually stunning image for a presentation slide. ${prompt}. Use photorealistic style with professional composition, cinematic lighting, and vibrant colors suitable for a business or educational presentation.`,
            },
          ],
        },
      ],
      config: {
        responseModalities: [Modality.IMAGE, Modality.TEXT],
      },
    });

    // Extract the image part from the response
    const parts = response.candidates?.[0]?.content?.parts ?? [];
    const imagePart = parts.find((p) =>
      p.inlineData?.mimeType?.startsWith("image/"),
    );

    if (!imagePart?.inlineData?.data) {
      throw new Error(
        "Gemini did not return an image. Try a more descriptive prompt.",
      );
    }

    const { mimeType = "image/png", data: base64Data } = imagePart.inlineData;
    const imageBuffer = Buffer.from(base64Data, "base64");

    // Generate a filename
    const ext = mimeType.split("/")[1] ?? "png";
    const filename = `${prompt.substring(0, 24).replace(/[^a-z0-9]/gi, "_")}_${Date.now}.${ext}`;

    // Upload to UploadThing for a permanent CDN URL
    const utFile = new UTFile([new Uint8Array(imageBuffer)], filename);
    const uploadResult = await utapi.uploadFiles([utFile]);

    if (!uploadResult[0]?.data?.ufsUrl) {
      console.error("Upload error:", uploadResult[0]?.error);
      throw new Error("Failed to upload generated image to storage");
    }

    const permanentUrl = uploadResult[0].data.ufsUrl;

    // Persist to DB
    const generatedImage = await db.generatedImage.create({
      data: {
        url: permanentUrl,
        prompt,
        userId: session.user.id,
      },
    });

    return { success: true, image: generatedImage, error: undefined };
  } catch (error) {
    console.error("Error generating image via Gemini:", error);
    try {
      return await runTogetherFallback(
        error instanceof Error ? error : new Error("Gemini generation failed."),
      );
    } catch (fallbackError) {
      return {
        success: false,
        error:
          fallbackError instanceof Error
            ? fallbackError.message
            : "Failed to generate image",
        image: undefined,
      };
    }
  }
}

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";
import {
  verifySessionValue,
  SESSION_COOKIE_NAME,
} from "@/services/session.service";

async function uploadToCloudinary(buffer, file) {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    return null;
  }

  const timestamp = Math.floor(Date.now() / 1000).toString();
  const folder = "billsplit_proofs";

  // Cloudinary signature: parameters in alphabetical order concatenated with secret
  const stringToSign = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
  const signature = crypto.createHash("sha1").update(stringToSign).digest("hex");

  const formData = new FormData();
  const blob = new Blob([buffer], { type: file.type || "application/octet-stream" });
  formData.append("file", blob, file.name || "proof_document");
  formData.append("api_key", apiKey);
  formData.append("timestamp", timestamp);
  formData.append("signature", signature);
  formData.append("folder", folder);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
    method: "POST",
    body: formData,
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error?.message || "Cloudinary upload failed");
  }

  return {
    fileUrl: data.secure_url,
    storedName: data.public_id,
  };
}

export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);
    const userId = verifySessionValue(sessionCookie?.value);

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || typeof file === "string") {
      return NextResponse.json(
        { success: false, message: "No document file uploaded" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 1. Try Cloudinary first if credentials are configured (required for Vercel/serverless)
    const cloudinaryResult = await uploadToCloudinary(buffer, file);
    if (cloudinaryResult) {
      return NextResponse.json({
        success: true,
        fileName: file.name,
        storedName: cloudinaryResult.storedName,
        fileUrl: cloudinaryResult.fileUrl,
      });
    }

    // 2. Fallback to local filesystem (for local development without Cloudinary env vars)
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadsDir, { recursive: true });

    const safeName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const filePath = path.join(uploadsDir, safeName);
    await writeFile(filePath, buffer);

    const fileUrl = `/uploads/${safeName}`;

    return NextResponse.json({
      success: true,
      fileName: file.name,
      storedName: safeName,
      fileUrl,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to upload document" },
      { status: 500 }
    );
  }
}

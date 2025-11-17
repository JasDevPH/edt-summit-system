// FILE: app/api/prereg/upload/route.ts
import { NextRequest, NextResponse } from "next/server";
import { uploadToCloudinary } from "@/lib/utils/cloudinary";

export async function POST(request: NextRequest) {
  try {
    // Get form data
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const folder = (formData.get("folder") as string) || "prereg";
    const resourceType =
      (formData.get("resourceType") as "image" | "raw") || "image";

    // Validate file
    if (!file) {
      return NextResponse.json(
        {
          success: false,
          message: "No file provided",
        },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        {
          success: false,
          message: "File size exceeds 10MB limit",
        },
        { status: 400 }
      );
    }

    // Validate file type for images
    if (resourceType === "image") {
      const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
        "image/gif",
      ];
      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Invalid file type. Only JPEG, PNG, WEBP, and GIF are allowed",
          },
          { status: 400 }
        );
      }
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Cloudinary with prereg prefix
    const fullFolder = `edt-summit/prereg/${folder}`;
    const result = await uploadToCloudinary(buffer, fullFolder, resourceType);

    return NextResponse.json(
      {
        success: true,
        message: "File uploaded successfully",
        url: result.secure_url,
        publicId: result.public_id,
        format: result.format,
        size: result.bytes,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("PreReg upload error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "File upload failed",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

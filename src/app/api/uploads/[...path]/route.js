import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET(request, { params }) {
  try {
    const { path: pathSegments } = params;
    const filePath = Array.isArray(pathSegments)
      ? pathSegments.join("/")
      : pathSegments;

    // Construct the full file path in the uploads directory
    const uploadsPath = path.join(process.cwd(), "public", "uploads", filePath);

    // Security: Check if the path is within uploads directory
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    if (!uploadsPath.startsWith(uploadsDir)) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    // Check if file exists
    if (!fs.existsSync(uploadsPath)) {
      return new NextResponse("File not found", { status: 404 });
    }

    // Read the file
    const fileBuffer = fs.readFileSync(uploadsPath);
    const stats = fs.statSync(uploadsPath);

    // Determine content type based on file extension
    const ext = path.extname(uploadsPath).toLowerCase();
    const contentTypes = {
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".gif": "image/gif",
      ".webp": "image/webp",
      ".svg": "image/svg+xml",
      ".pdf": "application/pdf",
      ".mp4": "video/mp4",
      ".webm": "video/webm",
    };

    const contentType = contentTypes[ext] || "application/octet-stream";

    // Return the file with appropriate headers
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Length": stats.size.toString(),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("Error serving file:", error);
    return new NextResponse("Error serving file", { status: 500 });
  }
}


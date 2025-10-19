import connectDB from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import Project from "@/models/Project";
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { s3 } from "@/lib/s3";
import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { parse as parseUrl } from "url";

export async function POST(req) {
  try {
    await connectDB();

    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json(
        { success: false, message: "توکن نامعتبر یا منقضی شده است" },
        { status: 401 }
      );
    }

    const contentType = req.headers.get("content-type") || "";

    let projectId;
    let objects;
    let uploadedFile;

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      projectId = formData.get("projectId");
      const objectsRaw = formData.get("objects");
      if (objectsRaw) {
        try {
          objects = JSON.parse(objectsRaw);
        } catch (e) {
          return NextResponse.json(
            { success: false, message: "فرمت objects نامعتبر است" },
            { status: 400 }
          );
        }
      }
      const file = formData.get("image");
      if (file && typeof file === "object") {
        uploadedFile = file;
      }
    } else {
      const body = await req.json();
      projectId = body?.projectId;
      objects = body?.objects;
    }

    const project = await Project.findOne({
      _id: projectId,
      user: authUser.userId,
      deletedAt: null,
    });

    if (!project) {
      return NextResponse.json(
        { success: false, message: "پروژه یافت نشد" },
        { status: 404 }
      );
    }

    if (typeof objects !== "undefined") {
      project.objects = objects;
    }

    // helper: extract liara key from a stored URL
    const extractLiaraKey = (urlOrPath) => {
      if (!urlOrPath) return null;
      try {
        if (urlOrPath.startsWith("http")) {
          const parsed = parseUrl(urlOrPath);
          if (parsed && parsed.pathname) {
            const parts = parsed.pathname.split("/").filter(Boolean);
            // اگر مسیر شامل نام باکت است، پس از آن key است
            if (parts.length >= 2 && parts[0] === process.env.LIARA_BUCKET_NAME) {
              return parts.slice(1).join("/");
            } else if (parts.length >= 1 && parts[0] === process.env.LIARA_BUCKET_NAME) {
              return parts.slice(1).join("/");
            } else {
              // fallback: everything بعد از نام دامنه (remove leading slash)
              return parts.join("/");
            }
          }
        } else {
          // local path like /uploads/projects/filename.png
          if (urlOrPath.startsWith("/uploads") || urlOrPath.startsWith("uploads")) {
            return null;
          }
        }
      } catch (e) {
        return null;
      }
      return null;
    };

    // helper: try delete old image (either from Liara or local)
    const tryDeleteOldImage = async (oldImage) => {
      if (!oldImage) return;
      // if local (starts with /uploads) -> delete file from public
      if (oldImage.startsWith("/uploads") || oldImage.startsWith("uploads")) {
        const localPath = path.join(process.cwd(), "public", oldImage.replace(/^\/+/, ""));
        try {
          await fs.promises.unlink(localPath);
        } catch (err) {
          // ignore not found
          console.log("Old local project image not found or couldn't be deleted:", err.message || err);
        }
        return;
      }

      // try extract liara key and delete
      const oldKey = extractLiaraKey(oldImage);
      if (oldKey) {
        try {
          await s3.send(new DeleteObjectCommand({
            Bucket: process.env.LIARA_BUCKET_NAME,
            Key: oldKey,
          }));
        } catch (err) {
          console.log("Failed to delete old object from Liara (might not exist):", err && err.code ? err.code : err);
        }
      }
    };

    if (uploadedFile) {
      // prepare buffer and filename/key
      const arrayBuffer = await uploadedFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // get extension from uploadedFile.name or from mime type fallback
      let ext = "";
      try {
        const originalExt = path.extname(uploadedFile.name || "");
        ext = originalExt || "";
      } catch (e) {
        ext = "";
      }
      if (!ext) {
        // fallback by mime type
        if (uploadedFile.type === "image/png") ext = ".png";
        else if (uploadedFile.type === "image/webp") ext = ".webp";
        else if (uploadedFile.type === "image/jpeg" || uploadedFile.type === "image/jpg") ext = ".jpg";
        else ext = ".png";
      }

      // safe file name based on project.name
      const originalName = project.name || `project-${project._id}`;
      const safeName = String(originalName).replaceAll(/\s+/g, "-");
      const fileName = `${safeName}-${Date.now()}${ext}`;

      // build Liara key
      const key = `projects/${fileName}`;

      // try upload to Liara
      let imageUrl;
      let uploadedToLiara = false;

      try {
        await s3.send(new PutObjectCommand({
          Bucket: process.env.LIARA_BUCKET_NAME,
          Key: key,
          Body: buffer,
          ContentType: uploadedFile.type || "application/octet-stream",
        }));
        const endpoint = (process.env.LIARA_ENDPOINT || "").replace(/\/$/, "");
        imageUrl = `${endpoint}/${process.env.LIARA_BUCKET_NAME}/${key}`;
        uploadedToLiara = true;
      } catch (err) {
        console.error("Liara upload failed:", err && err.code ? err.code : err);
        // fallback: save locally in public/uploads/projects
        try {
          const uploadsDir = path.join(process.cwd(), "public", "uploads", "projects");
          await fs.promises.mkdir(uploadsDir, { recursive: true });
          const localPath = path.join(uploadsDir, fileName);
          await fs.promises.writeFile(localPath, buffer);
          imageUrl = `/uploads/projects/${fileName}`;
        } catch (writeErr) {
          console.error("Failed to write fallback local file:", writeErr && writeErr.message ? writeErr.message : writeErr);
          // اگر نه لیارا و نه دیسک محلی موفق بود، خطا بده
          return NextResponse.json(
            { success: false, message: "خطا هنگام آپلود فایل" },
            { status: 500 }
          );
        }
      }

      // delete old image (try best-effort) قبل از ست کردن مسیر جدید
      try {
        await tryDeleteOldImage(project.image);
      } catch (e) {
        console.log("Error while deleting old project image:", e && e.message ? e.message : e);
      }

      // set new image url (public URL for liara or local path)
      project.image = imageUrl;
    }

    await project.save();

    return NextResponse.json(
      { success: true, message: "تغییرات با موفقیت ذخیره شدند", project },
      { status: 200 }
    );
  } catch (error) {
    console.error("Add object error:", error);
    return NextResponse.json(
      { success: false, message: "خطا هنگام ذخیره تغییرات" },
      { status: 500 }
    );
  }
}

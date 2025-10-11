import connectDB from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import Project from "@/models/Project";
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

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

    if (uploadedFile) {
      const uploadsDir = path.join(process.cwd(), "public", "uploads", "projects");
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      const originalName = project.name
      const safeName = originalName.replaceAll(" ", "-");
      const fileName = `${safeName}-${Date.now()}.png`;
      const filePath = path.join(uploadsDir, fileName);

      const arrayBuffer = await uploadedFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      await fs.promises.writeFile(filePath, buffer);

      project.image = `/uploads/projects/${fileName}`;
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

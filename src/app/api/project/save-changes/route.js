import connectDB from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import Project from "@/models/Project";
import User from "@/models/User";
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

    const requestUser = await User.findById(authUser.userId)
      .select("role canEditUserProjects")
      .lean();

    // Check if project exists and is editable (unless user is admin)
    const projectCheckQuery = {
      _id: projectId,
      deletedAt: null,
    };

    if (requestUser?.role !== "admin") {
      projectCheckQuery.user = authUser.userId;
    }

    const projectCheck = await Project.findOne(projectCheckQuery).select(
      "name"
    );

    if (!projectCheck) {
      return NextResponse.json(
        { success: false, message: "پروژه یافت نشد" },
        { status: 404 }
      );
    }

    // Check if admin has permission to edit user projects
    if (requestUser?.role === "admin") {
      if (!requestUser.canEditUserProjects) {
        return NextResponse.json(
          {
            success: false,
            message: "شما دسترسی ویرایش پروژه‌های کاربران را ندارید",
          },
          { status: 403 }
        );
      }
    }

    const updateData = {};
    if (typeof objects !== "undefined") {
      updateData.objects = objects;
    }

    if (uploadedFile) {
      const uploadsDir = path.join(
        process.cwd(),
        "public",
        "uploads",
        "projects"
      );
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      const originalName = projectCheck.name;
      const safeName = originalName.replaceAll(" ", "-");
      const fileName = `${safeName}-${Date.now()}.png`;
      const filePath = path.join(uploadsDir, fileName);

      const arrayBuffer = await uploadedFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      await fs.promises.writeFile(filePath, buffer);

      updateData.image = `/uploads/projects/${fileName}`;
    }

    const maxRetries = 3;
    let retries = 0;
    let project = null;

    const projectUpdateQuery = {
      _id: projectId,
      deletedAt: null,
    };

    if (requestUser?.role !== "admin") {
      projectUpdateQuery.user = authUser.userId;
    }

    while (retries < maxRetries && !project) {
      try {
        project = await Project.findOneAndUpdate(
          projectUpdateQuery,
          { $set: updateData },
          { new: true, runValidators: true }
        );

        if (!project) {
          return NextResponse.json(
            { success: false, message: "پروژه یافت نشد" },
            { status: 404 }
          );
        }
      } catch (error) {
        if (error.name === "VersionError" && retries < maxRetries - 1) {
          retries++;
          await new Promise((resolve) => setTimeout(resolve, 100 * retries));
        } else {
          throw error;
        }
      }
    }

    if (!project) {
      return NextResponse.json(
        { success: false, message: "خطا هنگام ذخیره تغییرات" },
        { status: 500 }
      );
    }

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

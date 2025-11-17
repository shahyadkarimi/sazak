import { getAuthUser } from "@/lib/auth";
import connectDB from "@/lib/db";
import User from "@/models/User";
import Part from "@/models/Part";
import Category from "@/models/Category";
import { NextResponse } from "next/server";
import { writeFile, unlink, mkdir } from "fs/promises";
import path from "path";
import fs from "fs";

export async function PUT(req, { params }) {
  try {
    await connectDB();

    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json(
        { success: false, message: "توکن نامعتبر یا منقضی شده است" },
        { status: 401 }
      );
    }

    const requester = await User.findById(authUser.userId).lean();
    if (!requester || requester.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "دسترسی غیرمجاز" },
        { status: 403 }
      );
    }

    const { id } = params;
    const formData = await req.formData();
    const name = formData.get("name");
    const categoryId = formData.get("category");
    const length = formData.get("length");
    const width = formData.get("width");
    const height = formData.get("height");
    const noColor = formData.get("noColor") === "true";
    const file = formData.get("glbFile");
    const thumbnailFile = formData.get("thumbnailFile");

    const part = await Part.findOne({
      _id: id,
      deletedAt: null,
    });

    if (!part) {
      return NextResponse.json(
        { success: false, message: "قطعه یافت نشد" },
        { status: 404 }
      );
    }

    if (name && name.trim() !== "") {
      part.name = name.trim();
    }

    if (length !== null && length !== undefined && length !== "") {
      part.length = parseFloat(length) || null;
    }

    if (width !== null && width !== undefined && width !== "") {
      part.width = parseFloat(width) || null;
    }

    if (height !== null && height !== undefined && height !== "") {
      part.height = parseFloat(height) || null;
    }

    part.noColor = noColor;

    if (categoryId) {
      const category = await Category.findOne({
        _id: categoryId,
        deletedAt: null,
      });

      if (!category) {
        return NextResponse.json(
          { success: false, message: "دسته‌بندی یافت نشد" },
          { status: 404 }
        );
      }

      part.category = categoryId;
    }

    if (file && typeof file !== "string") {
      if (file.type !== "model/gltf-binary" && !file.name.endsWith(".glb")) {
        return NextResponse.json(
          {
            success: false,
            message: "فرمت فایل نامعتبر است. فقط فایل‌های GLB مجاز است",
          },
          { status: 400 }
        );
      }

      const oldFilePath = path.join(process.cwd(), "public", part.glbPath);
      if (fs.existsSync(oldFilePath)) {
        try {
          await unlink(oldFilePath);
        } catch (e) {
          console.error("Error deleting old file:", e);
        }
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const uploadsDir = path.join(process.cwd(), "public", "uploads", "parts");
      if (!fs.existsSync(uploadsDir)) {
        await mkdir(uploadsDir, { recursive: true });
      }

      const fileExtension = path.extname(file.name);
      const safeName = (name || part.name).trim().replace(/[^a-zA-Z0-9]/g, "-");
      const fileName = `${safeName}-${Date.now()}${fileExtension}`;
      const filePath = path.join(uploadsDir, fileName);

      await writeFile(filePath, buffer);

      part.glbPath = `/uploads/parts/${fileName}`;
    }

    if (thumbnailFile && typeof thumbnailFile !== "string") {
      const oldThumbnailPath = part.thumbnailPath
        ? path.join(process.cwd(), "public", part.thumbnailPath)
        : null;
      if (oldThumbnailPath && fs.existsSync(oldThumbnailPath)) {
        try {
          await unlink(oldThumbnailPath);
        } catch (e) {
          console.error("Error deleting old thumbnail:", e);
        }
      }

      const thumbnailBytes = await thumbnailFile.arrayBuffer();
      const thumbnailBuffer = Buffer.from(thumbnailBytes);

      const thumbnailsDir = path.join(process.cwd(), "public", "uploads", "thumbnails");
      if (!fs.existsSync(thumbnailsDir)) {
        await mkdir(thumbnailsDir, { recursive: true });
      }

      const thumbnailFileName = `thumb-${Date.now()}.png`;
      const thumbnailFilePath = path.join(thumbnailsDir, thumbnailFileName);
      await writeFile(thumbnailFilePath, thumbnailBuffer);
      part.thumbnailPath = `/uploads/thumbnails/${thumbnailFileName}`;
    }

    await part.save();

    const partWithCategory = await Part.findById(part._id)
      .populate({ path: "category", select: "name" })
      .lean();

    return NextResponse.json(
      {
        success: true,
        part: {
          id: partWithCategory._id,
          name: partWithCategory.name,
          category: {
            id: partWithCategory.category?._id,
            name: partWithCategory.category?.name || "",
          },
          glbPath: partWithCategory.glbPath,
          thumbnailPath: partWithCategory.thumbnailPath,
          length: partWithCategory.length,
          width: partWithCategory.width,
          height: partWithCategory.height,
          noColor: partWithCategory.noColor || false,
          createdAt: partWithCategory.createdAt,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Admin update part error:", error);
    return NextResponse.json(
      { success: false, message: "خطا هنگام به‌روزرسانی قطعه" },
      { status: 500 }
    );
  }
}

export async function DELETE(req, { params }) {
  try {
    await connectDB();

    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json(
        { success: false, message: "توکن نامعتبر یا منقضی شده است" },
        { status: 401 }
      );
    }

    const requester = await User.findById(authUser.userId).lean();
    if (!requester || requester.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "دسترسی غیرمجاز" },
        { status: 403 }
      );
    }

    const { id } = params;

    const part = await Part.findOne({
      _id: id,
      deletedAt: null,
    });

    if (!part) {
      return NextResponse.json(
        { success: false, message: "قطعه یافت نشد" },
        { status: 404 }
      );
    }

    const filePath = path.join(process.cwd(), "public", part.glbPath);
    if (fs.existsSync(filePath)) {
      try {
        await unlink(filePath);
      } catch (e) {
        console.error("Error deleting file:", e);
      }
    }

    if (part.thumbnailPath) {
      const thumbnailFilePath = path.join(process.cwd(), "public", part.thumbnailPath);
      if (fs.existsSync(thumbnailFilePath)) {
        try {
          await unlink(thumbnailFilePath);
        } catch (e) {
          console.error("Error deleting thumbnail:", e);
        }
      }
    }

    part.deletedAt = new Date();
    await part.save();

    return NextResponse.json(
      { success: true, message: "قطعه با موفقیت حذف شد" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Admin delete part error:", error);
    return NextResponse.json(
      { success: false, message: "خطا هنگام حذف قطعه" },
      { status: 500 }
    );
  }
}


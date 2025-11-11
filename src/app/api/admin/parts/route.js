import { getAuthUser } from "@/lib/auth";
import connectDB from "@/lib/db";
import User from "@/models/User";
import Part from "@/models/Part";
import Category from "@/models/Category";
import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import fs from "fs";

export async function GET(req) {
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

    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get("category");

    const query = { deletedAt: null };
    if (categoryId) {
      query.category = categoryId;
    }

    const parts = await Part.find(query)
      .populate({ path: "category", select: "name" })
      .sort({ createdAt: -1 })
      .lean();

    const mapped = parts.map((p) => ({
      id: p._id,
      name: p.name,
      category: {
        id: p.category?._id,
        name: p.category?.name || "",
      },
      glbPath: p.glbPath,
      width: p.width,
      height: p.height,
      createdAt: p.createdAt,
    }));

    return NextResponse.json(
      { success: true, parts: mapped },
      { status: 200 }
    );
  } catch (error) {
    console.error("Admin parts list error:", error);
    return NextResponse.json(
      { success: false, message: "خطا هنگام دریافت لیست قطعات" },
      { status: 500 }
    );
  }
}

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

    const requester = await User.findById(authUser.userId).lean();
    if (!requester || requester.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "دسترسی غیرمجاز" },
        { status: 403 }
      );
    }

    const formData = await req.formData();
    const name = formData.get("name");
    const categoryId = formData.get("category");
    const width = formData.get("width");
    const height = formData.get("height");
    const file = formData.get("glbFile");

    if (!name || name.trim() === "") {
      return NextResponse.json(
        { success: false, message: "نام قطعه الزامی است" },
        { status: 400 }
      );
    }

    if (!categoryId) {
      return NextResponse.json(
        { success: false, message: "دسته‌بندی الزامی است" },
        { status: 400 }
      );
    }

    if (!file || typeof file === "string") {
      return NextResponse.json(
        { success: false, message: "فایل GLB الزامی است" },
        { status: 400 }
      );
    }

    if (file.type !== "model/gltf-binary" && !file.name.endsWith(".glb")) {
      return NextResponse.json(
        {
          success: false,
          message: "فرمت فایل نامعتبر است. فقط فایل‌های GLB مجاز است",
        },
        { status: 400 }
      );
    }

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

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadsDir = path.join(process.cwd(), "public", "uploads", "parts");
    if (!fs.existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    const fileExtension = path.extname(file.name);
    const fileName = `${Date.now()}${fileExtension}`;
    const filePath = path.join(uploadsDir, fileName);

    await writeFile(filePath, buffer);

    const glbPath = `/uploads/parts/${fileName}`;

    const newPart = new Part({
      name: name.trim(),
      category: categoryId,
      glbPath,
      width: width ? parseFloat(width) : null,
      height: height ? parseFloat(height) : null,
    });

    await newPart.save();

    const partWithCategory = await Part.findById(newPart._id)
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
          width: partWithCategory.width,
          height: partWithCategory.height,
          createdAt: partWithCategory.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Admin create part error:", error);
    return NextResponse.json(
      { success: false, message: "خطا هنگام ایجاد قطعه" },
      { status: 500 }
    );
  }
}


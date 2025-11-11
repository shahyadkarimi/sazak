import { getAuthUser } from "@/lib/auth";
import connectDB from "@/lib/db";
import User from "@/models/User";
import Category from "@/models/Category";
import Part from "@/models/Part";
import { NextResponse } from "next/server";

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
    const body = await req.json();
    const { name, description } = body;

    if (!name || name.trim() === "") {
      return NextResponse.json(
        { success: false, message: "نام دسته‌بندی الزامی است" },
        { status: 400 }
      );
    }

    const category = await Category.findOne({
      _id: id,
      deletedAt: null,
    });

    if (!category) {
      return NextResponse.json(
        { success: false, message: "دسته‌بندی یافت نشد" },
        { status: 404 }
      );
    }

    const existingCategory = await Category.findOne({
      name: name.trim(),
      _id: { $ne: id },
      deletedAt: null,
    });

    if (existingCategory) {
      return NextResponse.json(
        { success: false, message: "دسته‌بندی با این نام قبلاً وجود دارد" },
        { status: 400 }
      );
    }

    category.name = name.trim();
    category.description = description || null;
    await category.save();

    return NextResponse.json(
      {
        success: true,
        category: {
          id: category._id,
          name: category.name,
          description: category.description || "",
          createdAt: category.createdAt,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Admin update category error:", error);
    return NextResponse.json(
      { success: false, message: "خطا هنگام به‌روزرسانی دسته‌بندی" },
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

    const category = await Category.findOne({
      _id: id,
      deletedAt: null,
    });

    if (!category) {
      return NextResponse.json(
        { success: false, message: "دسته‌بندی یافت نشد" },
        { status: 404 }
      );
    }

    const partsCount = await Part.countDocuments({
      category: id,
      deletedAt: null,
    });

    if (partsCount > 0) {
      return NextResponse.json(
        {
          success: false,
          message: `نمی‌توان این دسته‌بندی را حذف کرد زیرا ${partsCount} قطعه به آن مرتبط است`,
        },
        { status: 400 }
      );
    }

    category.deletedAt = new Date();
    await category.save();

    return NextResponse.json(
      { success: true, message: "دسته‌بندی با موفقیت حذف شد" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Admin delete category error:", error);
    return NextResponse.json(
      { success: false, message: "خطا هنگام حذف دسته‌بندی" },
      { status: 500 }
    );
  }
}


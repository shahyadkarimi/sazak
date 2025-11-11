import { getAuthUser } from "@/lib/auth";
import connectDB from "@/lib/db";
import User from "@/models/User";
import Category from "@/models/Category";
import { NextResponse } from "next/server";

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

    const categories = await Category.find({
      deletedAt: null,
    })
      .sort({ createdAt: -1 })
      .lean();

    const mapped = categories.map((c) => ({
      id: c._id,
      name: c.name,
      description: c.description || "",
      createdAt: c.createdAt,
    }));

    return NextResponse.json(
      { success: true, categories: mapped },
      { status: 200 }
    );
  } catch (error) {
    console.error("Admin categories list error:", error);
    return NextResponse.json(
      { success: false, message: "خطا هنگام دریافت لیست دسته‌بندی‌ها" },
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

    const body = await req.json();
    const { name, description } = body;

    if (!name || name.trim() === "") {
      return NextResponse.json(
        { success: false, message: "نام دسته‌بندی الزامی است" },
        { status: 400 }
      );
    }

    const existingCategory = await Category.findOne({
      name: name.trim(),
      deletedAt: null,
    });

    if (existingCategory) {
      return NextResponse.json(
        { success: false, message: "دسته‌بندی با این نام قبلاً وجود دارد" },
        { status: 400 }
      );
    }

    const newCategory = new Category({
      name: name.trim(),
      description: description || null,
    });

    await newCategory.save();

    return NextResponse.json(
      {
        success: true,
        category: {
          id: newCategory._id,
          name: newCategory.name,
          description: newCategory.description || "",
          createdAt: newCategory.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Admin create category error:", error);
    return NextResponse.json(
      { success: false, message: "خطا هنگام ایجاد دسته‌بندی" },
      { status: 500 }
    );
  }
}


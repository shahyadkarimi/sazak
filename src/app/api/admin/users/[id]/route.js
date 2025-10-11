import { getAuthUser } from "@/lib/auth";
import connectDB from "@/lib/db";
import User from "@/models/User";
import { NextResponse } from "next/server";
import { validateUserUpdate } from "@/lib/validation";

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

    // Validate input
    const validation = validateUserUpdate(body);
    if (!validation.isValid) {
      return NextResponse.json(
        { success: false, message: validation.message },
        { status: 400 }
      );
    }

    const user = await User.findOne({ 
      _id: id,
      deletedAt: null,
      isDeleted: { $ne: true }
    });
    if (!user) {
      return NextResponse.json(
        { success: false, message: "کاربر یافت نشد" },
        { status: 404 }
      );
    }

    // Update user fields
    const updateData = {};
    if (body.name) updateData.name = body.name;
    if (body.familyName) updateData.familyName = body.familyName;
    if (body.phoneNumber) updateData.phoneNumber = body.phoneNumber;
    if (body.role) updateData.role = body.role;
    if (typeof body.isActive === "boolean") updateData.isActive = body.isActive;

    await User.findByIdAndUpdate(id, updateData);

    const updatedUser = await User.findById(id)
      .select("_id name familyName phoneNumber role isActive createdAt")
      .lean();

    return NextResponse.json(
      {
        success: true,
        message: "کاربر با موفقیت به‌روزرسانی شد",
        user: {
          id: updatedUser._id,
          name: updatedUser.name,
          familyName: updatedUser.familyName,
          fullName: `${updatedUser.name} ${updatedUser.familyName}`,
          phoneNumber: updatedUser.phoneNumber,
          role: updatedUser.role,
          isActive: updatedUser.isActive,
          createdAt: updatedUser.createdAt,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Admin user update error:", error);
    return NextResponse.json(
      { success: false, message: "خطا هنگام به‌روزرسانی کاربر" },
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

    // Prevent admin from deleting themselves
    if (id === authUser.userId) {
      return NextResponse.json(
        { success: false, message: "نمی‌توانید خودتان را حذف کنید" },
        { status: 400 }
      );
    }

    const user = await User.findOne({ 
      _id: id,
      deletedAt: null,
      isDeleted: { $ne: true }
    });
    if (!user) {
      return NextResponse.json(
        { success: false, message: "کاربر یافت نشد" },
        { status: 404 }
      );
    }

    // Soft delete by setting deletedAt
    await User.findByIdAndUpdate(id, { 
      deletedAt: new Date(),
      isDeleted: true 
    });

    return NextResponse.json(
      { success: true, message: "کاربر با موفقیت حذف شد" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Admin user delete error:", error);
    return NextResponse.json(
      { success: false, message: "خطا هنگام حذف کاربر" },
      { status: 500 }
    );
  }
}

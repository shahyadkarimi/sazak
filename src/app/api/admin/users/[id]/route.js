import { getAuthUser } from "@/lib/auth";
import connectDB from "@/lib/db";
import User from "@/models/User";
import { NextResponse } from "next/server";
import { validateUserUpdate } from "@/lib/validation";
import { createLog, LogActions } from "@/lib/logger";
import bcrypt from "bcryptjs";

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

    const requester = await User.findById(authUser.userId)
      .select("name familyName phoneNumber role")
      .lean();
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
    const updatedFields = {};
    if (body.name) {
      user.name = body.name;
      updatedFields.name = body.name;
    }
    if (body.familyName) {
      user.familyName = body.familyName;
      updatedFields.familyName = body.familyName;
    }
    if (body.phoneNumber) {
      user.phoneNumber = body.phoneNumber;
      updatedFields.phoneNumber = body.phoneNumber;
    }
    if (body.role) {
      user.role = body.role;
      updatedFields.role = body.role;
    }
    if (typeof body.isActive === "boolean") {
      user.isActive = body.isActive;
      updatedFields.isActive = body.isActive;
    }
    if (body.email !== undefined) {
      const normalized = body.email === "" ? null : body.email;
      user.email = normalized;
      updatedFields.email = normalized;
    }
    if (body.address !== undefined) {
      const normalized = body.address === "" ? null : body.address;
      user.address = normalized;
      updatedFields.address = normalized;
    }
    if (body.province !== undefined) {
      const normalized = body.province === "" ? null : body.province;
      user.province = normalized;
      updatedFields.province = normalized;
    }
    if (body.city !== undefined) {
      const normalized = body.city === "" ? null : body.city;
      user.city = normalized;
      updatedFields.city = normalized;
    }
    if (body.birthDate !== undefined) {
      const normalized = body.birthDate === "" ? null : body.birthDate;
      user.birthDate = normalized;
      updatedFields.birthDate = normalized;
    }
    if (body.password && body.password.trim() !== "") {
      user.password = await bcrypt.hash(body.password, 10);
      updatedFields.passwordChanged = true;
    }

    await user.save();

    const updatedUser = await User.findById(id)
      .select(
        "_id name familyName phoneNumber role isActive createdAt email address province city birthDate profilePicture"
      )
      .lean();

    await createLog(LogActions.ADMIN_USER_UPDATE, {
      performedBy: {
        userId: requester._id,
        name: requester.name,
        familyName: requester.familyName,
        phoneNumber: requester.phoneNumber,
        role: requester.role,
      },
      target: {
        type: "user",
        userId: updatedUser._id.toString(),
        phoneNumber: updatedUser.phoneNumber,
      },
      metadata: {
        updatedFields,
      },
      request: req,
    });

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
          email: updatedUser.email ?? "",
          address: updatedUser.address ?? "",
          province: updatedUser.province ?? "",
          city: updatedUser.city ?? "",
          birthDate: updatedUser.birthDate ?? "",
          profilePicture: updatedUser.profilePicture ?? "",
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

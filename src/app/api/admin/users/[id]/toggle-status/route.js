import { getAuthUser } from "@/lib/auth";
import connectDB from "@/lib/db";
import User from "@/models/User";
import { NextResponse } from "next/server";
import { createLog, LogActions } from "@/lib/logger";

export async function PATCH(req, { params }) {
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
    const { isActive } = body;

    if (typeof isActive !== "boolean") {
      return NextResponse.json(
        { success: false, message: "وضعیت نامعتبر است" },
        { status: 400 }
      );
    }

    // Prevent admin from deactivating themselves
    if (id === authUser.userId && !isActive) {
      return NextResponse.json(
        { success: false, message: "نمی‌توانید خودتان را غیرفعال کنید" },
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

    await User.findByIdAndUpdate(id, { isActive });

    await createLog(LogActions.ADMIN_USER_TOGGLE_STATUS, {
      performedBy: {
        userId: requester._id,
        name: requester.name,
        familyName: requester.familyName,
        phoneNumber: requester.phoneNumber,
        role: requester.role,
      },
      target: {
        type: "user",
        userId: user._id.toString(),
        phoneNumber: user.phoneNumber,
      },
      metadata: {
        isActive,
      },
      request: req,
    });

    return NextResponse.json(
      {
        success: true,
        message: `کاربر ${isActive ? "فعال" : "غیرفعال"} شد`,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Admin user toggle status error:", error);
    return NextResponse.json(
      { success: false, message: "خطا هنگام تغییر وضعیت کاربر" },
      { status: 500 }
    );
  }
}

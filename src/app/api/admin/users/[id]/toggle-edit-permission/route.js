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

    const user = await User.findOne({
      _id: id,
      deletedAt: null,
      isDeleted: { $ne: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "کاربر یافت نشد" },
        { status: 404 }
      );
    }

    // Only allow for admin users
    if (user.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "این دسترسی فقط برای ادمین‌ها قابل تنظیم است" },
        { status: 400 }
      );
    }

    // Toggle canEditUserProjects
    const newCanEditUserProjects = !user.canEditUserProjects;
    await User.findByIdAndUpdate(id, {
      canEditUserProjects: newCanEditUserProjects,
    });

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
        userId: user._id.toString(),
        phoneNumber: user.phoneNumber,
      },
      metadata: {
        updatedFields: {
          canEditUserProjects: newCanEditUserProjects,
        },
      },
      request: req,
    });

    return NextResponse.json(
      {
        success: true,
        message: newCanEditUserProjects
          ? "دسترسی ویرایش پروژه‌های کاربران فعال شد"
          : "دسترسی ویرایش پروژه‌های کاربران غیرفعال شد",
        canEditUserProjects: newCanEditUserProjects,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Admin user toggle edit permission error:", error);
    return NextResponse.json(
      { success: false, message: "خطا هنگام تغییر دسترسی ویرایش" },
      { status: 500 }
    );
  }
}

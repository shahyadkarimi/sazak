import { getAuthUser } from "@/lib/auth";
import connectDB from "@/lib/db";
import User from "@/models/User";
import Project from "@/models/Project";
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
      .select("role canEditUserProjects")
      .lean();
    if (!requester || requester.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "دسترسی غیرمجاز" },
        { status: 403 }
      );
    }

    // Check if admin has permission to edit user projects
    if (!requester.canEditUserProjects) {
      return NextResponse.json(
        { success: false, message: "شما دسترسی ویرایش پروژه‌های کاربران را ندارید" },
        { status: 403 }
      );
    }

    const { id } = params;

    const project = await Project.findById(id);
    if (!project) {
      return NextResponse.json(
        { success: false, message: "پروژه یافت نشد" },
        { status: 404 }
      );
    }

    // Toggle isEditable
    const newIsEditable = !project.isEditable;
    await Project.findByIdAndUpdate(id, { isEditable: newIsEditable });

    await createLog(LogActions.PROJECT_UPDATE, {
      performedBy: {
        userId: requester._id,
        name: requester.name,
        familyName: requester.familyName,
        phoneNumber: requester.phoneNumber,
        role: requester.role,
      },
      target: {
        type: "project",
        projectId: project._id.toString(),
        ownerId: project.user?.toString?.(),
        name: project.name,
      },
      metadata: {
        updatedFields: {
          isEditable: newIsEditable,
        },
      },
      request: req,
    });

    return NextResponse.json(
      {
        success: true,
        message: newIsEditable
          ? "دسترسی ویرایش فعال شد"
          : "دسترسی ویرایش غیرفعال شد",
        isEditable: newIsEditable,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Admin project toggle edit error:", error);
    return NextResponse.json(
      { success: false, message: "خطا هنگام تغییر دسترسی ویرایش" },
      { status: 500 }
    );
  }
}

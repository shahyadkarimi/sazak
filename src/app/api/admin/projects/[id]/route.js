import { getAuthUser } from "@/lib/auth";
import connectDB from "@/lib/db";
import User from "@/models/User";
import Project from "@/models/Project";
import { NextResponse } from "next/server";
import { createLog, LogActions } from "@/lib/logger";

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

    const project = await Project.findById(id);
    if (!project) {
      return NextResponse.json(
        { success: false, message: "پروژه یافت نشد" },
        { status: 404 }
      );
    }

    // Soft delete by setting deletedAt
    const deletedAt = new Date();
    await Project.findByIdAndUpdate(id, { 
      deletedAt,
      isDeleted: true 
    });

    await createLog(LogActions.ADMIN_PROJECT_DELETE, {
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
        deletedAt,
      },
      request: req,
    });

    return NextResponse.json(
      { success: true, message: "پروژه با موفقیت حذف شد" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Admin project delete error:", error);
    return NextResponse.json(
      { success: false, message: "خطا هنگام حذف پروژه" },
      { status: 500 }
    );
  }
}

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

    const requester = await User.findById(authUser.userId).lean();
    if (!requester || requester.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "دسترسی غیرمجاز" },
        { status: 403 }
      );
    }

    const { id } = params;
    const body = await req.json();
    const { name, isPublic } = body;

    const project = await Project.findById(id);
    if (!project) {
      return NextResponse.json(
        { success: false, message: "پروژه یافت نشد" },
        { status: 404 }
      );
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (typeof isPublic === "boolean") updateData.isPublic = isPublic;

    await Project.findByIdAndUpdate(id, updateData);

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
      },
      metadata: {
        updatedFields: updateData,
      },
      request: req,
    });

    return NextResponse.json(
      {
        success: true,
        message: "پروژه با موفقیت به‌روزرسانی شد",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Admin project update error:", error);
    return NextResponse.json(
      { success: false, message: "خطا هنگام به‌روزرسانی پروژه" },
      { status: 500 }
    );
  }
}

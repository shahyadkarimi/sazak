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

    const requester = await User.findById(authUser.userId)
      .select("role _id")
      .lean();
    
    if (!requester) {
      return NextResponse.json(
        { success: false, message: "کاربر یافت نشد" },
        { status: 403 }
      );
    }

    const { id } = params;

    const project = await Project.findById(id)
      .populate({ path: "user", select: "coach" })
      .lean();
    
    if (!project) {
      return NextResponse.json(
        { success: false, message: "پروژه یافت نشد" },
        { status: 404 }
      );
    }

    // Check permissions: only admin can delete projects
    if (requester.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "فقط ادمین می‌تواند پروژه‌ها را حذف کند" },
        { status: 403 }
      );
    }

    // Get full requester info for logging
    const requesterFull = await User.findById(authUser.userId)
      .select("name familyName phoneNumber role")
      .lean();

    // Soft delete by setting deletedAt
    const deletedAt = new Date();
    await Project.findByIdAndUpdate(id, { 
      deletedAt,
      isDeleted: true 
    });

    await createLog(LogActions.ADMIN_PROJECT_DELETE, {
      performedBy: {
        userId: requesterFull._id,
        name: requesterFull.name,
        familyName: requesterFull.familyName,
        phoneNumber: requesterFull.phoneNumber,
        role: requesterFull.role,
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

    const requester = await User.findById(authUser.userId)
      .select("role _id")
      .lean();
    
    if (!requester) {
      return NextResponse.json(
        { success: false, message: "کاربر یافت نشد" },
        { status: 403 }
      );
    }

    const { id } = params;
    const body = await req.json();
    const { name, isPublic } = body;

    const project = await Project.findById(id)
      .populate({ path: "user", select: "coach" })
      .lean();
    
    if (!project) {
      return NextResponse.json(
        { success: false, message: "پروژه یافت نشد" },
        { status: 404 }
      );
    }

    // Check permissions: admin can edit all, coach can edit their users' projects
    let hasPermission = false;
    if (requester.role === "admin") {
      hasPermission = true;
    } else if (requester.role === "coach") {
      // Check if the project owner has this coach assigned
      const projectOwner = project.user;
      if (projectOwner && projectOwner.coach && projectOwner.coach.toString() === requester._id.toString()) {
        hasPermission = true;
      }
    }

    if (!hasPermission) {
      return NextResponse.json(
        { success: false, message: "شما دسترسی ویرایش این پروژه را ندارید" },
        { status: 403 }
      );
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (typeof isPublic === "boolean") updateData.isPublic = isPublic;

    await Project.findByIdAndUpdate(id, updateData);
    
    // Convert project to regular object for logging
    const projectObj = await Project.findById(id).lean();

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
        projectId: projectObj._id.toString(),
        ownerId: projectObj.user?.toString?.() || project.user?._id?.toString() || project.user?.toString(),
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

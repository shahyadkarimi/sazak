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
      .select("role _id name familyName phoneNumber")
      .lean();
    
    if (!requester) {
      return NextResponse.json(
        { success: false, message: "کاربر یافت نشد" },
        { status: 403 }
      );
    }

    // Check if user is a coach
    if (requester.role !== "coach") {
      return NextResponse.json(
        { success: false, message: "دسترسی غیرمجاز" },
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

    // Check if the project owner has this coach assigned
    const projectOwner = project.user;
    if (!projectOwner || !projectOwner.coach || projectOwner.coach.toString() !== requester._id.toString()) {
      return NextResponse.json(
        { success: false, message: "شما دسترسی ویرایش این پروژه را ندارید" },
        { status: 403 }
      );
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (typeof isPublic === "boolean") updateData.isPublic = isPublic;

    await Project.findByIdAndUpdate(id, updateData);
    
    // Get updated project for logging
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
    console.error("Coach project update error:", error);
    return NextResponse.json(
      { success: false, message: "خطا هنگام به‌روزرسانی پروژه" },
      { status: 500 }
    );
  }
}


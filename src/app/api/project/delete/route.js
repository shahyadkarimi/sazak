import { getAuthUser } from "@/lib/auth";
import connectDB from "@/lib/db";
import Project from "@/models/Project";
import { NextResponse } from "next/server";
import { createLog, LogActions } from "@/lib/logger";

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

    const body = await req.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, message: "ID پروژه الزامی است" },
        { status: 400 }
      );
    }

    const project = await Project.findOne({ _id: id, user: authUser.userId });

    if (!project) {
      return NextResponse.json(
        { success: false, message: "پروژه یافت نشد یا متعلق به شما نیست" },
        { status: 404 }
      );
    }

    project.deletedAt = new Date();
    await project.save();

    await createLog(LogActions.PROJECT_DELETE, {
      performedBy: {
        userId: authUser.userId,
      },
      target: {
        type: "project",
        projectId: project._id.toString(),
        ownerId: authUser.userId,
        name: project.name,
      },
      metadata: {
        deletedAt: project.deletedAt,
      },
      request: req,
    });

    return NextResponse.json(
      { success: true, message: "پروژه با موفقیت حذف شد" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Delete project error:", error);
    return NextResponse.json(
      { success: false, message: "خطا هنگام حذف پروژه" },
      { status: 500 }
    );
  }
}

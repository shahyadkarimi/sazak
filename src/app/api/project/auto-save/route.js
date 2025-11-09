import { getAuthUser } from "@/lib/auth";
import connectDB from "@/lib/db";
import Project from "@/models/Project";
import { NextResponse } from "next/server";
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

    // Toggle autoSave
    project.autoSave = !project.autoSave;
    await project.save();

    return NextResponse.json(
      {
        success: true,
        message: `autoSave با موفقیت به ${project.autoSave} تغییر کرد`,
        autoSave: project.autoSave,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Toggle autoSave error:", error);
    return NextResponse.json(
      { success: false, message: "خطا هنگام تغییر autoSave" },
      { status: 500 }
    );
  }
}

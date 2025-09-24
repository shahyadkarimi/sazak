import connectDB from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
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

    const { projectId, objects } = body;

    const project = await Project.findOne({
      _id: projectId,
      user: authUser.userId,
      deletedAt: null,
    });

    if (!project) {
      return NextResponse.json(
        { success: false, message: "پروژه یافت نشد" },
        { status: 404 }
      );
    }

    project.objects = objects;

    await project.save();

    return NextResponse.json(
      { success: true, message: "تغییرات با موفقیت ذخیره شدند", project },
      { status: 200 }
    );
  } catch (error) {
    console.error("Add object error:", error);
    return NextResponse.json(
      { success: false, message: "خطا هنگام ذخیره تغییرات" },
      { status: 500 }
    );
  }
}

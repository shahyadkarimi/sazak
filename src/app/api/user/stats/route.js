import { getAuthUser } from "@/lib/auth";
import connectDB from "@/lib/db";
import User from "@/models/User";
import Project from "@/models/Project";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    await connectDB();

    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json(
        { success: false, message: "توکن نامعتبر یا منقضی شده است" },
        { status: 401 }
      );
    }

    const user = await User.findById(authUser.userId).lean();
    if (!user) {
      return NextResponse.json(
        { success: false, message: "کاربر یافت نشد" },
        { status: 404 }
      );
    }

    const projects = await Project.find({
      user: user._id,
      deletedAt: null,
    }).lean();

    const projectCount = projects.length;

    const totalObjects = projects.reduce(
      (acc, project) => acc + (project.objects?.length || 0),
      0
    );

    return NextResponse.json(
      {
        success: true,
        stats: {
          projectCount,
          totalObjects,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("User stats error:", error);
    return NextResponse.json(
      { success: false, message: "خطا هنگام دریافت آمار کاربر" },
      { status: 500 }
    );
  }
}

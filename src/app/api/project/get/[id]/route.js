import connectDB from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import Project from "@/models/Project";
import User from "@/models/User";
import { NextResponse } from "next/server";

export async function GET(req, { params }) {
  try {
    await connectDB();

    const authUser = await getAuthUser(req);

    if (!authUser) {
      return NextResponse.json(
        { success: false, message: "توکن نامعتبر یا منقضی شده است" },
        { status: 401 }
      );
    }

    const { id } = params;

    const requestUser = await User.findById(authUser.userId)
      .select("role")
      .lean();

    const projectQuery = { _id: id };

    if (requestUser?.role !== "admin") {
      projectQuery.user = authUser.userId;
    }

    const project = await Project.findOne(projectQuery).select("-__v -user");

    if (!project) {
      return NextResponse.json(
        { success: false, message: "پروژه یافت نشد" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, project }, { status: 200 });
  } catch (error) {
    console.error("Get project error:", error);
    return NextResponse.json(
      { success: false, message: "خطا هنگام دریافت پروژه" },
      { status: 500 }
    );
  }
}

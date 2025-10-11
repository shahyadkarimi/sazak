import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import User from "@/models/User";
import Project from "@/models/Project";

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

    const requester = await User.findById(authUser.userId).lean();
    if (!requester || requester.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "دسترسی غیرمجاز" },
        { status: 403 }
      );
    }

    const projects = await Project.find({ deletedAt: null })
      .select("_id name user createdAt objects image isPublic")
      .populate({ path: "user", select: "name familyName phoneNumber" })
      .sort({ createdAt: -1 })
      .lean();

    const totalProjects = await Project.countDocuments({ deletedAt: null });

    const mapped = projects.map((p) => ({
      id: p._id,
      image: p.image,
      name: p.name,
      userName: `${p.user?.name ?? ""} ${p.user?.familyName ?? ""}`.trim(),
      userPhoneNumber: p.user?.phoneNumber ?? "",
      createdAt: p.createdAt,
      objectsCount: Array.isArray(p.objects) ? p.objects.length : 0,
      isPublic: p.isPublic || false,
    }));

    return NextResponse.json(
      { success: true, stats: { totalProjects }, projects: mapped },
      { status: 200 }
    );
  } catch (error) {
    console.error("Admin projects list error:", error);
    return NextResponse.json(
      { success: false, message: "خطا هنگام دریافت لیست پروژه‌ها" },
      { status: 500 }
    );
  }
}



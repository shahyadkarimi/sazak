import { getAuthUser } from "@/lib/auth";
import connectDB from "@/lib/db";
import User from "@/models/User";
import { NextResponse } from "next/server";
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

    const users = await User.find({})
      .select("_id name familyName phoneNumber role isActive createdAt")
      .sort({ createdAt: -1 })
      .lean();

    const [totalUsers, activeUsers, adminUsers, totalProjects] =
      await Promise.all([
        User.countDocuments({}),
        User.countDocuments({ isActive: true }),
        User.countDocuments({ role: "admin" }),
        Project.countDocuments({ deletedAt: null }),
      ]);

    const mapped = users.map((u) => ({
      id: u._id,
      name: u.name,
      familyName: u.familyName,
      fullName: `${u.name} ${u.familyName}`,
      phoneNumber: u.phoneNumber,
      role: u.role,
      isActive: u.isActive,
      createdAt: u.createdAt,
    }));

    return NextResponse.json(
      {
        success: true,
        stats: { totalUsers, activeUsers, adminUsers, totalProjects },
        users: mapped,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Admin users list error:", error);
    return NextResponse.json(
      { success: false, message: "خطا هنگام دریافت لیست کاربران" },
      { status: 500 }
    );
  }
}

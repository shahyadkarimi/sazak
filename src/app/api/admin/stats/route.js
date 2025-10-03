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

    const requester = await User.findById(authUser.userId).lean();
    if (!requester || requester.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "دسترسی غیرمجاز" },
        { status: 403 }
      );
    }

    // Get basic counts
    const [
      totalUsers,
      activeUsers,
      adminUsers,
      totalProjects,
      recentUsers,
      recentProjects,
      projectsThisMonth,
      usersThisMonth,
    ] = await Promise.all([
      User.countDocuments({}),
      User.countDocuments({ isActive: true }),
      User.countDocuments({ role: "admin" }),
      Project.countDocuments({ deletedAt: null }),
      User.find({})
        .select("name familyName createdAt")
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
      Project.find({ deletedAt: null })
        .populate("user", "name familyName")
        .select("name createdAt user")
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
      Project.countDocuments({
        deletedAt: null,
        createdAt: {
          $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      }),
      User.countDocuments({
        createdAt: {
          $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      }),
    ]);

    // Calculate growth percentages
    const lastMonth = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1);
    const [projectsLastMonth, usersLastMonth] = await Promise.all([
      Project.countDocuments({
        deletedAt: null,
        createdAt: {
          $gte: lastMonth,
          $lt: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      }),
      User.countDocuments({
        createdAt: {
          $gte: lastMonth,
          $lt: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      }),
    ]);

    const projectGrowth = projectsLastMonth > 0 
      ? ((projectsThisMonth - projectsLastMonth) / projectsLastMonth * 100).toFixed(1)
      : 0;
    
    const userGrowth = usersLastMonth > 0 
      ? ((usersThisMonth - usersLastMonth) / usersLastMonth * 100).toFixed(1)
      : 0;

    // Get user registration data for the last 7 days
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
      
      const count = await User.countDocuments({
        createdAt: {
          $gte: startOfDay,
          $lt: endOfDay,
        },
      });
      
      last7Days.push({
        date: date.toLocaleDateString("fa-IR"),
        count,
      });
    }

    // Get project creation data for the last 7 days
    const last7DaysProjects = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
      
      const count = await Project.countDocuments({
        deletedAt: null,
        createdAt: {
          $gte: startOfDay,
          $lt: endOfDay,
        },
      });
      
      last7DaysProjects.push({
        date: date.toLocaleDateString("fa-IR"),
        count,
      });
    }

    const stats = {
      totalUsers,
      activeUsers,
      adminUsers,
      totalProjects,
      projectsThisMonth,
      usersThisMonth,
      projectGrowth: parseFloat(projectGrowth),
      userGrowth: parseFloat(userGrowth),
      recentUsers: recentUsers.map(user => ({
        id: user._id,
        name: `${user.name} ${user.familyName}`,
        createdAt: user.createdAt,
      })),
      recentProjects: recentProjects.map(project => ({
        id: project._id,
        name: project.name,
        user: project.user ? `${project.user.name} ${project.user.familyName}` : "نامشخص",
        createdAt: project.createdAt,
      })),
      last7Days,
      last7DaysProjects,
    };

    return NextResponse.json(
      {
        success: true,
        stats,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Admin stats error:", error);
    return NextResponse.json(
      { success: false, message: "خطا هنگام دریافت آمار" },
      { status: 500 }
    );
  }
}

import { getAuthUser } from "@/lib/auth";
import connectDB from "@/lib/db";
import User from "@/models/User";
import { NextResponse } from "next/server";
import Project from "@/models/Project";
import { validateAddUser } from "@/lib/validation";
import bcrypt from "bcryptjs";

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

    const users = await User.find({ 
      deletedAt: null,
      isDeleted: { $ne: true }
    })
      .select("_id name familyName phoneNumber role isActive createdAt email address province city birthDate profilePicture canEditUserProjects")
      .sort({ createdAt: -1 })
      .lean();

    const [totalUsers, activeUsers, adminUsers, totalProjects] =
      await Promise.all([
        User.countDocuments({ 
          deletedAt: null,
          isDeleted: { $ne: true }
        }),
        User.countDocuments({ 
          isActive: true,
          deletedAt: null,
          isDeleted: { $ne: true }
        }),
        User.countDocuments({ 
          role: "admin",
          deletedAt: null,
          isDeleted: { $ne: true }
        }),
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
      canEditUserProjects: u.role === "admin" ? (u.canEditUserProjects || false) : false,
      email: u.email ?? "",
      address: u.address ?? "",
      province: u.province ?? "",
      city: u.city ?? "",
      birthDate: u.birthDate ?? "",
      profilePicture: u.profilePicture ?? "",
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

    const requester = await User.findById(authUser.userId).lean();
    if (!requester || requester.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "دسترسی غیرمجاز" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const validation = validateAddUser(body);
    
    if (!validation.isValid) {
      return NextResponse.json(
        { success: false, message: validation.message },
        { status: 400 }
      );
    }

    const { name, familyName, phoneNumber, password, role } = body;

    // Check if user already exists
    const existingUser = await User.findOne({ 
      phoneNumber,
      deletedAt: null,
      isDeleted: { $ne: true }
    });
    
    if (existingUser) {
      return NextResponse.json(
        { success: false, message: "کاربری با این شماره موبایل قبلاً ثبت شده است" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create new user
    const newUser = new User({
      name,
      familyName,
      phoneNumber,
      password: hashedPassword,
      role: role || "user",
      isActive: true,
    });

    await newUser.save();

    const userResponse = {
      id: newUser._id,
      name: newUser.name,
      familyName: newUser.familyName,
      fullName: `${newUser.name} ${newUser.familyName}`,
      phoneNumber: newUser.phoneNumber,
      role: newUser.role,
      isActive: newUser.isActive,
      email: newUser.email ?? "",
      address: newUser.address ?? "",
      province: newUser.province ?? "",
      city: newUser.city ?? "",
      birthDate: newUser.birthDate ?? "",
      profilePicture: newUser.profilePicture ?? "",
      createdAt: newUser.createdAt,
    };

    return NextResponse.json(
      {
        success: true,
        message: "کاربر با موفقیت اضافه شد",
        user: userResponse,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Admin add user error:", error);
    return NextResponse.json(
      { success: false, message: "خطا هنگام اضافه کردن کاربر" },
      { status: 500 }
    );
  }
}

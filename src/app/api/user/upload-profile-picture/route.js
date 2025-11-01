import { getAuthUser } from "@/lib/auth";
import connectDB from "@/lib/db";
import User from "@/models/User";
import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

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

    const data = await req.formData();
    const file = data.get("profilePicture");

    if (!file) {
      return NextResponse.json(
        { success: false, message: "فایل انتخاب نشده است" },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          message: "فرمت فایل پشتیبانی نمی‌شود. فقط JPG, PNG و WebP مجاز است",
        },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, message: "حجم فایل نباید بیشتر از ۵ مگابایت باشد" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(
      process.cwd(),
      "public",
      "uploads",
      "profiles"
    );
    await mkdir(uploadsDir, { recursive: true });

    // Generate unique filename
    const fileExtension = path.extname(file.name);
    const fileName = `${authUser.userId}_${Date.now()}${fileExtension}`;
    const filePath = path.join(uploadsDir, fileName);

    // Save file
    await writeFile(filePath, buffer);

    // Update user profile picture in database
    const userDoc = await User.findById(authUser.userId);
    if (!userDoc) {
      return NextResponse.json(
        { success: false, message: "کاربر یافت نشد" },
        { status: 404 }
      );
    }

    // Delete old profile picture if exists
    if (userDoc.profilePicture) {
      const oldFilePath = path.join(
        process.cwd(),
        "public",
        userDoc.profilePicture
      );
      try {
        await import("fs").then((fs) => fs.promises.unlink(oldFilePath));
      } catch (error) {
        console.log("Old profile picture not found or already deleted");
      }
    }

    userDoc.profilePicture = `/uploads/profiles/${fileName}`;
    await userDoc.save();

    const user = userDoc.toObject();
    delete user.password;
    delete user.__v;

    return NextResponse.json(
      {
        success: true,
        message: "عکس پروفایل با موفقیت آپلود شد",
        user: {
          id: user._id,
          name: user.name,
          familyName: user.familyName,
          fullName: user.name + " " + user.familyName,
          phoneNumber: user.phoneNumber,
          role: user.role,
          profilePicture: user.profilePicture,
          createdAt: user.createdAt,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Upload profile picture error:", error);
    return NextResponse.json(
      { success: false, message: "خطا هنگام آپلود عکس پروفایل" },
      { status: 500 }
    );
  }
}

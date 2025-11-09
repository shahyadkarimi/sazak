import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import User from "@/models/User";
import Setting from "@/models/Setting";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

const allowedTypes = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/svg+xml",
];

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

    const data = await req.formData();
    const file = data.get("logo");

    if (!file) {
      return NextResponse.json(
        { success: false, message: "فایل انتخاب نشده است" },
        { status: 400 }
      );
    }

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, message: "فرمت فایل پشتیبانی نمی‌شود" },
        { status: 400 }
      );
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, message: "حجم فایل نباید بیشتر از ۵ مگابایت باشد" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadsDir = path.join(process.cwd(), "public", "uploads", "settings");
    await mkdir(uploadsDir, { recursive: true });

    const extension = path.extname(file.name) || ".png";
    const fileName = `logo_${Date.now()}${extension}`;
    const filePath = path.join(uploadsDir, fileName);

    await writeFile(filePath, buffer);

    const setting = await Setting.findOne() || new Setting();
    const oldLogo = setting.logo;
    setting.logo = `/uploads/settings/${fileName}`;
    setting.updatedBy = requester._id;
    await setting.save();

    if (oldLogo && oldLogo.startsWith("/")) {
      const oldPath = path.join(process.cwd(), "public", oldLogo);
      try {
        await import("fs").then((fs) => fs.promises.unlink(oldPath));
      } catch (error) {
        console.error("Delete old logo error:", error);
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: "لوگو با موفقیت آپلود شد",
        logo: setting.logo,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Admin upload logo error:", error);
    return NextResponse.json(
      { success: false, message: "خطا هنگام آپلود لوگو" },
      { status: 500 }
    );
  }
}


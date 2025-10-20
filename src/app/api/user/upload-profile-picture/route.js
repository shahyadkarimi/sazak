import { getAuthUser } from "@/lib/auth";
import connectDB from "@/lib/db";
import User from "@/models/User";
import { NextResponse } from "next/server";
import path from "path";
import { s3 } from "@/lib/s3";
import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { parse as parseUrl } from "url";
import fs from "fs";

export async function POST(req) {
  try {
    await connectDB();

    // Check for required environment variables
    if (!process.env.LIARA_BUCKET_NAME) {
      console.error("LIARA_BUCKET_NAME environment variable is not set");
      return NextResponse.json(
        { success: false, message: "تنظیمات سرور ناقص است" },
        { status: 500 }
      );
    }

    if (!process.env.LIARA_ENDPOINT) {
      console.error("LIARA_ENDPOINT environment variable is not set");
      return NextResponse.json(
        { success: false, message: "تنظیمات سرور ناقص است" },
        { status: 500 }
      );
    }

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
        { success: false, message: "فرمت فایل پشتیبانی نمی‌شود. فقط JPG, PNG و WebP مجاز است" },
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

    // Prepare buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Build key for object storage (put inside profiles/ folder)
    const ext = path.extname(file.name) || (file.type === "image/png" ? ".png" : "");
    const key = `profiles/${authUser.userId}_${Date.now()}${ext}`;

    // Upload to Liara (S3-compatible)
    const putCommand = new PutObjectCommand({
      Bucket: process.env.LIARA_BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: file.type,
      // اگر باکت شما private هست و نیاز به دسترسی عمومی دارید،
      // باید تنظیمات باکت در پنل لیارا را تغییر دهید (یا از presigned URL استفاده کنید).
    });

    await s3.send(putCommand);

    // Update user profile in DB
    const userDoc = await User.findById(authUser.userId);
    if (!userDoc) {
      // در صورت وجود خطا، سعی می‌کنیم فایل آپلود شده را پاک کنیم
      try {
        await s3.send(new DeleteObjectCommand({
          Bucket: process.env.LIARA_BUCKET_NAME,
          Key: key,
        }));
      } catch (e) {
        console.error("Failed to cleanup uploaded object:", e);
      }

      return NextResponse.json(
        { success: false, message: "کاربر یافت نشد" },
        { status: 404 }
      );
    }

    // Delete old profile picture:
    // - اگر تصویر قدیمی روی لیارا بوده، تلاش میکنیم آن آبجکت را حذف کنیم
    // - در غیر این صورت (مسیر محلی قبلی)، تلاش می‌کنیم فایل محلی را حذف کنیم
    if (userDoc.profilePicture) {
      try {
        const old = userDoc.profilePicture; // مثال: "/uploads/profiles/..." یا "https://storage.iran.liara.space/my-bucket/profiles/..."
        let oldKey = null;

        // اگر قبلاً URL کامل ذخیره شده (احتمالاً شامل LIARA_ENDPOINT یا اسم باکت)، استخراج key
        if (old.startsWith("http")) {
          try {
            const parsed = parseUrl(old);
            // نمونه: https://storage.iran.liara.space/<bucket-name>/profiles/...
            if (parsed && parsed.pathname) {
              // remove leading slash and bucket name
              const parts = parsed.pathname.split("/").filter(Boolean);
              // parts[0] باید bucket name باشه (در path-style)
              if (parts.length >= 2 && parts[0] === process.env.LIARA_BUCKET_NAME) {
                oldKey = parts.slice(1).join("/");
              } else {
                // اگر endpoint متفاوت باشه، سعی می‌کنیم آخرین قسمت‌ها را بگیریم
                // (fallback: last two segments)
                oldKey = parts.slice(parts.length - 2).join("/");
              }
            }
          } catch (e) {
            oldKey = null;
          }
        } else if (old.includes(process.env.LIARA_BUCKET_NAME)) {
          // ممکنه فقط path داخل باکت ذخیره شده باشه
          const idx = old.indexOf(process.env.LIARA_BUCKET_NAME);
          oldKey = old.substring(idx + process.env.LIARA_BUCKET_NAME.length + 1);
        } else if (old.startsWith("/uploads") || old.startsWith("uploads") || old.startsWith("/public")) {
          // قبلاً به صورت محلی ذخیره شده — حذف فایل محلی
          const localPath = path.join(process.cwd(), "public", old.replace(/^\/+/, ""));
          try {
            await fs.promises.unlink(localPath);
          } catch (err) {
            // ignore if not exists
            console.log("Old local profile picture not found or already deleted");
          }
        }

        // اگر oldKey استخراج شده، حذف از لیارا
        if (oldKey) {
          try {
            await s3.send(new DeleteObjectCommand({
              Bucket: process.env.LIARA_BUCKET_NAME,
              Key: oldKey,
            }));
          } catch (e) {
            console.log("Failed to delete old object from Liara (might not exist).", e);
          }
        }
      } catch (err) {
        console.log("Error while trying to delete old profile picture:", err);
      }
    }

    // Compose public URL (در صورتی که باکت public باشد این URL قابل دسترسی خواهد بود)
    const endpoint = (process.env.LIARA_ENDPOINT || "").replace(/\/$/, "");
    const publicUrl = `${endpoint}/${process.env.LIARA_BUCKET_NAME}/${key}`;

    userDoc.profilePicture = publicUrl; // یا ذخیره فقط key اگر ترجیح دارید: key
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
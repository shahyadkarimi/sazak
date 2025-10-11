import { getAuthUser } from "@/lib/auth";
import connectDB from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { updateProfileSchema } from "@/lib/validation";

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

    const { name, familyName, password, profilePicture } = updateProfileSchema.parse(body);

    const userDoc = await User.findById(authUser.userId);

    if (!userDoc) {
      return NextResponse.json(
        { success: false, message: "کاربر یافت نشد" },
        { status: 404 }
      );
    }

    if (name) userDoc.name = name;
    if (familyName) userDoc.familyName = familyName;
    if (password && password.trim() !== "") {
      userDoc.password = await bcrypt.hash(password, 10);
    }
    if (profilePicture) userDoc.profilePicture = profilePicture;

    await userDoc.save();

    const user = userDoc.toObject();
    delete user.password;
    delete user.__v;

    return NextResponse.json(
      {
        success: true,
        message: "پروفایل با موفقیت ویرایش شد.",
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
    if (error.name === "ZodError") {
      const formattedErrors = error.issues.map((issue) => ({
        name: issue.path.join("."),
        message: issue.message,
      }));
      return NextResponse.json(
        { success: false, errors: formattedErrors },
        { status: 400 }
      );
    }

    console.error("Update profile error:", error);
    return NextResponse.json(
      { success: false, message: "خطا هنگام ویرایش پروفایل" },
      { status: 500 }
    );
  }
}

import { getAuthUser } from "@/lib/auth";
import connectDB from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { updateProfileSchema } from "@/lib/validation";
import { createLog, LogActions } from "@/lib/logger";

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

    const {
      name,
      familyName,
      email,
      address,
      province,
      city,
      birthDate,
      password,
      profilePicture,
    } = updateProfileSchema.parse(body);

    const userDoc = await User.findById(authUser.userId);

    if (!userDoc) {
      return NextResponse.json(
        { success: false, message: "کاربر یافت نشد" },
        { status: 404 }
      );
    }

    const updatedFields = {};

    if (name) {
      userDoc.name = name;
      updatedFields.name = name;
    }
    if (familyName) {
      userDoc.familyName = familyName;
      updatedFields.familyName = familyName;
    }
    if (password && password.trim() !== "") {
      userDoc.password = await bcrypt.hash(password, 10);
      updatedFields.passwordChanged = true;
    }
    if (profilePicture) {
      userDoc.profilePicture = profilePicture;
      updatedFields.profilePicture = profilePicture;
    }
    if (email !== undefined) {
      const normalized = email === "" ? null : email;
      userDoc.email = normalized;
      updatedFields.email = normalized;
    }
    if (address !== undefined) {
      const normalized = address === "" ? null : address;
      userDoc.address = normalized;
      updatedFields.address = normalized;
    }
    if (province !== undefined) {
      const normalized = province === "" ? null : province;
      userDoc.province = normalized;
      updatedFields.province = normalized;
    }
    if (city !== undefined) {
      const normalized = city === "" ? null : city;
      userDoc.city = normalized;
      updatedFields.city = normalized;
    }
    if (birthDate !== undefined) {
      const normalized = birthDate === "" ? null : birthDate;
      userDoc.birthDate = normalized;
      updatedFields.birthDate = normalized;
    }

    await userDoc.save();

    const user = userDoc.toObject();
    delete user.password;
    delete user.__v;

    if (Object.keys(updatedFields).length > 0) {
      await createLog(LogActions.USER_PROFILE_UPDATE, {
        performedBy: {
          userId: userDoc._id,
          name: userDoc.name,
          familyName: userDoc.familyName,
          phoneNumber: userDoc.phoneNumber,
          role: userDoc.role,
        },
        target: {
          type: "user",
          userId: userDoc._id.toString(),
          phoneNumber: userDoc.phoneNumber,
        },
        metadata: {
          updatedFields,
        },
        request: req,
      });
    }

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
          email: user.email,
          address: user.address,
          province: user.province,
          city: user.city,
          birthDate: user.birthDate,
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

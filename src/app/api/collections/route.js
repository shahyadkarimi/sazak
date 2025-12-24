import { getAuthUser } from "@/lib/auth";
import connectDB from "@/lib/db";
import User from "@/models/User";
import Collection from "@/models/Collection";
import { NextResponse } from "next/server";

// Get user's collections
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

    const user = await User.findById(authUser.userId).lean();
    if (!user) {
      return NextResponse.json(
        { success: false, message: "کاربر یافت نشد" },
        { status: 404 }
      );
    }

    const collections = await Collection.find({
      user: user._id,
      deletedAt: null,
    })
      .populate("projects", "name image")
      .select("-__v -deletedAt")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(
      {
        success: true,
        collections,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get collections error:", error);
    return NextResponse.json(
      { success: false, message: "خطا هنگام دریافت کالکشن‌ها" },
      { status: 500 }
    );
  }
}

// Create a new collection
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

    const user = await User.findById(authUser.userId).lean();
    if (!user) {
      return NextResponse.json(
        { success: false, message: "کاربر یافت نشد" },
        { status: 404 }
      );
    }

    const { name, projectId } = await req.json();

    if (!name || !name.trim()) {
      return NextResponse.json(
        { success: false, message: "نام کالکشن الزامی است" },
        { status: 400 }
      );
    }

    // Check if collection with same name already exists
    const existingCollection = await Collection.findOne({
      user: user._id,
      name: name.trim(),
      deletedAt: null,
    });

    if (existingCollection) {
      // If projectId is provided, add it to existing collection
      if (projectId) {
        if (!existingCollection.projects.includes(projectId)) {
          existingCollection.projects.push(projectId);
          await existingCollection.save();
        }
        return NextResponse.json(
          {
            success: true,
            message: "پروژه به کالکشن اضافه شد",
            collection: existingCollection,
          },
          { status: 200 }
        );
      }
      return NextResponse.json(
        { success: false, message: "کالکشنی با این نام از قبل وجود دارد" },
        { status: 400 }
      );
    }

    // Create new collection
    const newCollection = new Collection({
      user: user._id,
      name: name.trim(),
      projects: projectId ? [projectId] : [],
    });

    await newCollection.save();

    const populatedCollection = await Collection.findById(newCollection._id)
      .populate("projects", "name image")
      .lean();

    return NextResponse.json(
      {
        success: true,
        message: "کالکشن با موفقیت ایجاد شد",
        collection: populatedCollection,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create collection error:", error);
    return NextResponse.json(
      { success: false, message: "خطا هنگام ایجاد کالکشن" },
      { status: 500 }
    );
  }
}

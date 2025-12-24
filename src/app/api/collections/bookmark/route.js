import { getAuthUser } from "@/lib/auth";
import connectDB from "@/lib/db";
import User from "@/models/User";
import Collection from "@/models/Collection";
import Project from "@/models/Project";
import { NextResponse } from "next/server";

// Add project to collection (bookmark)
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

    const { collectionId, projectId } = await req.json();

    if (!collectionId || !projectId) {
      return NextResponse.json(
        { success: false, message: "شناسه کالکشن و پروژه الزامی است" },
        { status: 400 }
      );
    }

    // Verify collection belongs to user
    const collection = await Collection.findOne({
      _id: collectionId,
      user: user._id,
      deletedAt: null,
    });

    if (!collection) {
      return NextResponse.json(
        { success: false, message: "کالکشن یافت نشد" },
        { status: 404 }
      );
    }

    // Verify project exists
    const project = await Project.findById(projectId);
    if (!project) {
      return NextResponse.json(
        { success: false, message: "پروژه یافت نشد" },
        { status: 404 }
      );
    }

    // Check if project is already in collection
    if (collection.projects.includes(projectId)) {
      return NextResponse.json(
        { success: false, message: "این پروژه قبلاً در کالکشن اضافه شده است" },
        { status: 400 }
      );
    }

    // Add project to collection
    collection.projects.push(projectId);
    await collection.save();

    const populatedCollection = await Collection.findById(collection._id)
      .populate("projects", "name image")
      .lean();

    return NextResponse.json(
      {
        success: true,
        message: "پروژه به کالکشن اضافه شد",
        collection: populatedCollection,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Add bookmark error:", error);
    return NextResponse.json(
      { success: false, message: "خطا هنگام اضافه کردن بوکمارک" },
      { status: 500 }
    );
  }
}

// Remove project from collection (unbookmark)
export async function DELETE(req) {
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

    const { collectionId, projectId } = await req.json();

    if (!collectionId || !projectId) {
      return NextResponse.json(
        { success: false, message: "شناسه کالکشن و پروژه الزامی است" },
        { status: 400 }
      );
    }

    // Verify collection belongs to user
    const collection = await Collection.findOne({
      _id: collectionId,
      user: user._id,
      deletedAt: null,
    });

    if (!collection) {
      return NextResponse.json(
        { success: false, message: "کالکشن یافت نشد" },
        { status: 404 }
      );
    }

    // Remove project from collection
    collection.projects = collection.projects.filter(
      (id) => id.toString() !== projectId
    );
    await collection.save();

    return NextResponse.json(
      {
        success: true,
        message: "پروژه از کالکشن حذف شد",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Remove bookmark error:", error);
    return NextResponse.json(
      { success: false, message: "خطا هنگام حذف بوکمارک" },
      { status: 500 }
    );
  }
}

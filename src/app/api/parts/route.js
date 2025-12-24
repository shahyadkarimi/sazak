import connectDB from "@/lib/db";
import Part from "@/models/Part";
import Category from "@/models/Category";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get("category");

    const query = { deletedAt: null };
    if (categoryId && categoryId !== "all") {
      query.category = categoryId;
    }

    const parts = await Part.find(query)
      .populate({ path: "category", select: "name" })
      .sort({ createdAt: -1 })
      .lean();

    const categories = await Category.find({
      deletedAt: null,
    })
      .sort({ name: 1 })
      .lean();

    const mappedParts = parts.map((p) => ({
      id: p._id.toString(),
      path: p.glbPath,
      thumbnailPath: p.thumbnailPath,
      name: p.name,
      length: p.length,
      width: p.width,
      height: p.height,
      noColor: p.noColor || false,
      color: p.noColor ? null : p.color || p.previewColor || null,
      category: {
        id: p.category?._id?.toString() || "",
        name: p.category?.name || "",
      },
    }));

    const mappedCategories = categories.map((c) => ({
      id: c._id.toString(),
      name: c.name,
    }));

    return NextResponse.json(
      {
        success: true,
        parts: mappedParts,
        categories: mappedCategories,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Parts list error:", error);
    return NextResponse.json(
      { success: false, message: "خطا هنگام دریافت لیست قطعات" },
      { status: 500 }
    );
  }
}


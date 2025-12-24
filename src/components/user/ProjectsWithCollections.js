"use client";

import { toFarsiNumber } from "@/helper/helper";
import { Icon } from "@iconify/react";
import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useState, useMemo } from "react";
import ProjectActions from "@/app/user/project/my-projects/ProjectActions";
import { cn, Input } from "@heroui/react";

const ProjectsWithCollections = ({
  initialProjects = [],
  initialCollections = [],
}) => {
  const [projects, setProjects] = useState(initialProjects);
  const [collections, setCollections] = useState(initialCollections);
  const [selectedCollectionId, setSelectedCollectionId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Sync state when props change
  useEffect(() => {
    setProjects(initialProjects);
    setCollections(initialCollections);
  }, [initialProjects, initialCollections]);

  // Filter projects by collection and search query
  const filteredProjects = useMemo(() => {
    let result = [...projects];

    // Filter by collection
    if (selectedCollectionId !== null) {
      const selectedCollection = collections.find(
        (col) => col._id.toString() === selectedCollectionId.toString()
      );
      if (selectedCollection) {
        const collectionProjectIds = selectedCollection.projects.map((p) =>
          typeof p === "object" ? p._id.toString() : p.toString()
        );
        result = result.filter((project) =>
          collectionProjectIds.includes(project._id.toString())
        );
      } else {
        result = [];
      }
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      result = result.filter(
        (project) =>
          project.name?.toLowerCase().includes(query) ||
          project.description?.toLowerCase().includes(query)
      );
    }

    return result;
  }, [projects, collections, selectedCollectionId, searchQuery]);

  return (
    <div className="w-full flex flex-col gap-4 lg:gap-8">
      {/* Search Input */}
      <div className="flex items-center gap-2">
        <Input
          className="w-full sm:w-72"
          placeholder="جستجو پروژه..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          startContent={
            <Icon
              icon="solar:minimalistic-magnifer-broken"
              className="text-gray-600 dark:text-gray-400"
              width="20"
              height="20"
            />
          }
          classNames={{
            input: "placeholder:font-light placeholder:text-gray-600 dark:placeholder:text-gray-400 dark:text-gray-200",
            inputWrapper:
              "!shadow-none rounded-xl border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 focus-within:border-primaryThemeColor bg-white dark:bg-gray-800",
          }}
        />
      </div>

      {/* Collections Filter */}
      {collections.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {/* Show All Button */}
          <button
            onClick={() => setSelectedCollectionId(null)}
            className={cn(
              "px-4 py-2 rounded-xl font-semibold text-sm transition-all",
              selectedCollectionId === null
                ? "bg-primaryThemeColor text-white shadow-lg"
                : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-md"
            )}
          >
            نمایش همه
          </button>

          {/* Collection Buttons */}
          {collections.map((collection) => {
            const collectionIdStr = collection._id.toString();
            const isSelected =
              selectedCollectionId?.toString() === collectionIdStr;
            return (
              <button
                key={collection._id}
                onClick={() => setSelectedCollectionId(collection._id)}
                className={cn(
                  "px-4 py-2 rounded-xl font-semibold text-sm transition-all",
                  isSelected
                    ? "bg-primaryThemeColor text-white shadow-lg"
                    : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-md"
                )}
              >
                {collection.name} (
                {toFarsiNumber(collection.projects?.length || 0)})
              </button>
            );
          })}
        </div>
      )}

      {/* Projects Grid */}
      {filteredProjects.length > 0 ? (
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.map((item) => (
            <div
              key={item._id}
              className="w-full group flex flex-col gap-3 bg-white dark:bg-gray-800 p-4 lg:p-4 rounded-2xl shadow-lg shadow-gray-100 dark:shadow-gray-900 hover:shadow-xl hover:shadow-gray-200/90 dark:hover:shadow-gray-800/90 transition-all"
            >
              <Link
                href={`/design-studio/project/${item._id}`}
                className="overflow-hidden rounded-2xl"
              >
                <Image
                  src={item.image || "/assets/holder.svg"}
                  width={600}
                  height={300}
                  className="aspect-video rounded-xl group-hover:scale-105 transition-all"
                  alt={item.name}
                />
              </Link>

              <Link
                href={`/design-studio/project/${item._id}`}
                className="text-lg text-gray-700 dark:text-gray-200 group-hover:text-primaryThemeColor font-extrabold transition-all"
              >
                {item.name}
              </Link>

              <p className="text-sm font-light -mt-1 text-gray-700 dark:text-gray-300 line-clamp-2 h-10">
                {item.description}
              </p>

              <div className="w-full flex justify-between items-center">
                <div className="flex items-center text-gray-600 dark:text-gray-400 text-[13px] gap-1">
                  <Icon icon="solar:layers-broken" width="20" height="20" />

                  <span>
                    سازه ها: {`${toFarsiNumber(item.objects?.length || 0)} عدد`}
                  </span>
                </div>

                <div className="flex items-center text-gray-500 dark:text-gray-400 text-xs gap-1">
                  <span>
                    آخرین ویرایش{" "}
                    {new Intl.DateTimeFormat("fa-IR", {
                      year: "numeric",
                      month: "long",
                      day: "2-digit",
                    }).format(new Date(item.updatedAt))}
                  </span>
                </div>
              </div>

              <ProjectActions id={item._id} project={item} />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center mt-8 gap-4">
          <h2 className="text-gray-600 dark:text-gray-400 text-lg">
            {selectedCollectionId === null
              ? "شما هنوز پروژه ای نساخته اید !"
              : "در این کالکشن پروژه‌ای وجود ندارد"}
          </h2>
          {selectedCollectionId === null && (
            <Link
              href={"/design-studio/new-project"}
              className="text-primaryThemeColor font-bold"
            >
              برای ایجاد اولین پروژه خود کلیک کنید
            </Link>
          )}
        </div>
      )}
    </div>
  );
};

export default ProjectsWithCollections;

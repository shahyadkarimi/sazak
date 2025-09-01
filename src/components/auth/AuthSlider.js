"use client";
import React, { useRef, useState } from "react";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import { toFarsiNumber } from "@/helper/helper";
import { Icon } from "@iconify/react";

const AuthSlider = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const swiperRef = useRef(null);

  const slider = [
    {
      image: "/assets/support.png",
      title: "پشتیبانی 24 ساعته",
      description:
        "هفت روز هفته به صورت تلفنی از 9 الی 18 و 24 ساعته از چت آنلاین آماده ی پاسخگویی به شما هستیم.",
    },
    {
      image: "/assets/support.png",
      title: "پشتیبانی 24 ساعته",
      description:
        "هفت روز هفته به صورت تلفنی از 9 الی 18 و 24 ساعته از چت آنلاین آماده ی پاسخگویی به شما هستیم.",
    },
    {
      image: "/assets/support.png",
      title: "پشتیبانی 24 ساعته",
      description:
        "هفت روز هفته به صورت تلفنی از 9 الی 18 و 24 ساعته از چت آنلاین آماده ی پاسخگویی به شما هستیم.",
    },
  ];

  return (
    <div className="w-full flex flex-col gap-8">
      <Swiper
        onSwiper={(swiper) => (swiperRef.current = swiper)}
        onSlideChange={(e) => setActiveIndex(e.activeIndex)}
        modules={[Autoplay]}
        loop
        autoplay={{ delay: 3000 }}
      >
        {slider.map((slide) => (
          <SwiperSlide className="">
            <div className="w-full flex flex-col items-center gap-4">
              <Image
                src={slide.image}
                width={200}
                height={200}
                className=""
                alt={slide.title}
              />

              <h3 className="text-xl font-semibold mt-10">
                {toFarsiNumber(slide.title)}
              </h3>
              <p className="mt-2 text-sm font-light text-gray-400">
                {toFarsiNumber(slide.description)}
              </p>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      {/* pagination & navigation */}
      <div className="w-full flex items-center relative justify-between my-10">
        <button
          onClick={() => {
            if (swiperRef.current) swiperRef.current.slidePrev();
          }}
          className="size-10 bg-white text-primaryThemeColor border-2 border-primaryThemeColor/15 rounded-full flex items-center justify-center"
        >
          <Icon icon="solar:arrow-right-linear" width="24" height="24" />
        </button>

        {/* paginate */}
        <div className="flex items-center gap-1.5">
          {slider.map((item, index) => (
            <button
              key={index}
              onClick={() => {
                if (swiperRef.current) swiperRef.current.slideTo(index);
              }}
              className={`${
                index === activeIndex
                  ? "size-2 w-6 bg-primaryThemeColor"
                  : "size-2 bg-primaryThemeColor/35"
              } transition-all rounded-full`}
            ></button>
          ))}
        </div>

        <button
          onClick={() => {
            if (swiperRef.current) swiperRef.current.slideNext();
          }}
          className="size-10 bg-white text-primaryThemeColor border-2 border-primaryThemeColor/15 rounded-full flex items-center justify-center"
        >
          <Icon icon="solar:arrow-left-linear" width="24" height="24" />
        </button>
      </div>
    </div>
  );
};

export default AuthSlider;

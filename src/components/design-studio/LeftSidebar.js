import React from "react";

const LeftSidebar = () => {
  return (
    <div className="min-w-20 flex flex-col justify-center items-center gap-4 bg-white">
      <button className="bg-gray-200/90 flex justify-center items-center size-11 rounded-2xl text-gray-700 hover:bg-primaryThemeColor/15 hover:text-primaryThemeColor transition-all duration-300">
        <i className="fi fi-rr-house-chimney size-5 text-xl block"></i>
      </button>

      <button className="bg-gray-200/90 flex justify-center items-center size-11 rounded-2xl text-gray-700 hover:bg-primaryThemeColor/15 hover:text-primaryThemeColor transition-all duration-300">
        <i className="fi fi-rr-add size-5 text-xl block"></i>
      </button>

      <button className="bg-gray-200/90 flex justify-center items-center size-11 rounded-2xl text-gray-700 hover:bg-primaryThemeColor/15 hover:text-primaryThemeColor transition-all duration-300">
        <i className="fi fi-rr-minus-circle size-5 text-xl block"></i>
      </button>

      <button className="bg-gray-200/90 flex justify-center items-center size-11 rounded-2xl text-gray-700 hover:bg-primaryThemeColor/15 hover:text-primaryThemeColor transition-all duration-300">
        <i className="fi fi-rr-arrows-alt-h size-5 text-xl block"></i>
      </button>

      <button className="bg-gray-200/90 flex justify-center items-center size-11 rounded-2xl text-gray-700 hover:bg-primaryThemeColor/15 hover:text-primaryThemeColor transition-all duration-300">
        <i className="fi fi-rr-arrows-alt-v size-5 text-xl block"></i>
      </button>
    </div>
  );
};

export default LeftSidebar;

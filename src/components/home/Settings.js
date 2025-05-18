import React, { useState } from "react";

const Settings = () => {
  const [openSettings, setOpenSettings] = useState(false);
  return (
    <div className="absolute w-60 h-96 bg-white rounded-2xl shadow-lg shadow-gray-100 z-50 left-0 top-2/4 -translate-y-2/4"></div>
  );
};

export default Settings;

import { Html } from "@react-three/drei";
import { useState, useEffect, useRef } from "react";

const ContextMenu = ({ position, isVisible, onClose }) => {
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const menuRef = useRef();

  useEffect(() => {
    if (isVisible) {
      // Position the menu at mouse cursor
      const handleMouseMove = (event) => {
        setMenuPosition({ x: event.clientX, y: event.clientY });
      };
      
      window.addEventListener('mousemove', handleMouseMove);
      return () => window.removeEventListener('mousemove', handleMouseMove);
    }
  }, [isVisible]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isVisible) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  return null;
};

export default ContextMenu;

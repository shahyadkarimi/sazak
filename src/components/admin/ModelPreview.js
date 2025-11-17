"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

const getRandomColor = () => {
  const colors = [
    "#3b82f6", "#ef4444", "#22c55e", "#eab308", 
    "#f97316", "#a855f7", "#ec4899", "#06b6d4",
    "#10b981", "#f59e0b", "#8b5cf6", "#ec4899",
    "#14b8a6", "#f43f5e", "#6366f1", "#0ea5e9",
    "#84cc16", "#fb923c", "#c026d3", "#06b6d4",
    "#22d3ee", "#a78bfa", "#34d399", "#fbbf24",
    "#60a5fa", "#f472b6", "#4ade80", "#fb7185"
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

const TransformGroup = ({ children, positionX = 0, positionY = 0, rotationX = 0, rotationY = 0, zoom = 1 }) => {
  const groupRef = useRef();
  
  useEffect(() => {
    if (groupRef.current) {
      groupRef.current.rotation.x = rotationX;
      groupRef.current.rotation.y = rotationY;
      groupRef.current.position.x = positionX;
      groupRef.current.position.y = positionY;
      groupRef.current.scale.set(zoom, zoom, zoom);
    }
  }, [positionX, positionY, rotationX, rotationY, zoom]);

  return <group ref={groupRef}>{children}</group>;
};

const PreviewModel = ({ file, color, positionX = 0, positionY = 0, rotationX = 0, rotationY = 0, zoom = 1 }) => {
  const [gltf, setGltf] = useState(null);
  const clonedSceneRef = useRef(null);
  
  useEffect(() => {
    if (!file) {
      clonedSceneRef.current = null;
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const arrayBuffer = e.target.result;
      const loader = new GLTFLoader();
      loader.parse(
        arrayBuffer,
        "",
        (gltf) => {
          setGltf(gltf);
          clonedSceneRef.current = null; // Reset when new file is loaded
        },
        (error) => {
          console.error("Error loading GLB:", error);
        }
      );
    };
    reader.readAsArrayBuffer(file);
  }, [file]);
  
  const scene = gltf?.scene;

  const [centerOffset, setCenterOffset] = useState([0, 0, 0]);
  const [autoScale, setAutoScale] = useState(1);

  // Calculate centerOffset and autoScale only once when scene changes
  useEffect(() => {
    if (!scene) return;
    const box = new THREE.Box3().setFromObject(scene);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);

    setCenterOffset([-center.x - 1.2, -center.y, -center.z]);

    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    const target = 2.8;
    const padding = 1.2;
    setAutoScale((target / maxDim) * padding);
  }, [scene]);

  // Clone scene only once and update color when it changes
  useEffect(() => {
    if (!scene) return;
    
    if (!clonedSceneRef.current) {
      clonedSceneRef.current = scene.clone(true);
    }
    
    // Update color without re-cloning
    clonedSceneRef.current.traverse((child) => {
      if (child.isMesh && child.material) {
        if (!child.userData.originalMaterial) {
          child.userData.originalMaterial = child.material;
        }
        child.material = child.userData.originalMaterial.clone();
        if (child.material.color && color) {
          child.material.emissive = new THREE.Color(color);
          child.material.emissiveIntensity = 0.5;
        } else {
          child.material.emissive = new THREE.Color(0x000000);
          child.material.emissiveIntensity = 0;
        }
      }
    });
  }, [scene, color]);

  if (!scene || !clonedSceneRef.current) return null;

  return (
    <TransformGroup positionX={positionX} positionY={positionY} rotationX={rotationX} rotationY={rotationY} zoom={zoom}>
      <group position={centerOffset} scale={autoScale}>
        <primitive object={clonedSceneRef.current} />
      </group>
    </TransformGroup>
  );
};

const PreviewModelFromUrl = ({ url, color, positionX = 0, positionY = 0, rotationX = 0, rotationY = 0, zoom = 1 }) => {
  const { scene } = useGLTF(url);
  const clonedSceneRef = useRef(null);

  const [centerOffset, setCenterOffset] = useState([0, 0, 0]);
  const [autoScale, setAutoScale] = useState(1);

  // Reset cloned scene when URL changes
  useEffect(() => {
    clonedSceneRef.current = null;
  }, [url]);

  // Calculate centerOffset and autoScale only once when scene changes
  useEffect(() => {
    if (!scene) return;
    const box = new THREE.Box3().setFromObject(scene);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);

    setCenterOffset([-center.x - 1.2, -center.y, -center.z]);

    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    const target = 2.8;
    const padding = 1.2;
    setAutoScale((target / maxDim) * padding);
  }, [scene]);

  // Clone scene only once and update color when it changes
  useEffect(() => {
    if (!scene) return;
    
    if (!clonedSceneRef.current) {
      clonedSceneRef.current = scene.clone(true);
    }
    
    // Update color without re-cloning
    clonedSceneRef.current.traverse((child) => {
      if (child.isMesh && child.material) {
        if (!child.userData.originalMaterial) {
          child.userData.originalMaterial = child.material;
        }
        child.material = child.userData.originalMaterial.clone();
        if (child.material.color && color) {
          child.material.emissive = new THREE.Color(color);
          child.material.emissiveIntensity = 0.5;
        } else {
          child.material.emissive = new THREE.Color(0x000000);
          child.material.emissiveIntensity = 0;
        }
      }
    });
  }, [scene, color]);

  if (!scene || !clonedSceneRef.current) return null;

  return (
    <TransformGroup positionX={positionX} positionY={positionY} rotationX={rotationX} rotationY={rotationY} zoom={zoom}>
      <group position={centerOffset} scale={autoScale}>
        <primitive object={clonedSceneRef.current} />
      </group>
    </TransformGroup>
  );
};

const ModelPreview = ({ file, url, className = "", positionX = 0, positionY = 0, rotationX = 0, rotationY = 0, zoom = 1, customColor = null, noColor = false }) => {
  const [modelColor, setModelColor] = useState(() => getRandomColor());
  
  useEffect(() => {
    if (file || url) {
      if (customColor !== null) {
        setModelColor(customColor);
      } else if (noColor) {
        setModelColor(null);
      } else {
        setModelColor(getRandomColor());
      }
    }
  }, [file, url, customColor, noColor]);
  
  if (!file && !url) return null;
  
  return (
    <div className={className} style={{ width: "100%", height: "100%", backgroundColor: "#f3f4f6" }}>
      <Canvas
        camera={{ position: [3.2, 3.2, 3.2], fov: 40 }}
        dpr={[1, 2]}
        gl={{ preserveDrawingBuffer: true, antialias: true }}
        frameloop="always"
        style={{ width: "100%", height: "100%", display: "block" }}
      >
        <ambientLight intensity={1} />
        <directionalLight position={[4, 6, 8]} intensity={1.2} />
        <Suspense fallback={null}>
          {file ? (
            <PreviewModel file={file} color={modelColor} positionX={positionX} positionY={positionY} rotationX={rotationX} rotationY={rotationY} zoom={zoom} />
          ) : (
            <PreviewModelFromUrl url={url} color={modelColor} positionX={positionX} positionY={positionY} rotationX={rotationX} rotationY={rotationY} zoom={zoom} />
          )}
        </Suspense>
      </Canvas>
    </div>
  );
};

export default ModelPreview;


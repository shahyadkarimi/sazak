import { useEffect, useRef, useState } from "react";
import useModelStore from "@/store/useModelStore";
import { useModelScene } from "@/hooks/useModelScene";
import { useModelAdjustment, adjustPositionToAvoidOverlap } from "@/hooks/useModelAdjustment";
import ModelControls from "./ModelControls";
import ContextMenu from "./ContextMenu";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";

const Model = ({ path, position, id, rotation }) => {
  const modelRef = useRef();
  const { raycaster, camera, gl } = useThree();

  const { scene: adjustedScene, isValid } = useModelScene(path);

  const selectedModelId = useModelStore((s) => s.selectedModelId);
  const setSelectedModelId = useModelStore((s) => s.setSelectedModelId);
  const updateModelPosition = useModelStore((s) => s.updateModelPosition);
  const updateModelRotation = useModelStore((s) => s.updateModelRotation);
  const setIsAdjustingHeight = useModelStore((s) => s.setIsAdjustingHeight);
  const existingModels = useModelStore((s) => s.selectedModels);
  const modelOptions = useModelStore((s) => s.modelOptions);
  const setModelsRef = useModelStore((s) => s.setModelsRef);
  const pushHistory = useModelStore((s) => s.pushHistory);

  const modelControls = useModelAdjustment(
    id,
    position,
    rotation,
    updateModelPosition,
    updateModelRotation,
    existingModels,
    {
      positionSnapStep: modelOptions.snapSize,
      heightSnapStep: modelOptions.snapSize,
      rotationSnapDegrees: modelOptions.rotationDeg,
      mouseSensitivityY:
        modelOptions.snapSize === 0.1 || modelOptions.snapSize === 0.5 ? 3 : 3,
    }
  );

  const isSelected =
    selectedModelId === id ||
    selectedModelId === 'ALL' ||
    (Array.isArray(selectedModelId) && selectedModelId.includes(id));
  const [clonedSceneState, setClonedSceneState] = useState(null);
  const [isHovered, setIsHovered] = useState(false);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartPosition, setDragStartPosition] = useState(null);
  const [dragStartMouse, setDragStartMouse] = useState(null);

  useEffect(() => {
    if (adjustedScene) {
      const clone = adjustedScene.clone(true);
      
      // Apply scale
      clone.scale.set(100, 100, 100);
      
      // Apply centering logic like ModelPlacer
      const box = new THREE.Box3().setFromObject(clone);
      const center = new THREE.Vector3();
      box.getCenter(center);
      
      // Center the model horizontally and place bottom at y=0
      clone.position.x = -center.x;
      clone.position.z = -center.z;
      clone.position.y = -box.min.y;
      
      clone.traverse((child) => {
        if (child.isMesh && child.material) {
          child.material = child.material.clone();
        }
      });
      setClonedSceneState(clone);
    }
  }, [adjustedScene]);

  // تغییر رنگ فقط وقتی مدل سلکت شده یا hover شده
  useEffect(() => {
    if (!clonedSceneState) return;
    setModelsRef(modelRef);

    clonedSceneState.traverse((child) => {
      if (child.isMesh && child.material) {
        if (isDragging) {
          if (child.material.emissive) {
            child.material.emissive = new THREE.Color(0x00ff00); // رنگ سبز برای drag
            child.material.emissiveIntensity = 0.4; // نوردهی بیشتر
          }
        } else if (isSelected) {
          if (child.material.emissive) {
            child.material.emissive = new THREE.Color(0xffff00); // رنگ درخشان زرد
            child.material.emissiveIntensity = 0.3; // نوردهی ملایم
          }
        } else if (isHovered) {
          if (child.material.emissive) {
            child.material.emissive = new THREE.Color(0x3b82f6); // رنگ آبی برای hover
            child.material.emissiveIntensity = 0.2; // نوردهی ملایم
          }
        } else {
          if (child.material.emissive) {
            child.material.emissive = new THREE.Color(0xdc2626);
            child.material.emissiveIntensity = 0; // نوردهی ملایم
          }
        }
      }
    });
  }, [isSelected, isHovered, isDragging, clonedSceneState]);

  // اطلاع به استور درباره درحال تنظیم بودن مدل
  useEffect(() => {
    setIsAdjustingHeight(
      modelControls.isAdjustingHeight || modelControls.isMoving || isDragging
    );
  }, [modelControls.isAdjustingHeight, modelControls.isMoving, isDragging]);


  // انتخاب فقط با کلیک راست انجام می‌شود (در handleRightClick)

  // Handle right-click: select model (with multi-select) and open context menu
  const handleRightClick = (event) => {
    event.stopPropagation();
    if (typeof event.preventDefault === 'function') {
      event.preventDefault();
    } else if (event.nativeEvent && typeof event.nativeEvent.preventDefault === 'function') {
      event.nativeEvent.preventDefault();
    }
    const isCtrl = event.ctrlKey || event.metaKey;

    // Normalize current selection to array for easier ops
    let currentSelection = [];
    if (selectedModelId === 'ALL') {
      currentSelection = existingModels.map((m) => m.id);
    } else if (Array.isArray(selectedModelId)) {
      currentSelection = [...selectedModelId];
    } else if (selectedModelId) {
      currentSelection = [selectedModelId];
    }

    let nextSelection;
    if (isCtrl) {
      // Toggle this id
      if (currentSelection.includes(id)) {
        nextSelection = currentSelection.filter((sid) => sid !== id);
      } else {
        nextSelection = [...currentSelection, id];
      }
      // If empties out, keep single selection to this id for usability
      if (nextSelection.length === 0) nextSelection = [id];
    } else {
      // Regular single select
      nextSelection = id;
    }

    setSelectedModelId(nextSelection);
    setShowContextMenu(true);
  };

  // Handle mouse hover for visual feedback
  const handlePointerOver = (event) => {
    event.stopPropagation();
    setIsHovered(true);
  };

  const handlePointerOut = (event) => {
    event.stopPropagation();
    setIsHovered(false);
  };

  // Handle drag start
  const handlePointerDown = (event) => {
    event.stopPropagation();
    // جلوگیری از رفتار پیش‌فرض در صورت موجود بودن
    if (typeof event.preventDefault === 'function') {
      event.preventDefault();
    } else if (event.nativeEvent && typeof event.nativeEvent.preventDefault === 'function') {
      event.nativeEvent.preventDefault();
    }
    // فقط با کلیک چپ درگ شروع شود
    const btn = (event.button !== undefined) ? event.button : event.nativeEvent?.button;
    if (btn !== 0) return;

    // Snapshot before starting a drag move
    pushHistory();

    setIsDragging(true);
    setDragStartPosition([...position]);

    // Store initial mouse position for drag calculation
    const mouse = new THREE.Vector2();
    mouse.x = (event.clientX / gl.domElement.clientWidth) * 2 - 1;
    mouse.y = -(event.clientY / gl.domElement.clientHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const tempPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -position[1]);
    const initialIntersection = new THREE.Vector3();
    raycaster.ray.intersectPlane(tempPlane, initialIntersection);

    setDragStartMouse({
      x: initialIntersection.x,
      y: initialIntersection.z,
      clientX: event.clientX,
      clientY: event.clientY
    });
  };

  // Handle drag move
  const handlePointerMove = (event) => {
    if (!isDragging || !dragStartPosition || !dragStartMouse) return;
    
    event.stopPropagation();
    
    const mouse = new THREE.Vector2();
    mouse.x = (event.clientX / gl.domElement.clientWidth) * 2 - 1;
    mouse.y = -(event.clientY / gl.domElement.clientHeight) * 2 + 1;
    
    const dragPlane = new THREE.Plane(
      new THREE.Vector3(0, 1, 0),
      -position[1]
    );
    const currentIntersection = new THREE.Vector3();
    raycaster.setFromCamera(mouse, camera);
    raycaster.ray.intersectPlane(dragPlane, currentIntersection);
    
    if (currentIntersection) {
      const deltaX = currentIntersection.x - dragStartMouse.x;
      const deltaZ = currentIntersection.z - dragStartMouse.y;
      
      const newX = dragStartPosition[0] + deltaX;
      const newZ = dragStartPosition[2] + deltaZ;
      
      // Apply snap to grid if snap is enabled
      const snapSize = modelOptions.snapSize;
      const snappedX = snapSize > 0 ? Math.round(newX / snapSize) * snapSize : newX;
      const snappedZ = snapSize > 0 ? Math.round(newZ / snapSize) * snapSize : newZ;
      
      const proposedPosition = [snappedX, position[1], snappedZ];
      
      // Check for collision and adjust position
      const adjustedPosition = adjustPositionToAvoidOverlap(
        proposedPosition,
        id,
        existingModels,
        snapSize
      );
      
      updateModelPosition(id, adjustedPosition);
    }
  };

  // Handle drag end
  const handlePointerUp = (event) => {
    if (isDragging) {
      event.stopPropagation();
      setIsDragging(false);
      setDragStartPosition(null);
      setDragStartMouse(null);
    }
  };

  // Global mouse up handler for drag end
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        setDragStartPosition(null);
        setDragStartMouse(null);
      }
    };

    if (isDragging) {
      window.addEventListener('mouseup', handleGlobalMouseUp);
    }

    return () => {
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging]);

  // Global mouse move to keep dragging even when cursor leaves the model
  useEffect(() => {
    if (!isDragging || !dragStartPosition || !dragStartMouse) return;

    const handleGlobalMouseMove = (event) => {
      const mouse = new THREE.Vector2();
      mouse.x = (event.clientX / gl.domElement.clientWidth) * 2 - 1;
      mouse.y = -(event.clientY / gl.domElement.clientHeight) * 2 + 1;

      const dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -position[1]);
      const currentIntersection = new THREE.Vector3();
      raycaster.setFromCamera(mouse, camera);
      raycaster.ray.intersectPlane(dragPlane, currentIntersection);

      if (currentIntersection) {
        const deltaX = currentIntersection.x - dragStartMouse.x;
        const deltaZ = currentIntersection.z - dragStartMouse.y;

        const newX = dragStartPosition[0] + deltaX;
        const newZ = dragStartPosition[2] + deltaZ;

        const snapSize = modelOptions.snapSize;
        const snappedX = snapSize > 0 ? Math.round(newX / snapSize) * snapSize : newX;
        const snappedZ = snapSize > 0 ? Math.round(newZ / snapSize) * snapSize : newZ;

        const proposedPosition = [snappedX, position[1], snappedZ];

        const adjustedPosition = adjustPositionToAvoidOverlap(
          proposedPosition,
          id,
          existingModels,
          snapSize
        );

        // Check if multiple models are selected and move them together
       if (selectedModelId === 'ALL') {
         // Move all models
         const deltaX = adjustedPosition[0] - position[0];
         const deltaZ = adjustedPosition[2] - position[2];
         
         const updatedModels = existingModels.map(model => ({
           ...model,
           position: [
             model.position[0] + deltaX,
             model.position[1],
             model.position[2] + deltaZ
           ]
         }));
         
         useModelStore.setState({ selectedModels: updatedModels });
       } else if (Array.isArray(selectedModelId) && selectedModelId.includes(id)) {
         // Move multiple selected models
         const deltaX = adjustedPosition[0] - position[0];
         const deltaZ = adjustedPosition[2] - position[2];
         
         const updatedModels = existingModels.map(model => {
           if (selectedModelId.includes(model.id)) {
             return {
               ...model,
               position: [
                 model.position[0] + deltaX,
                 model.position[1],
                 model.position[2] + deltaZ
               ]
             };
           }
           return model;
         });
         
         useModelStore.setState({ selectedModels: updatedModels });
       }
      }
    };

    window.addEventListener('mousemove', handleGlobalMouseMove);
    return () => window.removeEventListener('mousemove', handleGlobalMouseMove);
  }, [isDragging, dragStartPosition, dragStartMouse, position, id, updateModelPosition, raycaster, camera, gl, modelOptions.snapSize, existingModels]);


  // حذف مدل
  const deleteModelHandler = () => {
    pushHistory();
    useModelStore.setState((state) => ({
      selectedModels: state.selectedModels.filter((model) => model.id !== id),
    }));
  };

  // تکثیر مدل
  const duplicateModelHandler = () => {
    const newModel = {
      id: Date.now().toString(),
      path: path,
      position: [position[0] + 1, position[1], position[2] + 1], // Offset position
      rotation: [...rotation]
    };
    pushHistory();
    useModelStore.setState((state) => ({
      selectedModels: [...state.selectedModels, newModel],
    }));
  };

  const controlsWithDelete = {
    ...modelControls,
    deleteModel: deleteModelHandler,
  };

  if (!isValid || !clonedSceneState) return null;

  return (
    <group ref={modelRef} position={position}>
      <primitive
        object={clonedSceneState}
        rotation={rotation}
        // حذف انتخاب با کلیک چپ؛ انتخاب با راست‌کلیک انجام می‌شود
        onContextMenu={handleRightClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        style={{ cursor: isDragging ? 'grabbing' : (isHovered ? 'grab' : 'pointer') }}
      />

      <ModelControls
        position={position}
        isSelected={isSelected}
        controls={controlsWithDelete}
      />

      <ContextMenu
        position={position}
        isVisible={showContextMenu}
        onClose={() => setShowContextMenu(false)}
      />
    </group>
  );
};

export default Model;

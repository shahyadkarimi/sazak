import { useEffect, useRef } from "react";
import useModelStore from "@/store/useModelStore";
import { useModelScene } from "@/hooks/useModelScene";
import { useModelAdjustment } from "@/hooks/useModelAdjustment";
import ModelControls from "./ModelControls";

const Model = ({ path, position, id, rotation }) => {
  const modelRef = useRef();

  // استفاده از کاستوم هوک برای لود و تنظیم سین مدل
  const { scene: adjustedScene, isValid } = useModelScene(path);

  // دریافت state و اکشن‌های مورد نیاز از استور
  const selectedModelId = useModelStore((s) => s.selectedModelId);
  const setSelectedModelId = useModelStore((s) => s.setSelectedModelId);
  const updateModelPosition = useModelStore((s) => s.updateModelPosition);
  const updateModelRotation = useModelStore((s) => s.updateModelRotation);
  const setIsAdjustingHeight = useModelStore((s) => s.setIsAdjustingHeight);

  // استفاده از کاستوم هوک برای مدیریت تنظیمات مدل
  const modelControls = useModelAdjustment(
    id,
    position,
    rotation,
    updateModelPosition,
    updateModelRotation
  );

  // اگر path یا scene نامعتبر باشه، رندر رو متوقف می‌کنیم
  if (!isValid) {
    return null;
  }

  // انتخاب مدل
  const handleClick = (event) => {
    event.stopPropagation();
    setSelectedModelId(id);
  };

  // حذف مدل
  const deleteModelHandler = () => {
    useModelStore.setState((state) => ({
      selectedModels: state.selectedModels.filter((model) => model.id !== id),
    }));
  };

  // اضافه کردن دستگیره حذف به کنترل‌ها
  const controlsWithDelete = {
    ...modelControls,
    deleteModel: deleteModelHandler,
  };

  // چک کردن آیا این مدل انتخاب شده است
  const isSelected = selectedModelId === id;

  // Effect برای مدیریت وضعیت جهانی تنظیم ارتفاع
  // این مورد را می‌توان به داخل کاستوم هوک useModelAdjustment منتقل کرد
  // اما به دلیل وابستگی به استور، اینجا نگه داشتیم
  const { isAdjustingHeight, isMoving } = modelControls;

  // تنظیم وضعیت در استور (این می‌تواند به useEffect منتقل شود)
  useEffect(() => {
    setIsAdjustingHeight(isAdjustingHeight || isMoving);
  }, [isAdjustingHeight, isMoving]);

  return (
    <group ref={modelRef}>
      <primitive
        object={adjustedScene}
        scale={100}
        position={position}
        rotation={rotation}
        onClick={handleClick}
      />

      <ModelControls
        position={position}
        isSelected={isSelected}
        controls={controlsWithDelete}
      />
    </group>
  );
};

export default Model;

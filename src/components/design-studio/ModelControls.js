import { Html } from "@react-three/drei";
import HeightIcon from "../icons/HeightIcon";
import MoveIcon from "../icons/MoveIcon";
import RotateIcon from "../icons/RotateIcon";
import DeleteIcon from "../icons/DeleteIcon";

const ModelControls = ({ position, isSelected, controls, isDragging }) => {
  const {
    startAdjustHeight,
    stopAdjustHeight,
    startMoving,
    stopMoving,
    startRotatingY,
    stopRotatingY,
    startRotatingX,
    stopRotatingX,
    startRotatingZ,
    stopRotatingZ,
  } = controls;

  const buttonStyle = {};

  if (isDragging) return null;

  return isSelected ? (
    <>
      <Html
        position={[position[0], position[1] - 10, position[2]]}
        style={{
          pointerEvents: "auto",
          userSelect: "none",
    
        }}
        className="min-w-fit"
      >
        <div
          className="w-fit flex justify-between items-center gap-3 text-xs text-gray-800 "
          onMouseDown={(e) => e.stopPropagation()}
        >

          <button
            style={{ ...buttonStyle, cursor: "ns-resize" }}
            onMouseDown={startAdjustHeight}
            onMouseUp={stopAdjustHeight}
            title="تنظیم ارتفاع"
            className="flex items-center gap-1 px-3 py-2 rounded-xl bg-white shadow-lg"
          >
            <HeightIcon width={16} height={16} />
            <span>ارتفاع</span>
          </button>

          <button
            style={{ ...buttonStyle, cursor: "ew-resize" }}
            onMouseDown={startRotatingY}
            onMouseUp={stopRotatingY}
            title="چرخش حول محور Y (کشیدن افقی)"
            className="min-w-fit flex items-center gap-1 px-3 py-2 rounded-xl bg-white shadow-lg"
          >
            <RotateIcon />
            <span>چرخش Y</span>
          </button>

          <button
            style={{ ...buttonStyle, cursor: "ns-resize" }}
            onMouseDown={startRotatingX}
            onMouseUp={stopRotatingX}
            title="چرخش حول محور X (کشیدن عمودی)"
            className="min-w-fit flex items-center gap-1 px-3 py-2 rounded-xl bg-white shadow-lg"
          >
            <RotateIcon />
            <span>چرخش X</span>
          </button>

          <button
            style={{ ...buttonStyle, cursor: "grab" }}
            onMouseDown={startRotatingZ}
            onMouseUp={stopRotatingZ}
            title="چرخش حول محور Z"
            className="min-w-fit flex items-center gap-1 px-3 py-2 rounded-xl bg-white shadow-lg"
          >
            <RotateIcon />
            <span>چرخش Z</span>
          </button>

          {/* <button
            style={buttonStyle}
            onClick={controls.deleteModel}
            title="حذف مدل"
            className="min-w-fit flex items-center gap-1 px-3 py-2 rounded-xl bg-white shadow-lg"
          >
            <DeleteIcon />
            <span>حذف</span>
          </button> */}
        </div>
      </Html>
    </>
  ) : null;
};

export default ModelControls;

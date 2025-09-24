import { Html } from "@react-three/drei";
import HeightIcon from "../icons/HeightIcon";
import MoveIcon from "../icons/MoveIcon";
import RotateIcon from "../icons/RotateIcon";
import DeleteIcon from "../icons/DeleteIcon";

const ModelControls = ({ position, isSelected, controls }) => {
  const {
    startAdjustHeight,
    stopAdjustHeight,
    startMoving,
    stopMoving,
    startRotatingY,
    stopRotatingY,
    startRotatingX,
    stopRotatingX,
  } = controls;

  const buttonStyle = {};

  return isSelected ? (
    <>
      <Html
        position={[position[0], position[1], position[2]]}
        style={{
          pointerEvents: "auto",
          userSelect: "none",
    
        }}
        className="min-w-fit"
      >
        <div
          className="w-[360px] flex justify-between items-center gap-3 text-xs text-gray-800 "
          onMouseDown={(e) => e.stopPropagation()}
        >
          {/* دکمه تنظیم ارتفاع */}
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
          {/* دکمه جابجایی */}
          <button
            style={{ ...buttonStyle, cursor: "move" }}
            onMouseDown={startMoving}
            onMouseUp={stopMoving}
            title="جابجایی"
            className="flex items-center gap-1 px-3 py-2 rounded-xl bg-white shadow-lg"
          >
            <MoveIcon />
            <span>جابجایی</span>
          </button>
          {/* دکمه چرخش حول محور Y با موس */}
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
          {/* دکمه چرخش حول محور X با موس */}
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
          {/* دکمه حذف */}
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

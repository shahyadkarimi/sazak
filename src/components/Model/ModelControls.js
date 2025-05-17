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
        position={[position[0] - 0.4, position[1] + 3.5, position[2]]}
        style={{
          pointerEvents: "auto",
          userSelect: "none",
          transform: "translate(50%, -0)",
        }}
      >
        {/* دکمه تنظیم ارتفاع */}
        <button
          style={{ ...buttonStyle, cursor: "ns-resize" }}
          onMouseDown={startAdjustHeight}
          onMouseUp={stopAdjustHeight}
          title="تنظیم ارتفاع"
          className="flex items-center gap-1 text-xs px-3 py-2 rounded-xl bg-white shadow-lg abs"
        >
          <HeightIcon width={16} height={16} />
          {/* <span>ارتفاع</span> */}
        </button>
      </Html>

      <Html
        position={[position[0] - 0.4, position[1] - 0.3, position[2]]}
        style={{
          pointerEvents: "auto",
          userSelect: "none",
          transform: "translate(50%, 0)",
        }}
      >
        {/* دکمه جابجایی */}
        <button
          style={{ ...buttonStyle, cursor: "move" }}
          onMouseDown={startMoving}
          onMouseUp={stopMoving}
          title="جابجایی"
          className="flex items-center gap-1 text-xs px-3 py-2 rounded-xl bg-white shadow-lg"
        >
          <MoveIcon />
          {/* <span>جابجایی</span> */}
        </button>
      </Html>
    </>
  ) : null;
};

export default ModelControls;

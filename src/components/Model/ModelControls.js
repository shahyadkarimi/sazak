import { Html } from "@react-three/drei";

const ModelControls = ({ position, isSelected, controls }) => {
  const { 
    startAdjustHeight, 
    stopAdjustHeight, 
    startMoving, 
    stopMoving,
    startRotatingY,
    stopRotatingY,
    startRotatingX,
    stopRotatingX
  } = controls;

  const buttonStyle = {
    padding: "5px 10px",
    cursor: "pointer",
    fontSize: "16px"
  };

  return isSelected ? (
    <Html
      position={[position[0], position[1] + 1, position[2]]}
      style={{ pointerEvents: "auto", userSelect: "none" }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          background: "rgba(0,0,0,0.5)",
          padding: "10px",
          borderRadius: "5px",
          gap: "10px",
        }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* دکمه تنظیم ارتفاع */}
        <button
          style={{ ...buttonStyle, cursor: "ns-resize" }}
          onMouseDown={startAdjustHeight}
          onMouseUp={stopAdjustHeight}
          title="تنظیم ارتفاع"
        >
          ↕
        </button>
        {/* دکمه جابجایی */}
        <button
          style={{ ...buttonStyle, cursor: "move" }}
          onMouseDown={startMoving}
          onMouseUp={stopMoving}
          title="جابجایی"
        >
          ↔
        </button>
        {/* دکمه چرخش حول محور Y با موس */}
        <button
          style={{ ...buttonStyle, cursor: "ew-resize" }}
          onMouseDown={startRotatingY}
          onMouseUp={stopRotatingY}
          title="چرخش حول محور Y (کشیدن افقی)"
        >
          Y↻
        </button>
        {/* دکمه چرخش حول محور X با موس */}
        <button
          style={{ ...buttonStyle, cursor: "ns-resize" }}
          onMouseDown={startRotatingX}
          onMouseUp={stopRotatingX}
          title="چرخش حول محور X (کشیدن عمودی)"
        >
          X↻
        </button>
        {/* دکمه حذف */}
        <button
          style={buttonStyle}
          onClick={controls.deleteModel}
          title="حذف مدل"
        >
          D
        </button>
      </div>
    </Html>
  ) : null;
};

export default ModelControls;
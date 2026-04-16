import React from "react";

const ProgressBar = ({ value, max = 100, height = "6px", color = "#c8a96e" }) => {
  const percentage = Math.min((value / max) * 100, 100);

  return (
    <div className="progress-track" style={{ height }}>
      <div
        className="progress-fill"
        style={{ width: `${percentage}%`, backgroundColor: color }}
      />
    </div>
  );
};

export default ProgressBar;

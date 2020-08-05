import { h, c, Component, Any } from "atomico";
import style from "./data-circle-progress.css";

interface Props {
  size: string;
  parts: number;
  progress: number;
  brColor: string;
  brColorPositive: string;
  brColorNegative: string;
  brSize: string;
  brColorCero: string;
  brSizeState: string;
}

const DataCircleProgress: Component<Props> = ({
  size,
  parts,
  progress,
  brSize,
  brSizeState = brSize,
  brColor,
  brColorCero,
  brColorNegative,
  brColorPositive,
}) => {
  const radio = 40;
  const arco = Math.PI * 2 * radio;
  const deg90 = arco / 4;
  const sizeProgress = Math.abs((arco / parts) * progress);
  const sizeDiff = arco - sizeProgress;
  const strokeState =
    progress == 0
      ? brColorCero
      : progress > 0
      ? brColorPositive
      : brColorNegative;
  return (
    <host shadowDom>
      <style>{style}</style>
      <svg width={size} viewBox="0 0 100 100">
        <circle
          cx="50"
          cy="50"
          r={radio}
          stroke={brColor}
          stroke-width={brSize}
          fill="transparent"
        />
        <g
          transform={"scale(-1,1)"}
          transform-origin="center"
          style={progress > 0 ? "opacity:1" : "opacity:1"}
        >
          {circle({
            radio,
            brSize: brSizeState,
            stroke: strokeState,
            dasharray:
              progress > 0 ? "0," + arco : sizeProgress + "," + sizeDiff,
            deg90,
          })}
        </g>
        <g style={progress > 0 ? "opacity:1" : "opacity:1"}>
          {circle({
            radio,
            brSize: brSizeState,
            stroke: strokeState,
            dasharray:
              progress > 0 ? sizeProgress + "," + sizeDiff : "0," + arco,
            deg90,
          })}
        </g>
      </svg>
      <div class="centered">
        <slot></slot>
      </div>
    </host>
  );
};

const circle = ({ radio, brSize, stroke, dasharray, deg90 }) => (
  <circle
    cx="50"
    cy="50"
    r={radio}
    stroke={stroke}
    style="transition:1s ease all"
    stroke-width={brSize}
    stroke-dashoffset={deg90}
    stroke-dasharray={dasharray}
    stroke-linecap="round"
    fill="transparent"
  />
);

DataCircleProgress.props = {
  progress: { type: Number, value: 0.5, reflect: true },
  parts: {
    type: Number,
    value: 1,
  },
  brColor: {
    type: String,
    value: "rgba(0,0,0,.1)",
  },
  brColorPositive: {
    type: String,
    value: "#1FE668",
  },
  brColorNegative: {
    type: String,
    value: "tomato",
  },
  brSize: {
    type: String,
    value: "6",
  },
  brSizeState: {
    type: String,
  },
  brColorCero: {
    type: String,
    value: "black",
  },
  size: {
    type: String,
    value: "100px",
  },
};

customElements.define("data-circle-progress", c(DataCircleProgress));

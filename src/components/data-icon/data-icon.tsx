import { h, c, Component } from "atomico";

interface Props {
  type: string;
  size: string;
  color: string;
  opacity: number;
  transform: string;
}

const DataIconArrow: Component<Props> = ({
  type,
  size,
  color,
  transform,
  opacity,
}) => {
  return (
    <host shadowDom>
      <style>{`g {opacity:${opacity}; transform-origin: center; transition:1s ease all; transform:${
        transform || "none"
      }}`}</style>
      {type == "arrow" && (
        <svg height={size} viewBox="0 0 13 9">
          <g>
            <path
              d="M5.689,1.122a1,1,0,0,1,1.621,0l4.544,6.292A1,1,0,0,1,11.044,9H1.956a1,1,0,0,1-.811-1.585Z"
              fill={color}
            />
          </g>
        </svg>
      )}
      {type == "equal" && (
        <svg width="11.001" height={size} viewBox="0 0 11.001 8">
          <g>
            <path
              d="M-2073.6-1809a1.5,1.5,0,0,1-1.5-1.5,1.5,1.5,0,0,1,1.5-1.5h8a1.5,1.5,0,0,1,1.5,1.5,1.5,1.5,0,0,1-1.5,1.5Zm0-5a1.5,1.5,0,0,1-1.5-1.5,1.5,1.5,0,0,1,1.5-1.5h8a1.5,1.5,0,0,1,1.5,1.5,1.5,1.5,0,0,1-1.5,1.5Z"
              transform="translate(2075.1 1817)"
              fill={color}
            />
          </g>
        </svg>
      )}
    </host>
  );
};

DataIconArrow.props = {
  type: {
    type: String,
    value: "arrow",
  },
  size: {
    type: String,
    value: "10",
  },
  color: {
    type: String,
    value: "#1FE668",
  },
  transform: {
    type: String,
    value: "",
  },
  opacity: {
    type: Number,
    value: 1,
  },
};

customElements.define("data-icon", c(DataIconArrow));

import { h, c, Component } from "atomico";

interface Props {
  cases: string;
  progress: number;
}

const DataSlotProgress: Component<Props> = ({ cases, progress }) => {
  const slots = cases
    .split(/ *, */)
    .map((item) => {
      const test = item.match(/^ *([^\s]+) +([\d|.]+)(<|>){0,1}(=){0,1}$/);

      if (test) {
        const [, name, strN, case1, case2] = test;
        const value = Number(strN);
        const test1 = case1 && logic[case1](value);
        const test2 = case2 && logic[case2](value);
        return {
          name,
          test:
            test1 && test2
              ? (value: number) => test1(value) || test2(value)
              : test1 || test2,
        };
      }
    })
    .filter((value) => value);

  const slot = slots.find(({ test }) => test(progress));
  console.log(slot.name);
  return (
    <host shadowDom>
      <slot name={slot.name}></slot>
    </host>
  );
};

const logic = {
  ">": (a: number) => (b: number) => a < b,
  "<": (a: number) => (b: number) => a > b,
  "=": (a: number) => (b: number) => a == b,
};

DataSlotProgress.props = {
  cases: String,
  progress: Number,
};

customElements.define("data-slot-progress", c(DataSlotProgress));

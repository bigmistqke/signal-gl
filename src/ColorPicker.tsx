import { createEffect } from "solid-js";
import { createStore } from "solid-js/store";

type Vector4 = [number, number, number, number];

const Input = (props: { onInput: (value: number) => any, value: any }) => (
  <input
    type="number"
    value={props.value}
    onInput={(e) => props.onInput(parseInt(e.currentTarget.value))}
  />
);

export const ColorPicker = (props: { value: Vector4; onInput: (value: Vector4) => any }) => {
  const [rgba, setRgba] = createStore<Vector4>([1, 0, 0, 1]);

  createEffect(() => props.onInput(rgba))

  return (
    <div style={{ display: "flex", "flex-direction": "column" }}>
      <label>red:</label>
      <Input value={props.value[0] * 250} onInput={(value) => setRgba(0, value / 250)} />
      <label>green:</label>
      <Input value={props.value[1] * 250} onInput={(value) => setRgba(1, value / 250)} />
      <label>blue:</label>
      <Input value={props.value[2] * 250} onInput={(value) => setRgba(2, value / 250)} />
      <label>alpha:</label>
      <Input value={props.value[3] * 250} onInput={(value) => setRgba(3, value / 250)} />
    </div>
  );
};
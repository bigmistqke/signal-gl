import { createSignal, type ComponentProps } from "solid-js";

export function createInput<T extends number | string>(
  value: T,
  config?: ComponentProps<"input"> & { scale?: number },
) {
  const [signal, setSignal] = createSignal<T>(value);
  const Input = (props: ComponentProps<"input">) => (
    <input
      type={typeof value === "number" ? "number" : "text"}
      {...config}
      {...props}
      value={signal()}
      onInput={(e) => {
        typeof signal() === "number"
          ? setSignal(() => parseFloat(e.currentTarget.value) as T)
          : setSignal(() => e.currentTarget.value as T);
        props.onInput?.(e);
        config?.onInput?.(e);
      }}
    />
  );

  const derived = () => {
    const value = signal();
    if (typeof value === "number" && config?.scale) {
      return value * config.scale;
    }
    return value;
  };

  return [Input, derived, setSignal] as const;
}

import {
  forwardRef,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { AlertCircle, LoaderCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
export const Button = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "primary" | "secondary" | "ghost";
    busy?: boolean;
  }
>(({ className = "", variant = "primary", busy, children, ...props }, ref) => (
  <button
    ref={ref}
    className={`button button-${variant} ${className}`}
    {...props}
  >
    {busy && <LoaderCircle className="spin" size={18} />} {children}
  </button>
));
Button.displayName = "Button";
export const Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement>
>(({ className = "", ...props }, ref) => (
  <input ref={ref} className={`input ${className}`} {...props} />
));
Input.displayName = "Input";
export function Card({
  className = "",
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={`card ${className}`} {...props} />;
}
export function Badge({
  tone = "neutral",
  children,
}: {
  tone?: "neutral" | "success" | "warning" | "danger";
  children: ReactNode;
}) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}
export function Skeleton({ className = "" }: { className?: string }) {
  const { t } = useTranslation();
  return (
    <div
      role="status"
      aria-label={t("loading")}
      className={`skeleton ${className}`}
    />
  );
}
export function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  disabled,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  return (
    <SliderPrimitive.Root
      className="slider"
      value={[
        Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : min,
      ]}
      min={min}
      max={max}
      step={step}
      onValueChange={(v) => onChange(v[0])}
      disabled={disabled}
    >
      <SliderPrimitive.Track className="slider-track">
        <SliderPrimitive.Range className="slider-range" />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb className="slider-thumb" aria-label={label} />
    </SliderPrimitive.Root>
  );
}
export function Tooltip({
  text,
  children,
}: {
  text: string;
  children: ReactNode;
}) {
  return (
    <TooltipPrimitive.Root>
      <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content className="tooltip" sideOffset={8}>
          {text}
          <TooltipPrimitive.Arrow className="tooltip-arrow" />
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  );
}
export function Tabs({
  value,
  onChange,
  items,
  label,
  children,
}: {
  value: string;
  onChange: (v: string) => void;
  items: { id: string; label: string }[];
  label: string;
  children?: ReactNode;
}) {
  // Filters and mode switches are button groups; actual tab views supply a panel.
  if (!children)
    return (
      <div className="tabs" role="group" aria-label={label}>
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            className="tab"
            aria-pressed={value === item.id}
            data-state={value === item.id ? "active" : "inactive"}
            onClick={() => onChange(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
    );
  return (
    <TabsPrimitive.Root value={value} onValueChange={onChange}>
      <TabsPrimitive.List className="tabs" aria-label={label}>
        {items.map((item) => (
          <TabsPrimitive.Trigger className="tab" key={item.id} value={item.id}>
            {item.label}
          </TabsPrimitive.Trigger>
        ))}
      </TabsPrimitive.List>
      <TabsPrimitive.Content value={value}>{children}</TabsPrimitive.Content>
    </TabsPrimitive.Root>
  );
}
export function ErrorNotice({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="notice notice-danger" role="alert">
      <AlertCircle size={20} />
      <div>
        <p>{message}</p>
        {onRetry && (
          <Button variant="ghost" onClick={onRetry}>
            {t("retry")}
          </Button>
        )}
      </div>
    </div>
  );
}

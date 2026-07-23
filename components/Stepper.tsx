"use client";

export default function Stepper({
  value,
  onChange,
  step = 1,
  min = 0,
  disabled = false,
  placeholder,
}: {
  value: number | null;
  onChange: (value: number) => void;
  step?: number;
  min?: number;
  disabled?: boolean;
  placeholder?: string;
}) {
  function set(next: number) {
    if (disabled) return;
    onChange(Math.max(min, next));
  }

  return (
    <div
      className="input"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 2,
        padding: "2px",
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <button
        type="button"
        className="btn btn-secondary"
        style={{ padding: "1px 5px", fontSize: 12, lineHeight: 1.4, flex: "none" }}
        disabled={disabled}
        onClick={() => set((value ?? 0) - step)}
        aria-label="Decrease"
      >
        −
      </button>
      <input
        type="number"
        value={value ?? ""}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value === "" ? 0 : parseFloat(e.target.value))}
        style={{
          width: 0,
          flex: "1 1 auto",
          minWidth: 0,
          border: "none",
          background: "transparent",
          textAlign: "center",
          font: "inherit",
          fontSize: 13,
          color: "var(--color-text)",
        }}
      />
      <button
        type="button"
        className="btn btn-secondary"
        style={{ padding: "1px 5px", fontSize: 12, lineHeight: 1.4, flex: "none" }}
        disabled={disabled}
        onClick={() => set((value ?? 0) + step)}
        aria-label="Increase"
      >
        +
      </button>
    </div>
  );
}

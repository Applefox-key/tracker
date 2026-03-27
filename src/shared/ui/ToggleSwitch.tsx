interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  id?: string;
}

export function ToggleSwitch({ checked, onChange, label, id }: ToggleSwitchProps) {
  const inputId = id ?? `toggle-${Math.random().toString(36).slice(2)}`;

  return (
    <label htmlFor={inputId} className="flex items-center gap-2 cursor-pointer select-none group">
      <div className="relative shrink-0">
        <input
          id={inputId}
          type="checkbox"
          className="sr-only"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        {/* Track */}
        <div
          className={[
            "w-9 h-5 rounded-full transition-colors duration-200",
            checked ? "bg-emerald-600" : "bg-gray-300 group-hover:bg-gray-400",
          ].join(" ")}
        />
        {/* Thumb */}
        <div
          className={[
            "absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200",
            checked ? "translate-x-4" : "translate-x-0",
          ].join(" ")}
        />
      </div>
      {label && <span className="text-xs text-gray-600">{label}</span>}
    </label>
  );
}

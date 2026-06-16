import { useEffect } from "react";

interface SideDrawerProps {
  open: boolean;
  onClose: () => void;
  onOpen: () => void;
  side?: "left" | "right";
  tabLabel: string;
  tabIcon?: React.ReactNode;
  title: string;
  hasActiveIndicator?: boolean;
  topline?: boolean;
  children: React.ReactNode;
}

export function SideDrawer({
  open,
  onClose,
  onOpen,
  side = "right",
  tabLabel,
  tabIcon,
  title,
  hasActiveIndicator = false,
  topline = false,
  children,
}: SideDrawerProps) {
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const isRight = side === "right";

  return (
    <>
      {/* Peek tab — mobile only */}
      <button
        onClick={open ? onClose : onOpen}
        className={`sm:hidden fixed z-[51] bg-emerald-600 text-white shadow-lg select-none flex flex-col items-center gap-1 p-2 opacity-70
          transition-[transform,opacity] duration-300 ease-in-out
          ${open ? "opacity-100" : "opacity-70"}
          ${topline ? "top-[12px]" : "top-[126px]"}
          ${isRight ? "right-0 rounded-l-xl" : "left-0 rounded-r-xl"}
          ${isRight && open ? "-translate-x-72" : ""}
          ${!isRight && open ? "translate-x-72" : ""}`}>
        {tabIcon}
        <span
          className="font-bold leading-none tracking-wide"
          style={topline ? { fontSize: "10px" } : { fontSize: "9px" }}>
          {tabLabel}
        </span>
        {hasActiveIndicator && (
          <span
            className={`absolute -top-1 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white dark:border-gray-900 ${
              isRight ? "-left-1" : "-right-1"
            }`}
          />
        )}
      </button>

      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`sm:hidden fixed inset-0 z-40 bg-black/30 backdrop-blur-sm transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* Drawer panel */}
      <div
        className={`sm:hidden fixed inset-y-0 z-50 w-72 bg-white dark:bg-gray-900 shadow-2xl
          flex flex-col transition-transform duration-300 ease-in-out
          ${isRight ? "right-0" : "left-0"}
          ${open ? "translate-x-0" : isRight ? "translate-x-full" : "-translate-x-full"}`}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 shrink-0">
          <span className="font-semibold text-sm text-gray-800 dark:text-gray-100">{title}</span>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors rounded-md">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-5">{children}</div>
      </div>
    </>
  );
}

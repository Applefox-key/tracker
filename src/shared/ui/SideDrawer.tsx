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
  verticalPosition?: string;
  headerAction?: React.ReactNode;
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
  verticalPosition = "top-0",
  headerAction,
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
        className={`sm:hidden fixed z-[51] bg-emerald-600 text-white shadow-lg select-none flex  items-center justify-center gap-1 p-2 opacity-70
          transition-[transform,opacity] duration-300 ease-in-out h-14 
          ${open ? "opacity-100" : "opacity-70"}
  
          ${verticalPosition}
          ${isRight ? "right-0 rounded-l-md" : "left-0 rounded-r-md"}
          ${isRight && open ? "-translate-x-[22rem]" : ""}
          ${!isRight && open ? "translate-x-[22rem]" : ""}`}>
        {tabIcon}

        <span className="font-bold leading-none tracking-wide flex items-center gap-0.5" style={{ fontSize: "12px" }}>
          {tabLabel}
          {!tabIcon && (
            <span className={`transition-transform duration-300 inline-block ${open ? "rotate-180" : ""}`}>{">"}</span>
          )}
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
        className={`sm:hidden fixed inset-y-0 z-50 w-[22rem] bg-white dark:bg-gray-900 shadow-2xl
          flex flex-col transition-transform duration-300 ease-in-out
          ${isRight ? "right-0" : "left-0"}
          ${open ? "translate-x-0" : isRight ? "translate-x-full" : "-translate-x-full"}`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700 shrink-0">
          <span className="font-semibold text-base text-gray-800 dark:text-gray-100">{title}</span>
          <div className="flex items-center gap-3">
            {headerAction}
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors rounded-md">
              <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
                <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-5">{children}</div>
      </div>
    </>
  );
}

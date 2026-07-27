import { useEffect } from "react";

export interface HelpSetting {
  icon: string;
  label: string;
  desc: string;
}

interface PracticeHelpModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  howToPlayLabel: string;
  description: string;
  settings?: HelpSetting[];
  settingsLabel?: string;
  closeLabel: string;
}

export function PracticeHelpModal({
  open,
  onClose,
  title,
  howToPlayLabel,
  description,
  settings,
  settingsLabel,
  closeLabel,
}: PracticeHelpModalProps) {
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="pointer-events-auto w-full max-w-sm bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col"
          onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
            <span className="font-bold text-gray-900 dark:text-gray-100">{title}</span>
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors rounded-md">
              <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
                <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          <div className="px-5 py-4 flex flex-col gap-4">
            <div>
              <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-1.5">
                {howToPlayLabel}
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{description}</p>
            </div>

            {settings && settings.length > 0 && settingsLabel && (
              <div>
                <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">
                  {settingsLabel}
                </p>
                <ul className="flex flex-col gap-2.5">
                  {settings.map((s, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <span className="text-base shrink-0 leading-none mt-0.5">{s.icon}</span>
                      <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                        <span className="font-semibold text-gray-700 dark:text-gray-300">{s.label}</span>
                        {" — "}
                        {s.desc}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="px-5 pb-5 pt-1">
            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-sm font-semibold transition-colors">
              {closeLabel}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

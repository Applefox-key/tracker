import { useEffect, useRef, useState } from "react";
import { useUserSettings } from "@/hooks/useUserSettings";
import { ALL_SPEECH_LANGS, type LangCode } from "@/lib/userSettings";

interface Props {
  /** Text to speak */
  text: string;
  className?: string;
}

const supported = typeof window !== "undefined" && "speechSynthesis" in window;

/** Compound speak + language picker button. Left half triggers playback; right half opens a language dropdown. */
export function SpeakButton({ text, className = "" }: Props) {
  const { speechLangs } = useUserSettings();
  const langs = ALL_SPEECH_LANGS.filter((l) => speechLangs.includes(l.code));

  const [speaking, setSpeaking] = useState(false);
  const [lang, setLang] = useState<LangCode>(speechLangs[0] ?? "");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const utRef = useRef<SpeechSynthesisUtterance | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // When user's lang list changes, reset active lang to first in the new list
  useEffect(() => {
    setLang(speechLangs[0] ?? "");
  }, [speechLangs.join(",")]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cancel on unmount
  useEffect(() => () => { window.speechSynthesis?.cancel(); }, []);

  // Close dropdown on outside click
  useEffect(() => {
    if (!dropdownOpen) return;
    function onPointerDown(e: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [dropdownOpen]);

  // Close dropdown on Escape
  useEffect(() => {
    if (!dropdownOpen) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setDropdownOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [dropdownOpen]);

  if (!supported) return null;

  function handleSpeak(e: React.MouseEvent) {
    e.stopPropagation();
    setDropdownOpen(false);
    const synth = window.speechSynthesis;
    if (speaking) {
      synth.cancel();
      setSpeaking(false);
      return;
    }
    const u = new SpeechSynthesisUtterance(text);
    if (lang) u.lang = lang;
    u.onend = () => setSpeaking(false);
    u.onerror = () => setSpeaking(false);
    utRef.current = u;
    synth.cancel();
    synth.speak(u);
    setSpeaking(true);
  }

  function handleLangButtonClick(e: React.MouseEvent) {
    e.stopPropagation();
    setDropdownOpen((v) => !v);
  }

  function handleLangSelect(e: React.MouseEvent, code: LangCode) {
    e.stopPropagation();
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
    }
    setLang(code);
    setDropdownOpen(false);
  }

  const currentLabel = langs.find((l) => l.code === lang)?.label ?? lang;
  const hasMultipleLangs = langs.length > 1;

  const activeBg = speaking
    ? "bg-emerald-500 text-white animate-pulse"
    : "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-800/60";

  const borderColor = speaking
    ? "border-emerald-500 dark:border-emerald-400"
    : "border-emerald-300 dark:border-emerald-700";

  return (
    <div ref={containerRef} className={`relative inline-flex items-center ${className}`}>
      <div className={`inline-flex items-center rounded-full border ${borderColor}`}>
        {/* Speak button — left half */}
        <button
          type="button"
          onClick={handleSpeak}
          title={speaking ? "Stop" : "Read aloud"}
          className={`inline-flex items-center justify-center w-7 h-7 transition-colors shrink-0 ${activeBg} ${
            hasMultipleLangs ? "rounded-l-full" : "rounded-full"
          }`}
        >
          {speaking ? (
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="6" width="12" height="12" rx="1.5" />
            </svg>
          ) : (
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
            </svg>
          )}
        </button>

        {/* Divider + lang button — right half */}
        {hasMultipleLangs && (
          <>
            <div className={`w-px self-stretch ${speaking ? "bg-emerald-400 dark:bg-emerald-500" : "bg-emerald-300 dark:bg-emerald-700"}`} />
            <button
              type="button"
              onClick={handleLangButtonClick}
              title="Change language"
              className={`inline-flex items-center gap-0.5 pl-1.5 pr-2 h-7 text-xs font-semibold rounded-r-full transition-colors ${
                speaking
                  ? "bg-emerald-500 text-white animate-pulse"
                  : "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-800/60"
              }`}
            >
              {currentLabel}
              <svg
                className={`w-2.5 h-2.5 transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M7 10l5 5 5-5z" />
              </svg>
            </button>
          </>
        )}
      </div>

      {/* Dropdown */}
      {dropdownOpen && hasMultipleLangs && (
        <div className="absolute right-0 top-full mt-1 z-50 min-w-[90px] rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-lg py-1">
          {langs.map(({ code, label }) => (
            <button
              key={code}
              type="button"
              onClick={(e) => handleLangSelect(e, code)}
              className={`w-full text-left px-3 py-1.5 text-xs transition-colors ${
                code === lang
                  ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 font-semibold"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

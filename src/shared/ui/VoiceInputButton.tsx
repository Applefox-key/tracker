import { useEffect, useRef, useState } from "react";
import { useUserSettings } from "@/hooks/useUserSettings";
import { ALL_SPEECH_LANGS, type LangCode } from "@/lib/userSettings";

interface Props {
  /** Called continuously with the current transcript while recording. */
  onResult: (text: string) => void;
  /** Controlled selected language. If omitted, component manages its own state. */
  lang?: LangCode;
  /** Called when user switches language. Required when `lang` is provided. */
  onLangChange?: (lang: LangCode) => void;
  className?: string;
}

// Minimal type shim — lib.dom.d.ts may not include SpeechRecognition in all TS configs
interface ISpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: ((event: ISpeechRecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
}
interface ISpeechRecognitionEvent {
  results: { length: number; [i: number]: { isFinal: boolean; [j: number]: { transcript: string } } };
}
type SpeechRecognitionCtor = new () => ISpeechRecognition;

function getSpeechRecognition(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as Record<string, unknown>;
  return (w["SpeechRecognition"] ?? w["webkitSpeechRecognition"] ?? null) as SpeechRecognitionCtor | null;
}

const supported = !!getSpeechRecognition();

/**
 * Compound mic + language picker button.
 * Left half triggers recording; right half opens a language dropdown.
 */
export function VoiceInputButton({ onResult, lang: controlledLang, onLangChange, className = "" }: Props) {
  const { speechLangs } = useUserSettings();
  const langs = ALL_SPEECH_LANGS.filter((l) => speechLangs.includes(l.code));

  const [recording, setRecording] = useState(false);
  const [internalLang, setInternalLang] = useState<LangCode>(speechLangs[0] ?? "");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const recognitionRef = useRef<ISpeechRecognition | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const lang = controlledLang ?? internalLang;

  function setLang(code: LangCode) {
    if (controlledLang !== undefined) {
      onLangChange?.(code);
    } else {
      setInternalLang(code);
    }
  }

  // When user's lang list changes, reset active lang to first in the new list (uncontrolled only)
  useEffect(() => {
    if (controlledLang === undefined) setInternalLang(speechLangs[0] ?? "");
  }, [speechLangs.join(",")]); // eslint-disable-line react-hooks/exhaustive-deps

  // Stop recognition on unmount
  useEffect(() => () => { recognitionRef.current?.stop(); }, []);

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

  function start() {
    const API = getSpeechRecognition()!;
    const r = new API();
    r.continuous = true;
    r.interimResults = true;
    if (lang) r.lang = lang;

    r.onresult = (event) => {
      let final = "";
      let interim = "";
      for (let i = 0; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) final += t;
        else interim += t;
      }
      onResult(final || interim);
    };

    r.onend = () => setRecording(false);
    r.onerror = () => setRecording(false);
    recognitionRef.current = r;
    r.start();
    setRecording(true);
  }

  function stop() {
    recognitionRef.current?.stop();
    setRecording(false);
  }

  function handleMicClick(e: React.MouseEvent) {
    e.stopPropagation();
    setDropdownOpen(false);
    if (recording) stop();
    else start();
  }

  function handleLangButtonClick(e: React.MouseEvent) {
    e.stopPropagation();
    setDropdownOpen((v) => !v);
  }

  function handleLangSelect(e: React.MouseEvent, code: LangCode) {
    e.stopPropagation();
    if (recording) stop();
    setLang(code);
    setDropdownOpen(false);
  }

  const currentLabel = langs.find((l) => l.code === lang)?.label ?? lang;
  const hasMultipleLangs = langs.length > 1;

  const micBg = recording
    ? "bg-red-500 text-white animate-pulse"
    : "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-800/60";

  return (
    <div ref={containerRef} className={`relative inline-flex items-center ${className}`}>
      <div
        className={`inline-flex items-center rounded-full border ${
          recording
            ? "border-red-400 dark:border-red-500"
            : "border-emerald-300 dark:border-emerald-700"
        } overflow-visible`}
      >
        {/* Mic button — left half */}
        <button
          type="button"
          onClick={handleMicClick}
          title={recording ? "Stop recording" : "Voice input"}
          className={`inline-flex items-center justify-center w-7 h-7 transition-colors shrink-0 ${micBg} ${
            hasMultipleLangs ? "rounded-l-full" : "rounded-full"
          }`}
        >
          {recording ? (
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 11h-1.7c0 .74-.16 1.43-.43 2.05l1.23 1.23c.56-.98.9-2.09.9-3.28zm-4.02.17c0-.06.02-.11.02-.17V5c0-1.66-1.34-3-3-3S9 3.34 9 5v.18l5.98 5.99zM4.27 3 3 4.27l6.01 6.01V11c0 1.66 1.33 3 2.99 3 .22 0 .44-.03.65-.08l1.66 1.66c-.71.33-1.5.52-2.31.52-2.76 0-5.3-2.1-5.3-5.1H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c.91-.13 1.77-.45 2.54-.9L19.73 21 21 19.73 4.27 3z" />
            </svg>
          ) : (
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z" />
            </svg>
          )}
        </button>

        {/* Divider + lang button — right half */}
        {hasMultipleLangs && (
          <>
            <div className={`w-px self-stretch ${recording ? "bg-red-300 dark:bg-red-600" : "bg-emerald-300 dark:bg-emerald-700"}`} />
            <button
              type="button"
              onClick={handleLangButtonClick}
              title="Change language"
              className={`inline-flex items-center gap-0.5 pl-1.5 pr-2 h-7 text-xs font-semibold rounded-r-full transition-colors ${
                recording
                  ? "bg-red-500 text-white animate-pulse"
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

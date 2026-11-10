import { FaChevronLeft } from "react-icons/fa";
import { IoMdArrowRoundBack } from "react-icons/io";

interface Props {
  onClick: () => void;
  label?: string;
}

export function BackButton({ onClick, label }: Props) {
  return (
    <>
      {/* Mobile: fixed to top-left corner */}
      <button
        onClick={onClick}
        aria-label={label ?? "Back"}
        className="sm:hidden fixed top-0 left-0 z-30 text-[30px] p-3 flex items-center justify-center rounded-br-md rounded-tr-md bg-emerald-600 opacity-70 text-white shadow-md active:scale-95 transition-transform shrink-0">
        <IoMdArrowRoundBack />
      </button>
      {/* Spacer keeps header layout intact on mobile (fixed btn is out of flow) */}
      <div className="sm:hidden w-10 h-10 shrink-0" aria-hidden="true" />

      {/* Desktop: inline neutral button */}
      <button
        onClick={onClick}
        aria-label={label ?? "Back"}
        className="hidden sm:flex w-9 h-9 items-center justify-center rounded-xl border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-200 transition-colors shrink-0">
        <FaChevronLeft className="text-sm" />
      </button>
    </>
  );
}

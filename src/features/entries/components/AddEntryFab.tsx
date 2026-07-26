import { Link } from "react-router-dom";
import { FaPlus } from "react-icons/fa6";

const FAB_CLASS =
  "sm:hidden fixed right-5 z-20 w-14 h-14 rounded-full bg-emerald-600 opacity-70 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-xl flex items-center justify-center transition-colors";
const FAB_STYLE = { bottom: "calc(3.5rem + env(safe-area-inset-bottom) + 1rem)" };

interface AddEntryFabButtonProps {
  onClick: () => void;
  isOpen?: boolean;
  ariaLabel: string;
}

interface AddEntryFabLinkProps {
  to: string;
  state?: object;
  ariaLabel: string;
}

type AddEntryFabProps = AddEntryFabButtonProps | AddEntryFabLinkProps;

function isLinkProps(props: AddEntryFabProps): props is AddEntryFabLinkProps {
  return "to" in props;
}

export function AddEntryFab(props: AddEntryFabProps) {
  const { ariaLabel } = props;

  if (isLinkProps(props)) {
    return (
      <Link to={props.to} state={props.state} className={FAB_CLASS} style={FAB_STYLE} aria-label={ariaLabel}>
        <FaPlus className="text-2xl" />
      </Link>
    );
  }

  const { onClick, isOpen } = props;
  return (
    <button onClick={onClick} className={FAB_CLASS} style={FAB_STYLE} aria-label={ariaLabel}>
      <FaPlus
        className="text-2xl"
        style={{ transform: isOpen ? "rotate(45deg)" : "none", transition: "transform 0.2s" }}
      />
    </button>
  );
}

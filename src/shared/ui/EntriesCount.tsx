interface Props {
  count: number;
  label: string;
  className?: string;
}

export function EntriesCount({ count, label, className }: Props) {
  const countStr = String(count);
  const idx = label.indexOf(countStr);
  if (idx === -1) return <span className={className}>{label}</span>;
  return (
    <span className={className}>
      {label.slice(0, idx)}
      <span className="inline-flex items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 font-semibold px-2 py-0.5 min-w-[1.5rem]">{countStr}</span>
      {label.slice(idx + countStr.length)}
    </span>
  );
}

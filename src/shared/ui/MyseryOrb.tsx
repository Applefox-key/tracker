export default function MysteryOrb() {
  return (
    <div className="relative size-5">
      {/* glow */}
      <div className="absolute inset-0 rounded-full bg-fuchsia-300/30 blur-md animate-pulse" />

      {/* orb */}
      <div
        className="
          relative size-full rounded-full
          bg-[conic-gradient(from_0deg,#a7f3d0,#93c5fd,#c4b5fd,#f9a8d4,#fde68a,#a7f3d0)]
          shadow-[inset_0_0_8px_rgba(255,255,255,.8),0_2px_8px_rgba(99,102,241,.25)]
          animate-[spin_6s_linear_infinite]
        ">
        {/* glass highlight */}
        <div
          className="
            absolute left-2 top-1.5
            h-3 w-6
            rounded-full
            bg-white/50
            blur-[2px]
            rotate-[-25deg]
          "
        />

        {/* question mark */}
        <span
          className="
            absolute inset-0
            flex items-center justify-center
            text-xl font-semibold text-white
            drop-shadow-[0_1px_2px_rgba(0,0,0,.15)]
          ">
          ?
        </span>
      </div>
    </div>
  );
}

type GhostProps = {
  className?: string;
};

/** A white ghost. Decorative, so it is hidden from assistive technology. */
export function Ghost({ className }: GhostProps) {
  return (
    <svg
      viewBox="0 0 64 72"
      className={className}
      aria-hidden="true"
      focusable="false"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M8 34C8 17.4 18.7 6 32 6s24 11.4 24 28v32l-8-6-8 8-8-8-8 8-8-8-8 6V34Z"
        fill="#ffffff"
        fillOpacity="0.94"
      />
      <ellipse cx="24" cy="32" rx="3.5" ry="5" fill="#250902" />
      <ellipse cx="40" cy="32" rx="3.5" ry="5" fill="#250902" />
      <ellipse cx="32" cy="45" rx="4" ry="5" fill="#250902" fillOpacity="0.85" />
    </svg>
  );
}

/**
 * One ghost that drifts slowly across the whole page, behind the content.
 * The motion is switched off for people who prefer reduced motion (see globals.css).
 */
export function FloatingGhost() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
    >
      <div className="ghost-drift absolute left-0 top-24 w-24">
        <div className="ghost-bob ghost-glow">
          <Ghost className="h-auto w-full" />
        </div>
      </div>
    </div>
  );
}
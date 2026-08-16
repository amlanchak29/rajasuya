import { useState } from "react";
import { initSound, isMuted, setMuted } from "../game/sound";

/** Floating speaker button, bottom-left — big enough to find. */
export default function SoundToggle() {
  const [muted, setMutedState] = useState(isMuted);
  return (
    <button
      onClick={() => {
        initSound();
        setMuted(!muted);
        setMutedState(!muted);
      }}
      title={muted ? "Sound is off — click to unmute" : "Sound is on — click to mute"}
      aria-label={muted ? "Unmute" : "Mute"}
      className={`fixed bottom-5 left-5 z-20 grid h-11 w-11 place-items-center rounded-full border bg-court/90 shadow-lg backdrop-blur transition-colors ${
        muted
          ? "border-line text-leaf-faint hover:border-line-bright"
          : "border-line-bright text-indra hover:border-indra"
      }`}
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
        <path d="M4 9.5v5h3.5L13 19V5L7.5 9.5H4z" fill="currentColor" />
        {muted ? (
          <g stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <line x1="16" y1="9.5" x2="21" y2="14.5" />
            <line x1="21" y1="9.5" x2="16" y2="14.5" />
          </g>
        ) : (
          <g
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            fill="none"
          >
            <path d="M15.5 9.5a3.5 3.5 0 0 1 0 5" />
            <path d="M18 7.5a6.5 6.5 0 0 1 0 9" />
          </g>
        )}
      </svg>
    </button>
  );
}

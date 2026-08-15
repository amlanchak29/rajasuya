import { useState } from "react";
import type { GuideLine } from "../game/guide";

const DISMISS_KEY = "rajasuya-guide-dismissed";

/** One line of counsel (dismissible, remembered across games) and the
 * court announcement when sessions change. */
export default function GuideStrip({
  guide,
  sessionNote,
}: {
  guide: GuideLine | null;
  sessionNote: string | null;
}) {
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem(DISMISS_KEY) === "1",
  );
  const showGuide = guide !== null && !dismissed;
  if (!showGuide && !sessionNote) return null;

  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-1 px-4 pt-3">
      {showGuide && (
        <p className="flex items-baseline gap-3 font-body text-sm italic text-leaf-dim">
          <span className="font-chrome text-[10px] uppercase not-italic tracking-widest text-indra">
            counsel
          </span>
          {guide.text}
          <button
            onClick={() => {
              localStorage.setItem(DISMISS_KEY, "1");
              setDismissed(true);
            }}
            className="font-chrome text-[11px] uppercase not-italic tracking-wide text-leaf-faint hover:text-leaf-dim"
            title="Hide the guide for good"
          >
            hide
          </button>
        </p>
      )}
      {sessionNote && (
        <p className="ml-auto font-body text-sm italic text-indra/90">
          {sessionNote}
        </p>
      )}
    </div>
  );
}

import { useState } from "react";
import { HERO, WAY } from "./assets";

export const WAY_SEEN_KEY = "rajasuya-way-seen";

/** The five things a stranger must know before the game begins — each a
 * scene, a heading, and a few lines. Everything else the counsel strip
 * teaches in play. */
const PANELS = [
  {
    image: HERO,
    heading: "Two rival claims",
    body:
      "You are Yudhishthira's claim, seated at Indraprastha — or " +
      "Jarasandha's, at Magadha. Neither of you holds the imperial " +
      "throne. Twelve kings, across four courts, will decide who " +
      "deserves it.",
  },
  {
    image: WAY.oath,
    heading: "Win the world, openly",
    body:
      "A king who swears to you before the assembled world advances your " +
      "claim. Gather the oaths you need — or hold the greater legitimacy " +
      "when the clock runs out — and the throne is yours.",
  },
  {
    image: WAY.feast,
    heading: "The way to a king",
    body:
      "Feast him — Satkara — until he owes you. Petition him — Yachana — " +
      "and his allegiance is yours. Then bind him, by private counsel or " +
      "by deeper debt, until he will swear the oath — Pratigya.",
  },
  {
    image: WAY.refusal,
    heading: "Vows close doors",
    body:
      "Every king carries a vow, public and unbreakable. One will never " +
      "be seen to submit; another will not deal with those who swear in " +
      "secret. Vows bind your rival too — the sharpest play is to turn " +
      "a king's vow against the one who needs him.",
  },
  {
    image: WAY.counsel,
    heading: "The world sees only open acts",
    body:
      "Hidden petitions come cheaper, and counsel — Mantrana — is always " +
      "silent. But secrets win nothing before the world: a king sworn in " +
      "shadow is held, and denied to your rival — and counts for nothing " +
      "toward your victory.",
  },
];

export default function TheWay({ onDone }: { onDone: () => void }) {
  const [i, setI] = useState(0);
  const last = i === PANELS.length - 1;
  const panel = PANELS[i];

  const finish = () => {
    localStorage.setItem(WAY_SEEN_KEY, "1");
    onDone();
  };

  return (
    <main className="fixed inset-0 z-50 flex flex-col bg-hall">
      <div className="relative min-h-0 grow">
        <img
          key={i}
          src={panel.image}
          alt=""
          className="ceremony-fade h-full w-full object-cover"
        />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-hall to-transparent" />
      </div>
      <div className="mx-auto w-full max-w-2xl px-6 pb-8 pt-2 text-center">
        <h2 className="font-display text-3xl text-leaf">{panel.heading}</h2>
        <p className="mt-3 font-body text-lg leading-relaxed text-leaf-dim">
          {panel.body}
        </p>
        <div className="mt-5 flex items-center justify-center gap-2">
          {PANELS.map((_, d) => (
            <span
              key={d}
              className={`h-1.5 w-1.5 rounded-full ${d === i ? "bg-indra" : "bg-line-bright"}`}
            />
          ))}
        </div>
        <div className="mt-5 flex items-center justify-center gap-4">
          <button
            onClick={finish}
            className="font-chrome text-sm uppercase tracking-wide text-leaf-faint hover:text-leaf-dim"
          >
            Skip
          </button>
          {i > 0 && (
            <button
              onClick={() => setI(i - 1)}
              className="rounded border border-line-bright px-5 py-2 font-chrome text-leaf hover:border-indra"
            >
              Back
            </button>
          )}
          <button
            onClick={() => (last ? finish() : setI(i + 1))}
            className="rounded bg-indra px-8 py-2 font-chrome font-bold text-hall hover:brightness-110"
          >
            {last ? "To the hall" : "Next"}
          </button>
        </div>
      </div>
    </main>
  );
}

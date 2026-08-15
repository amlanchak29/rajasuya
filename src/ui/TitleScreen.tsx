import { HERO } from "./assets";

export default function TitleScreen({
  onEnter,
  onLearn,
}: {
  onEnter: () => void;
  onLearn: () => void;
}) {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-end overflow-hidden">
      <img
        src={HERO}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-hall via-hall/50 to-hall/20" />
      <div className="relative flex flex-col items-center gap-4 px-6 pb-20 text-center">
        <h1 className="font-display text-7xl tracking-wide text-leaf drop-shadow-lg">
          Rajasuya
        </h1>
        <p className="max-w-md font-body text-lg italic text-leaf-dim">
          Two claims to paramountcy. Neither sits on a throne. Twelve kings
          will decide.
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-3">
          <button
            onClick={onEnter}
            className="rounded bg-indra px-8 py-3 font-chrome text-lg font-bold text-hall hover:brightness-110"
          >
            Enter the hall
          </button>
          <button
            onClick={onLearn}
            className="rounded border border-line-bright px-8 py-3 font-chrome text-lg text-leaf hover:border-indra"
          >
            Learn the way
          </button>
        </div>
      </div>
    </main>
  );
}

/** Generated art (engraved ink + gold style, locked via style reference —
 * regenerate with the prompts in git history if the roster changes). */
import bhagadatta from "../assets/figures/bhagadatta.jpg";
import shakuni from "../assets/figures/shakuni.jpg";
import susharma from "../assets/figures/susharma.jpg";
import shishupala from "../assets/figures/shishupala.jpg";
import karna from "../assets/figures/karna.jpg";
import paundraka from "../assets/figures/paundraka.jpg";
import rukmi from "../assets/figures/rukmi.jpg";
import nila from "../assets/figures/nila.jpg";
import pandya from "../assets/figures/pandya.jpg";
import shalya from "../assets/figures/shalya.jpg";
import jayadratha from "../assets/figures/jayadratha.jpg";
import kritavarma from "../assets/figures/kritavarma.jpg";
import sigilIndraprastha from "../assets/sigil-indraprastha.jpg";
import sigilMagadha from "../assets/sigil-magadha.jpg";
import hero from "../assets/hero.jpg";
import wayOath from "../assets/way/oath.jpg";
import wayFeast from "../assets/way/feast.jpg";
import wayCounsel from "../assets/way/counsel.jpg";
import wayRefusal from "../assets/way/refusal.jpg";
import verbSatkara from "../assets/verbs/satkara.jpg";
import verbYachana from "../assets/verbs/yachana.jpg";
import verbMantrana from "../assets/verbs/mantrana.jpg";
import verbPratigya from "../assets/verbs/pratigya.jpg";
import type { Player, Verb } from "../engine/engine";

export const PORTRAITS: Record<string, string> = {
  bhagadatta,
  shakuni,
  susharma,
  shishupala,
  karna,
  paundraka,
  rukmi,
  nila,
  pandya,
  shalya,
  jayadratha,
  kritavarma,
};

export const SIGILS: Record<Player, string> = {
  indraprastha: sigilIndraprastha,
  magadha: sigilMagadha,
};

export const HERO = hero;

export const WAY = {
  oath: wayOath,
  feast: wayFeast,
  counsel: wayCounsel,
  refusal: wayRefusal,
};

export const VERB_ICONS: Record<Verb, string> = {
  satkara: verbSatkara,
  yachana: verbYachana,
  mantrana: verbMantrana,
  pratigya: verbPratigya,
};

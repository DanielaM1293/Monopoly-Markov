// Monopoly as a Markov chain.
// State = (square, consecutive doubles) for free movement, plus 3 "in jail" states.
// Every state transition is ONE dice roll. We count where the token rests after each roll.

export const N = 40;
export const JAIL = 10;
export const GO_TO_JAIL = 30;
export const CHANCE = [7, 22, 36];
export const CHEST = [2, 17, 33];
export const RAILS = [5, 15, 25, 35];
export const UTILS = [12, 28];

export interface Rules {
  goToJail: boolean; // square 30 + "Go to Jail" cards + 3 doubles send you to jail
  cards: boolean; // Chance / Community Chest move you
  tripleDoubles: boolean; // third doubles in a row -> jail
  payOutOfJail: boolean; // true: pay $50 at once. false: wait for doubles (max 3 tries)
}

export const DEFAULT_RULES: Rules = {
  goToJail: true,
  cards: true,
  tripleDoubles: true,
  payOutOfJail: false,
};

// state indexing
const FREE = N * 3; // 120 free states: pos*3 + doubles
export const NSTATES = FREE + 3; // + jail attempts 0,1,2
const jailState = (k: number) => FREE + k;
const freeState = (pos: number, d: number) => pos * 3 + d;

const nearest = (pos: number, set: number[]) => {
  for (let i = 1; i <= N; i++) {
    const p = (pos + i) % N;
    if (set.includes(p)) return p;
  }
  return pos;
};

// A card outcome: either "go to jail" (-1) or a final resting square.
// Cards are modelled as independent draws (no deck memory) -> this is a stated approximation.
type Outcome = { to: number; p: number };

function landing(pos: number, rules: Rules): Outcome[] {
  if (pos === GO_TO_JAIL && rules.goToJail) return [{ to: -1, p: 1 }];
  if (!rules.cards) return [{ to: pos, p: 1 }];
  const out: Outcome[] = [];
  const add = (to: number, p: number) => {
    // a card can land you on a square that itself needs resolving (e.g. "back 3" -> Chest)
    for (const o of landingNoRecurse(to, rules)) out.push({ to: o.to, p: p * o.p });
  };
  if (CHANCE.includes(pos)) {
    // 16 cards: 10 move, 6 stay
    const cards: (number | 'stay' | 'jail')[] = [
      0, 24, 11, nearest(pos, UTILS), nearest(pos, RAILS), nearest(pos, RAILS), (pos + N - 3) % N,
      rules.goToJail ? 'jail' : 'stay', 5, 39,
    ];
    for (const c of cards) {
      if (c === 'jail') out.push({ to: -1, p: 1 / 16 });
      else if (c === 'stay') out.push({ to: pos, p: 1 / 16 });
      else add(c, 1 / 16);
    }
    out.push({ to: pos, p: 6 / 16 });
    return out;
  }
  if (CHEST.includes(pos)) {
    // 16 cards: Advance to Go, Go to Jail, 14 stay
    add(0, 1 / 16);
    if (rules.goToJail) out.push({ to: -1, p: 1 / 16 });
    else out.push({ to: pos, p: 1 / 16 });
    out.push({ to: pos, p: 14 / 16 });
    return out;
  }
  return [{ to: pos, p: 1 }];
}
// second-level resolution (only "back 3" from Chance 36 -> Chest 33 matters, 22->19, 7->4 are plain)
function landingNoRecurse(pos: number, rules: Rules): Outcome[] {
  if (pos === GO_TO_JAIL && rules.goToJail) return [{ to: -1, p: 1 }];
  if (CHEST.includes(pos) && rules.cards) {
    const out: Outcome[] = [{ to: 0, p: 1 / 16 }];
    out.push(rules.goToJail ? { to: -1, p: 1 / 16 } : { to: pos, p: 1 / 16 });
    out.push({ to: pos, p: 14 / 16 });
    return out;
  }
  return [{ to: pos, p: 1 }];
}

/** Sparse transition list: T[s] = [[toState, prob], ...] */
export function buildChain(rules: Rules): [number, number][][] {
  const T: [number, number][][] = Array.from({ length: NSTATES }, () => []);
  const push = (s: number, to: number, p: number) => T[s].push([to, p]);
  const resolve = (s: number, pos: number, nd: number, p: number) => {
    for (const o of landing(pos, rules)) {
      if (o.to === -1) push(s, jailState(0), p * o.p);
      else push(s, freeState(o.to, nd), p * o.p);
    }
  };
  for (let pos = 0; pos < N; pos++) {
    for (let d = 0; d < 3; d++) {
      const s = freeState(pos, d);
      for (let a = 1; a <= 6; a++)
        for (let b = 1; b <= 6; b++) {
          const p = 1 / 36;
          const dbl = a === b;
          if (dbl && d === 2 && rules.tripleDoubles && rules.goToJail) {
            push(s, jailState(0), p);
            continue;
          }
          const nd = dbl ? (d + 1) % 3 : 0;
          resolve(s, (pos + a + b) % N, nd, p);
        }
    }
  }
  for (let k = 0; k < 3; k++) {
    const s = jailState(k);
    for (let a = 1; a <= 6; a++)
      for (let b = 1; b <= 6; b++) {
        const p = 1 / 36;
        const dbl = a === b;
        const dest = (JAIL + a + b) % N;
        if (rules.payOutOfJail) {
          resolve(s, dest, dbl ? 1 : 0, p);
        } else if (dbl || k === 2) {
          resolve(s, dest, 0, p);
        } else push(s, jailState(k + 1), p);
      }
  }
  return T;
}

/** Exact long-run distribution by power iteration. Returns per-square probability and jail split. */
export function stationary(rules: Rules) {
  const T = buildChain(rules);
  let v = new Float64Array(NSTATES);
  v[freeState(0, 0)] = 1;
  let iters = 0;
  for (; iters < 5000; iters++) {
    const w = new Float64Array(NSTATES);
    for (let s = 0; s < NSTATES; s++) {
      const vs = v[s];
      if (vs === 0) continue;
      for (const [to, p] of T[s]) w[to] += vs * p;
    }
    let diff = 0;
    for (let s = 0; s < NSTATES; s++) diff += Math.abs(w[s] - v[s]);
    v = w;
    if (diff < 1e-15) break;
  }
  const sq = new Array(N).fill(0);
  let inJail = 0;
  for (let pos = 0; pos < N; pos++) for (let d = 0; d < 3; d++) sq[pos] += v[freeState(pos, d)];
  for (let k = 0; k < 3; k++) inJail += v[jailState(k)];
  const visiting = sq[JAIL];
  sq[JAIL] += inJail;
  return { probs: sq as number[], inJail, visiting, iters, T };
}

// ---------- randomness ----------
export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Walker that follows the chain (cards i.i.d.). Used by the live simulator. */
export function makeWalker(rules: Rules, seed: number) {
  const T = buildChain(rules);
  // cumulative tables
  const cum = T.map((row) => {
    const c: number[] = [];
    let s = 0;
    for (const [, p] of row) c.push((s += p));
    return c;
  });
  const rand = rng(seed);
  let state = freeState(0, 0);
  const counts = new Array(N).fill(0);
  let total = 0;
  const toPos = (s: number) => (s >= FREE ? JAIL : Math.floor(s / 3));
  return {
    step() {
      const r = rand() * cum[state][cum[state].length - 1];
      const c = cum[state];
      let i = 0;
      while (i < c.length - 1 && r > c[i]) i++;
      state = T[state][i][0];
      const pos = toPos(state);
      counts[pos]++;
      total++;
      return { pos, inJail: state >= FREE };
    },
    counts,
    get total() {
      return total;
    },
  };
}

export const tv = (p: number[], q: number[]) => {
  let s = 0;
  for (let i = 0; i < p.length; i++) s += Math.abs(p[i] - q[i]);
  return s / 2;
};

/**
 * "Realistic" game: two shuffled 16-card decks that are actually drawn and put at the bottom.
 * Used as the held-out test of the model (the Markov chain assumes no deck memory).
 */
export function simulateRealGame(rules: Rules, rolls: number, seed: number) {
  const rand = rng(seed);
  const shuffle = <T,>(a: T[]) => {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  // Chance: 0=Go 1=Illinois 2=StCharles 3=Utility 4=Rail 5=Rail 6=Back3 7=Jail 8=Reading 9=Boardwalk, 10..15 stay
  let chance = shuffle([...Array(16).keys()]);
  let chest = shuffle([...Array(16).keys()]); // 0=Go 1=Jail rest stay
  let ci = 0,
    ki = 0;
  const counts = new Array(N).fill(0);
  let pos = 0,
    doubles = 0,
    jail = -1; // jail = failed attempts so far (-1 = free)
  const resolve = (): void => {
    if (pos === GO_TO_JAIL && rules.goToJail) {
      pos = JAIL;
      jail = 0;
      return;
    }
    if (!rules.cards) return;
    if (CHANCE.includes(pos)) {
      const c = chance[ci++ % 16];
      if (ci % 16 === 0) chance = shuffle(chance); // (re-shuffle each full pass: a mild idealisation)
      if (c === 0) pos = 0;
      else if (c === 1) pos = 24;
      else if (c === 2) pos = 11;
      else if (c === 3) pos = nearest(pos, UTILS);
      else if (c === 4 || c === 5) pos = nearest(pos, RAILS);
      else if (c === 6) {
        pos = (pos + N - 3) % N;
        resolve();
      } else if (c === 7) {
        if (rules.goToJail) {
          pos = JAIL;
          jail = 0;
        }
      } else if (c === 8) pos = 5;
      else if (c === 9) pos = 39;
    } else if (CHEST.includes(pos)) {
      const c = chest[ki++ % 16];
      if (ki % 16 === 0) chest = shuffle(chest);
      if (c === 0) pos = 0;
      else if (c === 1 && rules.goToJail) {
        pos = JAIL;
        jail = 0;
      }
    }
  };
  for (let r = 0; r < rolls; r++) {
    const a = 1 + Math.floor(rand() * 6),
      b = 1 + Math.floor(rand() * 6);
    const dbl = a === b;
    if (jail >= 0) {
      if (rules.payOutOfJail || dbl || jail === 2) {
        jail = -1;
        pos = (JAIL + a + b) % N;
        doubles = rules.payOutOfJail && dbl ? 1 : 0;
        resolve();
      } else jail++;
    } else if (dbl && doubles === 2 && rules.tripleDoubles && rules.goToJail) {
      pos = JAIL;
      jail = 0;
      doubles = 0;
    } else {
      doubles = dbl ? (doubles + 1) % 3 : 0;
      pos = (pos + a + b) % N;
      resolve();
    }
    counts[pos]++;
  }
  return counts.map((c) => c / rolls);
}

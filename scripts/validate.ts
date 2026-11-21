import { stationary, DEFAULT_RULES, makeWalker, simulateRealGame, tv, NSTATES } from '../src/engine';
const t0 = Date.now();
const { probs, inJail, visiting, iters, T } = stationary(DEFAULT_RULES);
console.log('iters', iters, 'sum', probs.reduce((a, b) => a + b, 0).toFixed(12), 'ms', Date.now() - t0);
// row-stochastic check
let worst = 0;
T.forEach((row) => { worst = Math.max(worst, Math.abs(row.reduce((a, [, p]) => a + p, 0) - 1)); });
console.log('max row-sum error', worst, 'states', NSTATES);
const rank = probs.map((p, i) => [i, p] as const).sort((a, b) => b[1] - a[1]).slice(0, 10);
console.log('top10', rank.map(([i, p]) => i + ':' + (p * 100).toFixed(2)).join('  '));
console.log('inJail', (inJail * 100).toFixed(2), 'visiting', (visiting * 100).toFixed(2));
for (const n of [1e4, 1e5, 1e6, 1e7]) {
  const w = makeWalker(DEFAULT_RULES, 42);
  for (let i = 0; i < n; i++) w.step();
  console.log('iid walker', n, 'TV', tv(w.counts.map((c) => c / n), probs).toFixed(5));
}
for (const n of [1e5, 1e6, 1e7]) {
  console.log('real decks', n, 'TV', tv(simulateRealGame(DEFAULT_RULES, n, 2024), probs).toFixed(5));
}

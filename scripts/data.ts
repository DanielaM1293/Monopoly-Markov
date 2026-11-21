import { stationary, DEFAULT_RULES } from '../src/engine';
import { writeFileSync } from 'fs';
const b = stationary(DEFAULT_RULES);
writeFileSync('deliver/probs.json', JSON.stringify({ probs: b.probs, inJail: b.inJail, visiting: b.visiting, iters: b.iters }));
console.log(b.inJail, b.visiting);

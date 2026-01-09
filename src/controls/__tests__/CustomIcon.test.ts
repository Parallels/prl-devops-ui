import assert from 'node:assert';
import { mergeClassTokens, hasExplicitSize } from '../../utils/iconUtils';



const mergedOverride = mergeClassTokens('h-6 w-6', 'w-4 h-4');
assert.ok(mergedOverride.split(/\s+/).includes('w-4'));
assert.ok(mergedOverride.split(/\s+/).includes('h-4'));
assert.ok(!mergedOverride.includes('w-6'));
assert.ok(!mergedOverride.includes('h-6'));

const mergedFallback = mergeClassTokens('inline-flex', 'w-6 h-6');
assert.deepStrictEqual(mergedFallback.split(/\s+/), ['inline-flex', 'w-6', 'h-6']);

assert.strictEqual(hasExplicitSize('w-4 h-4'), true);
assert.strictEqual(hasExplicitSize('inline-flex items-center'), false);

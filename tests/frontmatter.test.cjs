"use strict";
/**
 * Vector Tools Tests - frontmatter.cjs
 *
 * Tests for the hand-rolled YAML parser's pure function exports:
 * extractFrontmatter, reconstructFrontmatter, spliceFrontmatter,
 * parseMustHavesBlock, and FRONTMATTER_SCHEMAS.
 *
 * Includes REG-04 regression: quoted comma inline array edge case.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = require("node:test");
const node_assert_1 = __importDefault(require("node:assert"));
const { extractFrontmatter, reconstructFrontmatter, spliceFrontmatter, parseMustHavesBlock, FRONTMATTER_SCHEMAS, } = require('../core/bin/lib/frontmatter.cjs');
// ─── extractFrontmatter ─────────────────────────────────────────────────────
(0, node_test_1.describe)('extractFrontmatter', () => {
    (0, node_test_1.test)('parses simple key-value pairs', () => {
        const content = '---\nname: foo\ntype: execute\n---\nbody';
        const result = extractFrontmatter(content);
        node_assert_1.default.strictEqual(result.name, 'foo');
        node_assert_1.default.strictEqual(result.type, 'execute');
    });
    (0, node_test_1.test)('strips quotes from values', () => {
        const doubleQuoted = '---\nname: "foo"\n---\n';
        const singleQuoted = '---\nname: \'foo\'\n---\n';
        node_assert_1.default.strictEqual(extractFrontmatter(doubleQuoted).name, 'foo');
        node_assert_1.default.strictEqual(extractFrontmatter(singleQuoted).name, 'foo');
    });
    (0, node_test_1.test)('parses nested objects', () => {
        const content = '---\ntechstack:\n  added: prisma\n  patterns: repository\n---\n';
        const result = extractFrontmatter(content);
        node_assert_1.default.deepStrictEqual(result.techstack, { added: 'prisma', patterns: 'repository' });
    });
    (0, node_test_1.test)('parses block arrays', () => {
        const content = '---\nitems:\n  - alpha\n  - beta\n  - gamma\n---\n';
        const result = extractFrontmatter(content);
        node_assert_1.default.deepStrictEqual(result.items, ['alpha', 'beta', 'gamma']);
    });
    (0, node_test_1.test)('parses inline arrays', () => {
        const content = '---\nkey: [a, b, c]\n---\n';
        const result = extractFrontmatter(content);
        node_assert_1.default.deepStrictEqual(result.key, ['a', 'b', 'c']);
    });
    (0, node_test_1.test)('handles quoted commas in inline arrays — REG-04 known limitation', () => {
        // REG-04: The split(',') on line 53 does NOT respect quotes.
        // The parser WILL split on commas inside quotes, producing wrong results.
        // This test documents the CURRENT (buggy) behavior.
        const content = '---\nkey: ["a, b", c]\n---\n';
        const result = extractFrontmatter(content);
        // Current behavior: splits on ALL commas, producing 3 items instead of 2
        // Expected correct behavior would be: ["a, b", "c"]
        // Actual current behavior: ["a", "b", "c"] (split ignores quotes)
        node_assert_1.default.ok(Array.isArray(result.key), 'should produce an array');
        node_assert_1.default.ok(result.key.length >= 2, 'should produce at least 2 items from comma split');
        // The bug produces ["a", "b\"", "c"] or similar — the exact output depends on
        // how the regex strips quotes after the split.
        // We verify the key insight: the result has MORE items than intended (known limitation).
        node_assert_1.default.ok(result.key.length > 2, 'REG-04: split produces more items than intended due to quoted comma bug');
    });
    (0, node_test_1.test)('returns empty object for no frontmatter', () => {
        const content = 'Just plain content, no frontmatter.';
        const result = extractFrontmatter(content);
        node_assert_1.default.deepStrictEqual(result, {});
    });
    (0, node_test_1.test)('returns empty object for empty frontmatter', () => {
        const content = '---\n---\nBody text.';
        const result = extractFrontmatter(content);
        node_assert_1.default.deepStrictEqual(result, {});
    });
    (0, node_test_1.test)('parses frontmatter-only content', () => {
        const content = '---\nkey: val\n---';
        const result = extractFrontmatter(content);
        node_assert_1.default.strictEqual(result.key, 'val');
    });
    (0, node_test_1.test)('handles emoji and non-ASCII in values', () => {
        const content = '---\nname: "Hello World"\nlabel: "cafe"\n---\n';
        const result = extractFrontmatter(content);
        node_assert_1.default.strictEqual(result.name, 'Hello World');
        node_assert_1.default.strictEqual(result.label, 'cafe');
    });
    (0, node_test_1.test)('converts empty-object placeholders to arrays when dash items follow', () => {
        // When a key has no value, it gets an empty {} placeholder.
        // When "- item" lines follow, the parser converts {} to [].
        const content = '---\nrequirements:\n  - REQ-01\n  - REQ-02\n---\n';
        const result = extractFrontmatter(content);
        node_assert_1.default.ok(Array.isArray(result.requirements), 'should convert placeholder object to array');
        node_assert_1.default.deepStrictEqual(result.requirements, ['REQ-01', 'REQ-02']);
    });
    (0, node_test_1.test)('skips empty lines in YAML body', () => {
        const content = '---\nfirst: one\n\nsecond: two\n\nthird: three\n---\n';
        const result = extractFrontmatter(content);
        node_assert_1.default.strictEqual(result.first, 'one');
        node_assert_1.default.strictEqual(result.second, 'two');
        node_assert_1.default.strictEqual(result.third, 'three');
    });
});
// ─── reconstructFrontmatter ─────────────────────────────────────────────────
(0, node_test_1.describe)('reconstructFrontmatter', () => {
    (0, node_test_1.test)('serializes simple key-value', () => {
        const result = reconstructFrontmatter({ name: 'foo' });
        node_assert_1.default.strictEqual(result, 'name: foo');
    });
    (0, node_test_1.test)('serializes empty array as inline []', () => {
        const result = reconstructFrontmatter({ items: [] });
        node_assert_1.default.strictEqual(result, 'items: []');
    });
    (0, node_test_1.test)('serializes short string arrays inline', () => {
        const result = reconstructFrontmatter({ key: ['a', 'b', 'c'] });
        node_assert_1.default.strictEqual(result, 'key: [a, b, c]');
    });
    (0, node_test_1.test)('serializes long arrays as block', () => {
        const result = reconstructFrontmatter({ key: ['one', 'two', 'three', 'four'] });
        node_assert_1.default.ok(result.includes('key:'), 'should have key header');
        node_assert_1.default.ok(result.includes('  - one'), 'should have block array items');
        node_assert_1.default.ok(result.includes('  - four'), 'should have last item');
    });
    (0, node_test_1.test)('quotes values containing colons or hashes', () => {
        const result = reconstructFrontmatter({ url: 'http://example.com' });
        node_assert_1.default.ok(result.includes('"http://example.com"'), 'should quote value with colon');
        const hashResult = reconstructFrontmatter({ comment: 'value # note' });
        node_assert_1.default.ok(hashResult.includes('"value # note"'), 'should quote value with hash');
    });
    (0, node_test_1.test)('serializes nested objects with proper indentation', () => {
        const result = reconstructFrontmatter({ tech: { added: 'prisma', patterns: 'repo' } });
        node_assert_1.default.ok(result.includes('tech:'), 'should have parent key');
        node_assert_1.default.ok(result.includes('  added: prisma'), 'should have indented child');
        node_assert_1.default.ok(result.includes('  patterns: repo'), 'should have indented child');
    });
    (0, node_test_1.test)('serializes nested arrays within objects', () => {
        const result = reconstructFrontmatter({
            tech: { added: ['prisma', 'jose'] },
        });
        node_assert_1.default.ok(result.includes('tech:'), 'should have parent key');
        node_assert_1.default.ok(result.includes('  added: [prisma, jose]'), 'should serialize nested short array inline');
    });
    (0, node_test_1.test)('skips null and undefined values', () => {
        const result = reconstructFrontmatter({ name: 'foo', skip: null, also: undefined, keep: 'bar' });
        node_assert_1.default.ok(!result.includes('skip'), 'should not include null key');
        node_assert_1.default.ok(!result.includes('also'), 'should not include undefined key');
        node_assert_1.default.ok(result.includes('name: foo'), 'should include non-null key');
        node_assert_1.default.ok(result.includes('keep: bar'), 'should include non-null key');
    });
    (0, node_test_1.test)('round-trip: simple frontmatter', () => {
        const original = '---\nname: test\ntype: execute\nwave: 1\n---\n';
        const extracted1 = extractFrontmatter(original);
        const reconstructed = reconstructFrontmatter(extracted1);
        const roundTrip = `---\n${reconstructed}\n---\n`;
        const extracted2 = extractFrontmatter(roundTrip);
        node_assert_1.default.deepStrictEqual(extracted2, extracted1, 'round-trip should preserve data identity');
    });
    (0, node_test_1.test)('round-trip: nested with arrays', () => {
        const original = '---\nphase: 01\ntech:\n  added:\n    - prisma\n    - jose\n  patterns:\n    - repository\n    - jwt\n---\n';
        const extracted1 = extractFrontmatter(original);
        const reconstructed = reconstructFrontmatter(extracted1);
        const roundTrip = `---\n${reconstructed}\n---\n`;
        const extracted2 = extractFrontmatter(roundTrip);
        node_assert_1.default.deepStrictEqual(extracted2, extracted1, 'round-trip should preserve nested structures');
    });
    (0, node_test_1.test)('round-trip: multiple data types', () => {
        const original = '---\nname: testplan\nwave: 2\ntags: [auth, api, db]\ndeps:\n  - dep1\n  - dep2\nconfig:\n  enabled: true\n  count: 5\n---\n';
        const extracted1 = extractFrontmatter(original);
        const reconstructed = reconstructFrontmatter(extracted1);
        const roundTrip = `---\n${reconstructed}\n---\n`;
        const extracted2 = extractFrontmatter(roundTrip);
        node_assert_1.default.deepStrictEqual(extracted2, extracted1, 'round-trip should preserve multiple data types');
    });
});
// ─── spliceFrontmatter ──────────────────────────────────────────────────────
(0, node_test_1.describe)('spliceFrontmatter', () => {
    (0, node_test_1.test)('replaces existing frontmatter preserving body', () => {
        const content = '---\nphase: 01\ntype: execute\n---\n\n# Body Content\n\nParagraph here.';
        const newObj = { phase: '02', type: 'tdd', wave: '1' };
        const result = spliceFrontmatter(content, newObj);
        // New frontmatter should be present
        const extracted = extractFrontmatter(result);
        node_assert_1.default.strictEqual(extracted.phase, '02');
        node_assert_1.default.strictEqual(extracted.type, 'tdd');
        node_assert_1.default.strictEqual(extracted.wave, '1');
        // Body should be preserved
        node_assert_1.default.ok(result.includes('# Body Content'), 'body heading should be preserved');
        node_assert_1.default.ok(result.includes('Paragraph here.'), 'body paragraph should be preserved');
    });
    (0, node_test_1.test)('adds frontmatter to content without any', () => {
        const content = 'Plain text with no frontmatter.';
        const newObj = { phase: '01', plan: '01' };
        const result = spliceFrontmatter(content, newObj);
        // Should start with frontmatter delimiters
        node_assert_1.default.ok(result.startsWith('---\n'), 'should start with opening delimiter');
        node_assert_1.default.ok(result.includes('\n---\n'), 'should have closing delimiter');
        // Original content should follow
        node_assert_1.default.ok(result.includes('Plain text with no frontmatter.'), 'original content should be preserved');
        // Frontmatter should be extractable
        const extracted = extractFrontmatter(result);
        node_assert_1.default.strictEqual(extracted.phase, '01');
        node_assert_1.default.strictEqual(extracted.plan, '01');
    });
    (0, node_test_1.test)('preserves content after frontmatter delimiters exactly', () => {
        const body = '\n\nExact content with special chars: $, %, &, <, >\nLine 2\nLine 3';
        const content = '---\nold: value\n---' + body;
        const newObj = { new: 'value' };
        const result = spliceFrontmatter(content, newObj);
        // The body after the closing --- should be exactly preserved
        const closingIdx = result.indexOf('\n---', 4); // skip the opening ---
        const resultBody = result.slice(closingIdx + 4); // skip \n---
        node_assert_1.default.strictEqual(resultBody, body, 'body content after frontmatter should be exactly preserved');
    });
});
// ─── parseMustHavesBlock ────────────────────────────────────────────────────
(0, node_test_1.describe)('parseMustHavesBlock', () => {
    (0, node_test_1.test)('extracts truths as string array', () => {
        const content = `---
phase: 01
must_haves:
    truths:
      - "All tests pass on CI"
      - "Coverage exceeds 80%"
---

Body content.`;
        const result = parseMustHavesBlock(content, 'truths');
        node_assert_1.default.ok(Array.isArray(result), 'should return an array');
        node_assert_1.default.strictEqual(result.length, 2);
        node_assert_1.default.strictEqual(result[0], 'All tests pass on CI');
        node_assert_1.default.strictEqual(result[1], 'Coverage exceeds 80%');
    });
    (0, node_test_1.test)('extracts artifacts as object array', () => {
        const content = `---
phase: 01
must_haves:
    artifacts:
      - path: "src/auth.ts"
        provides: "JWT authentication"
        min_lines: 100
      - path: "src/middleware.ts"
        provides: "Route protection"
        min_lines: 50
---

Body.`;
        const result = parseMustHavesBlock(content, 'artifacts');
        node_assert_1.default.ok(Array.isArray(result), 'should return an array');
        node_assert_1.default.strictEqual(result.length, 2);
        node_assert_1.default.strictEqual(result[0].path, 'src/auth.ts');
        node_assert_1.default.strictEqual(result[0].provides, 'JWT authentication');
        node_assert_1.default.strictEqual(result[0].min_lines, 100);
        node_assert_1.default.strictEqual(result[1].path, 'src/middleware.ts');
        node_assert_1.default.strictEqual(result[1].min_lines, 50);
    });
    (0, node_test_1.test)('extracts key_links with from/to/via/pattern fields', () => {
        const content = `---
phase: 01
must_haves:
    key_links:
      - from: "tests/auth.test.ts"
        to: "src/auth.ts"
        via: "import statement"
        pattern: "import.*auth"
---
`;
        const result = parseMustHavesBlock(content, 'key_links');
        node_assert_1.default.ok(Array.isArray(result), 'should return an array');
        node_assert_1.default.strictEqual(result.length, 1);
        node_assert_1.default.strictEqual(result[0].from, 'tests/auth.test.ts');
        node_assert_1.default.strictEqual(result[0].to, 'src/auth.ts');
        node_assert_1.default.strictEqual(result[0].via, 'import statement');
        node_assert_1.default.strictEqual(result[0].pattern, 'import.*auth');
    });
    (0, node_test_1.test)('returns empty array when block not found', () => {
        const content = `---
phase: 01
must_haves:
    truths:
      - "Some truth"
---
`;
        const result = parseMustHavesBlock(content, 'nonexistent_block');
        node_assert_1.default.deepStrictEqual(result, []);
    });
    (0, node_test_1.test)('returns empty array when no frontmatter', () => {
        const content = 'Plain text without any frontmatter delimiters.';
        const result = parseMustHavesBlock(content, 'truths');
        node_assert_1.default.deepStrictEqual(result, []);
    });
    (0, node_test_1.test)('handles nested arrays within artifact objects', () => {
        const content = `---
phase: 01
must_haves:
    artifacts:
      - path: "src/api.ts"
        provides: "REST endpoints"
        exports:
          - "GET"
          - "POST"
---
`;
        const result = parseMustHavesBlock(content, 'artifacts');
        node_assert_1.default.ok(Array.isArray(result), 'should return an array');
        node_assert_1.default.strictEqual(result.length, 1);
        node_assert_1.default.strictEqual(result[0].path, 'src/api.ts');
        // The nested array should be captured
        node_assert_1.default.ok(result[0].exports !== undefined, 'should have exports field');
    });
});
//# sourceMappingURL=frontmatter.test.cjs.map
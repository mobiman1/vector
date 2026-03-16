#!/usr/bin/env node
"use strict";
/**
 * Copy Vector hooks to dist for installation.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const HOOKS_DIR = path_1.default.join(__dirname, '..', 'hooks');
const DIST_DIR = path_1.default.join(HOOKS_DIR, 'dist');
// Hooks to copy (compiled .cjs output from .cts source)
const HOOKS_TO_COPY = [
    'vector-check-update.cjs',
    'vector-context-monitor.cjs',
    'vector-statusline.cjs',
];
function build() {
    if (!fs_1.default.existsSync(DIST_DIR)) {
        fs_1.default.mkdirSync(DIST_DIR, { recursive: true });
    }
    for (const hook of HOOKS_TO_COPY) {
        const src = path_1.default.join(HOOKS_DIR, hook);
        const dest = path_1.default.join(DIST_DIR, hook);
        if (!fs_1.default.existsSync(src)) {
            console.warn(`Warning: ${hook} not found, skipping`);
            continue;
        }
        console.log(`Copying ${hook}...`);
        fs_1.default.copyFileSync(src, dest);
        console.log(`  → ${dest}`);
    }
    console.log('\nBuild complete.');
}
build();
//# sourceMappingURL=build-hooks.cjs.map
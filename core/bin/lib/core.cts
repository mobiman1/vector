/**
 * Core — Shared utilities, constants, and internal helpers
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import { execSync, spawnSync } from 'child_process';
import { MODEL_PROFILES } from './model-profiles.cjs';

// ─── PhaseFilter interface ────────────────────────────────────────────────────

export interface PhaseFilter {
  (dirName: string): boolean;
  phaseCount: number;
}

// ─── Config types ─────────────────────────────────────────────────────────────

export interface VectorConfig {
  model_profile: string;
  commit_docs: boolean;
  search_gitignored: boolean;
  branching_strategy: string;
  phase_branch_template: string;
  milestone_branch_template: string;
  research: boolean;
  plan_checker: boolean;
  verifier: boolean;
  nyquist_validation: boolean;
  parallelization: boolean;
  brave_search: boolean;
  model_overrides: Record<string, string> | null;
}

// ─── Path helpers ────────────────────────────────────────────────────────────

/** Normalize a relative path to always use forward slashes (cross-platform). */
export function toPosixPath(p: string): string {
  return p.split(path.sep).join('/');
}

// ─── Output helpers ───────────────────────────────────────────────────────────

export function output(result: unknown, raw?: boolean, rawValue?: unknown): void {
  if (raw && rawValue !== undefined) {
    process.stdout.write(String(rawValue));
  } else {
    const json = JSON.stringify(result, null, 2);
    // Large payloads exceed Claude Code's Bash tool buffer (~50KB).
    // Write to tmpfile and output the path prefixed with @file: so callers can detect it.
    if (json.length > 50000) {
      const tmpPath = path.join(os.tmpdir(), `vector-${Date.now()}.json`);
      fs.writeFileSync(tmpPath, json, 'utf-8');
      process.stdout.write('@file:' + tmpPath);
    } else {
      process.stdout.write(json);
    }
  }
  process.exit(0);
}

export function error(message: string): never {
  process.stderr.write('Error: ' + message + '\n');
  process.exit(1);
}

// ─── File & Config utilities ──────────────────────────────────────────────────

export function safeReadFile(filePath: string): string | null {
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch {
    return null;
  }
}

export function loadConfig(cwd: string): VectorConfig {
  const configPath = path.join(cwd, '.planning', 'config.json');
  const defaults: VectorConfig = {
    model_profile: 'balanced',
    commit_docs: true,
    search_gitignored: false,
    branching_strategy: 'none',
    phase_branch_template: 'vector/phase-{phase}-{slug}',
    milestone_branch_template: 'vector/{milestone}-{slug}',
    research: true,
    plan_checker: true,
    verifier: true,
    nyquist_validation: true,
    parallelization: true,
    brave_search: false,
    model_overrides: null,
  };

  try {
    const raw = fs.readFileSync(configPath, 'utf-8');
    const parsed: Record<string, unknown> = JSON.parse(raw);

    // Migrate deprecated "depth" key to "granularity" with value mapping
    if ('depth' in parsed && !('granularity' in parsed)) {
      const depthToGranularity: Record<string, string> = { quick: 'coarse', standard: 'standard', comprehensive: 'fine' };
      parsed.granularity = depthToGranularity[parsed.depth as string] || parsed.depth;
      delete parsed.depth;
      try { fs.writeFileSync(configPath, JSON.stringify(parsed, null, 2), 'utf-8'); } catch {}
    }

    const get = (key: string, nested?: { section: string; field: string }): unknown => {
      if (parsed[key] !== undefined) return parsed[key];
      if (nested) {
        const section = parsed[nested.section];
        if (section && typeof section === 'object' && section !== null) {
          const sectionObj = section as Record<string, unknown>;
          if (sectionObj[nested.field] !== undefined) {
            return sectionObj[nested.field];
          }
        }
      }
      return undefined;
    };

    const parallelization = (() => {
      const val = get('parallelization');
      if (typeof val === 'boolean') return val;
      if (typeof val === 'object' && val !== null && 'enabled' in val) return (val as Record<string, unknown>).enabled as boolean;
      return defaults.parallelization;
    })();

    return {
      model_profile: (get('model_profile') ?? defaults.model_profile) as string,
      commit_docs: (get('commit_docs', { section: 'planning', field: 'commit_docs' }) ?? defaults.commit_docs) as boolean,
      search_gitignored: (get('search_gitignored', { section: 'planning', field: 'search_gitignored' }) ?? defaults.search_gitignored) as boolean,
      branching_strategy: (get('branching_strategy', { section: 'git', field: 'branching_strategy' }) ?? defaults.branching_strategy) as string,
      phase_branch_template: (get('phase_branch_template', { section: 'git', field: 'phase_branch_template' }) ?? defaults.phase_branch_template) as string,
      milestone_branch_template: (get('milestone_branch_template', { section: 'git', field: 'milestone_branch_template' }) ?? defaults.milestone_branch_template) as string,
      research: (get('research', { section: 'workflow', field: 'research' }) ?? defaults.research) as boolean,
      plan_checker: (get('plan_checker', { section: 'workflow', field: 'plan_check' }) ?? defaults.plan_checker) as boolean,
      verifier: (get('verifier', { section: 'workflow', field: 'verifier' }) ?? defaults.verifier) as boolean,
      nyquist_validation: (get('nyquist_validation', { section: 'workflow', field: 'nyquist_validation' }) ?? defaults.nyquist_validation) as boolean,
      parallelization,
      brave_search: (get('brave_search') ?? defaults.brave_search) as boolean,
      model_overrides: (parsed.model_overrides as Record<string, string>) || null,
    };
  } catch {
    return defaults;
  }
}

// ─── Git utilities ────────────────────────────────────────────────────────────

export function isGitIgnored(cwd: string, targetPath: string): boolean {
  try {
    // --no-index checks .gitignore rules regardless of whether the file is tracked.
    // Without it, git check-ignore returns "not ignored" for tracked files even when
    // .gitignore explicitly lists them — a common source of confusion when .planning/
    // was committed before being added to .gitignore.
    execSync('git check-ignore -q --no-index -- ' + targetPath.replace(/[^a-zA-Z0-9._\-/]/g, ''), {
      cwd,
      stdio: 'pipe',
    });
    return true;
  } catch {
    return false;
  }
}

export function execGit(cwd: string, args: string[]): { exitCode: number; stdout: string; stderr: string } {
  const result = spawnSync('git', args, {
    cwd,
    stdio: 'pipe',
    encoding: 'utf-8',
  });
  return {
    exitCode: result.status ?? 1,
    stdout: (result.stdout ?? '').toString().trim(),
    stderr: (result.stderr ?? '').toString().trim(),
  };
}

// ─── Phase utilities ──────────────────────────────────────────────────────────

export function escapeRegex(value: unknown): string {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function normalizePhaseName(phase: unknown): string {
  const match = String(phase).match(/^(\d+)([A-Z])?((?:\.\d+)*)/i);
  if (!match) return String(phase);
  const padded = match[1].padStart(2, '0');
  const letter = match[2] ? match[2].toUpperCase() : '';
  const decimal = match[3] || '';
  return padded + letter + decimal;
}

export function comparePhaseNum(a: unknown, b: unknown): number {
  const pa = String(a).match(/^(\d+)([A-Z])?((?:\.\d+)*)/i);
  const pb = String(b).match(/^(\d+)([A-Z])?((?:\.\d+)*)/i);
  if (!pa || !pb) return String(a).localeCompare(String(b));
  const intDiff = parseInt(pa[1], 10) - parseInt(pb[1], 10);
  if (intDiff !== 0) return intDiff;
  // No letter sorts before letter: 12 < 12A < 12B
  const la = (pa[2] || '').toUpperCase();
  const lb = (pb[2] || '').toUpperCase();
  if (la !== lb) {
    if (!la) return -1;
    if (!lb) return 1;
    return la < lb ? -1 : 1;
  }
  // Segment-by-segment decimal comparison: 12A < 12A.1 < 12A.1.2 < 12A.2
  const aDecParts = pa[3] ? pa[3].slice(1).split('.').map(p => parseInt(p, 10)) : [];
  const bDecParts = pb[3] ? pb[3].slice(1).split('.').map(p => parseInt(p, 10)) : [];
  const maxLen = Math.max(aDecParts.length, bDecParts.length);
  if (aDecParts.length === 0 && bDecParts.length > 0) return -1;
  if (bDecParts.length === 0 && aDecParts.length > 0) return 1;
  for (let i = 0; i < maxLen; i++) {
    const av = Number.isFinite(aDecParts[i]) ? aDecParts[i] : 0;
    const bv = Number.isFinite(bDecParts[i]) ? bDecParts[i] : 0;
    if (av !== bv) return av - bv;
  }
  return 0;
}

export interface PhaseInfo {
  found: boolean;
  directory: string | null;
  phase_number: string;
  phase_name: string | null;
  phase_slug: string | null;
  plans: string[];
  summaries: string[];
  incomplete_plans: string[];
  has_research: boolean;
  has_context: boolean;
  has_verification: boolean;
  archived?: string;
}

export function searchPhaseInDir(baseDir: string, relBase: string, normalized: string): PhaseInfo | null {
  try {
    const entries = fs.readdirSync(baseDir, { withFileTypes: true });
    const dirs = entries.filter(e => e.isDirectory()).map(e => e.name).sort((a, b) => comparePhaseNum(a, b));
    const match = dirs.find(d => d.startsWith(normalized));
    if (!match) return null;

    const dirMatch = match.match(/^(\d+[A-Z]?(?:\.\d+)*)-?(.*)/i);
    const phaseNumber = dirMatch ? dirMatch[1] : normalized;
    const phaseName = dirMatch && dirMatch[2] ? dirMatch[2] : null;
    const phaseDir = path.join(baseDir, match);
    const phaseFiles = fs.readdirSync(phaseDir);

    const plans = phaseFiles.filter(f => f.endsWith('-PLAN.md') || f === 'PLAN.md').sort();
    const summaries = phaseFiles.filter(f => f.endsWith('-SUMMARY.md') || f === 'SUMMARY.md').sort();
    const hasResearch = phaseFiles.some(f => f.endsWith('-RESEARCH.md') || f === 'RESEARCH.md');
    const hasContext = phaseFiles.some(f => f.endsWith('-CONTEXT.md') || f === 'CONTEXT.md');
    const hasVerification = phaseFiles.some(f => f.endsWith('-VERIFICATION.md') || f === 'VERIFICATION.md');

    const completedPlanIds = new Set(
      summaries.map(s => s.replace('-SUMMARY.md', '').replace('SUMMARY.md', ''))
    );
    const incompletePlans = plans.filter(p => {
      const planId = p.replace('-PLAN.md', '').replace('PLAN.md', '');
      return !completedPlanIds.has(planId);
    });

    return {
      found: true,
      directory: toPosixPath(path.join(relBase, match)),
      phase_number: phaseNumber,
      phase_name: phaseName,
      phase_slug: phaseName ? phaseName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') : null,
      plans,
      summaries,
      incomplete_plans: incompletePlans,
      has_research: hasResearch,
      has_context: hasContext,
      has_verification: hasVerification,
    };
  } catch {
    return null;
  }
}

export function findPhaseInternal(cwd: string, phase: unknown): PhaseInfo | null {
  if (!phase) return null;

  const phasesDir = path.join(cwd, '.planning', 'phases');
  const normalized = normalizePhaseName(phase);

  // Search current phases first
  const current = searchPhaseInDir(phasesDir, '.planning/phases', normalized);
  if (current) return current;

  // Search archived milestone phases (newest first)
  const milestonesDir = path.join(cwd, '.planning', 'milestones');
  if (!fs.existsSync(milestonesDir)) return null;

  try {
    const milestoneEntries = fs.readdirSync(milestonesDir, { withFileTypes: true });
    const archiveDirs = milestoneEntries
      .filter(e => e.isDirectory() && /^v[\d.]+-phases$/.test(e.name))
      .map(e => e.name)
      .sort()
      .reverse();

    for (const archiveName of archiveDirs) {
      const versionMatch = archiveName.match(/^(v[\d.]+)-phases$/);
      const version = versionMatch ? versionMatch[1] : archiveName;
      const archivePath = path.join(milestonesDir, archiveName);
      const relBase = '.planning/milestones/' + archiveName;
      const result = searchPhaseInDir(archivePath, relBase, normalized);
      if (result) {
        result.archived = version;
        return result;
      }
    }
  } catch {}

  return null;
}

export interface ArchivedPhaseDir {
  name: string;
  milestone: string;
  basePath: string;
  fullPath: string;
}

export function getArchivedPhaseDirs(cwd: string): ArchivedPhaseDir[] {
  const milestonesDir = path.join(cwd, '.planning', 'milestones');
  const results: ArchivedPhaseDir[] = [];

  if (!fs.existsSync(milestonesDir)) return results;

  try {
    const milestoneEntries = fs.readdirSync(milestonesDir, { withFileTypes: true });
    // Find v*-phases directories, sort newest first
    const phaseDirs = milestoneEntries
      .filter(e => e.isDirectory() && /^v[\d.]+-phases$/.test(e.name))
      .map(e => e.name)
      .sort()
      .reverse();

    for (const archiveName of phaseDirs) {
      const versionMatch = archiveName.match(/^(v[\d.]+)-phases$/);
      const version = versionMatch ? versionMatch[1] : archiveName;
      const archivePath = path.join(milestonesDir, archiveName);
      const entries = fs.readdirSync(archivePath, { withFileTypes: true });
      const dirs = entries.filter(e => e.isDirectory()).map(e => e.name).sort((a, b) => comparePhaseNum(a, b));

      for (const dir of dirs) {
        results.push({
          name: dir,
          milestone: version,
          basePath: path.join('.planning', 'milestones', archiveName),
          fullPath: path.join(archivePath, dir),
        });
      }
    }
  } catch {}

  return results;
}

// ─── Roadmap milestone scoping ───────────────────────────────────────────────

/**
 * Strip shipped milestone content wrapped in <details> blocks.
 * Used to isolate current milestone phases when searching ROADMAP.md
 * for phase headings or checkboxes — prevents matching archived milestone
 * phases that share the same numbers as current milestone phases.
 */
export function stripShippedMilestones(content: string): string {
  return content.replace(/<details>[\s\S]*?<\/details>/gi, '');
}

/**
 * Replace a pattern only in the current milestone section of ROADMAP.md
 * (everything after the last </details> close tag). Used for write operations
 * that must not accidentally modify archived milestone checkboxes/tables.
 */
export function replaceInCurrentMilestone(content: string, pattern: RegExp, replacement: string): string {
  const lastDetailsClose = content.lastIndexOf('</details>');
  if (lastDetailsClose === -1) {
    return content.replace(pattern, replacement);
  }
  const offset = lastDetailsClose + '</details>'.length;
  const before = content.slice(0, offset);
  const after = content.slice(offset);
  return before + after.replace(pattern, replacement);
}

// ─── Roadmap & model utilities ────────────────────────────────────────────────

export interface RoadmapPhaseInfo {
  found: boolean;
  phase_number: string;
  phase_name: string;
  goal: string | null;
  section: string;
}

export function getRoadmapPhaseInternal(cwd: string, phaseNum: unknown): RoadmapPhaseInfo | null {
  if (!phaseNum) return null;
  const roadmapPath = path.join(cwd, '.planning', 'ROADMAP.md');
  if (!fs.existsSync(roadmapPath)) return null;

  try {
    const content = stripShippedMilestones(fs.readFileSync(roadmapPath, 'utf-8'));
    const escapedPhase = escapeRegex(phaseNum.toString());
    const phasePattern = new RegExp(`#{2,4}\\s*Phase\\s+${escapedPhase}:\\s*([^\\n]+)`, 'i');
    const headerMatch = content.match(phasePattern);
    if (!headerMatch) return null;

    const phaseName = headerMatch[1].trim();
    const headerIndex = headerMatch.index!;
    const restOfContent = content.slice(headerIndex);
    const nextHeaderMatch = restOfContent.match(/\n#{2,4}\s+Phase\s+\d/i);
    const sectionEnd = nextHeaderMatch ? headerIndex + nextHeaderMatch.index! : content.length;
    const section = content.slice(headerIndex, sectionEnd).trim();

    const goalMatch = section.match(/\*\*Goal(?:\*\*:|\*?\*?:\*\*)\s*([^\n]+)/i);
    const goal = goalMatch ? goalMatch[1].trim() : null;

    return {
      found: true,
      phase_number: phaseNum.toString(),
      phase_name: phaseName,
      goal,
      section,
    };
  } catch {
    return null;
  }
}

export function resolveModelInternal(cwd: string, agentType: string): string {
  const config = loadConfig(cwd);

  // Check per-agent override first
  const override = config.model_overrides?.[agentType];
  if (override) {
    return override === 'opus' ? 'inherit' : override;
  }

  // Fall back to profile lookup
  const profile = String(config.model_profile || 'balanced').toLowerCase();
  const agentModels = MODEL_PROFILES[agentType] as Record<string, string> | undefined;
  if (!agentModels) return 'sonnet';
  if (profile === 'inherit') return 'inherit';
  const resolved = agentModels[profile] || agentModels['balanced'] || 'sonnet';
  return resolved === 'opus' ? 'inherit' : resolved;
}

// ─── Misc utilities ───────────────────────────────────────────────────────────

export function pathExistsInternal(cwd: string, targetPath: string): boolean {
  const fullPath = path.isAbsolute(targetPath) ? targetPath : path.join(cwd, targetPath);
  try {
    fs.statSync(fullPath);
    return true;
  } catch {
    return false;
  }
}

export function generateSlugInternal(text: unknown): string | null {
  if (!text) return null;
  return String(text).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

export interface MilestoneInfo {
  version: string;
  name: string;
}

export function getMilestoneInfo(cwd: string): MilestoneInfo {
  try {
    const roadmap = fs.readFileSync(path.join(cwd, '.planning', 'ROADMAP.md'), 'utf-8');

    // First: check for list-format roadmaps using 🚧 (in-progress) marker
    // e.g. "- 🚧 **v2.1 Belgium** — Phases 24-28 (in progress)"
    const inProgressMatch = roadmap.match(/🚧\s*\*\*v(\d+\.\d+)\s+([^*]+)\*\*/);
    if (inProgressMatch) {
      return {
        version: 'v' + inProgressMatch[1],
        name: inProgressMatch[2].trim(),
      };
    }

    // Second: heading-format roadmaps — strip shipped milestones in <details> blocks
    const cleaned = stripShippedMilestones(roadmap);
    // Extract version and name from the same ## heading for consistency
    const headingMatch = cleaned.match(/## .*v(\d+\.\d+)[:\s]+([^\n(]+)/);
    if (headingMatch) {
      return {
        version: 'v' + headingMatch[1],
        name: headingMatch[2].trim(),
      };
    }
    // Fallback: try bare version match
    const versionMatch = cleaned.match(/v(\d+\.\d+)/);
    return {
      version: versionMatch ? versionMatch[0] : 'v1.0',
      name: 'milestone',
    };
  } catch {
    return { version: 'v1.0', name: 'milestone' };
  }
}

/**
 * Returns a filter function that checks whether a phase directory belongs
 * to the current milestone based on ROADMAP.md phase headings.
 * If no ROADMAP exists or no phases are listed, returns a pass-all filter.
 */
export function getMilestonePhaseFilter(cwd: string): PhaseFilter {
  const milestonePhaseNums = new Set<string>();
  try {
    const roadmap = stripShippedMilestones(fs.readFileSync(path.join(cwd, '.planning', 'ROADMAP.md'), 'utf-8'));
    const phasePattern = /#{2,4}\s*Phase\s+(\d+[A-Z]?(?:\.\d+)*)\s*:/gi;
    let m: RegExpExecArray | null;
    while ((m = phasePattern.exec(roadmap)) !== null) {
      milestonePhaseNums.add(m[1]);
    }
  } catch {}

  if (milestonePhaseNums.size === 0) {
    const passAll = (_dirName: string) => true;
    (passAll as PhaseFilter).phaseCount = 0;
    return passAll as PhaseFilter;
  }

  const normalized = new Set(
    [...milestonePhaseNums].map(n => (n.replace(/^0+/, '') || '0').toLowerCase())
  );

  function isDirInMilestone(dirName: string): boolean {
    const m = dirName.match(/^0*(\d+[A-Za-z]?(?:\.\d+)*)/);
    if (!m) return false;
    return normalized.has(m[1].toLowerCase());
  }
  (isDirInMilestone as PhaseFilter).phaseCount = milestonePhaseNums.size;
  return isDirInMilestone as PhaseFilter;
}

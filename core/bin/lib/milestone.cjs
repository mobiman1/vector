"use strict";
/**
 * Milestone — Milestone and requirements lifecycle operations
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cmdRequirementsMarkComplete = cmdRequirementsMarkComplete;
exports.cmdMilestoneComplete = cmdMilestoneComplete;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const core_cjs_1 = require("./core.cjs");
const frontmatter_cjs_1 = require("./frontmatter.cjs");
const state_cjs_1 = require("./state.cjs");
function cmdRequirementsMarkComplete(cwd, reqIdsRaw, raw) {
    if (!reqIdsRaw || reqIdsRaw.length === 0) {
        (0, core_cjs_1.error)('requirement IDs required. Usage: requirements mark-complete REQ-01,REQ-02 or REQ-01 REQ-02');
    }
    // Accept comma-separated, space-separated, or bracket-wrapped: [REQ-01, REQ-02]
    const reqIds = reqIdsRaw
        .join(' ')
        .replace(/[\[\]]/g, '')
        .split(/[,\s]+/)
        .map(r => r.trim())
        .filter(Boolean);
    if (reqIds.length === 0) {
        (0, core_cjs_1.error)('no valid requirement IDs found');
    }
    const reqPath = path_1.default.join(cwd, '.planning', 'REQUIREMENTS.md');
    if (!fs_1.default.existsSync(reqPath)) {
        (0, core_cjs_1.output)({ updated: false, reason: 'REQUIREMENTS.md not found', ids: reqIds }, raw, 'no requirements file');
        return;
    }
    let reqContent = fs_1.default.readFileSync(reqPath, 'utf-8');
    const updated = [];
    const notFound = [];
    for (const reqId of reqIds) {
        let found = false;
        const reqEscaped = (0, core_cjs_1.escapeRegex)(reqId);
        // Update checkbox: - [ ] **REQ-ID** → - [x] **REQ-ID**
        const checkboxPattern = new RegExp(`(-\\s*\\[)[ ](\\]\\s*\\*\\*${reqEscaped}\\*\\*)`, 'gi');
        if (checkboxPattern.test(reqContent)) {
            reqContent = reqContent.replace(new RegExp(`(-\\s*\\[)[ ](\\]\\s*\\*\\*${reqEscaped}\\*\\*)`, 'gi'), '$1x$2');
            found = true;
        }
        // Update traceability table: | REQ-ID | Phase N | Pending | → | REQ-ID | Phase N | Complete |
        const tablePattern = new RegExp(`(\\|\\s*${reqEscaped}\\s*\\|[^|]+\\|)\\s*Pending\\s*(\\|)`, 'gi');
        if (tablePattern.test(reqContent)) {
            // Re-read since test() advances lastIndex for global regex
            reqContent = reqContent.replace(new RegExp(`(\\|\\s*${reqEscaped}\\s*\\|[^|]+\\|)\\s*Pending\\s*(\\|)`, 'gi'), '$1 Complete $2');
            found = true;
        }
        if (found) {
            updated.push(reqId);
        }
        else {
            notFound.push(reqId);
        }
    }
    if (updated.length > 0) {
        fs_1.default.writeFileSync(reqPath, reqContent, 'utf-8');
    }
    (0, core_cjs_1.output)({
        updated: updated.length > 0,
        marked_complete: updated,
        not_found: notFound,
        total: reqIds.length,
    }, raw, `${updated.length}/${reqIds.length} requirements marked complete`);
}
function cmdMilestoneComplete(cwd, version, options, raw) {
    if (!version) {
        (0, core_cjs_1.error)('version required for milestone complete (e.g., v1.0)');
    }
    const roadmapPath = path_1.default.join(cwd, '.planning', 'ROADMAP.md');
    const reqPath = path_1.default.join(cwd, '.planning', 'REQUIREMENTS.md');
    const statePath = path_1.default.join(cwd, '.planning', 'STATE.md');
    const milestonesPath = path_1.default.join(cwd, '.planning', 'MILESTONES.md');
    const archiveDir = path_1.default.join(cwd, '.planning', 'milestones');
    const phasesDir = path_1.default.join(cwd, '.planning', 'phases');
    const today = new Date().toISOString().split('T')[0];
    const milestoneName = options.name || version;
    // Ensure archive directory exists
    fs_1.default.mkdirSync(archiveDir, { recursive: true });
    // Scope stats and accomplishments to only the phases belonging to the
    // current milestone's ROADMAP.  Uses the shared filter from core.cjs
    // (same logic used by cmdPhasesList and other callers).
    const isDirInMilestone = (0, core_cjs_1.getMilestonePhaseFilter)(cwd);
    // Gather stats from phases (scoped to current milestone only)
    let phaseCount = 0;
    let totalPlans = 0;
    let totalTasks = 0;
    const accomplishments = [];
    try {
        const entries = fs_1.default.readdirSync(phasesDir, { withFileTypes: true });
        const dirs = entries.filter(e => e.isDirectory()).map(e => e.name).sort();
        for (const dir of dirs) {
            if (!isDirInMilestone(dir))
                continue;
            phaseCount++;
            const phaseFiles = fs_1.default.readdirSync(path_1.default.join(phasesDir, dir));
            const plans = phaseFiles.filter(f => f.endsWith('-PLAN.md') || f === 'PLAN.md');
            const summaries = phaseFiles.filter(f => f.endsWith('-SUMMARY.md') || f === 'SUMMARY.md');
            totalPlans += plans.length;
            // Extract one-liners from summaries
            for (const s of summaries) {
                try {
                    const content = fs_1.default.readFileSync(path_1.default.join(phasesDir, dir, s), 'utf-8');
                    const fm = (0, frontmatter_cjs_1.extractFrontmatter)(content);
                    if (fm['one-liner']) {
                        accomplishments.push(fm['one-liner']);
                    }
                    // Count tasks
                    const taskMatches = content.match(/##\s*Task\s*\d+/gi) || [];
                    totalTasks += taskMatches.length;
                }
                catch { }
            }
        }
    }
    catch { }
    // Archive ROADMAP.md
    if (fs_1.default.existsSync(roadmapPath)) {
        const roadmapContent = fs_1.default.readFileSync(roadmapPath, 'utf-8');
        fs_1.default.writeFileSync(path_1.default.join(archiveDir, `${version}-ROADMAP.md`), roadmapContent, 'utf-8');
    }
    // Archive REQUIREMENTS.md
    if (fs_1.default.existsSync(reqPath)) {
        const reqContent = fs_1.default.readFileSync(reqPath, 'utf-8');
        const archiveHeader = `# Requirements Archive: ${version} ${milestoneName}\n\n**Archived:** ${today}\n**Status:** SHIPPED\n\nFor current requirements, see \`.planning/REQUIREMENTS.md\`.\n\n---\n\n`;
        fs_1.default.writeFileSync(path_1.default.join(archiveDir, `${version}-REQUIREMENTS.md`), archiveHeader + reqContent, 'utf-8');
    }
    // Archive audit file if exists
    const auditFile = path_1.default.join(cwd, '.planning', `${version}-MILESTONE-AUDIT.md`);
    if (fs_1.default.existsSync(auditFile)) {
        fs_1.default.renameSync(auditFile, path_1.default.join(archiveDir, `${version}-MILESTONE-AUDIT.md`));
    }
    // Create/append MILESTONES.md entry
    const accomplishmentsList = accomplishments.map(a => `- ${a}`).join('\n');
    const milestoneEntry = `## ${version} ${milestoneName} (Shipped: ${today})\n\n**Phases completed:** ${phaseCount} phases, ${totalPlans} plans, ${totalTasks} tasks\n\n**Key accomplishments:**\n${accomplishmentsList || '- (none recorded)'}\n\n---\n\n`;
    if (fs_1.default.existsSync(milestonesPath)) {
        const existing = fs_1.default.readFileSync(milestonesPath, 'utf-8');
        if (!existing.trim()) {
            // Empty file — treat like new
            fs_1.default.writeFileSync(milestonesPath, `# Milestones\n\n${milestoneEntry}`, 'utf-8');
        }
        else {
            // Insert after the header line(s) for reverse chronological order (newest first)
            const headerMatch = existing.match(/^(#{1,3}\s+[^\n]*\n\n?)/);
            if (headerMatch) {
                const header = headerMatch[1];
                const rest = existing.slice(header.length);
                fs_1.default.writeFileSync(milestonesPath, header + milestoneEntry + rest, 'utf-8');
            }
            else {
                // No recognizable header — prepend the entry
                fs_1.default.writeFileSync(milestonesPath, milestoneEntry + existing, 'utf-8');
            }
        }
    }
    else {
        fs_1.default.writeFileSync(milestonesPath, `# Milestones\n\n${milestoneEntry}`, 'utf-8');
    }
    // Update STATE.md
    if (fs_1.default.existsSync(statePath)) {
        let stateContent = fs_1.default.readFileSync(statePath, 'utf-8');
        stateContent = stateContent.replace(/(\*\*Status:\*\*\s*).*/, `$1${version} milestone complete`);
        stateContent = stateContent.replace(/(\*\*Last Activity:\*\*\s*).*/, `$1${today}`);
        stateContent = stateContent.replace(/(\*\*Last Activity Description:\*\*\s*).*/, `$1${version} milestone completed and archived`);
        (0, state_cjs_1.writeStateMd)(statePath, stateContent, cwd);
    }
    // Archive phase directories if requested
    let phasesArchived = false;
    if (options.archivePhases) {
        try {
            const phaseArchiveDir = path_1.default.join(archiveDir, `${version}-phases`);
            fs_1.default.mkdirSync(phaseArchiveDir, { recursive: true });
            const phaseEntries = fs_1.default.readdirSync(phasesDir, { withFileTypes: true });
            const phaseDirNames = phaseEntries.filter(e => e.isDirectory()).map(e => e.name);
            let archivedCount = 0;
            for (const dir of phaseDirNames) {
                if (!isDirInMilestone(dir))
                    continue;
                fs_1.default.renameSync(path_1.default.join(phasesDir, dir), path_1.default.join(phaseArchiveDir, dir));
                archivedCount++;
            }
            phasesArchived = archivedCount > 0;
        }
        catch { }
    }
    const result = {
        version,
        name: milestoneName,
        date: today,
        phases: phaseCount,
        plans: totalPlans,
        tasks: totalTasks,
        accomplishments,
        archived: {
            roadmap: fs_1.default.existsSync(path_1.default.join(archiveDir, `${version}-ROADMAP.md`)),
            requirements: fs_1.default.existsSync(path_1.default.join(archiveDir, `${version}-REQUIREMENTS.md`)),
            audit: fs_1.default.existsSync(path_1.default.join(archiveDir, `${version}-MILESTONE-AUDIT.md`)),
            phases: phasesArchived,
        },
        milestones_updated: true,
        state_updated: fs_1.default.existsSync(statePath),
    };
    (0, core_cjs_1.output)(result, raw);
}
//# sourceMappingURL=milestone.cjs.map
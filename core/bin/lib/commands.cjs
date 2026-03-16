"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cmdGenerateSlug = cmdGenerateSlug;
exports.cmdCurrentTimestamp = cmdCurrentTimestamp;
exports.cmdListTodos = cmdListTodos;
exports.cmdVerifyPathExists = cmdVerifyPathExists;
exports.cmdHistoryDigest = cmdHistoryDigest;
exports.cmdResolveModel = cmdResolveModel;
exports.cmdCommit = cmdCommit;
exports.cmdSummaryExtract = cmdSummaryExtract;
exports.cmdWebsearch = cmdWebsearch;
exports.cmdProgressRender = cmdProgressRender;
exports.cmdTodoComplete = cmdTodoComplete;
exports.cmdScaffold = cmdScaffold;
exports.cmdStats = cmdStats;
/**
 * Commands — Standalone utility commands
 */
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const core_cjs_1 = require("./core.cjs");
const frontmatter_cjs_1 = require("./frontmatter.cjs");
const model_profiles_cjs_1 = require("./model-profiles.cjs");
function cmdGenerateSlug(text, raw) {
    if (!text) {
        (0, core_cjs_1.error)('text required for slug generation');
    }
    const slug = text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    const result = { slug };
    (0, core_cjs_1.output)(result, raw, slug);
}
function cmdCurrentTimestamp(format, raw) {
    const now = new Date();
    let result;
    switch (format) {
        case 'date':
            result = now.toISOString().split('T')[0];
            break;
        case 'filename':
            result = now.toISOString().replace(/:/g, '-').replace(/\..+/, '');
            break;
        case 'full':
        default:
            result = now.toISOString();
            break;
    }
    (0, core_cjs_1.output)({ timestamp: result }, raw, result);
}
function cmdListTodos(cwd, area, raw) {
    const pendingDir = path_1.default.join(cwd, '.planning', 'todos', 'pending');
    let count = 0;
    const todos = [];
    try {
        const files = fs_1.default.readdirSync(pendingDir).filter(f => f.endsWith('.md'));
        for (const file of files) {
            try {
                const content = fs_1.default.readFileSync(path_1.default.join(pendingDir, file), 'utf-8');
                const createdMatch = content.match(/^created:\s*(.+)$/m);
                const titleMatch = content.match(/^title:\s*(.+)$/m);
                const areaMatch = content.match(/^area:\s*(.+)$/m);
                const todoArea = areaMatch ? areaMatch[1].trim() : 'general';
                // Apply area filter if specified
                if (area && todoArea !== area)
                    continue;
                count++;
                todos.push({
                    file,
                    created: createdMatch ? createdMatch[1].trim() : 'unknown',
                    title: titleMatch ? titleMatch[1].trim() : 'Untitled',
                    area: todoArea,
                    path: (0, core_cjs_1.toPosixPath)(path_1.default.join('.planning', 'todos', 'pending', file)),
                });
            }
            catch { }
        }
    }
    catch { }
    const result = { count, todos };
    (0, core_cjs_1.output)(result, raw, count.toString());
}
function cmdVerifyPathExists(cwd, targetPath, raw) {
    if (!targetPath) {
        (0, core_cjs_1.error)('path required for verification');
    }
    const fullPath = path_1.default.isAbsolute(targetPath) ? targetPath : path_1.default.join(cwd, targetPath);
    try {
        const stats = fs_1.default.statSync(fullPath);
        const type = stats.isDirectory() ? 'directory' : stats.isFile() ? 'file' : 'other';
        const result = { exists: true, type };
        (0, core_cjs_1.output)(result, raw, 'true');
    }
    catch {
        const result = { exists: false, type: null };
        (0, core_cjs_1.output)(result, raw, 'false');
    }
}
function cmdHistoryDigest(cwd, raw) {
    const phasesDir = path_1.default.join(cwd, '.planning', 'phases');
    const digest = { phases: {}, decisions: [], tech_stack: new Set() };
    // Collect all phase directories: archived + current
    const allPhaseDirs = [];
    // Add archived phases first (oldest milestones first)
    const archived = (0, core_cjs_1.getArchivedPhaseDirs)(cwd);
    for (const a of archived) {
        allPhaseDirs.push({ name: a.name, fullPath: a.fullPath, milestone: a.milestone });
    }
    // Add current phases
    if (fs_1.default.existsSync(phasesDir)) {
        try {
            const currentDirs = fs_1.default.readdirSync(phasesDir, { withFileTypes: true })
                .filter(e => e.isDirectory())
                .map(e => e.name)
                .sort();
            for (const dir of currentDirs) {
                allPhaseDirs.push({ name: dir, fullPath: path_1.default.join(phasesDir, dir), milestone: null });
            }
        }
        catch { }
    }
    if (allPhaseDirs.length === 0) {
        digest.tech_stack = [];
        (0, core_cjs_1.output)(digest, raw);
        return;
    }
    try {
        for (const { name: dir, fullPath: dirPath } of allPhaseDirs) {
            const summaries = fs_1.default.readdirSync(dirPath).filter(f => f.endsWith('-SUMMARY.md') || f === 'SUMMARY.md');
            for (const summary of summaries) {
                try {
                    const content = fs_1.default.readFileSync(path_1.default.join(dirPath, summary), 'utf-8');
                    const fm = (0, frontmatter_cjs_1.extractFrontmatter)(content);
                    const phaseNum = fm.phase || dir.split('-')[0];
                    if (!digest.phases[phaseNum]) {
                        digest.phases[phaseNum] = {
                            name: fm.name || dir.split('-').slice(1).join(' ') || 'Unknown',
                            provides: new Set(),
                            affects: new Set(),
                            patterns: new Set(),
                        };
                    }
                    const phaseEntry = digest.phases[phaseNum];
                    // Merge provides
                    const depGraph = fm['dependency-graph'];
                    if (depGraph && depGraph.provides) {
                        depGraph.provides.forEach(p => phaseEntry.provides.add(p));
                    }
                    else if (fm.provides) {
                        fm.provides.forEach(p => phaseEntry.provides.add(p));
                    }
                    // Merge affects
                    if (depGraph && depGraph.affects) {
                        depGraph.affects.forEach(a => phaseEntry.affects.add(a));
                    }
                    // Merge patterns
                    if (fm['patterns-established']) {
                        fm['patterns-established'].forEach(p => phaseEntry.patterns.add(p));
                    }
                    // Merge decisions
                    if (fm['key-decisions']) {
                        fm['key-decisions'].forEach(d => {
                            digest.decisions.push({ phase: phaseNum, decision: d });
                        });
                    }
                    // Merge tech stack
                    if (fm['tech-stack'] && fm['tech-stack'].added) {
                        fm['tech-stack'].added.forEach(t => digest.tech_stack.add(typeof t === 'string' ? t : t.name));
                    }
                }
                catch {
                    // Skip malformed summaries
                }
            }
        }
        // Convert Sets to Arrays for JSON output
        Object.keys(digest.phases).forEach(p => {
            const phase = digest.phases[p];
            phase.provides = [...phase.provides];
            phase.affects = [...phase.affects];
            phase.patterns = [...phase.patterns];
        });
        digest.tech_stack = [...digest.tech_stack];
        (0, core_cjs_1.output)(digest, raw);
    }
    catch (e) {
        (0, core_cjs_1.error)('Failed to generate history digest: ' + e.message);
    }
}
function cmdResolveModel(cwd, agentType, raw) {
    if (!agentType) {
        (0, core_cjs_1.error)('agent-type required');
    }
    const config = (0, core_cjs_1.loadConfig)(cwd);
    const profile = config.model_profile || 'balanced';
    const model = (0, core_cjs_1.resolveModelInternal)(cwd, agentType);
    const agentModels = model_profiles_cjs_1.MODEL_PROFILES[agentType];
    const result = agentModels
        ? { model, profile }
        : { model, profile, unknown_agent: true };
    (0, core_cjs_1.output)(result, raw, model);
}
function cmdCommit(cwd, message, files, raw, amend) {
    if (!message && !amend) {
        (0, core_cjs_1.error)('commit message required');
    }
    const config = (0, core_cjs_1.loadConfig)(cwd);
    // Check commit_docs config
    if (!config.commit_docs) {
        const result = { committed: false, hash: null, reason: 'skipped_commit_docs_false' };
        (0, core_cjs_1.output)(result, raw, 'skipped');
        return;
    }
    // Check if .planning is gitignored
    if ((0, core_cjs_1.isGitIgnored)(cwd, '.planning')) {
        const result = { committed: false, hash: null, reason: 'skipped_gitignored' };
        (0, core_cjs_1.output)(result, raw, 'skipped');
        return;
    }
    // Stage files
    const filesToStage = files && files.length > 0 ? files : ['.planning/'];
    for (const file of filesToStage) {
        (0, core_cjs_1.execGit)(cwd, ['add', file]);
    }
    // Commit
    const commitArgs = amend ? ['commit', '--amend', '--no-edit'] : ['commit', '-m', message];
    const commitResult = (0, core_cjs_1.execGit)(cwd, commitArgs);
    if (commitResult.exitCode !== 0) {
        if (commitResult.stdout.includes('nothing to commit') || commitResult.stderr.includes('nothing to commit')) {
            const result = { committed: false, hash: null, reason: 'nothing_to_commit' };
            (0, core_cjs_1.output)(result, raw, 'nothing');
            return;
        }
        const result = { committed: false, hash: null, reason: 'nothing_to_commit', error: commitResult.stderr };
        (0, core_cjs_1.output)(result, raw, 'nothing');
        return;
    }
    // Get short hash
    const hashResult = (0, core_cjs_1.execGit)(cwd, ['rev-parse', '--short', 'HEAD']);
    const hash = hashResult.exitCode === 0 ? hashResult.stdout : null;
    const result = { committed: true, hash, reason: 'committed' };
    (0, core_cjs_1.output)(result, raw, hash || 'committed');
}
function cmdSummaryExtract(cwd, summaryPath, fields, raw) {
    if (!summaryPath) {
        (0, core_cjs_1.error)('summary-path required for summary-extract');
    }
    const fullPath = path_1.default.join(cwd, summaryPath);
    if (!fs_1.default.existsSync(fullPath)) {
        (0, core_cjs_1.output)({ error: 'File not found', path: summaryPath }, raw);
        return;
    }
    const content = fs_1.default.readFileSync(fullPath, 'utf-8');
    const fm = (0, frontmatter_cjs_1.extractFrontmatter)(content);
    // Parse key-decisions into structured format
    const parseDecisions = (decisionsList) => {
        if (!decisionsList || !Array.isArray(decisionsList))
            return [];
        return decisionsList.map(d => {
            const colonIdx = d.indexOf(':');
            if (colonIdx > 0) {
                return {
                    summary: d.substring(0, colonIdx).trim(),
                    rationale: d.substring(colonIdx + 1).trim(),
                };
            }
            return { summary: d, rationale: null };
        });
    };
    // Build full result
    const fullResult = {
        path: summaryPath,
        one_liner: fm['one-liner'] || null,
        key_files: fm['key-files'] || [],
        tech_added: (fm['tech-stack'] && fm['tech-stack'].added) || [],
        patterns: fm['patterns-established'] || [],
        decisions: parseDecisions(fm['key-decisions']),
        requirements_completed: fm['requirements-completed'] || [],
    };
    // If fields specified, filter to only those fields
    if (fields && fields.length > 0) {
        const filtered = { path: summaryPath };
        for (const field of fields) {
            if (fullResult[field] !== undefined) {
                filtered[field] = fullResult[field];
            }
        }
        (0, core_cjs_1.output)(filtered, raw);
        return;
    }
    (0, core_cjs_1.output)(fullResult, raw);
}
async function cmdWebsearch(query, options, raw) {
    const apiKey = process.env.BRAVE_API_KEY;
    if (!apiKey) {
        // No key = silent skip, agent falls back to built-in WebSearch
        (0, core_cjs_1.output)({ available: false, reason: 'BRAVE_API_KEY not set' }, raw, '');
        return;
    }
    if (!query) {
        (0, core_cjs_1.output)({ available: false, error: 'Query required' }, raw, '');
        return;
    }
    const params = new URLSearchParams({
        q: query,
        count: String(options.limit || 10),
        country: 'us',
        search_lang: 'en',
        text_decorations: 'false'
    });
    if (options.freshness) {
        params.set('freshness', options.freshness);
    }
    try {
        const response = await fetch(`https://api.search.brave.com/res/v1/web/search?${params}`, {
            headers: {
                'Accept': 'application/json',
                'X-Subscription-Token': apiKey
            }
        });
        if (!response.ok) {
            (0, core_cjs_1.output)({ available: false, error: `API error: ${response.status}` }, raw, '');
            return;
        }
        const data = await response.json();
        const results = (data.web?.results || []).map(r => ({
            title: r.title,
            url: r.url,
            description: r.description,
            age: r.age || null
        }));
        (0, core_cjs_1.output)({
            available: true,
            query,
            count: results.length,
            results
        }, raw, results.map(r => `${r.title}\n${r.url}\n${r.description}`).join('\n\n'));
    }
    catch (err) {
        (0, core_cjs_1.output)({ available: false, error: err.message }, raw, '');
    }
}
function cmdProgressRender(cwd, format, raw) {
    const phasesDir = path_1.default.join(cwd, '.planning', 'phases');
    const milestone = (0, core_cjs_1.getMilestoneInfo)(cwd);
    const phases = [];
    let totalPlans = 0;
    let totalSummaries = 0;
    try {
        const entries = fs_1.default.readdirSync(phasesDir, { withFileTypes: true });
        const dirs = entries.filter(e => e.isDirectory()).map(e => e.name).sort((a, b) => (0, core_cjs_1.comparePhaseNum)(a, b));
        for (const dir of dirs) {
            const dm = dir.match(/^(\d+(?:\.\d+)*)-?(.*)/);
            const phaseNum = dm ? dm[1] : dir;
            const phaseName = dm && dm[2] ? dm[2].replace(/-/g, ' ') : '';
            const phaseFiles = fs_1.default.readdirSync(path_1.default.join(phasesDir, dir));
            const plans = phaseFiles.filter(f => f.endsWith('-PLAN.md') || f === 'PLAN.md').length;
            const summaries = phaseFiles.filter(f => f.endsWith('-SUMMARY.md') || f === 'SUMMARY.md').length;
            totalPlans += plans;
            totalSummaries += summaries;
            let status;
            if (plans === 0)
                status = 'Pending';
            else if (summaries >= plans)
                status = 'Complete';
            else if (summaries > 0)
                status = 'In Progress';
            else
                status = 'Planned';
            phases.push({ number: phaseNum, name: phaseName, plans, summaries, status });
        }
    }
    catch { }
    const percent = totalPlans > 0 ? Math.min(100, Math.round((totalSummaries / totalPlans) * 100)) : 0;
    if (format === 'table') {
        // Render markdown table
        const barWidth = 10;
        const filled = Math.round((percent / 100) * barWidth);
        const bar = '\u2588'.repeat(filled) + '\u2591'.repeat(barWidth - filled);
        let out = `# ${milestone.version} ${milestone.name}\n\n`;
        out += `**Progress:** [${bar}] ${totalSummaries}/${totalPlans} plans (${percent}%)\n\n`;
        out += `| Phase | Name | Plans | Status |\n`;
        out += `|-------|------|-------|--------|\n`;
        for (const p of phases) {
            out += `| ${p.number} | ${p.name} | ${p.summaries}/${p.plans} | ${p.status} |\n`;
        }
        (0, core_cjs_1.output)({ rendered: out }, raw, out);
    }
    else if (format === 'bar') {
        const barWidth = 20;
        const filled = Math.round((percent / 100) * barWidth);
        const bar = '\u2588'.repeat(filled) + '\u2591'.repeat(barWidth - filled);
        const text = `[${bar}] ${totalSummaries}/${totalPlans} plans (${percent}%)`;
        (0, core_cjs_1.output)({ bar: text, percent, completed: totalSummaries, total: totalPlans }, raw, text);
    }
    else {
        // JSON format
        (0, core_cjs_1.output)({
            milestone_version: milestone.version,
            milestone_name: milestone.name,
            phases,
            total_plans: totalPlans,
            total_summaries: totalSummaries,
            percent,
        }, raw);
    }
}
function cmdTodoComplete(cwd, filename, raw) {
    if (!filename) {
        (0, core_cjs_1.error)('filename required for todo complete');
    }
    const pendingDir = path_1.default.join(cwd, '.planning', 'todos', 'pending');
    const completedDir = path_1.default.join(cwd, '.planning', 'todos', 'completed');
    const sourcePath = path_1.default.join(pendingDir, filename);
    if (!fs_1.default.existsSync(sourcePath)) {
        (0, core_cjs_1.error)(`Todo not found: ${filename}`);
    }
    // Ensure completed directory exists
    fs_1.default.mkdirSync(completedDir, { recursive: true });
    // Read, add completion timestamp, move
    let content = fs_1.default.readFileSync(sourcePath, 'utf-8');
    const today = new Date().toISOString().split('T')[0];
    content = `completed: ${today}\n` + content;
    fs_1.default.writeFileSync(path_1.default.join(completedDir, filename), content, 'utf-8');
    fs_1.default.unlinkSync(sourcePath);
    (0, core_cjs_1.output)({ completed: true, file: filename, date: today }, raw, 'completed');
}
function cmdScaffold(cwd, type, options, raw) {
    const { phase, name } = options;
    const padded = phase ? (0, core_cjs_1.normalizePhaseName)(phase) : '00';
    const today = new Date().toISOString().split('T')[0];
    // Find phase directory
    const phaseInfo = phase ? (0, core_cjs_1.findPhaseInternal)(cwd, phase) : null;
    const phaseDir = phaseInfo?.directory ? path_1.default.join(cwd, phaseInfo.directory) : null;
    if (phase && !phaseDir && type !== 'phase-dir') {
        (0, core_cjs_1.error)(`Phase ${phase} directory not found`);
    }
    let filePath, content;
    switch (type) {
        case 'context': {
            filePath = path_1.default.join(phaseDir, `${padded}-CONTEXT.md`);
            content = `---\nphase: "${padded}"\nname: "${name || phaseInfo?.phase_name || 'Unnamed'}"\ncreated: ${today}\n---\n\n# Phase ${phase}: ${name || phaseInfo?.phase_name || 'Unnamed'} — Context\n\n## Decisions\n\n_Decisions will be captured during /vector:discuss-phase ${phase}_\n\n## Discretion Areas\n\n_Areas where the executor can use judgment_\n\n## Deferred Ideas\n\n_Ideas to consider later_\n`;
            break;
        }
        case 'uat': {
            filePath = path_1.default.join(phaseDir, `${padded}-UAT.md`);
            content = `---\nphase: "${padded}"\nname: "${name || phaseInfo?.phase_name || 'Unnamed'}"\ncreated: ${today}\nstatus: pending\n---\n\n# Phase ${phase}: ${name || phaseInfo?.phase_name || 'Unnamed'} — User Acceptance Testing\n\n## Test Results\n\n| # | Test | Status | Notes |\n|---|------|--------|-------|\n\n## Summary\n\n_Pending UAT_\n`;
            break;
        }
        case 'verification': {
            filePath = path_1.default.join(phaseDir, `${padded}-VERIFICATION.md`);
            content = `---\nphase: "${padded}"\nname: "${name || phaseInfo?.phase_name || 'Unnamed'}"\ncreated: ${today}\nstatus: pending\n---\n\n# Phase ${phase}: ${name || phaseInfo?.phase_name || 'Unnamed'} — Verification\n\n## Goal-Backward Verification\n\n**Phase Goal:** [From ROADMAP.md]\n\n## Checks\n\n| # | Requirement | Status | Evidence |\n|---|------------|--------|----------|\n\n## Result\n\n_Pending verification_\n`;
            break;
        }
        case 'phase-dir': {
            if (!phase || !name) {
                (0, core_cjs_1.error)('phase and name required for phase-dir scaffold');
            }
            const slug = (0, core_cjs_1.generateSlugInternal)(name);
            const dirName = `${padded}-${slug}`;
            const phasesParent = path_1.default.join(cwd, '.planning', 'phases');
            fs_1.default.mkdirSync(phasesParent, { recursive: true });
            const dirPath = path_1.default.join(phasesParent, dirName);
            fs_1.default.mkdirSync(dirPath, { recursive: true });
            (0, core_cjs_1.output)({ created: true, directory: `.planning/phases/${dirName}`, path: dirPath }, raw, dirPath);
            return;
        }
        default:
            (0, core_cjs_1.error)(`Unknown scaffold type: ${type}. Available: context, uat, verification, phase-dir`);
            return;
    }
    if (fs_1.default.existsSync(filePath)) {
        (0, core_cjs_1.output)({ created: false, reason: 'already_exists', path: filePath }, raw, 'exists');
        return;
    }
    fs_1.default.writeFileSync(filePath, content, 'utf-8');
    const relPath = (0, core_cjs_1.toPosixPath)(path_1.default.relative(cwd, filePath));
    (0, core_cjs_1.output)({ created: true, path: relPath }, raw, relPath);
}
function cmdStats(cwd, format, raw) {
    const phasesDir = path_1.default.join(cwd, '.planning', 'phases');
    const roadmapPath = path_1.default.join(cwd, '.planning', 'ROADMAP.md');
    const reqPath = path_1.default.join(cwd, '.planning', 'REQUIREMENTS.md');
    const statePath = path_1.default.join(cwd, '.planning', 'STATE.md');
    const milestone = (0, core_cjs_1.getMilestoneInfo)(cwd);
    const isDirInMilestone = (0, core_cjs_1.getMilestonePhaseFilter)(cwd);
    // Phase & plan stats (reuse progress pattern)
    const phasesByNumber = new Map();
    let totalPlans = 0;
    let totalSummaries = 0;
    try {
        const roadmapContent = (0, core_cjs_1.stripShippedMilestones)(fs_1.default.readFileSync(roadmapPath, 'utf-8'));
        const headingPattern = /#{2,4}\s*Phase\s+(\d+[A-Z]?(?:\.\d+)*)\s*:\s*([^\n]+)/gi;
        let match;
        while ((match = headingPattern.exec(roadmapContent)) !== null) {
            phasesByNumber.set(match[1], {
                number: match[1],
                name: match[2].replace(/\(INSERTED\)/i, '').trim(),
                plans: 0,
                summaries: 0,
                status: 'Not Started',
            });
        }
    }
    catch { }
    try {
        const entries = fs_1.default.readdirSync(phasesDir, { withFileTypes: true });
        const dirs = entries
            .filter(e => e.isDirectory())
            .map(e => e.name)
            .filter(isDirInMilestone)
            .sort((a, b) => (0, core_cjs_1.comparePhaseNum)(a, b));
        for (const dir of dirs) {
            const dm = dir.match(/^(\d+[A-Z]?(?:\.\d+)*)-?(.*)/i);
            const phaseNum = dm ? dm[1] : dir;
            const phaseName = dm && dm[2] ? dm[2].replace(/-/g, ' ') : '';
            const phaseFiles = fs_1.default.readdirSync(path_1.default.join(phasesDir, dir));
            const plans = phaseFiles.filter(f => f.endsWith('-PLAN.md') || f === 'PLAN.md').length;
            const summaries = phaseFiles.filter(f => f.endsWith('-SUMMARY.md') || f === 'SUMMARY.md').length;
            totalPlans += plans;
            totalSummaries += summaries;
            let status;
            if (plans === 0)
                status = 'Not Started';
            else if (summaries >= plans)
                status = 'Complete';
            else if (summaries > 0)
                status = 'In Progress';
            else
                status = 'Planned';
            const existing = phasesByNumber.get(phaseNum);
            phasesByNumber.set(phaseNum, {
                number: phaseNum,
                name: existing?.name || phaseName,
                plans,
                summaries,
                status,
            });
        }
    }
    catch { }
    const phases = [...phasesByNumber.values()].sort((a, b) => (0, core_cjs_1.comparePhaseNum)(a.number, b.number));
    const completedPhases = phases.filter(p => p.status === 'Complete').length;
    const planPercent = totalPlans > 0 ? Math.min(100, Math.round((totalSummaries / totalPlans) * 100)) : 0;
    const percent = phases.length > 0 ? Math.min(100, Math.round((completedPhases / phases.length) * 100)) : 0;
    // Requirements stats
    let requirementsTotal = 0;
    let requirementsComplete = 0;
    try {
        if (fs_1.default.existsSync(reqPath)) {
            const reqContent = fs_1.default.readFileSync(reqPath, 'utf-8');
            const checked = reqContent.match(/^- \[x\] \*\*/gm);
            const unchecked = reqContent.match(/^- \[ \] \*\*/gm);
            requirementsComplete = checked ? checked.length : 0;
            requirementsTotal = requirementsComplete + (unchecked ? unchecked.length : 0);
        }
    }
    catch { }
    // Last activity from STATE.md
    let lastActivity = null;
    try {
        if (fs_1.default.existsSync(statePath)) {
            const stateContent = fs_1.default.readFileSync(statePath, 'utf-8');
            const activityMatch = stateContent.match(/^last_activity:\s*(.+)$/im)
                || stateContent.match(/\*\*Last Activity:\*\*\s*(.+)/i)
                || stateContent.match(/^Last Activity:\s*(.+)$/im)
                || stateContent.match(/^Last activity:\s*(.+)$/im);
            if (activityMatch)
                lastActivity = activityMatch[1].trim();
        }
    }
    catch { }
    // Git stats
    let gitCommits = 0;
    let gitFirstCommitDate = null;
    const commitCount = (0, core_cjs_1.execGit)(cwd, ['rev-list', '--count', 'HEAD']);
    if (commitCount.exitCode === 0) {
        gitCommits = parseInt(commitCount.stdout, 10) || 0;
    }
    const rootHash = (0, core_cjs_1.execGit)(cwd, ['rev-list', '--max-parents=0', 'HEAD']);
    if (rootHash.exitCode === 0 && rootHash.stdout) {
        const firstCommit = rootHash.stdout.split('\n')[0].trim();
        const firstDate = (0, core_cjs_1.execGit)(cwd, ['show', '-s', '--format=%as', firstCommit]);
        if (firstDate.exitCode === 0) {
            gitFirstCommitDate = firstDate.stdout || null;
        }
    }
    const result = {
        milestone_version: milestone.version,
        milestone_name: milestone.name,
        phases,
        phases_completed: completedPhases,
        phases_total: phases.length,
        total_plans: totalPlans,
        total_summaries: totalSummaries,
        percent,
        plan_percent: planPercent,
        requirements_total: requirementsTotal,
        requirements_complete: requirementsComplete,
        git_commits: gitCommits,
        git_first_commit_date: gitFirstCommitDate,
        last_activity: lastActivity,
    };
    if (format === 'table') {
        const barWidth = 10;
        const filled = Math.round((percent / 100) * barWidth);
        const bar = '\u2588'.repeat(filled) + '\u2591'.repeat(barWidth - filled);
        let out = `# ${milestone.version} ${milestone.name} \u2014 Statistics\n\n`;
        out += `**Progress:** [${bar}] ${completedPhases}/${phases.length} phases (${percent}%)\n`;
        if (totalPlans > 0) {
            out += `**Plans:** ${totalSummaries}/${totalPlans} complete (${planPercent}%)\n`;
        }
        out += `**Phases:** ${completedPhases}/${phases.length} complete\n`;
        if (requirementsTotal > 0) {
            out += `**Requirements:** ${requirementsComplete}/${requirementsTotal} complete\n`;
        }
        out += '\n';
        out += `| Phase | Name | Plans | Completed | Status |\n`;
        out += `|-------|------|-------|-----------|--------|\n`;
        for (const p of phases) {
            out += `| ${p.number} | ${p.name} | ${p.plans} | ${p.summaries} | ${p.status} |\n`;
        }
        if (gitCommits > 0) {
            out += `\n**Git:** ${gitCommits} commits`;
            if (gitFirstCommitDate)
                out += ` (since ${gitFirstCommitDate})`;
            out += '\n';
        }
        if (lastActivity)
            out += `**Last activity:** ${lastActivity}\n`;
        (0, core_cjs_1.output)({ rendered: out }, raw, out);
    }
    else {
        (0, core_cjs_1.output)(result, raw);
    }
}
//# sourceMappingURL=commands.cjs.map
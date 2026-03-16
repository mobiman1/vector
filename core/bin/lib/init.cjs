"use strict";
/**
 * Init — Compound init commands for workflow bootstrapping
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cmdInitExecutePhase = cmdInitExecutePhase;
exports.cmdInitPlanPhase = cmdInitPlanPhase;
exports.cmdInitNewProject = cmdInitNewProject;
exports.cmdInitNewMilestone = cmdInitNewMilestone;
exports.cmdInitQuick = cmdInitQuick;
exports.cmdInitResume = cmdInitResume;
exports.cmdInitVerifyWork = cmdInitVerifyWork;
exports.cmdInitPhaseOp = cmdInitPhaseOp;
exports.cmdInitTodos = cmdInitTodos;
exports.cmdInitMilestoneOp = cmdInitMilestoneOp;
exports.cmdInitMapCodebase = cmdInitMapCodebase;
exports.cmdInitProgress = cmdInitProgress;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
const child_process_1 = require("child_process");
const core_cjs_1 = require("./core.cjs");
function cmdInitExecutePhase(cwd, phase, raw) {
    if (!phase) {
        (0, core_cjs_1.error)('phase required for init execute-phase');
    }
    const config = (0, core_cjs_1.loadConfig)(cwd);
    const phaseInfo = (0, core_cjs_1.findPhaseInternal)(cwd, phase);
    const milestone = (0, core_cjs_1.getMilestoneInfo)(cwd);
    const roadmapPhase = (0, core_cjs_1.getRoadmapPhaseInternal)(cwd, phase);
    const reqMatch = roadmapPhase?.section?.match(/^\*\*Requirements\*\*:[^\S\n]*([^\n]*)$/m);
    const reqExtracted = reqMatch
        ? reqMatch[1].replace(/[\[\]]/g, '').split(',').map((s) => s.trim()).filter(Boolean).join(', ')
        : null;
    const phase_req_ids = (reqExtracted && reqExtracted !== 'TBD') ? reqExtracted : null;
    const result = {
        // Models
        executor_model: (0, core_cjs_1.resolveModelInternal)(cwd, 'vector-executor'),
        verifier_model: (0, core_cjs_1.resolveModelInternal)(cwd, 'vector-verifier'),
        // Config flags
        commit_docs: config.commit_docs,
        parallelization: config.parallelization,
        branching_strategy: config.branching_strategy,
        phase_branch_template: config.phase_branch_template,
        milestone_branch_template: config.milestone_branch_template,
        verifier_enabled: config.verifier,
        // Phase info
        phase_found: !!phaseInfo,
        phase_dir: phaseInfo?.directory || null,
        phase_number: phaseInfo?.phase_number || null,
        phase_name: phaseInfo?.phase_name || null,
        phase_slug: phaseInfo?.phase_slug || null,
        phase_req_ids,
        // Plan inventory
        plans: phaseInfo?.plans || [],
        summaries: phaseInfo?.summaries || [],
        incomplete_plans: phaseInfo?.incomplete_plans || [],
        plan_count: phaseInfo?.plans?.length || 0,
        incomplete_count: phaseInfo?.incomplete_plans?.length || 0,
        // Branch name (pre-computed)
        branch_name: config.branching_strategy === 'phase' && phaseInfo
            ? config.phase_branch_template
                .replace('{phase}', phaseInfo.phase_number)
                .replace('{slug}', phaseInfo.phase_slug || 'phase')
            : config.branching_strategy === 'milestone'
                ? config.milestone_branch_template
                    .replace('{milestone}', milestone.version)
                    .replace('{slug}', (0, core_cjs_1.generateSlugInternal)(milestone.name) || 'milestone')
                : null,
        // Milestone info
        milestone_version: milestone.version,
        milestone_name: milestone.name,
        milestone_slug: (0, core_cjs_1.generateSlugInternal)(milestone.name),
        // File existence
        state_exists: (0, core_cjs_1.pathExistsInternal)(cwd, '.planning/STATE.md'),
        roadmap_exists: (0, core_cjs_1.pathExistsInternal)(cwd, '.planning/ROADMAP.md'),
        config_exists: (0, core_cjs_1.pathExistsInternal)(cwd, '.planning/config.json'),
        // File paths
        state_path: '.planning/STATE.md',
        roadmap_path: '.planning/ROADMAP.md',
        config_path: '.planning/config.json',
    };
    (0, core_cjs_1.output)(result, raw);
}
function cmdInitPlanPhase(cwd, phase, raw) {
    if (!phase) {
        (0, core_cjs_1.error)('phase required for init plan-phase');
    }
    const config = (0, core_cjs_1.loadConfig)(cwd);
    const phaseInfo = (0, core_cjs_1.findPhaseInternal)(cwd, phase);
    const roadmapPhase = (0, core_cjs_1.getRoadmapPhaseInternal)(cwd, phase);
    const reqMatch = roadmapPhase?.section?.match(/^\*\*Requirements\*\*:[^\S\n]*([^\n]*)$/m);
    const reqExtracted = reqMatch
        ? reqMatch[1].replace(/[\[\]]/g, '').split(',').map((s) => s.trim()).filter(Boolean).join(', ')
        : null;
    const phase_req_ids = (reqExtracted && reqExtracted !== 'TBD') ? reqExtracted : null;
    const result = {
        // Models
        researcher_model: (0, core_cjs_1.resolveModelInternal)(cwd, 'vector-phase-researcher'),
        planner_model: (0, core_cjs_1.resolveModelInternal)(cwd, 'vector-planner'),
        checker_model: (0, core_cjs_1.resolveModelInternal)(cwd, 'vector-plan-checker'),
        // Workflow flags
        research_enabled: config.research,
        plan_checker_enabled: config.plan_checker,
        nyquist_validation_enabled: config.nyquist_validation,
        commit_docs: config.commit_docs,
        // Phase info
        phase_found: !!phaseInfo,
        phase_dir: phaseInfo?.directory || null,
        phase_number: phaseInfo?.phase_number || null,
        phase_name: phaseInfo?.phase_name || null,
        phase_slug: phaseInfo?.phase_slug || null,
        padded_phase: phaseInfo?.phase_number ? (0, core_cjs_1.normalizePhaseName)(phaseInfo.phase_number) : null,
        phase_req_ids,
        // Existing artifacts
        has_research: phaseInfo?.has_research || false,
        has_context: phaseInfo?.has_context || false,
        has_plans: (phaseInfo?.plans?.length || 0) > 0,
        plan_count: phaseInfo?.plans?.length || 0,
        // Environment
        planning_exists: (0, core_cjs_1.pathExistsInternal)(cwd, '.planning'),
        roadmap_exists: (0, core_cjs_1.pathExistsInternal)(cwd, '.planning/ROADMAP.md'),
        // File paths
        state_path: '.planning/STATE.md',
        roadmap_path: '.planning/ROADMAP.md',
        requirements_path: '.planning/REQUIREMENTS.md',
    };
    if (phaseInfo?.directory) {
        // Find *-CONTEXT.md in phase directory
        const phaseDirFull = path_1.default.join(cwd, phaseInfo.directory);
        try {
            const files = fs_1.default.readdirSync(phaseDirFull);
            const contextFile = files.find(f => f.endsWith('-CONTEXT.md') || f === 'CONTEXT.md');
            if (contextFile) {
                result.context_path = (0, core_cjs_1.toPosixPath)(path_1.default.join(phaseInfo.directory, contextFile));
            }
            const researchFile = files.find(f => f.endsWith('-RESEARCH.md') || f === 'RESEARCH.md');
            if (researchFile) {
                result.research_path = (0, core_cjs_1.toPosixPath)(path_1.default.join(phaseInfo.directory, researchFile));
            }
            const verificationFile = files.find(f => f.endsWith('-VERIFICATION.md') || f === 'VERIFICATION.md');
            if (verificationFile) {
                result.verification_path = (0, core_cjs_1.toPosixPath)(path_1.default.join(phaseInfo.directory, verificationFile));
            }
            const uatFile = files.find(f => f.endsWith('-UAT.md') || f === 'UAT.md');
            if (uatFile) {
                result.uat_path = (0, core_cjs_1.toPosixPath)(path_1.default.join(phaseInfo.directory, uatFile));
            }
        }
        catch { }
    }
    (0, core_cjs_1.output)(result, raw);
}
function cmdInitNewProject(cwd, raw) {
    const config = (0, core_cjs_1.loadConfig)(cwd);
    // Detect Brave Search API key availability
    const homedir = os_1.default.homedir();
    const braveKeyFile = path_1.default.join(homedir, '.vector', 'brave_api_key');
    const hasBraveSearch = !!(process.env.BRAVE_API_KEY || fs_1.default.existsSync(braveKeyFile));
    // Detect existing code
    let hasCode = false;
    let hasPackageFile = false;
    try {
        const files = (0, child_process_1.execSync)('find . -maxdepth 3 \\( -name "*.ts" -o -name "*.js" -o -name "*.py" -o -name "*.go" -o -name "*.rs" -o -name "*.swift" -o -name "*.java" \\) 2>/dev/null | grep -v node_modules | grep -v .git | head -5', {
            cwd,
            encoding: 'utf-8',
            stdio: ['pipe', 'pipe', 'pipe'],
        });
        hasCode = files.trim().length > 0;
    }
    catch { }
    hasPackageFile = (0, core_cjs_1.pathExistsInternal)(cwd, 'package.json') ||
        (0, core_cjs_1.pathExistsInternal)(cwd, 'requirements.txt') ||
        (0, core_cjs_1.pathExistsInternal)(cwd, 'Cargo.toml') ||
        (0, core_cjs_1.pathExistsInternal)(cwd, 'go.mod') ||
        (0, core_cjs_1.pathExistsInternal)(cwd, 'Package.swift');
    const result = {
        // Models
        researcher_model: (0, core_cjs_1.resolveModelInternal)(cwd, 'vector-project-researcher'),
        synthesizer_model: (0, core_cjs_1.resolveModelInternal)(cwd, 'vector-research-synthesizer'),
        roadmapper_model: (0, core_cjs_1.resolveModelInternal)(cwd, 'vector-roadmapper'),
        // Config
        commit_docs: config.commit_docs,
        // Existing state
        project_exists: (0, core_cjs_1.pathExistsInternal)(cwd, '.planning/PROJECT.md'),
        has_codebase_map: (0, core_cjs_1.pathExistsInternal)(cwd, '.planning/codebase'),
        planning_exists: (0, core_cjs_1.pathExistsInternal)(cwd, '.planning'),
        // Brownfield detection
        has_existing_code: hasCode,
        has_package_file: hasPackageFile,
        is_brownfield: hasCode || hasPackageFile,
        needs_codebase_map: (hasCode || hasPackageFile) && !(0, core_cjs_1.pathExistsInternal)(cwd, '.planning/codebase'),
        // Git state
        has_git: (0, core_cjs_1.pathExistsInternal)(cwd, '.git'),
        // Enhanced search
        brave_search_available: hasBraveSearch,
        // File paths
        project_path: '.planning/PROJECT.md',
    };
    (0, core_cjs_1.output)(result, raw);
}
function cmdInitNewMilestone(cwd, raw) {
    const config = (0, core_cjs_1.loadConfig)(cwd);
    const milestone = (0, core_cjs_1.getMilestoneInfo)(cwd);
    const result = {
        // Models
        researcher_model: (0, core_cjs_1.resolveModelInternal)(cwd, 'vector-project-researcher'),
        synthesizer_model: (0, core_cjs_1.resolveModelInternal)(cwd, 'vector-research-synthesizer'),
        roadmapper_model: (0, core_cjs_1.resolveModelInternal)(cwd, 'vector-roadmapper'),
        // Config
        commit_docs: config.commit_docs,
        research_enabled: config.research,
        // Current milestone
        current_milestone: milestone.version,
        current_milestone_name: milestone.name,
        // File existence
        project_exists: (0, core_cjs_1.pathExistsInternal)(cwd, '.planning/PROJECT.md'),
        roadmap_exists: (0, core_cjs_1.pathExistsInternal)(cwd, '.planning/ROADMAP.md'),
        state_exists: (0, core_cjs_1.pathExistsInternal)(cwd, '.planning/STATE.md'),
        // File paths
        project_path: '.planning/PROJECT.md',
        roadmap_path: '.planning/ROADMAP.md',
        state_path: '.planning/STATE.md',
    };
    (0, core_cjs_1.output)(result, raw);
}
function cmdInitQuick(cwd, description, raw) {
    const config = (0, core_cjs_1.loadConfig)(cwd);
    const now = new Date();
    const slug = description ? (0, core_cjs_1.generateSlugInternal)(description)?.substring(0, 40) : null;
    // Generate collision-resistant quick task ID: YYMMDD-xxx
    // xxx = 2-second precision blocks since midnight, encoded as 3-char Base36 (lowercase)
    // Range: 000 (00:00:00) to xbz (23:59:58), guaranteed 3 chars for any time of day.
    // Provides ~2s uniqueness window per user — practically collision-free across a team.
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const dateStr = yy + mm + dd;
    const secondsSinceMidnight = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
    const timeBlocks = Math.floor(secondsSinceMidnight / 2);
    const timeEncoded = timeBlocks.toString(36).padStart(3, '0');
    const quickId = dateStr + '-' + timeEncoded;
    const result = {
        // Models
        planner_model: (0, core_cjs_1.resolveModelInternal)(cwd, 'vector-planner'),
        executor_model: (0, core_cjs_1.resolveModelInternal)(cwd, 'vector-executor'),
        checker_model: (0, core_cjs_1.resolveModelInternal)(cwd, 'vector-plan-checker'),
        verifier_model: (0, core_cjs_1.resolveModelInternal)(cwd, 'vector-verifier'),
        // Config
        commit_docs: config.commit_docs,
        // Quick task info
        quick_id: quickId,
        slug: slug,
        description: description || null,
        // Timestamps
        date: now.toISOString().split('T')[0],
        timestamp: now.toISOString(),
        // Paths
        quick_dir: '.planning/quick',
        task_dir: slug ? `.planning/quick/${quickId}-${slug}` : null,
        // File existence
        roadmap_exists: (0, core_cjs_1.pathExistsInternal)(cwd, '.planning/ROADMAP.md'),
        planning_exists: (0, core_cjs_1.pathExistsInternal)(cwd, '.planning'),
    };
    (0, core_cjs_1.output)(result, raw);
}
function cmdInitResume(cwd, raw) {
    const config = (0, core_cjs_1.loadConfig)(cwd);
    // Check for interrupted agent
    let interruptedAgentId = null;
    try {
        interruptedAgentId = fs_1.default.readFileSync(path_1.default.join(cwd, '.planning', 'current-agent-id.txt'), 'utf-8').trim();
    }
    catch { }
    const result = {
        // File existence
        state_exists: (0, core_cjs_1.pathExistsInternal)(cwd, '.planning/STATE.md'),
        roadmap_exists: (0, core_cjs_1.pathExistsInternal)(cwd, '.planning/ROADMAP.md'),
        project_exists: (0, core_cjs_1.pathExistsInternal)(cwd, '.planning/PROJECT.MD'),
        planning_exists: (0, core_cjs_1.pathExistsInternal)(cwd, '.planning'),
        // File paths
        state_path: '.planning/STATE.md',
        roadmap_path: '.planning/ROADMAP.md',
        project_path: '.planning/PROJECT.md',
        // Agent state
        has_interrupted_agent: !!interruptedAgentId,
        interrupted_agent_id: interruptedAgentId,
        // Config
        commit_docs: config.commit_docs,
    };
    (0, core_cjs_1.output)(result, raw);
}
function cmdInitVerifyWork(cwd, phase, raw) {
    if (!phase) {
        (0, core_cjs_1.error)('phase required for init verify-work');
    }
    const config = (0, core_cjs_1.loadConfig)(cwd);
    const phaseInfo = (0, core_cjs_1.findPhaseInternal)(cwd, phase);
    const result = {
        // Models
        planner_model: (0, core_cjs_1.resolveModelInternal)(cwd, 'vector-planner'),
        checker_model: (0, core_cjs_1.resolveModelInternal)(cwd, 'vector-plan-checker'),
        // Config
        commit_docs: config.commit_docs,
        // Phase info
        phase_found: !!phaseInfo,
        phase_dir: phaseInfo?.directory || null,
        phase_number: phaseInfo?.phase_number || null,
        phase_name: phaseInfo?.phase_name || null,
        // Existing artifacts
        has_verification: phaseInfo?.has_verification || false,
    };
    (0, core_cjs_1.output)(result, raw);
}
function cmdInitPhaseOp(cwd, phase, raw) {
    const config = (0, core_cjs_1.loadConfig)(cwd);
    let phaseInfo = (0, core_cjs_1.findPhaseInternal)(cwd, phase);
    // If the only disk match comes from an archived milestone, prefer the
    // current milestone's ROADMAP entry so discuss-phase and similar flows
    // don't attach to shipped work that reused the same phase number.
    if (phaseInfo?.archived) {
        const roadmapPhase = (0, core_cjs_1.getRoadmapPhaseInternal)(cwd, phase);
        if (roadmapPhase?.found) {
            const phaseName = roadmapPhase.phase_name;
            phaseInfo = {
                found: true,
                directory: null,
                phase_number: roadmapPhase.phase_number,
                phase_name: phaseName,
                phase_slug: phaseName ? phaseName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') : null,
                plans: [],
                summaries: [],
                incomplete_plans: [],
                has_research: false,
                has_context: false,
                has_verification: false,
            };
        }
    }
    // Fallback to ROADMAP.md if no directory exists (e.g., Plans: TBD)
    if (!phaseInfo) {
        const roadmapPhase = (0, core_cjs_1.getRoadmapPhaseInternal)(cwd, phase);
        if (roadmapPhase?.found) {
            const phaseName = roadmapPhase.phase_name;
            phaseInfo = {
                found: true,
                directory: null,
                phase_number: roadmapPhase.phase_number,
                phase_name: phaseName,
                phase_slug: phaseName ? phaseName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') : null,
                plans: [],
                summaries: [],
                incomplete_plans: [],
                has_research: false,
                has_context: false,
                has_verification: false,
            };
        }
    }
    const result = {
        // Config
        commit_docs: config.commit_docs,
        brave_search: config.brave_search,
        // Phase info
        phase_found: !!phaseInfo,
        phase_dir: phaseInfo?.directory || null,
        phase_number: phaseInfo?.phase_number || null,
        phase_name: phaseInfo?.phase_name || null,
        phase_slug: phaseInfo?.phase_slug || null,
        padded_phase: phaseInfo?.phase_number ? (0, core_cjs_1.normalizePhaseName)(phaseInfo.phase_number) : null,
        // Existing artifacts
        has_research: phaseInfo?.has_research || false,
        has_context: phaseInfo?.has_context || false,
        has_plans: (phaseInfo?.plans?.length || 0) > 0,
        has_verification: phaseInfo?.has_verification || false,
        plan_count: phaseInfo?.plans?.length || 0,
        // File existence
        roadmap_exists: (0, core_cjs_1.pathExistsInternal)(cwd, '.planning/ROADMAP.md'),
        planning_exists: (0, core_cjs_1.pathExistsInternal)(cwd, '.planning'),
        // File paths
        state_path: '.planning/STATE.md',
        roadmap_path: '.planning/ROADMAP.md',
        requirements_path: '.planning/REQUIREMENTS.md',
    };
    if (phaseInfo?.directory) {
        const phaseDirFull = path_1.default.join(cwd, phaseInfo.directory);
        try {
            const files = fs_1.default.readdirSync(phaseDirFull);
            const contextFile = files.find(f => f.endsWith('-CONTEXT.md') || f === 'CONTEXT.md');
            if (contextFile) {
                result.context_path = (0, core_cjs_1.toPosixPath)(path_1.default.join(phaseInfo.directory, contextFile));
            }
            const researchFile = files.find(f => f.endsWith('-RESEARCH.md') || f === 'RESEARCH.md');
            if (researchFile) {
                result.research_path = (0, core_cjs_1.toPosixPath)(path_1.default.join(phaseInfo.directory, researchFile));
            }
            const verificationFile = files.find(f => f.endsWith('-VERIFICATION.md') || f === 'VERIFICATION.md');
            if (verificationFile) {
                result.verification_path = (0, core_cjs_1.toPosixPath)(path_1.default.join(phaseInfo.directory, verificationFile));
            }
            const uatFile = files.find(f => f.endsWith('-UAT.md') || f === 'UAT.md');
            if (uatFile) {
                result.uat_path = (0, core_cjs_1.toPosixPath)(path_1.default.join(phaseInfo.directory, uatFile));
            }
        }
        catch { }
    }
    (0, core_cjs_1.output)(result, raw);
}
function cmdInitTodos(cwd, area, raw) {
    const config = (0, core_cjs_1.loadConfig)(cwd);
    const now = new Date();
    // List todos (reuse existing logic)
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
                if (area && todoArea !== area)
                    continue;
                count++;
                todos.push({
                    file,
                    created: createdMatch ? createdMatch[1].trim() : 'unknown',
                    title: titleMatch ? titleMatch[1].trim() : 'Untitled',
                    area: todoArea,
                    path: '.planning/todos/pending/' + file,
                });
            }
            catch { }
        }
    }
    catch { }
    const result = {
        // Config
        commit_docs: config.commit_docs,
        // Timestamps
        date: now.toISOString().split('T')[0],
        timestamp: now.toISOString(),
        // Todo inventory
        todo_count: count,
        todos,
        area_filter: area || null,
        // Paths
        pending_dir: '.planning/todos/pending',
        completed_dir: '.planning/todos/completed',
        // File existence
        planning_exists: (0, core_cjs_1.pathExistsInternal)(cwd, '.planning'),
        todos_dir_exists: (0, core_cjs_1.pathExistsInternal)(cwd, '.planning/todos'),
        pending_dir_exists: (0, core_cjs_1.pathExistsInternal)(cwd, '.planning/todos/pending'),
    };
    (0, core_cjs_1.output)(result, raw);
}
function cmdInitMilestoneOp(cwd, raw) {
    const config = (0, core_cjs_1.loadConfig)(cwd);
    const milestone = (0, core_cjs_1.getMilestoneInfo)(cwd);
    // Count phases
    let phaseCount = 0;
    let completedPhases = 0;
    const phasesDir = path_1.default.join(cwd, '.planning', 'phases');
    try {
        const entries = fs_1.default.readdirSync(phasesDir, { withFileTypes: true });
        const dirs = entries.filter(e => e.isDirectory()).map(e => e.name);
        phaseCount = dirs.length;
        // Count phases with summaries (completed)
        for (const dir of dirs) {
            try {
                const phaseFiles = fs_1.default.readdirSync(path_1.default.join(phasesDir, dir));
                const hasSummary = phaseFiles.some(f => f.endsWith('-SUMMARY.md') || f === 'SUMMARY.md');
                if (hasSummary)
                    completedPhases++;
            }
            catch { }
        }
    }
    catch { }
    // Check archive
    const archiveDir = path_1.default.join(cwd, '.planning', 'archive');
    let archivedMilestones = [];
    try {
        archivedMilestones = fs_1.default.readdirSync(archiveDir, { withFileTypes: true })
            .filter(e => e.isDirectory())
            .map(e => e.name);
    }
    catch { }
    const result = {
        // Config
        commit_docs: config.commit_docs,
        // Current milestone
        milestone_version: milestone.version,
        milestone_name: milestone.name,
        milestone_slug: (0, core_cjs_1.generateSlugInternal)(milestone.name),
        // Phase counts
        phase_count: phaseCount,
        completed_phases: completedPhases,
        all_phases_complete: phaseCount > 0 && phaseCount === completedPhases,
        // Archive
        archived_milestones: archivedMilestones,
        archive_count: archivedMilestones.length,
        // File existence
        project_exists: (0, core_cjs_1.pathExistsInternal)(cwd, '.planning/PROJECT.md'),
        roadmap_exists: (0, core_cjs_1.pathExistsInternal)(cwd, '.planning/ROADMAP.md'),
        state_exists: (0, core_cjs_1.pathExistsInternal)(cwd, '.planning/STATE.md'),
        archive_exists: (0, core_cjs_1.pathExistsInternal)(cwd, '.planning/archive'),
        phases_dir_exists: (0, core_cjs_1.pathExistsInternal)(cwd, '.planning/phases'),
    };
    (0, core_cjs_1.output)(result, raw);
}
function cmdInitMapCodebase(cwd, raw) {
    const config = (0, core_cjs_1.loadConfig)(cwd);
    // Check for existing codebase maps
    const codebaseDir = path_1.default.join(cwd, '.planning', 'codebase');
    let existingMaps = [];
    try {
        existingMaps = fs_1.default.readdirSync(codebaseDir).filter(f => f.endsWith('.md'));
    }
    catch { }
    const result = {
        // Models
        mapper_model: (0, core_cjs_1.resolveModelInternal)(cwd, 'vector-codebase-mapper'),
        // Config
        commit_docs: config.commit_docs,
        search_gitignored: config.search_gitignored,
        parallelization: config.parallelization,
        // Paths
        codebase_dir: '.planning/codebase',
        // Existing maps
        existing_maps: existingMaps,
        has_maps: existingMaps.length > 0,
        // File existence
        planning_exists: (0, core_cjs_1.pathExistsInternal)(cwd, '.planning'),
        codebase_dir_exists: (0, core_cjs_1.pathExistsInternal)(cwd, '.planning/codebase'),
    };
    (0, core_cjs_1.output)(result, raw);
}
function cmdInitProgress(cwd, raw) {
    const config = (0, core_cjs_1.loadConfig)(cwd);
    const milestone = (0, core_cjs_1.getMilestoneInfo)(cwd);
    // Analyze phases — filter to current milestone and include ROADMAP-only phases
    const phasesDir = path_1.default.join(cwd, '.planning', 'phases');
    const phases = [];
    let currentPhase = null;
    let nextPhase = null;
    // Build set of phases defined in ROADMAP for the current milestone
    const roadmapPhaseNums = new Set();
    const roadmapPhaseNames = new Map();
    try {
        const roadmapContent = (0, core_cjs_1.stripShippedMilestones)(fs_1.default.readFileSync(path_1.default.join(cwd, '.planning', 'ROADMAP.md'), 'utf-8'));
        const headingPattern = /#{2,4}\s*Phase\s+(\d+[A-Z]?(?:\.\d+)*)\s*:\s*([^\n]+)/gi;
        let hm;
        while ((hm = headingPattern.exec(roadmapContent)) !== null) {
            roadmapPhaseNums.add(hm[1]);
            roadmapPhaseNames.set(hm[1], hm[2].replace(/\(INSERTED\)/i, '').trim());
        }
    }
    catch { }
    const isDirInMilestone = (0, core_cjs_1.getMilestonePhaseFilter)(cwd);
    const seenPhaseNums = new Set();
    try {
        const entries = fs_1.default.readdirSync(phasesDir, { withFileTypes: true });
        const dirs = entries.filter(e => e.isDirectory()).map(e => e.name)
            .filter(isDirInMilestone)
            .sort((a, b) => {
            const pa = a.match(/^(\d+[A-Z]?(?:\.\d+)*)/i);
            const pb = b.match(/^(\d+[A-Z]?(?:\.\d+)*)/i);
            if (!pa || !pb)
                return a.localeCompare(b);
            return parseInt(pa[1], 10) - parseInt(pb[1], 10);
        });
        for (const dir of dirs) {
            const match = dir.match(/^(\d+[A-Z]?(?:\.\d+)*)-?(.*)/i);
            const phaseNumber = match ? match[1] : dir;
            const phaseName = match && match[2] ? match[2] : null;
            seenPhaseNums.add(phaseNumber.replace(/^0+/, '') || '0');
            const phasePath = path_1.default.join(phasesDir, dir);
            const phaseFiles = fs_1.default.readdirSync(phasePath);
            const plans = phaseFiles.filter(f => f.endsWith('-PLAN.md') || f === 'PLAN.md');
            const summaries = phaseFiles.filter(f => f.endsWith('-SUMMARY.md') || f === 'SUMMARY.md');
            const hasResearch = phaseFiles.some(f => f.endsWith('-RESEARCH.md') || f === 'RESEARCH.md');
            const status = summaries.length >= plans.length && plans.length > 0 ? 'complete' :
                plans.length > 0 ? 'in_progress' :
                    hasResearch ? 'researched' : 'pending';
            const phaseEntry = {
                number: phaseNumber,
                name: phaseName,
                directory: '.planning/phases/' + dir,
                status,
                plan_count: plans.length,
                summary_count: summaries.length,
                has_research: hasResearch,
            };
            phases.push(phaseEntry);
            // Find current (first incomplete with plans) and next (first pending)
            if (!currentPhase && (status === 'in_progress' || status === 'researched')) {
                currentPhase = phaseEntry;
            }
            if (!nextPhase && status === 'pending') {
                nextPhase = phaseEntry;
            }
        }
    }
    catch { }
    // Add phases defined in ROADMAP but not yet scaffolded to disk
    for (const [num, name] of roadmapPhaseNames) {
        const stripped = num.replace(/^0+/, '') || '0';
        if (!seenPhaseNums.has(stripped)) {
            const phaseEntry = {
                number: num,
                name: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''),
                directory: null,
                status: 'not_started',
                plan_count: 0,
                summary_count: 0,
                has_research: false,
            };
            phases.push(phaseEntry);
            if (!nextPhase && !currentPhase) {
                nextPhase = phaseEntry;
            }
        }
    }
    // Re-sort phases by number after adding ROADMAP-only phases
    phases.sort((a, b) => parseInt(a.number, 10) - parseInt(b.number, 10));
    // Check for paused work
    let pausedAt = null;
    try {
        const state = fs_1.default.readFileSync(path_1.default.join(cwd, '.planning', 'STATE.md'), 'utf-8');
        const pauseMatch = state.match(/\*\*Paused At:\*\*\s*(.+)/);
        if (pauseMatch)
            pausedAt = pauseMatch[1].trim();
    }
    catch { }
    const result = {
        // Models
        executor_model: (0, core_cjs_1.resolveModelInternal)(cwd, 'vector-executor'),
        planner_model: (0, core_cjs_1.resolveModelInternal)(cwd, 'vector-planner'),
        // Config
        commit_docs: config.commit_docs,
        // Milestone
        milestone_version: milestone.version,
        milestone_name: milestone.name,
        // Phase overview
        phases,
        phase_count: phases.length,
        completed_count: phases.filter(p => p.status === 'complete').length,
        in_progress_count: phases.filter(p => p.status === 'in_progress').length,
        // Current state
        current_phase: currentPhase,
        next_phase: nextPhase,
        paused_at: pausedAt,
        has_work_in_progress: !!currentPhase,
        // File existence
        project_exists: (0, core_cjs_1.pathExistsInternal)(cwd, '.planning/PROJECT.md'),
        roadmap_exists: (0, core_cjs_1.pathExistsInternal)(cwd, '.planning/ROADMAP.md'),
        state_exists: (0, core_cjs_1.pathExistsInternal)(cwd, '.planning/STATE.md'),
        // File paths
        state_path: '.planning/STATE.md',
        roadmap_path: '.planning/ROADMAP.md',
        project_path: '.planning/PROJECT.md',
        config_path: '.planning/config.json',
    };
    (0, core_cjs_1.output)(result, raw);
}
//# sourceMappingURL=init.cjs.map
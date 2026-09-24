'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const cp = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const HOOKS_PATH = 'hooks/claude-codex-hooks.json';
const MCP_URL = 'https://mcp.dev.venom-ah.com';
const read = (file) => fs.readFileSync(path.join(ROOT, file), 'utf8');
const json = (file) => JSON.parse(read(file));
const canonical = read('VENOM.md').trim();
const script = path.join(ROOT, 'hooks', 'venom-context.js');
function run(file, args = [], options = {}) {
  const result = cp.spawnSync(process.execPath, [file, ...args], { encoding: 'utf8', ...options });
  assert.equal(result.status, 0, result.stderr);
  return result.stdout;
}

test('distribution manifests and marketplace retain host-managed MCP', () => {
  const version = json('package.json').version;
  const codex = json('.codex-plugin/plugin.json');
  const claude = json('.claude-plugin/plugin.json');
  const gemini = json('platforms/gemini/gemini-extension.json');
  for (const manifest of [codex, claude, gemini]) {
    assert.equal(manifest.name, 'venom');
    assert.equal(manifest.version, version);
  }
  assert.deepEqual(codex.mcpServers, { venom: { type: 'http', url: MCP_URL } });
  assert.equal(codex.hooks, `./${HOOKS_PATH}`);
  assert.ok(fs.existsSync(path.join(ROOT, codex.hooks)));
  assert.equal(claude.mcpServers, './.mcp.json');
  assert.equal(claude.hooks, `./${HOOKS_PATH}`);
  assert.equal(fs.existsSync(path.join(ROOT, 'hooks/hooks.json')), false); // No duplicate auto-discovery.
  assert.equal(json('.mcp.json').mcpServers.venom.url, MCP_URL);
  assert.equal(gemini.mcpServers.venom.httpUrl, MCP_URL);
  assert.equal(gemini.contextFileName, 'VENOM.md');
  const entry = json('.agents/plugins/marketplace.json').plugins.find((p) => p.name === 'venom');
  assert.deepEqual(entry.source, { source: 'local', path: './' });
  assert.equal(entry.policy.authentication, 'ON_INSTALL');
});

test('loader delegates storage conventions and makes writing conditional', () => {
  assert.match(canonical, /`session-start`/);
  assert.match(canonical, /native skills when this connection/);
  assert.match(canonical, /supplied by the Venom server/);
  assert.match(canonical, /`venom_skill_session_start`/);
  assert.match(canonical, /Do not use\nanother loading route to bypass/);
  assert.match(canonical, /organization change/);
  assert.match(canonical, /indicated skill\nupdate/);
  assert.match(canonical, /human intent, constraints, decisions and rationale/);
  assert.match(canonical, /Successful sessions can make zero writes/);
  assert.match(canonical, /verify saves/);
  assert.match(canonical, /do not defer necessary handoffs to shutdown/);
  assert.match(canonical, /Avoid routine save announcements/);
  assert.match(canonical, /Venom was not updated/);
  assert.doesNotMatch(canonical, /`me`|hooks\/session-start|brains\/|projects\/|knowledge\/|tasks\//);
  assert.equal(fs.existsSync(path.join(ROOT, 'skills')), false);
  assert.equal(fs.existsSync(path.join(ROOT, 'gemini-extension.json')), false);
  assert.equal(fs.existsSync(path.join(ROOT, 'platforms/kiro/venom-session-start.kiro.hook')), false);
});

test('all manual hosts retain the development endpoint and host approval controls', () => {
  const configs = {
    cursor: json('platforms/cursor/mcp.json').mcpServers.venom,
    kiro: json('platforms/kiro/mcp.json').mcpServers.venom,
    opencode: json('platforms/opencode/opencode.json').mcp.venom,
    copilot: json('platforms/copilot/mcp-config.json').mcpServers.venom,
    vscode: json('platforms/vscode/mcp.json').servers.venom,
    cline: json('platforms/cline/mcp.json').mcpServers.venom,
    windsurf: json('platforms/windsurf/mcp_config.json').mcpServers.venom,
    devin: json('platforms/devin/mcp_config.json').mcpServers.venom,
  };
  for (const config of Object.values(configs)) {
    assert.equal(config.url || config.serverUrl, MCP_URL);
    assert.equal(config.headers, undefined);
    assert.equal(config.trust, undefined);
    assert.ok(!config.autoApprove || config.autoApprove.length === 0);
  }
  assert.equal(configs.opencode.type, 'remote');
  assert.equal(configs.copilot.type, 'http');
  assert.equal(configs.vscode.type, 'http');
  assert.equal(configs.cline.type, 'streamableHttp');
  assert.equal(configs.devin.transport, 'http');
  assert.deepEqual(json('platforms/opencode/opencode.json').instructions, ['VENOM.md']);
});

test('generated persistent instructions match the single loader', () => {
  run(path.join(ROOT, 'scripts/sync-guidance.js'), ['--check']);
  assert.match(read('platforms/cursor/venom.mdc'), /^---\nalwaysApply: true\n---/);
  assert.match(read('platforms/kiro/venom.md'), /^---\ninclusion: always\n---/);
  assert.match(read('platforms/windsurf/venom.md'), /^---\ntrigger: always_on\n---/);
});

test('OpenCode template uses only supported top-level schema fields', () => {
  // Official https://opencode.ai/config.json, #/$defs/Config, verified 2026-09-17:
  // additionalProperties is false. This is the subset used by our adapter;
  // documentation-only keys such as _comment make the actual config invalid.
  const config = json('platforms/opencode/opencode.json');
  assert.deepEqual(Object.keys(config).sort(), ['$schema', 'instructions', 'mcp']);
});

test('only startup and subagent hooks provide guidance', () => {
  const hookMap = json(HOOKS_PATH).hooks;
  assert.deepEqual(Object.keys(hookMap).sort(), ['SessionStart', 'SubagentStart']);
  assert.equal(hookMap.SessionStart[0].matcher, undefined); // All startup sources, including fork.
  for (const [event, entries] of Object.entries(hookMap)) {
    for (const hook of entries.flatMap((entry) => entry.hooks)) {
      // Claude substitutes this path before sh or PowerShell executes it;
      // Codex also exposes it as an environment variable.
      assert.equal(hook.command, `node "\${CLAUDE_PLUGIN_ROOT}/hooks/venom-context.js" ${event}`);
      assert.equal(hook.commandWindows, undefined); // Ponytail #593: not a Claude marketplace field.
      assert.deepEqual(Object.keys(hook).sort(),
        ['command', ...(hook.statusMessage ? ['statusMessage'] : []), 'timeout', 'type'].sort());
      assert.doesNotMatch(hook.command, /(^|\s)exec\s|&&|\|\||>\/dev\/null/);
    }
  }
  for (const event of ['SessionStart', 'SubagentStart']) {
    const result = JSON.parse(run(script, [event]));
    assert.equal(result.hookSpecificOutput.hookEventName, event);
    assert.equal(result.hookSpecificOutput.additionalContext, canonical);
  }
  for (const event of ['UserPromptSubmit', 'BeforeAgent', 'PostToolUse', 'SessionEnd', 'PreCompact', 'Unknown']) {
    // Stale host registrations must not reintroduce per-turn write pressure.
    assert.equal(run(script, [event]), '');
  }
  assert.doesNotMatch(read('hooks/venom-context.js'), /\bfetch\s*\(|https?:\/\/|readFileSync\s*\(\s*0/);
});

test('completion never requests another model turn, including already-saved and trivial turns', () => {
  for (const event of ['Stop', 'SubagentStop', 'AfterAgent']) {
    const args = event === 'AfterAgent' ? [event, 'gemini'] : [event];
    for (const last_assistant_message of ['Venom was updated and the save verified.', 'Hello!', 'Work completed; progress not saved.']) {
      for (const stop_hook_active of [false, true]) {
        assert.equal(run(script, args, { input: JSON.stringify({ stop_hook_active, last_assistant_message }) }), '');
      }
    }
  }
});

test('startup and subagents retain a loader reminder if VENOM.md is missing or empty', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'venom fallback '));
  try {
    fs.cpSync(path.join(ROOT, 'hooks'), path.join(root, 'hooks'), { recursive: true });
    for (const content of [null, '']) {
      if (content !== null) fs.writeFileSync(path.join(root, 'VENOM.md'), content);
      for (const event of ['SessionStart', 'SubagentStart']) {
        const result = JSON.parse(run(path.join(root, 'hooks/venom-context.js'), [event]));
        assert.equal(result.hookSpecificOutput.hookEventName, event);
        assert.match(result.hookSpecificOutput.additionalContext, /host-managed connection/);
        assert.match(result.hookSpecificOutput.additionalContext, /verify saves/);
        assert.match(result.hookSpecificOutput.additionalContext, /disabled skills/);
      }
    }
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});

test('a closed output pipe does not turn a reminder into a hook failure', async () => {
  for (const event of ['SessionStart', 'UserPromptSubmit']) {
    const child = cp.spawn(process.execPath, [script, event], { stdio: ['pipe', 'pipe', 'pipe'] });
    child.stdout.destroy();
    child.stdin.end('{"stop_hook_active":false}');
    let stderr = '';
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    await new Promise((resolve, reject) => {
      child.on('error', reject);
      child.on('close', (code) => code === 0 ? resolve() : reject(new Error(stderr)));
    });
    assert.equal(stderr, '');
  }
});

test('Windows commands execute in PowerShell from paths with spaces', { skip: process.platform !== 'win32' }, () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'venom plugin '));
  try {
    fs.cpSync(path.join(ROOT, 'hooks'), path.join(root, 'hooks'), { recursive: true });
    fs.copyFileSync(path.join(ROOT, 'VENOM.md'), path.join(root, 'VENOM.md'));
    for (const [event, groups] of Object.entries(json(HOOKS_PATH).hooks)) {
      for (const hook of groups.flatMap((group) => group.hooks)) {
        const input = '{"stop_hook_active":false}';
        const expected = JSON.parse(run(script, [event], { input }));
        for (const command of [hook.command.replace('${CLAUDE_PLUGIN_ROOT}', root), hook.command.replace('${CLAUDE_PLUGIN_ROOT}', '${env:CLAUDE_PLUGIN_ROOT}')]) {
          const result = cp.spawnSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', `'${input}' | ${command}`], {
            encoding: 'utf8', cwd: os.tmpdir(), env: { ...process.env, CLAUDE_PLUGIN_ROOT: root },
          });
          assert.equal(result.status, 0, result.stderr || String(result.error));
          assert.deepEqual(JSON.parse(result.stdout), expected);
        }
      }
    }
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});

test('configured POSIX commands work from another cwd and installation paths with spaces', () => {
  if (process.platform === 'win32') return;
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'venom plugin '));
  try {
    fs.cpSync(path.join(ROOT, 'hooks'), path.join(root, 'hooks'), { recursive: true });
    fs.copyFileSync(path.join(ROOT, 'VENOM.md'), path.join(root, 'VENOM.md'));
    for (const [event, entries] of Object.entries(json(HOOKS_PATH).hooks)) {
      for (const hook of entries.flatMap((entry) => entry.hooks)) {
        const env = { ...process.env, CLAUDE_PLUGIN_ROOT: root };
        const input = JSON.stringify({ stop_hook_active: false });
        const expected = JSON.parse(run(script, [event], { input }));
        const result = cp.spawnSync('/bin/sh', ['-c', hook.command], { encoding: 'utf8', cwd: os.tmpdir(), env, input });
        assert.equal(result.status, 0, result.stderr);
        assert.deepEqual(JSON.parse(result.stdout), expected);
        const substituted = cp.spawnSync('/bin/sh', ['-c', hook.command.replace('${CLAUDE_PLUGIN_ROOT}', root)], {
          encoding: 'utf8', cwd: os.tmpdir(), input,
        });
        assert.equal(substituted.status, 0, substituted.stderr);
        assert.deepEqual(JSON.parse(substituted.stdout), expected);
        const missingNode = cp.spawnSync('/bin/sh', ['-c', hook.command], {
          encoding: 'utf8', env: { CLAUDE_PLUGIN_ROOT: root, PATH: '/node-is-not-installed' },
        });
        assert.equal(missingNode.status, 127);
        assert.equal(missingNode.stdout, '');
        assert.match(missingNode.stderr, /node.*not found/);
      }
    }
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});

test('Gemini package isolates its schema, path substitution, and timeout units', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'venom gemini '));
  try {
    run(path.join(ROOT, 'scripts/package-gemini.js'), [root]);
    const manifest = JSON.parse(fs.readFileSync(path.join(root, 'gemini-extension.json'), 'utf8'));
    assert.equal(fs.readFileSync(path.join(root, manifest.contextFileName), 'utf8').trim(), canonical);
    const hooks = JSON.parse(fs.readFileSync(path.join(root, 'hooks/hooks.json'), 'utf8')).hooks;
    assert.deepEqual(Object.keys(hooks), ['SessionStart']);
    for (const [event, entries] of Object.entries(hooks)) {
      const hook = entries[0].hooks[0];
      assert.equal(hook.timeout, 5000);
      assert.match(hook.command, /\$\{extensionPath\}/);
      assert.doesNotMatch(hook.command, /CLAUDE_PLUGIN_ROOT/);
      const input = JSON.stringify({ stop_hook_active: false });
      const response = JSON.parse(run(path.join(root, 'hooks/venom-context.js'), [event, 'gemini'], { input }));
      assert.equal(response.hookSpecificOutput.hookEventName, undefined);
      assert.match(response.hookSpecificOutput.additionalContext, /session-start/);
      if (process.platform !== 'win32') {
        const result = cp.spawnSync('/bin/sh', ['-c', hook.command.replace('${extensionPath}', root)], {
          encoding: 'utf8', cwd: os.tmpdir(), input,
        });
        assert.equal(result.status, 0, result.stderr);
        assert.deepEqual(JSON.parse(result.stdout), response);
      }
    }
    assert.equal(fs.existsSync(path.join(root, '.claude-plugin')), false);
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});

test('hooks do not wait for stdin and completion events stay silent', async () => {
  const cases = ['SessionStart', 'SubagentStart', 'UserPromptSubmit', 'Stop', 'SubagentStop', 'AfterAgent']
    .flatMap((event) => ['', '{"stop_hook_active":', '\uFEFF{"stop_hook_active":false}', '{"stop_hook_active":true}']
      .map((input) => ({ event, input })));
  await Promise.all(cases.map(async ({ event, input }) => {
    const args = event === 'AfterAgent' ? [event, 'gemini'] : [event];
    const child = cp.spawn(process.execPath, [script, ...args], { stdio: ['pipe', 'pipe', 'ignore'] });
    let output = '';
    child.stdout.on('data', (chunk) => { output += chunk; });
    child.stdin.write(input);
    await new Promise((resolve, reject) => {
      const guard = setTimeout(() => { child.kill('SIGKILL'); reject(new Error('hook waited for stdin EOF')); }, 3000);
      child.on('close', (code) => {
        clearTimeout(guard);
        if (code !== 0) reject(new Error(`hook exited ${code}`));
        else resolve();
      });
      child.on('error', (error) => { clearTimeout(guard); reject(error); });
    });
    if (!['SessionStart', 'SubagentStart'].includes(event)) {
      assert.equal(output, '');
    } else assert.ok(JSON.parse(output).hookSpecificOutput.additionalContext);
  }));
});

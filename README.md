# Venom agent plugin

Venom provides shared organization context through the host-managed MCP
connection at `https://mcp.dev.venom-ah.com`. The plugin asks the agent to load
Venom's published **`session-start`** skill. The backend supplies the default;
each organization can customize and publish its own version.

The plugin contains only the loader, connection settings, and host adapters.
Company workflows live in the backend skill. Connections remain authenticated
and organization-scoped; the host manages OAuth, tool approval, and skill
controls. Installing this plugin does not disable those controls.

## Claude Code

```text
/plugin marketplace add venom-ah/plugin
/plugin install venom@venom
```

## Codex

```bash
codex plugin marketplace add venom-ah/plugin
codex plugin add venom@venom
```

Start a new task, authorize Venom, and review/trust the bundled hooks. Codex
also needs lifecycle hooks enabled in its configuration. These hosts get a
loader reminder at session start/resume/context restoration, subagent start,
and prompt submission. Node.js 18+ runs the hook; no network requests or tokens
are handled by the script. If Node is unavailable, the host reports a
nonblocking hook error. If hooks cannot run, the MCP server's startup
instructions remain the baseline. Their delivery still depends on the host.

## Gemini CLI

Gemini and Claude automatically load the same hook filename with different
schemas. Use the isolated Gemini package:

```bash
git clone https://github.com/venom-ah/plugin venom-plugin
cd venom-plugin
npm run package:gemini
gemini extensions install ./dist/gemini/venom
```

Restart Gemini and authorize Venom. The extension loads `VENOM.md` and uses
`SessionStart` / `BeforeAgent` hooks, with Gemini's own timeout units and path
substitution. Node.js 18+ is needed for the hooks. To update, pull this repository,
rebuild the package, and run `gemini extensions update venom` (or reinstall the
local package). Do not install the repository root as a Gemini extension.

## Other hosts

Merge MCP entries into existing configuration; never overwrite other servers.
Add the small instruction file alongside existing rules. Keep organization
customizations in the backend `session-start` skill.

| Host | MCP configuration | Instruction installation |
| --- | --- | --- |
| Cursor | Merge [mcp.json](platforms/cursor/mcp.json) into `.cursor/mcp.json` or `~/.cursor/mcp.json` | Copy [venom.mdc](platforms/cursor/venom.mdc) into the project's `.cursor/rules/` |
| Kiro IDE / CLI | Merge [mcp.json](platforms/kiro/mcp.json) into `.kiro/settings/mcp.json` | Copy [venom.md](platforms/kiro/venom.md) into `.kiro/steering/`; custom agents must include this resource |
| OpenCode | Merge [opencode.json](platforms/opencode/opencode.json) into project `opencode.json` | Copy root [VENOM.md](VENOM.md) into the project root; preserve it in `instructions` alongside existing entries |
| GitHub Copilot CLI | Merge [mcp-config.json](platforms/copilot/mcp-config.json) into `~/.copilot/mcp-config.json` | Append [copilot-instructions.md](platforms/copilot/copilot-instructions.md) to `.github/copilot-instructions.md` or `~/.copilot/copilot-instructions.md` |
| VS Code Copilot Agent | Merge [mcp.json](platforms/vscode/mcp.json) into `.vscode/mcp.json` | Append the same [Copilot instructions](platforms/copilot/copilot-instructions.md) to `.github/copilot-instructions.md` |
| Cline | Merge [mcp.json](platforms/cline/mcp.json) through Cline's MCP settings UI | Copy [venom.md](platforms/cline/venom.md) into `.clinerules/` and enable the rule |
| Windsurf / Devin Desktop legacy Cascade | Merge [mcp_config.json](platforms/windsurf/mcp_config.json) into `~/.codeium/windsurf/mcp_config.json` | Copy [venom.md](platforms/windsurf/venom.md) into `.windsurf/rules/` |
| Devin CLI / Desktop Local | Merge [mcp_config.json](platforms/devin/mcp_config.json) into `.devin/mcp_config.json` | Append root [VENOM.md](VENOM.md) to the project's `AGENTS.md` |

Authorize each connection in its host. Use current supported host releases.
The [coverage notes](HOST-COVERAGE.md) describe sources, lifecycle limits, and
verification. These are local/IDE adapters; unattended cloud agents need a
separately supported authentication path.

## Upgrading from 0.2

Remove the old Kiro `venom-session-start.kiro.hook` if previously installed and
use the steering file. Remove old Venom-specific instructions that call the
retired identity tool or read an organization file under `hooks/`. The backend
must publish `session-start` and advertise its loader before this version can
use organization guidance. Native hosts select that skill from the Venom
server; other hosts use the advertised `venom_skill_session_start` tool.

## Development

```bash
npm run sync:guidance  # regenerate host rule wrappers after editing VENOM.md
npm test
npm run package:gemini
```

Tests execute the hook scripts and packaged Gemini hook commands, verify native
and fallback routing instructions, preserve host controls, and catch stale
adapters. They make no network requests and do not prove model compliance or
live OAuth interoperability. No local copy of the backend skill is installed.

# Venom agent plugin

Connect your coding agent to your organization's shared
[Venom](https://venom-ah.com) brain.

The plugin bundles the Venom MCP server at `https://mcp.dev.venom-ah.com`. On
Codex and Claude Code it also reminds the agent to use Venom throughout
substantive work. Your agent host owns OAuth and the MCP connection; the plugin
stores no credentials and runs no background code.

Venom gives agents an organization-scoped filesystem of notes, plus the people
and Teams directory. Files carry Unix-style ownership and permissions, so an
agent sees exactly what the person it acts for is allowed to see.

## Install

### Claude Code

```text
/plugin marketplace add venom-ah/plugin
/plugin install venom@venom
```

Claude Code prompts for Venom authorization when the connection is first used.
Review and trust the bundled lifecycle hooks when prompted.

### Codex

```bash
codex plugin marketplace add venom-ah/plugin
codex plugin add venom@venom
```

Start a new task after installation. Codex prompts for Venom authorization when
the connection is first used. Review and trust the bundled lifecycle hooks when
prompted.

### Gemini CLI

```bash
gemini extensions install https://github.com/venom-ah/plugin
```

### GitHub Copilot CLI

Add Venom to `~/.copilot/mcp-config.json`:

```json
{
  "mcpServers": {
    "venom": {
      "url": "https://mcp.dev.venom-ah.com"
    }
  }
}
```

### Cursor

Copy [`platforms/cursor/mcp.json`](platforms/cursor/mcp.json) into `.cursor/`
for the project or into `~/.cursor/`.

### Kiro

Merge [`platforms/kiro/mcp.json`](platforms/kiro/mcp.json) into
`.kiro/settings/mcp.json`. Optionally copy
[`platforms/kiro/venom-session-start.kiro.hook`](platforms/kiro/venom-session-start.kiro.hook)
into `.kiro/hooks/` to ask the agent to read shared session guidance through
its host-managed Venom connection.

### OpenCode

Merge [`platforms/opencode/opencode.json`](platforms/opencode/opencode.json)
into your OpenCode configuration.

## Agent guidance

The Codex and Claude Code hooks inject a small, organization-neutral reminder.
The reminder tells the agent to use the host-authenticated Venom MCP;
organization-specific workflows stay in the brain itself, under
`hooks/session-start.md`.

Codex and Claude Code receive the reminder at session start, resume, fork,
context compaction, and subagent start. The guidance itself covers final
handoff without forcing another model turn on every response.

The hooks never authenticate, store tokens, or call Venom directly. If Venom is
unavailable or no organization guidance exists, the agent continues silently.
Lifecycle reminders require Node.js; when Node is unavailable, the hooks skip
silently and the Venom MCP remains usable.

## Development

```bash
npm test
```

The test suite validates the plugin manifests, marketplace entry, and MCP
configuration without making network requests. It also checks that the bundled
guidance and the Kiro auto-approve list name only tools the server actually
exposes.

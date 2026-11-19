# pomoduck

A small Pomodoro timer for the terminal, plus an MCP server so AI agents (Claude, Cursor, Cline…) can start, check and log focus sessions. Zero dependencies, Node 18+.

Same timers run in the browser at **[PomoDuck — free Pomodoro timer](https://www.pomoduck.com)**, where focus sessions also grow a little duck farm.

```bash
npx pomoduck            # 25 min focus, then a 5 min break
npx pomoduck 50         # 50 min focus, 10 min break
npx pomoduck run deep   # loop 50/10 rounds until Ctrl+C
npx pomoduck plan 120   # split 2 hours into rounds and breaks
npx pomoduck stats      # focus minutes for the last 7 days
```

Sessions are stored locally in `~/.pomoduck/state.json` (override with `POMODUCK_HOME`). Nothing is sent anywhere.

## Techniques

| id | Focus / break | Long break | Good for | Browser timer |
|---|---|---|---|---|
| `pomodoro` | 25 / 5 | 15 after 4 | Most desk work, starting a task you avoid | [25 minute Pomodoro timer](https://www.pomoduck.com/timer/25-minutes) |
| `short` | 10 / 2 | 10 after 4 | Low energy, ADHD-friendly starts, chores | [10 minute timer](https://www.pomoduck.com/timer/10-minutes) |
| `deep` | 50 / 10 | 30 after 3 | Writing, coding, dense study | [50 minute focus timer](https://www.pomoduck.com/timer/50-minutes) |
| `52-17` | 52 / 17 | — | Knowledge work with offline breaks | [50 minute focus timer](https://www.pomoduck.com/timer/50-minutes) |
| `ultradian` | 90 / 20 | — | One or two big creative blocks a day | [90 minute timer](https://www.pomoduck.com/timer/90-minutes) |
| `study` | 45 / 15 | 30 after 3 | Exam revision, reading, problem sets | [Study timer](https://www.pomoduck.com/lp/study-timer) |

The table lives in [`data/techniques.json`](data/techniques.json) if you want to reuse it.
New to the method? Read [what the Pomodoro technique is](https://www.pomoduck.com/blog/what-is-pomodoro-technique).

## CLI

```
pomoduck [minutes]                 focus timer (default 25), then a break
pomoduck run <technique>           loop focus/break rounds
pomoduck break [minutes]           break timer (default 5)
pomoduck plan <minutes> [technique]
pomoduck status
pomoduck stats [days]
pomoduck techniques
pomoduck mcp                       run as an MCP server on stdio
  -l, --label <text>               what the session is for
  --no-break                       skip the break after focus
```

Ctrl+C stops a session and logs it as abandoned. The terminal bell rings when a timer ends.

## MCP server

```json
{
  "mcpServers": {
    "pomoduck": { "command": "npx", "args": ["-y", "pomoduck", "mcp"] }
  }
}
```

Claude Code: `claude mcp add pomoduck -- npx -y pomoduck mcp`

| Tool | What it does |
|---|---|
| `start_session` | Start a focus or break timer (`kind`, `minutes`, `label`) |
| `status` | Running session and seconds left |
| `stop_session` | Stop early (logged as abandoned) |
| `stats` | Focus minutes and sessions over the last N days |
| `plan` | Split focus time into rounds of a technique |
| `list_techniques` | The technique table above |

Example prompts: *"Start a 50 minute focus session for the API refactor"*, *"How much did I focus this week?"*, *"Plan 3 hours of study with 45/15 blocks."*

The timer state is a file, so the CLI and the MCP server see the same session: start it from your agent, check it with `pomoduck status` in a terminal.

## Want more than a terminal timer?

[PomoDuck](https://www.pomoduck.com) is the free web version: a [focus timer](https://www.pomoduck.com/lp/focus-timer) with tasks, daily goals, streaks and a heatmap, a [website blocker](https://www.pomoduck.com/lp/website-blocker) extension for Chrome, and an Android app. Focus earns seed, breaks earn water, and your ducks turn both into eggs.

## License

Code: MIT. Technique data (`data/techniques.json`): CC BY 4.0 — suggested credit: *Focus techniques by [PomoDuck](https://www.pomoduck.com)*.

#!/usr/bin/env node
import * as store from '../src/store.js'
import { techniques, technique, plan, webTimer, fmt } from '../src/core.js'

const HELP = `pomoduck — Pomodoro timer for the terminal (and an MCP server for AI agents)

Usage
  pomoduck [minutes]            focus timer (default 25), then a break
  pomoduck run <technique>      loop focus/break rounds: ${techniques.map((t) => t.id).join(', ')}
  pomoduck break [minutes]      break timer (default 5)
  pomoduck plan <minutes> [technique]   split focus time into rounds
  pomoduck status               show the running session
  pomoduck stats [days]         focus minutes over the last N days (default 7)
  pomoduck techniques           list techniques
  pomoduck mcp                  run as an MCP server on stdio

Options
  -l, --label <text>            what the session is for
  --no-break                    don't start the break after focus

Same timers in the browser: https://www.pomoduck.com`

const args = process.argv.slice(2)
const flag = (n, s) => {
  const i = args.findIndex((a) => a === n || a === s)
  if (i < 0) return undefined
  const v = args[i + 1]
  args.splice(i, 2)
  return v
}
const label = flag('--label', '-l') || ''
const noBreak = args.includes('--no-break') && (args.splice(args.indexOf('--no-break'), 1), true)
const [cmd, a1, a2] = args

function countdown({ kind, minutes }) {
  store.start({ kind, minutes, label })
  return new Promise((resolve) => {
    const tty = process.stdout.isTTY
    const width = 30
    const onInt = () => {
      store.stop()
      process.stdout.write('\n  stopped — session logged as abandoned\n')
      process.exit(130)
    }
    process.once('SIGINT', onInt)
    const tick = () => {
      const s = store.status()
      if (!s) {
        clearInterval(timer)
        process.removeListener('SIGINT', onInt)
        process.stdout.write(`${tty ? '\r\x1b[K' : ''}  ${kind === 'focus' ? '🦆 focus' : '💧 break'} done (${minutes} min)\x07\n`)
        return resolve()
      }
      if (!tty) return
      const done = 1 - s.remaining_seconds / (minutes * 60)
      const bar = '█'.repeat(Math.round(done * width)).padEnd(width, '░')
      process.stdout.write(`\r\x1b[K  ${kind === 'focus' ? '🦆' : '💧'} ${fmt(s.remaining_seconds)} ${bar}${label ? '  ' + label : ''}`)
    }
    const timer = setInterval(tick, 1000)
    tick()
  })
}

async function main() {
  if (cmd === '-h' || cmd === '--help' || cmd === 'help') return console.log(HELP)
  if (cmd === 'mcp') return (await import('../src/mcp.js')).serve()
  if (cmd === 'techniques') {
    for (const t of techniques) console.log(`  ${t.id.padEnd(10)} ${String(t.focus).padStart(3)}/${t.short_break} min  ${t.name} — ${t.good_for}`)
    return
  }
  if (cmd === 'stats') {
    const s = store.stats(Number(a1) || 7)
    console.log(`  last ${s.days} days: ${s.focus_minutes} focus min, ${s.focus_sessions} sessions done, ${s.abandoned} abandoned`)
    for (const [d, m] of Object.entries(s.by_day).sort()) console.log(`  ${d}  ${'▇'.repeat(Math.ceil(m / 10))} ${m}m`)
    return
  }
  if (cmd === 'plan') {
    const p = plan(Number(a1) || 100, a2 || 'pomodoro')
    console.log(`  ${p.technique}: ${p.focus_minutes} min focus, done at ${p.ends}`)
    for (const b of p.blocks) console.log(`  ${b.starts}  ${b.kind.padEnd(10)} ${b.minutes} min`)
    return
  }
  if (cmd === 'status') {
    const s = store.status()
    console.log(s ? `  ${s.kind} ${fmt(s.remaining_seconds)} left of ${s.minutes} min${s.label ? ' — ' + s.label : ''}` : '  no session running')
    return
  }
  if (cmd === 'break') return countdown({ kind: 'break', minutes: Number(a1) || 5 })
  if (cmd === 'run') {
    const t = technique(a1 || 'pomodoro')
    if (!t) return console.error(`unknown technique "${a1}"`), process.exit(1)
    console.log(`  ${t.name} — Ctrl+C to stop. Browser version: ${t.pomoduck}`)
    for (let i = 1; ; i++) {
      await countdown({ kind: 'focus', minutes: t.focus })
      await countdown({ kind: 'break', minutes: i % t.rounds_before_long_break === 0 ? t.long_break : t.short_break })
    }
  }
  const minutes = Number(cmd) || 25
  if (cmd && !Number(cmd)) return console.error(HELP), process.exit(1)
  console.log(`  Ctrl+C to stop. Browser version: ${webTimer(minutes)}`)
  await countdown({ kind: 'focus', minutes })
  if (!noBreak) await countdown({ kind: 'break', minutes: minutes >= 50 ? 10 : 5 })
}

main()

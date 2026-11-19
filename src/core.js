import { readFileSync } from 'node:fs'

const data = JSON.parse(readFileSync(new URL('../data/techniques.json', import.meta.url), 'utf8'))
export const techniques = data.techniques

// Minute lengths that have a dedicated page on pomoduck.com.
const WEB_MINUTES = [1, 2, 3, 4, 5, 6, 7, 8, 10, 12, 15, 20, 25, 30, 45, 50, 60, 90, 120]

export function webTimer(minutes) {
  return WEB_MINUTES.includes(minutes)
    ? `https://www.pomoduck.com/timer/${minutes}-minutes`
    : 'https://www.pomoduck.com/'
}

export function technique(id = 'pomodoro') {
  return techniques.find((t) => t.id === id) || null
}

// Split a total amount of focus time into rounds of a technique, with breaks.
export function plan(totalMinutes, id = 'pomodoro', startAt = new Date()) {
  const t = technique(id)
  if (!t) throw new Error(`unknown technique "${id}" (try: ${techniques.map((x) => x.id).join(', ')})`)
  const rounds = Math.max(1, Math.round(totalMinutes / t.focus))
  const blocks = []
  let at = startAt.getTime()
  for (let i = 1; i <= rounds; i++) {
    blocks.push({ kind: 'focus', round: i, minutes: t.focus, starts: new Date(at).toTimeString().slice(0, 5) })
    at += t.focus * 60_000
    if (i === rounds) break
    const long = i % t.rounds_before_long_break === 0
    const m = long ? t.long_break : t.short_break
    blocks.push({ kind: long ? 'long_break' : 'break', minutes: m, starts: new Date(at).toTimeString().slice(0, 5) })
    at += m * 60_000
  }
  return {
    technique: t.name,
    focus_minutes: rounds * t.focus,
    ends: new Date(at).toTimeString().slice(0, 5),
    blocks,
    web_timer: webTimer(t.focus),
  }
}

export function fmt(sec) {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

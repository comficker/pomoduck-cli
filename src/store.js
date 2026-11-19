// Tiny JSON store in ~/.pomoduck/state.json: the running session (if any) and a log of finished ones.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

const DIR = process.env.POMODUCK_HOME || join(homedir(), '.pomoduck')
const FILE = join(DIR, 'state.json')

export function load() {
  try {
    return JSON.parse(readFileSync(FILE, 'utf8'))
  } catch {
    return { current: null, log: [] }
  }
}

export function save(state) {
  mkdirSync(DIR, { recursive: true })
  writeFileSync(FILE, JSON.stringify(state, null, 2))
}

// Move a session whose end time has passed into the log.
export function settle(state, now = Date.now()) {
  const c = state.current
  if (c && now >= c.ends_at) {
    state.log.push({ ...c, finished_at: c.ends_at, completed: true })
    state.current = null
  }
  return state
}

export function start({ kind = 'focus', minutes = 25, label = '' }, now = Date.now()) {
  const state = settle(load(), now)
  if (state.current) stopCurrent(state, now)
  state.current = { kind, minutes, label, started_at: now, ends_at: now + minutes * 60_000 }
  save(state)
  return state.current
}

function stopCurrent(state, now) {
  const c = state.current
  const done = Math.round((now - c.started_at) / 60_000)
  state.log.push({ ...c, finished_at: now, completed: false, minutes_done: done })
  state.current = null
}

export function stop(now = Date.now()) {
  const state = settle(load(), now)
  const c = state.current
  if (c) stopCurrent(state, now)
  save(state)
  return c
}

export function status(now = Date.now()) {
  const state = settle(load(), now)
  save(state)
  const c = state.current
  if (!c) return null
  return { ...c, remaining_seconds: Math.max(0, Math.round((c.ends_at - now) / 1000)) }
}

export function stats(days = 7, now = Date.now()) {
  const state = settle(load(), now)
  save(state)
  const since = now - days * 86_400_000
  const focus = state.log.filter((s) => s.kind === 'focus' && s.finished_at >= since)
  const minutes = focus.reduce((m, s) => m + (s.completed ? s.minutes : s.minutes_done || 0), 0)
  const byDay = {}
  for (const s of focus) {
    const d = new Date(s.finished_at).toISOString().slice(0, 10)
    byDay[d] = (byDay[d] || 0) + (s.completed ? s.minutes : s.minutes_done || 0)
  }
  return {
    days,
    focus_sessions: focus.filter((s) => s.completed).length,
    abandoned: focus.filter((s) => !s.completed).length,
    focus_minutes: minutes,
    by_day: byDay,
  }
}

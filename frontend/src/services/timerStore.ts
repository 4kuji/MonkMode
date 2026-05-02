/**
 * Shared Timer Store
 * Uses localStorage + BroadcastChannel for cross-window timer synchronization.
 * Timer is timestamp-based so it survives tab throttling and page reloads.
 */

export type TimerMode = "pomodoro" | "short" | "long" | "stopwatch";

export interface TimerState {
  mode: TimerMode;
  isRunning: boolean;
  /** For countdown modes: the total duration in seconds */
  totalTime: number;
  /** Remaining seconds when last paused/saved */
  remainingTime: number;
  /** ISO timestamp when the timer was last started/resumed */
  lastResumedAt: string | null;
  /** ISO timestamp when the session originally started (for analytics) */
  sessionStartedAt: string | null;
  /** Custom minutes for pomodoro */
  customMinutes: number;
  /** Subject / course name */
  subject: string;
  /** Completed pomodoro count */
  completedPomodoros: number;
}

const STORAGE_KEY = "monkmode_timer_state";
const CHANNEL_NAME = "monkmode_timer_sync";

const SHORT_BREAK = 5 * 60;
const LONG_BREAK = 15 * 60;

export function getTotalTimeForMode(mode: TimerMode, customMinutes: number): number {
  switch (mode) {
    case "pomodoro": return customMinutes * 60;
    case "short": return SHORT_BREAK;
    case "long": return LONG_BREAK;
    case "stopwatch": return 0;
  }
}

function getDefaultState(): TimerState {
  return {
    mode: "pomodoro",
    isRunning: false,
    totalTime: 25 * 60,
    remainingTime: 25 * 60,
    lastResumedAt: null,
    sessionStartedAt: null,
    customMinutes: 25,
    subject: "",
    completedPomodoros: 0,
  };
}

/** Read timer state from localStorage */
export function readTimerState(): TimerState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...getDefaultState(), ...parsed };
    }
  } catch {
    // Corrupted data, return default
  }
  return getDefaultState();
}

/** Write timer state to localStorage and broadcast to other windows */
export function writeTimerState(state: TimerState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  try {
    const bc = new BroadcastChannel(CHANNEL_NAME);
    bc.postMessage({ type: "timer_update", state });
    bc.close();
  } catch {
    // BroadcastChannel not supported — localStorage 'storage' event is fallback
  }
}

/**
 * Calculate the current "display time" based on timestamps.
 * This is the key function that makes the timer accurate across tabs.
 */
export function computeCurrentTime(state: TimerState): number {
  if (!state.isRunning || !state.lastResumedAt) {
    return state.remainingTime;
  }

  const elapsedMs = Date.now() - new Date(state.lastResumedAt).getTime();
  const elapsedSec = Math.floor(elapsedMs / 1000);

  if (state.mode === "stopwatch") {
    // Stopwatch counts up
    return state.remainingTime + elapsedSec;
  } else {
    // Countdown modes
    const current = state.remainingTime - elapsedSec;
    return Math.max(0, current);
  }
}

/**
 * Subscribe to timer state changes from other windows.
 * Returns unsubscribe function.
 */
export function subscribeTimerChanges(callback: (state: TimerState) => void): () => void {
  // BroadcastChannel listener
  let bc: BroadcastChannel | null = null;
  try {
    bc = new BroadcastChannel(CHANNEL_NAME);
    bc.onmessage = (event) => {
      if (event.data?.type === "timer_update" && event.data.state) {
        callback(event.data.state);
      }
    };
  } catch {
    // BroadcastChannel not supported
  }

  // Fallback: storage event (fires in other tabs when localStorage changes)
  const storageHandler = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY && event.newValue) {
      try {
        const state = JSON.parse(event.newValue);
        callback(state);
      } catch {
        // ignore parse errors
      }
    }
  };
  window.addEventListener("storage", storageHandler);

  return () => {
    if (bc) bc.close();
    window.removeEventListener("storage", storageHandler);
  };
}

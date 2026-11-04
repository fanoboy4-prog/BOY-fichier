export type PremiumStatus = 'trial' | 'expired' | 'premium';

export interface PremiumState {
  trialStartDate: number;
  trialDays: number;
  isPremium: boolean;
}

export const PAYMENT_NUMBERS = {
  mvola: 'A RENSEIGNER',
  orangeMoney: 'A RENSEIGNER',
};

const TRIAL_START_KEY = 'trialStartDate';
const IS_PREMIUM_KEY = 'isPremium';
const TRIAL_DAYS_KEY = 'trialDays';
const DEFAULT_TRIAL_DAYS = 3;
const DAY_MS = 24 * 60 * 60 * 1000;

export function loadPremiumState(now: number = Date.now()): PremiumState {
  let trialStartDate = Date.parse(readItem(TRIAL_START_KEY) ?? '');
  if (Number.isNaN(trialStartDate)) {
    trialStartDate = now;
    writeItem(TRIAL_START_KEY, new Date(now).toISOString());
  }

  let trialDays = Number(readItem(TRIAL_DAYS_KEY));
  if (!Number.isFinite(trialDays) || trialDays <= 0) {
    trialDays = DEFAULT_TRIAL_DAYS;
    writeItem(TRIAL_DAYS_KEY, String(trialDays));
  }

  return {
    trialStartDate,
    trialDays,
    isPremium: readItem(IS_PREMIUM_KEY) === 'true',
  };
}

export function savePremiumActive(): void {
  writeItem(IS_PREMIUM_KEY, 'true');
}

export function getPremiumStatus(state: PremiumState, now: number = Date.now()): PremiumStatus {
  if (state.isPremium) return 'premium';
  return now < trialEndsAt(state) ? 'trial' : 'expired';
}

export function getTrialDaysLeft(state: PremiumState, now: number = Date.now()): number {
  return Math.max(0, Math.ceil((trialEndsAt(state) - now) / DAY_MS));
}

function trialEndsAt(state: PremiumState): number {
  return state.trialStartDate + state.trialDays * DAY_MS;
}

function readItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeItem(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // ignore
  }
}

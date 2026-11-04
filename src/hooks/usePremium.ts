import { useCallback, useState } from 'react';
import {
  getPremiumStatus,
  getTrialDaysLeft,
  loadPremiumState,
  savePremiumActive,
} from '@/lib/premium';
import type { PremiumState } from '@/lib/premium';

export function usePremium() {
  const [state, setState] = useState<PremiumState>(() => loadPremiumState());
  const now = Date.now();
  const status = getPremiumStatus(state, now);

  const activatePremium = useCallback(() => {
    savePremiumActive();
    setState((prev) => ({ ...prev, isPremium: true }));
  }, []);

  return {
    status,
    daysLeft: getTrialDaysLeft(state, now),
    canUsePremium: status !== 'expired',
    activatePremium,
  };
}

import { Check, Crown, X } from 'lucide-react';
import { PAYMENT_NUMBERS } from '@/lib/premium';
import type { PremiumStatus } from '@/lib/premium';

interface PaywallScreenProps {
  status: PremiumStatus;
  daysLeft: number;
  onActivate: () => void;
  onClose: () => void;
}

const FEATURES = ['Custom chat wallpaper', 'All five colour themes', 'Chats, calls and translation stay free'];

function statusMessage(status: PremiumStatus, daysLeft: number): string {
  if (status === 'premium') return 'Premium is active. Thank you for your support.';
  if (status === 'trial') return `Free trial: ${daysLeft} ${daysLeft === 1 ? 'day' : 'days'} left`;
  return 'Your free trial has ended';
}

export function PaywallScreen({ status, daysLeft, onActivate, onClose }: PaywallScreenProps) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#F0F2F5] max-w-md mx-auto">
      <div className="relative flex-shrink-0 bg-[#075E54] px-5 pt-10 pb-8 text-white shadow-md">
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center mb-4">
          <Crown className="w-7 h-7 text-[#25D366]" />
        </div>
        <h2 className="text-2xl font-bold leading-tight">Live Translation Premium</h2>
        <p className="text-white/85 text-sm mt-2">{statusMessage(status, daysLeft)}</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <section className="bg-white rounded-2xl shadow-sm p-4">
          <h3 className="text-xs font-bold uppercase tracking-wide text-[#075E54] mb-3">Included with Premium</h3>
          <ul className="space-y-2.5">
            {FEATURES.map((feature) => (
              <li key={feature} className="flex items-center gap-2.5 text-sm text-gray-800">
                <Check className="w-4 h-4 text-[#128C7E] flex-shrink-0" />
                {feature}
              </li>
            ))}
          </ul>
        </section>

        {status !== 'premium' && (
          <section className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wide text-[#075E54]">Pay with mobile money</h3>
            <PaymentRow label="MVola" number={PAYMENT_NUMBERS.mvola} />
            <PaymentRow label="Orange Money" number={PAYMENT_NUMBERS.orangeMoney} />
            <p className="text-xs text-gray-500 leading-relaxed">
              Send the payment to one of these numbers, then tap "J'ai payé" to unlock Premium.
            </p>
          </section>
        )}
      </div>

      <div className="flex-shrink-0 bg-white border-t border-gray-200 p-4">
        {status === 'premium' ? (
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl bg-[#075E54] text-white font-semibold hover:bg-[#064c44] transition-colors"
          >
            Done
          </button>
        ) : (
          <>
            <button
              onClick={onActivate}
              className="w-full py-3 rounded-xl bg-[#075E54] text-white font-semibold hover:bg-[#064c44] active:scale-[0.99] transition-all"
            >
              J'ai payé
            </button>
            <button
              onClick={onClose}
              className="w-full mt-2 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              {status === 'expired' ? 'Continue with the free version' : 'Maybe later'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function PaymentRow({ label, number }: { label: string; number: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
      <span className="text-sm font-semibold text-gray-800">{label}</span>
      <span className="text-sm font-mono text-gray-600">{number}</span>
    </div>
  );
}

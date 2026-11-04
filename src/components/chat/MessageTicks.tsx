import { Check, CheckCheck } from 'lucide-react';
import type { MessageStatus } from '@/lib/chat';

const STATUS_LABEL: Record<MessageStatus, string> = {
  sent: 'Envoyé',
  delivered: 'Délivré',
  read: 'Lu',
};

export function MessageTicks({ status }: { status: MessageStatus }) {
  const Icon = status === 'sent' ? Check : CheckCheck;
  const color = status === 'read' ? 'text-[#34B7F1]' : 'text-[#555555]';
  return <Icon aria-label={STATUS_LABEL[status]} className={`w-3.5 h-3.5 flex-shrink-0 ${color}`} />;
}

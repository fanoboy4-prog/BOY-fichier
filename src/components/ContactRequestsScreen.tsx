import { SettingsPage, SettingsSection } from '@/components/settings/SettingsUi';
import { REQUEST_STATUS_LABEL } from '@/lib/contactRequests';
import type { ContactRequest, RequestStatus } from '@/lib/contactRequests';
import { dialLabel } from '@/lib/phoneKey';

const STATUS_STYLES: Record<RequestStatus, string> = {
  pending: 'bg-amber-100 text-amber-800',
  accepted: 'bg-emerald-100 text-emerald-800',
  declined: 'bg-red-100 text-red-700',
};

export function RequestStatusBadge({ status }: { status: RequestStatus }) {
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold ${STATUS_STYLES[status]}`}>
      {REQUEST_STATUS_LABEL[status]}
    </span>
  );
}

interface ContactRequestsScreenProps {
  requests: ContactRequest[];
  myKey: string;
  onAccept: (request: ContactRequest) => void;
  onDecline: (request: ContactRequest) => void;
  onBack: () => void;
}

export function ContactRequestsScreen({ requests, myKey, onAccept, onDecline, onBack }: ContactRequestsScreenProps) {
  const incoming = requests.filter((r) => r.toKey === myKey);
  const outgoing = requests.filter((r) => r.fromKey === myKey);

  return (
    <SettingsPage title="Demandes" onBack={onBack}>
      <SettingsSection title="Reçues">
        {incoming.length === 0 ? (
          <p className="text-sm text-gray-400 py-2">Aucune demande reçue.</p>
        ) : (
          incoming.map((request) => (
            <div key={request.id} className="flex items-center gap-3 py-2">
              <div className="w-11 h-11 rounded-full bg-[#075E54] flex items-center justify-center text-white font-bold flex-shrink-0">
                {request.fromName.charAt(0).toUpperCase() || '?'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{request.fromName}</p>
                <p className="text-xs text-gray-500 truncate">{dialLabel(request.fromCountryCode, request.fromPhone)}</p>
              </div>
              {request.status === 'pending' ? (
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => onDecline(request)}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Refuser
                  </button>
                  <button
                    onClick={() => onAccept(request)}
                    className="px-3 py-1.5 rounded-lg bg-[#25D366] text-xs font-bold text-white hover:bg-[#1da851] transition-colors"
                  >
                    Accepter
                  </button>
                </div>
              ) : (
                <RequestStatusBadge status={request.status} />
              )}
            </div>
          ))
        )}
      </SettingsSection>

      <SettingsSection title="Envoyées">
        {outgoing.length === 0 ? (
          <p className="text-sm text-gray-400 py-2">Aucune demande envoyée.</p>
        ) : (
          outgoing.map((request) => (
            <div key={request.id} className="flex items-center gap-3 py-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{request.toName}</p>
                <p className="text-xs text-gray-500 truncate">{dialLabel(request.toCountryCode, request.toPhone)}</p>
              </div>
              <RequestStatusBadge status={request.status} />
            </div>
          ))
        )}
      </SettingsSection>
    </SettingsPage>
  );
}

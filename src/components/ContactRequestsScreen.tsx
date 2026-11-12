import { useState } from 'react';
import type { ContactRequest } from '@/lib/contactRequests';

interface Props {
  requests: ContactRequest[];
  myKey: string;
  onAccept: (r: ContactRequest) => void;
  onDecline: (r: ContactRequest) => void;
  onCancel?: (r: ContactRequest) => void;
  onBack: () => void;
}

export function ContactRequestsScreen({ requests, myKey, onAccept, onDecline, onCancel, onBack }: Props) {
  const [tab, setTab] = useState<'received' | 'sent'>('received');
  const [msgDraft, setMsgDraft] = useState<Record<string, string>>({});
  const [showMsgBox, setShowMsgBox] = useState<string | null>(null);

  const received = requests.filter(r => r.toKey === myKey && r.status === 'pending');
  const sent = requests.filter(r => r.fromKey === myKey && r.status === 'pending');

  return (
    <div className="h-[100dvh] flex flex-col bg-white max-w-md mx-auto">
      <div className="bg-[#075E54] px-4 py-3 flex items-center gap-3">
        <button onClick={onBack} className="text-white text-xl">←</button>
        <h1 className="text-white font-bold text-lg">Demandes</h1>
      </div>
      <div className="flex border-b">
        <button onClick={() => setTab('received')} className={`flex-1 py-3 font-semibold ${tab==='received'?'text-[#075E54] border-b-2 border-[#075E54]':'text-gray-500'}`}>REÇUES ({received.length})</button>
        <button onClick={() => setTab('sent')} className={`flex-1 py-3 font-semibold ${tab==='sent'?'text-[#075E54] border-b-2 border-[#075E54]':'text-gray-500'}`}>ENVOYÉES ({sent.length})</button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {tab === 'received' && received.length === 0 && <p className="text-center text-gray-400 mt-10">Aucune demande reçue</p>}
        {tab === 'received' && received.map(r => (
          <div key={r.id} className="border rounded-xl p-3">
            <p className="font-bold">{r.fromName}</p>
            <p className="text-sm text-gray-500">{r.fromCountryCode} {r.fromPhone}</p>
            {r.invitationMessage && <div className="mt-2 bg-green-50 border border-green-200 rounded-lg p-2 text-sm">💬 <i>"{r.invitationMessage}"</i><p className="text-[11px] text-gray-400">Message d'invitation - visible dans le chat</p></div>}
            <div className="flex gap-2 mt-3">
              <button onClick={() => onAccept(r)} className="flex-1 bg-[#25D366] text-white py-2 rounded-lg font-semibold">Accepter</button>
              <button onClick={() => onDecline(r)} className="flex-1 bg-gray-200 py-2 rounded-lg font-semibold">Refuser</button>
            </div>
          </div>
        ))}
        {tab === 'sent' && sent.length === 0 && <p className="text-center text-gray-400 mt-10">Aucune demande envoyée</p>}
        {tab === 'sent' && sent.map(r => (
          <div key={r.id} className="border rounded-xl p-3">
            <p className="font-bold">{r.toName}</p>
            <p className="text-sm text-gray-500">{r.toCountryCode} {r.toPhone} • En attente</p>
            {r.invitationMessage && <div className="mt-2 bg-blue-50 rounded-lg p-2 text-sm">💬 Vous: "{r.invitationMessage}"</div>}
            {showMsgBox === r.id ? (
              <div className="mt-2 flex gap-2">
                <input autoFocus value={msgDraft[r.id] || ''} onChange={e => setMsgDraft({...msgDraft, [r.id]: e.target.value})} placeholder="Salut, c'est moi..." className="flex-1 border rounded-lg px-2 py-2 text-sm" />
                <button onClick={() => {
                  const m = (msgDraft[r.id]||'').trim(); if(!m) return;
                  // Sauvegarde via event - App.tsx gère via hook si dispo, sinon localStorage direct
                  const list = JSON.parse(localStorage.getItem('live-translation-requests')||'[]');
                  const updated = list.map((x:any)=> x.id===r.id ? {...x, invitationMessage:m} : x);
                  localStorage.setItem('live-translation-requests', JSON.stringify(updated));
                  window.dispatchEvent(new Event('requests-changed'));
                  setShowMsgBox(null);
                }} className="bg-[#075E54] text-white px-3 rounded-lg text-sm">Envoyer</button>
              </div>
            ) : (
              <div className="flex gap-2 mt-3">
                <button onClick={() => setShowMsgBox(r.id)} className="flex-1 bg-[#075E54] text-white py-2 rounded-lg font-semibold text-sm">💬 Envoyer message</button>
                <button onClick={() => { if(confirm('Annuler cette demande ?')) onCancel?.(r); }} className="flex-1 bg-red-100 text-red-600 py-2 rounded-lg font-semibold text-sm">❌ Annuler</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
                                                                                       }
export function RequestStatusBadge({ status }: { status: string }) {
  const label = status === 'pending' ? 'En attente' : status === 'accepted' ? 'Acceptée' : status === 'declined' ? 'Refusée' : 'Annulée';
  return <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{label}</span>;
}

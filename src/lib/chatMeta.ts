export interface ChatMeta {
  archived?: boolean;
  pinned?: boolean;
  unread?: boolean;
}

export type ChatMetaMap = Record<string, ChatMeta>;

const META_KEY = 'lt_chat_meta';

export function loadChatMeta(): ChatMetaMap {
  try {
    const raw = localStorage.getItem(META_KEY);
    return raw ? (JSON.parse(raw) as ChatMetaMap) : {};
  } catch {
    return {};
  }
}

function saveChatMeta(map: ChatMetaMap): ChatMetaMap {
  try {
    localStorage.setItem(META_KEY, JSON.stringify(map));
  } catch {
    // storage may be full or unavailable
  }
  return map;
}

export function updateChatMeta(contactId: string, patch: ChatMeta): ChatMetaMap {
  const map = loadChatMeta();
  map[contactId] = { ...map[contactId], ...patch };
  return saveChatMeta(map);
}

export function removeChatMeta(contactId: string): ChatMetaMap {
  const map = loadChatMeta();
  delete map[contactId];
  return saveChatMeta(map);
}

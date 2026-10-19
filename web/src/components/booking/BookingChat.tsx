'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { io, type Socket } from 'socket.io-client';
import Cookies from 'js-cookie';
import { Send, Loader2, MessageCircle } from 'lucide-react';
import { messageApi } from '@/lib/api';

interface ChatMessage {
  id: string;
  body: string;
  createdAt: string;
  senderId: string;
  sender?: { id: string; name: string; photoUrl?: string | null };
  pending?: boolean;
}

const SOCKET_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api').replace(/\/api\/?$/, '');

export default function BookingChat({
  bookingId,
  currentUserId,
}: {
  bookingId: string;
  currentUserId?: string;
}) {
  const t = useTranslations('chat');
  const locale = useLocale();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);

  const upsert = useCallback((incoming: ChatMessage) => {
    setMessages((prev) => {
      // replace a pending optimistic bubble or ignore a known id
      const withoutDupes = prev.filter(
        (m) => m.id !== incoming.id && !(m.pending && m.body === incoming.body && m.senderId === incoming.senderId)
      );
      return [...withoutDupes, incoming].sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt));
    });
  }, []);

  const load = useCallback(async () => {
    try {
      const { data } = await messageApi.list(bookingId);
      setMessages(data.messages || []);
    } catch {
      setError(t('loadError'));
    } finally {
      setLoading(false);
    }
  }, [bookingId, t]);

  useEffect(() => {
    load();

    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      auth: { token: Cookies.get('accessToken') },
    });
    socketRef.current = socket;
    socket.on('connect', () => socket.emit('join:booking', bookingId));
    socket.on('message:new', (msg: ChatMessage) => {
      if (msg && msg.id) upsert(msg);
    });

    // polling fallback in case the socket can't connect
    const poll = setInterval(load, 8000);

    return () => {
      clearInterval(poll);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [bookingId, load, upsert]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    setError('');

    const optimistic: ChatMessage = {
      id: `tmp-${Date.now()}`,
      body,
      createdAt: new Date().toISOString(),
      senderId: currentUserId || 'me',
      pending: true,
    };
    setMessages((prev) => [...prev, optimistic]);
    setText('');

    try {
      const { data } = await messageApi.send(bookingId, body);
      upsert(data.message);
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      setText(body);
      setError(t('sendError'));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-3 border-b border-gray-100">
        <MessageCircle className="w-4 h-4 text-brand-600" />
        <h2 className="font-bold text-gray-900 text-sm">{t('title')}</h2>
      </div>

      <div className="h-72 overflow-y-auto px-4 py-4 space-y-2 bg-gray-50">
        {loading ? (
          <div className="h-full grid place-items-center">
            <Loader2 className="w-5 h-5 animate-spin text-brand-500" />
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full grid place-items-center text-center text-gray-400 text-sm">
            <div>
              <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-30" />
              {t('empty')}
            </div>
          </div>
        ) : (
          messages.map((m) => {
            const mine = m.senderId === currentUserId;
            return (
              <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[78%] rounded-2xl px-3.5 py-2 text-sm ${
                  mine ? 'bg-brand-600 text-white rounded-ee-sm' : 'bg-white border border-gray-200 text-gray-800 rounded-es-sm'
                } ${m.pending ? 'opacity-60' : ''}`}>
                  {!mine && m.sender?.name && (
                    <p className="text-[11px] font-semibold text-brand-600 mb-0.5">{m.sender.name}</p>
                  )}
                  <p className="whitespace-pre-wrap break-words">{m.body}</p>
                  <p className={`text-[10px] mt-1 ${mine ? 'text-brand-100' : 'text-gray-400'}`}>
                    {new Date(m.createdAt).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <p className="text-[11px] text-gray-400 px-4 py-1.5 bg-amber-50 border-t border-amber-100">{t('safetyNotice')}</p>
      {error && <p className="text-xs text-red-500 px-4 pt-2">{error}</p>}

      <form onSubmit={send} className="flex items-center gap-2 p-3 border-t border-gray-100">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t('placeholder')}
          maxLength={2000}
          className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        <button
          type="submit"
          disabled={sending || !text.trim()}
          className="bg-brand-600 text-white p-2.5 rounded-xl hover:bg-brand-700 transition-colors disabled:opacity-50"
          aria-label={t('sendAriaLabel')}
        >
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 rtl:-scale-x-100" />}
        </button>
      </form>
    </div>
  );
}

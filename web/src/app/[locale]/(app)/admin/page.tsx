'use client';
import { useEffect, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useMoney } from '@/lib/money';
import { adminApi } from '@/lib/api';
import { CheckCircle, XCircle, Users, ShieldCheck, AlertTriangle, UserCog, Trash2, Ban, RotateCcw, Search } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

export default function AdminPage() {
  const t = useTranslations('admin');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const money = useMoney();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';
  const [tab, setTab] = useState<'verifications' | 'users' | 'disputes' | 'team'>('verifications');
  const [staff, setStaff] = useState<any[]>([]);
  const [activity, setActivity] = useState<any[]>([]);
  const [staffPhone, setStaffPhone] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [userMsg, setUserMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [teamMsg, setTeamMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [verifications, setVerifications] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [disputes, setDisputes] = useState<any[]>([]);
  const [note, setNote] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    adminApi.getPendingVerifications().then(({ data }) => setVerifications(data.verifications || [])).catch(() => {});
    adminApi.getUsers().then(({ data }) => setUsers(data.users || [])).catch(() => {}); // admin only
    adminApi.getStaff().then(({ data }) => setStaff(data.staff || [])).catch(() => {});
    adminApi.getActivity().then(({ data }) => setActivity(data.activity || [])).catch(() => {});
    adminApi.getDisputes().then(({ data }) => setDisputes(data.disputes || [])).catch(() => {});
  }, []);

  const review = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    setLoading(true);
    try {
      await adminApi.reviewVerification(id, status, note[id]);
      setVerifications((v) => v.filter((x) => x.id !== id));
      adminApi.getUsers().then(({ data }) => setUsers(data.users || [])).catch(() => {});
      adminApi.getActivity().then(({ data }) => setActivity(data.activity || [])).catch(() => {});
    } finally {
      setLoading(false);
    }
  };

  const resolve = async (id: string, resolution: 'REFUND' | 'RELEASE') => {
    if (!window.confirm(resolution === 'REFUND' ? t('confirmRefund') : t('confirmRelease'))) return;
    setLoading(true);
    try {
      await adminApi.resolveDispute(id, resolution);
      setDisputes((d) => d.filter((x) => x.id !== id));
    } finally {
      setLoading(false);
    }
  };

  const refreshUsers = () => adminApi.getUsers().then(({ data }) => setUsers(data.users || [])).catch(() => {});
  const toggleActive = async (u: any) => {
    setUserMsg(null);
    if (u.isActive !== false && !window.confirm(t('confirmDeactivate', { name: u.name }))) return;
    try { await adminApi.setUserActive(u.id, u.isActive === false); await refreshUsers(); }
    catch (err: any) { setUserMsg({ ok: false, text: err?.response?.data?.message || t('userActionError') }); }
  };
  const removeUser = async (u: any) => {
    setUserMsg(null);
    const typed = window.prompt(t('deleteConfirmPrompt', { name: u.name, phone: u.phone }));
    if (typed === null) return;
    try {
      await adminApi.deleteUser(u.id, typed.trim());
      setUserMsg({ ok: true, text: t('deleteDone', { name: u.name }) });
      await refreshUsers();
      refreshTeam();
    } catch (err: any) { setUserMsg({ ok: false, text: err?.response?.data?.message || t('userActionError') }); }
  };

  const refreshTeam = () => {
    adminApi.getStaff().then(({ data }) => setStaff(data.staff || [])).catch(() => {});
    adminApi.getActivity().then(({ data }) => setActivity(data.activity || [])).catch(() => {});
  };
  const addStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setTeamMsg(null);
    try {
      await adminApi.addStaff(staffPhone.trim());
      setStaffPhone('');
      setTeamMsg({ ok: true, text: t('teamAdded') });
      refreshTeam();
    } catch (err: any) {
      setTeamMsg({ ok: false, text: err?.response?.data?.message || t('teamErrorGeneric') });
    }
  };
  const removeStaff = async (m: any) => {
    if (!window.confirm(t('teamConfirmRemove', { name: m.name }))) return;
    try { await adminApi.removeStaff(m.id); refreshTeam(); }
    catch (err: any) { setTeamMsg({ ok: false, text: err?.response?.data?.message || t('teamErrorGeneric') }); }
  };

  const tabs = [
    { key: 'disputes' as const, label: t('disputesTab'), icon: AlertTriangle, count: disputes.length },
    { key: 'verifications' as const, label: t('idVerifications'), icon: ShieldCheck, count: verifications.length },
    // Only the admin sees the user list and the team (moderators get disputes + ID reviews only).
    ...(isAdmin ? [
      { key: 'users' as const, label: t('users'), icon: Users, count: users.length },
      { key: 'team' as const, label: t('teamTab'), icon: UserCog, count: staff.length },
    ] : []),
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{t('title')}</h1>

      <div className="flex gap-2 mb-6">
        {tabs.map(({ key, label, icon: Icon, count }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${tab === key ? 'bg-brand-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            <Icon className="w-4 h-4" />
            {label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${tab === key ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>{count}</span>
          </button>
        ))}
      </div>

      {tab === 'verifications' && (
        <div className="space-y-4">
          {verifications.length === 0 && (
            <div className="text-center py-20 text-gray-400">
              <ShieldCheck className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p className="font-semibold text-gray-600">{t('noPending')}</p>
            </div>
          )}
          {verifications.map((v) => (
            <div key={v.id} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="font-bold text-gray-900">{v.user?.name}</p>
                  <p className="text-sm text-gray-500">{v.user?.phone}</p>
                  <p className="text-xs text-gray-400 mt-1">{t('submitted', { date: new Date(v.createdAt).toLocaleString(locale) })}</p>
                </div>
                <span className="text-xs bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full font-semibold">{tCommon('status.PENDING')}</span>
              </div>
              <div className="flex flex-wrap gap-2 text-xs mb-3">
                <span className="bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full font-semibold">{t('verifDocType')}: {v.documentType === 'PASSPORT' ? t('docPassport') : t('docIdCard')}</span>
                {v.consentAt && <span className="bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full">{t('verifConsent', { date: new Date(v.consentAt).toLocaleDateString(locale) })}</span>}
              </div>
              <div className={`grid gap-3 mb-4 ${v.backPhoto ? 'grid-cols-2' : 'grid-cols-1'}`}>
                <div>
                  <p className="text-xs text-gray-400 mb-1 font-medium">{t('front')}</p>
                  <a href={v.frontPhoto} target="_blank" rel="noreferrer">
                    <img src={v.frontPhoto} alt={t('front')} className="rounded-xl border border-gray-100 object-cover w-full h-32 hover:opacity-90 transition-opacity cursor-zoom-in" />
                  </a>
                </div>
                {v.backPhoto && (
                  <div>
                    <p className="text-xs text-gray-400 mb-1 font-medium">{t('back')}</p>
                    <a href={v.backPhoto} target="_blank" rel="noreferrer">
                      <img src={v.backPhoto} alt={t('back')} className="rounded-xl border border-gray-100 object-cover w-full h-32 hover:opacity-90 transition-opacity cursor-zoom-in" />
                    </a>
                  </div>
                )}
              </div>
              {v.selfieVideo && (
                <div className="mb-4">
                  <p className="text-xs text-gray-400 mb-1 font-medium">{t('verifVideo')}</p>
                  <video src={v.selfieVideo} controls playsInline className="w-full max-h-72 rounded-xl bg-black" />
                  {v.challengeCode && (
                    <p className="text-sm mt-2 bg-amber-50 text-amber-900 rounded-xl px-3 py-2">🔊 {t('verifCode')}: <span className="font-bold tracking-[0.25em]" dir="ltr">{v.challengeCode}</span></p>
                  )}
                </div>
              )}
              <textarea value={note[v.id] || ''} onChange={(e) => setNote((n) => ({ ...n, [v.id]: e.target.value }))}
                placeholder={t('notePlaceholder')} rows={2}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none mb-3" />
              <div className="flex gap-2">
                <button disabled={loading} onClick={() => review(v.id, 'APPROVED')}
                  className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-green-600 transition-colors disabled:opacity-60">
                  <CheckCircle className="w-4 h-4" /> {t('approve')}
                </button>
                <button disabled={loading} onClick={() => review(v.id, 'REJECTED')}
                  className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-red-600 transition-colors disabled:opacity-60">
                  <XCircle className="w-4 h-4" /> {t('reject')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'disputes' && (
        <div className="space-y-4">
          {disputes.length === 0 && (
            <div className="text-center py-20 text-gray-400">
              <AlertTriangle className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p className="font-semibold text-gray-600">{t('noDisputes')}</p>
            </div>
          )}
          {disputes.map((d) => (
            <div key={d.id} className="bg-white rounded-2xl border border-orange-200 p-5 shadow-sm">
              <div className="flex items-start justify-between mb-3 gap-3">
                <div>
                  <p className="font-bold text-gray-900">{d.trip?.originCity} → {d.trip?.destinationCity}</p>
                  <p className="text-sm text-gray-500">📦 {d.parcelRequest?.description} · {d.parcelRequest?.weightKg}kg{d.parcelRequest?.estimatedValue ? ` · ${money(d.parcelRequest.estimatedValue, d.parcelRequest.valueCurrency)}` : ''}</p>
                </div>
                <span className="text-xs bg-orange-100 text-orange-700 px-2.5 py-1 rounded-full font-semibold">{tCommon('status.DISPUTED')}</span>
              </div>
              <div className="bg-orange-50 rounded-xl p-3 text-sm text-orange-900 mb-3">
                <span className="font-semibold">{t('disputeReason')}:</span> {d.disputeReason}
              </div>
              <div className="grid sm:grid-cols-3 gap-3 text-sm mb-3">
                <div><p className="text-xs text-gray-400">{t('disputeSender')}</p><p className="font-medium text-gray-900">{d.parcelRequest?.sender?.name}</p><p className="text-xs text-gray-500" dir="ltr">{d.parcelRequest?.sender?.phone}</p></div>
                <div><p className="text-xs text-gray-400">{t('disputeTraveler')}</p><p className="font-medium text-gray-900">{d.trip?.traveler?.name}</p><p className="text-xs text-gray-500" dir="ltr">{d.trip?.traveler?.phone}</p></div>
                <div><p className="text-xs text-gray-400">{t('disputePayment')}</p><p className="font-medium text-gray-900">{money(d.payment?.grossAmount, d.payment?.currency, true)} ({d.payment?.status})</p></div>
              </div>
              {d.trackingEvents?.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs font-semibold text-gray-400 uppercase mb-1">{t('disputeTimeline')}</p>
                  <ul className="text-xs text-gray-600 space-y-0.5">
                    {d.trackingEvents.map((e: any, i: number) => (
                      <li key={i}>{tCommon(`status.${e.status}`)} · {new Date(e.createdAt).toLocaleString(locale)}{e.note ? ` — ${e.note}` : ''}</li>
                    ))}
                  </ul>
                </div>
              )}
              {d.messages?.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-semibold text-gray-400 uppercase mb-1">{t('disputeChat')}</p>
                  <ul className="text-xs text-gray-600 space-y-0.5 max-h-28 overflow-auto bg-gray-50 rounded-xl p-2">
                    {d.messages.slice(-8).map((m: any, i: number) => (<li key={i}><span className="font-semibold">{m.sender?.name}:</span> {m.body}</li>))}
                  </ul>
                </div>
              )}
              <div className="flex gap-2">
                <button disabled={loading} onClick={() => resolve(d.id, 'REFUND')} className="flex-1 bg-red-500 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-red-600 transition-colors disabled:opacity-60">{t('refundSender')}</button>
                <button disabled={loading} onClick={() => resolve(d.id, 'RELEASE')} className="flex-1 bg-green-500 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-green-600 transition-colors disabled:opacity-60">{t('releaseTraveler')}</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'team' && isAdmin && (
        <div className="space-y-5">
          <p className="text-sm text-gray-500">{t('teamIntro')}</p>
          <form onSubmit={addStaff} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm flex flex-col sm:flex-row gap-3 sm:items-end">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-gray-500 mb-1">{t('teamPhoneLabel')}</label>
              <input type="tel" dir="ltr" required value={staffPhone} onChange={(e) => setStaffPhone(e.target.value)} placeholder="+33612345678"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
            <button type="submit" className="bg-brand-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-brand-700 transition-colors">{t('teamAdd')}</button>
          </form>
          {teamMsg && <p className={`text-sm px-3 py-2 rounded-lg ${teamMsg.ok ? 'text-green-700 bg-green-50' : 'text-red-600 bg-red-50'}`}>{teamMsg.text}</p>}

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50">
            {staff.map((m) => (
              <div key={m.id} className="flex items-center gap-3 px-4 py-3">
                <div className="w-9 h-9 bg-brand-600 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0">{m.name?.charAt(0)?.toUpperCase()}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-gray-900 truncate">{m.name}</p>
                  <p className="text-xs text-gray-400" dir="ltr">{m.phone}</p>
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${m.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>{m.role === 'ADMIN' ? t('teamRoleAdmin') : t('teamRoleMod')}</span>
                {m.role === 'MODERATOR' && (
                  <button onClick={() => removeStaff(m)} title={t('teamRemove')} aria-label={t('teamRemove')} className="text-gray-400 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                )}
              </div>
            ))}
          </div>

          {activity.length > 0 && (
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">{t('teamActivity')}</p>
              <ul className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50 text-sm">
                {activity.slice(0, 15).map((a) => (
                  <li key={a.id} className="px-4 py-2.5 flex justify-between gap-3">
                    <span><span className="font-semibold text-gray-900">{a.actorName}</span> <span className="text-gray-500">{t(`activity.${a.action}`)}</span></span>
                    <span className="text-xs text-gray-400 shrink-0">{new Date(a.createdAt).toLocaleString(locale, { dateStyle: 'short', timeStyle: 'short' })}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {tab === 'users' && isAdmin && (
        <div>
        <div className="relative mb-3 max-w-sm">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input value={userSearch} onChange={(e) => setUserSearch(e.target.value)} placeholder={t('searchUsers')}
            className="w-full border border-gray-200 rounded-xl ps-9 pe-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
        </div>
        {userMsg && <p className={`text-sm px-3 py-2 rounded-lg mb-3 ${userMsg.ok ? 'text-green-700 bg-green-50' : 'text-red-600 bg-red-50'}`}>{userMsg.text}</p>}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {[t('tableName'), t('tablePhone'), t('tableRole'), t('tableVerified'), t('tableRating'), t('tableJoined'), t('tableActions')].map((h) => (
                  <th key={h} className="text-start px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.filter((u) => `${u.name} ${u.phone}`.toLowerCase().includes(userSearch.trim().toLowerCase())).map((u) => (
                <tr key={u.id} className={`hover:bg-gray-50 transition-colors ${u.isActive === false ? 'opacity-50' : ''}`}>
                  <td className="px-4 py-3 font-medium text-gray-900">{u.name}{u.isActive === false && <span className="ms-2 text-[10px] font-semibold bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">{t('inactiveBadge')}</span>}</td>
                  <td className="px-4 py-3 text-gray-500">{u.phone}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${u.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>{u.role}</span>
                  </td>
                  <td className="px-4 py-3">
                    {u.isVerified
                      ? <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">{t('verified')}</span>
                      : <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{t('unverified')}</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{u.rating > 0 ? `⭐ ${Number(u.rating).toFixed(1)}` : '—'}</td>
                  <td className="px-4 py-3 text-gray-400">{new Date(u.createdAt).toLocaleDateString(locale)}</td>
                  <td className="px-4 py-3">
                    {!['ADMIN', 'MODERATOR'].includes(u.role) && u.id !== user?.id ? (
                      <div className="flex items-center gap-2">
                        <button onClick={() => toggleActive(u)} title={u.isActive === false ? t('reactivate') : t('deactivate')} aria-label={u.isActive === false ? t('reactivate') : t('deactivate')}
                          className="text-gray-400 hover:text-amber-600 transition-colors">{u.isActive === false ? <RotateCcw className="w-4 h-4" /> : <Ban className="w-4 h-4" />}</button>
                        <button onClick={() => removeUser(u)} title={t('deleteUser')} aria-label={t('deleteUser')} className="text-gray-400 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    ) : <span className="text-gray-300">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </div>
      )}
    </div>
  );
}

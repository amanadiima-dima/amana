'use client';
import { useEffect, useState } from 'react';
import { adminApi } from '@/lib/api';
import { CheckCircle, XCircle, Users, ShieldCheck } from 'lucide-react';

export default function AdminPage() {
  const [tab, setTab] = useState<'verifications' | 'users'>('verifications');
  const [verifications, setVerifications] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [note, setNote] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    adminApi.getPendingVerifications().then(({ data }) => setVerifications(data.verifications || [])).catch(() => {});
    adminApi.getUsers().then(({ data }) => setUsers(data.users || [])).catch(() => {});
  }, []);

  const review = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    setLoading(true);
    try {
      await adminApi.reviewVerification(id, status, note[id]);
      setVerifications((v) => v.filter((x) => x.id !== id));
      const { data } = await adminApi.getUsers();
      setUsers(data.users || []);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Admin Panel</h1>

      <div className="flex gap-2 mb-6">
        {[
          { key: 'verifications', label: 'ID Verifications', icon: ShieldCheck, count: verifications.length },
          { key: 'users', label: 'Users', icon: Users, count: users.length },
        ].map(({ key, label, icon: Icon, count }) => (
          <button key={key} onClick={() => setTab(key as any)}
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
              <p className="font-semibold text-gray-600">No pending verifications</p>
            </div>
          )}
          {verifications.map((v) => (
            <div key={v.id} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="font-bold text-gray-900">{v.user?.name}</p>
                  <p className="text-sm text-gray-500">{v.user?.phone}</p>
                  <p className="text-xs text-gray-400 mt-1">Submitted {new Date(v.createdAt).toLocaleString()}</p>
                </div>
                <span className="text-xs bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full font-semibold">PENDING</span>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <p className="text-xs text-gray-400 mb-1 font-medium">Front</p>
                  <a href={v.frontPhoto} target="_blank" rel="noreferrer">
                    <img src={v.frontPhoto} alt="ID Front" className="rounded-xl border border-gray-100 object-cover w-full h-32 hover:opacity-90 transition-opacity cursor-zoom-in" />
                  </a>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1 font-medium">Back</p>
                  <a href={v.backPhoto} target="_blank" rel="noreferrer">
                    <img src={v.backPhoto} alt="ID Back" className="rounded-xl border border-gray-100 object-cover w-full h-32 hover:opacity-90 transition-opacity cursor-zoom-in" />
                  </a>
                </div>
              </div>
              <textarea value={note[v.id] || ''} onChange={(e) => setNote((n) => ({ ...n, [v.id]: e.target.value }))}
                placeholder="Optional note (shown to user on rejection)…" rows={2}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none mb-3" />
              <div className="flex gap-2">
                <button disabled={loading} onClick={() => review(v.id, 'APPROVED')}
                  className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-green-600 transition-colors disabled:opacity-60">
                  <CheckCircle className="w-4 h-4" /> Approve
                </button>
                <button disabled={loading} onClick={() => review(v.id, 'REJECTED')}
                  className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-red-600 transition-colors disabled:opacity-60">
                  <XCircle className="w-4 h-4" /> Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'users' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Name', 'Phone', 'Role', 'Verified', 'Rating', 'Joined'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">{u.name}</td>
                  <td className="px-4 py-3 text-gray-500">{u.phone}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${u.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>{u.role}</span>
                  </td>
                  <td className="px-4 py-3">
                    {u.isVerified
                      ? <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">✓ Verified</span>
                      : <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Unverified</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{u.rating > 0 ? `⭐ ${Number(u.rating).toFixed(1)}` : '—'}</td>
                  <td className="px-4 py-3 text-gray-400">{new Date(u.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

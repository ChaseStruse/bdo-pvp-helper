'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { API_BASE } from '@/lib/constants';

// Removed AdminStats interface

interface User {
  id: number;
  email: string;
  family_name: string;
  is_admin: number;
  created_at: string;
}

interface PendingMatch {
  id: number;
  user_id: string;
  timestamp: string;
  won: number | null;
  image_path: string | null;
  data: Record<string, string | number | boolean>[]; // Parsed stats from the match
}

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [users, setUsers] = useState<User[]>([]);
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [pendingMatches, setPendingMatches] = useState<PendingMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'pendingMatches' | 'pendingUsers' | 'registeredUsers'>('pendingMatches');

  useEffect(() => {
    if (status === 'loading') return;
    
    if (status === 'unauthenticated' || !session?.user?.name) {
      router.push('/auth/signin');
      return;
    }

    const fetchAdminData = async () => {
      try {
        const familyName = session.user.name;
        
        // First verify admin status
        const statusRes = await fetch(`${API_BASE}/auth/admin_status/${encodeURIComponent(familyName as string)}`);
        if (!statusRes.ok) throw new Error('Failed to verify admin status');
        
        const statusData = await statusRes.json();
        if (!statusData.is_admin) {
          router.push('/');
          return;
        }

        // Fetch dashboard data
        const statsRes = await fetch(`${API_BASE}/admin/stats?family_name=${encodeURIComponent(familyName as string)}`);
        if (!statsRes.ok) throw new Error('Failed to load admin stats');
        
        const data = await statsRes.json();
        setUsers(data.users);
        setPendingUsers(data.pending_users || []);
        setPendingMatches(data.pending_matches || []);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        setError(msg);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, [status, session, router]);

  const handleApproval = async (userId: number, action: 'approve' | 'deny') => {
    if (!session?.user?.name) return;
    try {
      const res = await fetch(`${API_BASE}/admin/users/${userId}/${action}`, {
        method: action === 'approve' ? 'POST' : 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ family_name: session.user.name })
      });
      
      if (res.ok) {
        // Remove from pending
        const userToMove = pendingUsers.find(u => u.id === userId);
        setPendingUsers(prev => prev.filter(u => u.id !== userId));
        
        // If approved, add to users list
        if (action === 'approve' && userToMove) {
          setUsers(prev => [{ ...userToMove, is_admin: 0 }, ...prev]);
        }
      } else {
        alert(`Failed to ${action} user`);
      }
    } catch (e) {
      console.error(e);
      alert(`Error trying to ${action} user`);
    }
  };

  const handleMatchApproval = async (matchId: number, action: 'approve' | 'deny') => {
    if (!session?.user?.name) return;
    try {
      const res = await fetch(`${API_BASE}/admin/matches/${matchId}/${action}`, {
        method: action === 'approve' ? 'POST' : 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ family_name: session.user.name })
      });
      
      if (res.ok) {
        setPendingMatches(prev => prev.filter(m => m.id !== matchId));
      } else {
        alert(`Failed to ${action} match`);
      }
    } catch (e) {
      console.error(e);
      alert(`Error trying to ${action} match`);
    }
  };

  if (loading || status === 'loading') {
    return <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-dim)' }}>Verifying credentials...</div>;
  }

  if (error) {
    return <div style={{ textAlign: 'center', padding: '60px', color: '#f85149' }}>{error}</div>;
  }

  return (
    <div>
      <h1 style={{ color: 'var(--primary-color)', marginBottom: '20px' }}>Admin Dashboard</h1>
      
      {/* Tabs */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '30px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
        <button 
          className={`btn ${activeTab === 'pendingMatches' ? 'btn-primary' : ''}`}
          onClick={() => setActiveTab('pendingMatches')}
          style={{ position: 'relative' }}
        >
          Pending Matches
          {pendingMatches.length > 0 && (
            <span style={{ position: 'absolute', top: '-8px', right: '-8px', background: '#d29922', color: 'white', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 'bold' }}>{pendingMatches.length}</span>
          )}
        </button>
        <button 
          className={`btn ${activeTab === 'pendingUsers' ? 'btn-primary' : ''}`}
          onClick={() => setActiveTab('pendingUsers')}
          style={{ position: 'relative' }}
        >
          Pending Users
          {pendingUsers.length > 0 && (
            <span style={{ position: 'absolute', top: '-8px', right: '-8px', background: '#f85149', color: 'white', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 'bold' }}>{pendingUsers.length}</span>
          )}
        </button>
        <button 
          className={`btn ${activeTab === 'registeredUsers' ? 'btn-primary' : ''}`}
          onClick={() => setActiveTab('registeredUsers')}
        >
          Registered Users
        </button>
      </div>

      {/* Pending Match Approvals */}
      {activeTab === 'pendingMatches' && (
        pendingMatches.length > 0 ? (
        <div className="card" style={{ marginBottom: '40px', borderColor: 'rgba(210, 153, 34, 0.4)' }}>
          <h2 style={{ marginTop: 0, marginBottom: '20px', color: '#d29922' }}>Pending Scoreboard Matches</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {pendingMatches.map((match) => (
              <div key={match.id} style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', gap: '20px' }}>
                  {match.image_path ? (
                    <img src={`${API_BASE}${match.image_path}`} alt="Scoreboard" style={{ width: '350px', height: 'auto', objectFit: 'contain', borderRadius: '6px' }} />
                  ) : (
                    <div style={{ width: '350px', height: '150px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', color: 'var(--text-dim)' }}>No Image</div>
                  )}
                  
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ fontSize: '1.1rem' }}>Uploaded by: <strong>{match.user_id}</strong></div>
                  <div style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>Date: {new Date(match.timestamp).toLocaleString()}</div>
                  <div style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>Result Claimed: {match.won === 1 ? 'Win' : match.won === 0 ? 'Loss' : 'None'}</div>
                  
                  <div style={{ marginTop: 'auto', display: 'flex', gap: '12px', paddingTop: '16px' }}>
                    <button 
                      onClick={() => handleMatchApproval(match.id, 'approve')}
                      style={{ background: '#238636', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 'bold' }}
                    >
                      Approve Match
                    </button>
                    <button 
                      onClick={() => handleMatchApproval(match.id, 'deny')}
                      style={{ background: 'transparent', color: '#f85149', border: '1px solid #f85149', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 'bold' }}
                    >
                      Deny / Delete
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Stats Table */}
              <div style={{ marginTop: '16px' }}>
                <table className="results-table" style={{ fontSize: '0.85rem' }}>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Class</th>
                      <th>Spec</th>
                      <th>Kills</th>
                      <th>Deaths</th>
                      <th>CC</th>
                      <th>Dealt</th>
                      <th>Taken</th>
                      <th>Healed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {match.data.map((player: Record<string, string | number | boolean>, i: number) => (
                      <tr key={i} className={player.Enemy ? 'enemy-row' : ''}>
                        <td style={{ fontWeight: 'bold' }}>{player.name || player.character_name}</td>
                        <td>{player.selectedClass || player.Class}</td>
                        <td>{player.selectedSpec || player.Spec}</td>
                        <td>{player.Kills}</td>
                        <td>{player.Deaths}</td>
                        <td>{player.CC}</td>
                        <td>{player.Dealt?.toLocaleString()}</td>
                        <td>{player.Taken?.toLocaleString()}</td>
                        <td>{player.Healed?.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            ))}
          </div>
        </div>
        ) : (
          <div className="empty-state" style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-dim)' }}>
            No pending matches to review.
          </div>
        )
      )}

      {/* Pending User Approvals */}
      {activeTab === 'pendingUsers' && (
        pendingUsers.length > 0 ? (
        <div className="card" style={{ marginBottom: '40px', borderColor: 'rgba(248, 81, 73, 0.4)' }}>
          <h2 style={{ marginTop: 0, marginBottom: '20px', color: '#f85149' }}>Pending User Approvals</h2>
          <table className="results-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Family Name</th>
                <th>Email</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pendingUsers.map((user) => (
                <tr key={user.id}>
                  <td>{user.id}</td>
                  <td style={{ fontWeight: 'bold' }}>{user.family_name}</td>
                  <td style={{ color: 'var(--text-dim)' }}>{user.email}</td>
                  <td style={{ fontSize: '0.85rem' }}>{new Date(user.created_at).toLocaleDateString()}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        onClick={() => handleApproval(user.id, 'approve')}
                        style={{ background: '#238636', color: 'white', border: 'none', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}
                      >
                        Approve
                      </button>
                      <button 
                        onClick={() => handleApproval(user.id, 'deny')}
                        style={{ background: 'transparent', color: '#f85149', border: '1px solid #f85149', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}
                      >
                        Deny
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        ) : (
          <div className="empty-state" style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-dim)' }}>
            No pending users to review.
          </div>
        )
      )}

      {/* Users Table */}
      {activeTab === 'registeredUsers' && (
      <div className="card">
        <h2 style={{ marginTop: 0, marginBottom: '20px', color: 'var(--text-color)' }}>Registered Users</h2>
        <table className="results-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Family Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Joined</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.id}</td>
                <td style={{ fontWeight: 'bold' }}>{user.family_name}</td>
                <td style={{ color: 'var(--text-dim)' }}>{user.email}</td>
                <td>
                  {user.is_admin ? (
                    <span style={{ background: 'rgba(47, 129, 247, 0.15)', color: 'var(--primary-color)', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold' }}>Admin</span>
                  ) : (
                    <span style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>User</span>
                  )}
                </td>
                <td style={{ fontSize: '0.85rem' }}>{new Date(user.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      )}
    </div>
  );
}

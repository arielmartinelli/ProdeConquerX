import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';

const AVATAR_MAP = {
  ariel: "🦖",
  agostina: "🦄",
  jazmin: "🦊",
  ariana: "🌸",
  cande: "🐼",
  cris: "🦁",
  tomi: "🎮",
  lucas: "🚀",
  manu: "🐯",
  nina: "🐱",
  juli: "🐨",
  jaz_mercado: "✨",
  fabri: "⚡"
};

function getAvatar(username) {
  return AVATAR_MAP[username] || "⚽";
}

export default function Dashboard({ currentUser }) {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    votedCount: 0,
    notVotedCount: 0,
    exactCount: 0,
    outcomeCount: 0,
    totalAcertados: 0,
    noAcertadosCount: 0
  });

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('id, username, display_name, score, exact_count, outcome_count, has_paid')
          .order('score', { ascending: false })
          .order('exact_count', { ascending: false })
          .order('display_name', { ascending: true });

        if (error) throw error;

        // Load currentUser predictions
        const { data: userPreds, error: predError } = await supabase
          .from('predictions')
          .select('match_id, points_earned')
          .eq('user_id', currentUser.id);
        if (predError) throw predError;

        // Load matches
        const { data: matchesData, error: matchesError } = await supabase
          .from('matches')
          .select('id, status');
        if (matchesError) throw matchesError;

        const totalMatches = matchesData.length;
        const votedCount = userPreds.length;
        const notVotedCount = totalMatches - votedCount;
        const exactCount = userPreds.filter(p => p.points_earned === 3).length;
        const outcomeCount = userPreds.filter(p => p.points_earned === 1).length;
        const totalAcertados = exactCount + outcomeCount;
        const noAcertadosCount = userPreds.filter(p => p.points_earned === 0).length;

        setStats({
          votedCount,
          notVotedCount,
          exactCount,
          outcomeCount,
          totalAcertados,
          noAcertadosCount
        });

        // Map ranking position manually based on ordered rows
        const rankedData = (data || []).map((user, index) => ({
          ...user,
          rank: index + 1
        }));

        setLeaderboard(rankedData);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setError("No se pudo cargar la tabla de posiciones.");
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  if (loading) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">🔄</div>
        <p>Cargando posiciones de la copa...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">⚠️</div>
        <p>{error}</p>
      </div>
    );
  }

  const gold = leaderboard[0];
  const silver = leaderboard[1];
  const bronze = leaderboard[2];

  const paidUsersCount = leaderboard.filter(u => u.has_paid).length;
  const totalCollected = paidUsersCount * 5000;
  const prize1st = totalCollected * 0.65;
  const prize2nd = totalCollected * 0.35;

  return (
    <div>
      <h2 className="dashboard-title">
        <span>🏆</span> Tabla de Posiciones
      </h2>

      {/* Personal Prediction Stats Dashboard */}
      <div className="personal-stats-dashboard glass-panel" style={{ marginBottom: '2rem', padding: '1.5rem', border: '2px solid rgba(0, 102, 204, 0.15)', background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(240, 244, 248, 0.95) 100%)', borderRadius: '12px' }}>
        <h3 style={{ textTransform: 'uppercase', color: 'var(--color-secondary)', fontSize: '0.95rem', fontWeight: '800', letterSpacing: '1px', marginBottom: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: 0 }}>
          📊 Mi Dashboard de Pronósticos
        </h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '1rem' }}>
          {/* Card 1: Votados */}
          <div style={{ background: '#fff', border: '1px solid rgba(0, 102, 204, 0.1)', padding: '1rem', borderRadius: '8px', textAlign: 'center', boxShadow: 'var(--shadow-glued)' }}>
            <span style={{ fontSize: '1.5rem' }}>🗳️</span>
            <h5 style={{ margin: '0.4rem 0 0.2rem 0', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Votados</h5>
            <span style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--color-secondary)' }}>
              {stats.votedCount} <span style={{ fontSize: '0.8rem', fontWeight: '500', color: 'var(--text-muted)' }}>/ 104</span>
            </span>
          </div>

          {/* Card 2: Sin Votar */}
          <div style={{ background: '#fff', border: '1px solid rgba(0, 102, 204, 0.1)', padding: '1rem', borderRadius: '8px', textAlign: 'center', boxShadow: 'var(--shadow-glued)' }}>
            <span style={{ fontSize: '1.5rem' }}>⏳</span>
            <h5 style={{ margin: '0.4rem 0 0.2rem 0', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Sin Votar</h5>
            <span style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--text-muted)' }}>
              {stats.notVotedCount}
            </span>
          </div>

          {/* Card 3: Acertados */}
          <div style={{ background: '#fff', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '1rem', borderRadius: '8px', textAlign: 'center', boxShadow: 'var(--shadow-glued)', outline: '2px solid rgba(16, 185, 129, 0.1)' }}>
            <span style={{ fontSize: '1.5rem' }}>🎯</span>
            <h5 style={{ margin: '0.4rem 0 0.2rem 0', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Acertados</h5>
            <span style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--color-primary)' }}>
              {stats.totalAcertados}
            </span>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.4rem', fontSize: '0.65rem', marginTop: '0.2rem', color: 'var(--text-secondary)' }}>
              <span>🎯 Ex: {stats.exactCount}</span>
              <span>•</span>
              <span>🔮 Res: {stats.outcomeCount}</span>
            </div>
          </div>

          {/* Card 4: No Acertados */}
          <div style={{ background: '#fff', border: '1px solid rgba(255, 42, 95, 0.2)', padding: '1rem', borderRadius: '8px', textAlign: 'center', boxShadow: 'var(--shadow-glued)' }}>
            <span style={{ fontSize: '1.5rem' }}>🤷</span>
            <h5 style={{ margin: '0.4rem 0 0.2rem 0', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>No Acertados</h5>
            <span style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--color-accent)' }}>
              {stats.noAcertadosCount}
            </span>
          </div>
        </div>
      </div>

      {/* Pool Summary Card */}
      <div className="glass-panel pool-summary-card" style={{ marginBottom: '2rem', padding: '1.5rem', border: '3px solid var(--color-gold)', background: 'linear-gradient(135deg, #fffcf5 0%, #fff 100%)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h4 style={{ textTransform: 'uppercase', color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0, letterSpacing: '1px' }}>Total Recaudado</h4>
            <span style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--bg-album-cover)' }}>
              ${totalCollected.toLocaleString('es-AR')} ARS
            </span>
            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {paidUsersCount} de {leaderboard.length} jugadores pagaron la inscripción ($5.000)
            </p>
          </div>
          
          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
            <div className="prize-badge gold" style={{ background: 'rgba(243, 205, 66, 0.12)', border: '1px solid var(--color-gold)', borderRadius: '8px', padding: '0.6rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--bg-album-cover)', textTransform: 'uppercase' }}>🥇 1° Puesto (65%)</span>
              <span style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--bg-album-cover)' }}>${prize1st.toLocaleString('es-AR')}</span>
            </div>
            
            <div className="prize-badge silver" style={{ background: 'rgba(176, 190, 197, 0.12)', border: '1px solid #b0bec5', borderRadius: '8px', padding: '0.6rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#455a64', textTransform: 'uppercase' }}>🥈 2° Puesto (35%)</span>
              <span style={{ fontSize: '1.25rem', fontWeight: '800', color: '#455a64' }}>${prize2nd.toLocaleString('es-AR')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Podium Display */}
      {leaderboard.length >= 3 && (
        <div className="podium-container">
          {/* 2nd Place (Silver) */}
          {silver && (
            <div className="podium-step silver">
              <div className="podium-avatar">
                {getAvatar(silver.username)}
                <div className="podium-badge">2</div>
              </div>
              <div className="podium-name" title={silver.display_name}>
                {silver.display_name}
              </div>
              <div className="podium-score">
                <span>{silver.score}</span> pts
              </div>
              <div className="podium-pillar"></div>
            </div>
          )}

          {/* 1st Place (Gold) */}
          {gold && (
            <div className="podium-step gold">
              <div className="podium-avatar">
                {getAvatar(gold.username)}
                <div className="podium-badge">1</div>
              </div>
              <div className="podium-name" title={gold.display_name}>
                {gold.display_name}
              </div>
              <div className="podium-score">
                <span>{gold.score}</span> pts
              </div>
              <div className="podium-pillar"></div>
            </div>
          )}

          {/* 3rd Place (Bronze) */}
          {bronze && (
            <div className="podium-step bronze">
              <div className="podium-avatar">
                {getAvatar(bronze.username)}
                <div className="podium-badge">3</div>
              </div>
              <div className="podium-name" title={bronze.display_name}>
                {bronze.display_name}
              </div>
              <div className="podium-score">
                <span>{bronze.score}</span> pts
              </div>
              <div className="podium-pillar"></div>
            </div>
          )}
        </div>
      )}

      {/* Full Leaderboard Table */}
      <div className="glass-panel leaderboard-section">
        <div className="leaderboard-header">
          <h3 className="leaderboard-title-text">Ranking General</h3>
        </div>
        <div className="table-responsive">
          <table className="leaderboard-table">
            <thead>
              <tr>
                <th className="rank-col" style={{ textAlign: 'center' }}>Pos</th>
                <th>Usuario</th>
                <th style={{ textAlign: 'center' }}>Inscripción</th>
                <th style={{ textAlign: 'center' }}>Exactos (3pts)</th>
                <th style={{ textAlign: 'center' }}>Resultados (1pt)</th>
                <th style={{ textAlign: 'center' }}>Puntos</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((u) => {
                const isMe = u.id === currentUser?.id;
                let rankClass = "rank-badge normal-badge";
                if (u.rank === 1) rankClass = "rank-badge gold-badge";
                else if (u.rank === 2) rankClass = "rank-badge silver-badge";
                else if (u.rank === 3) rankClass = "rank-badge bronze-badge";

                return (
                  <tr key={u.id} className={isMe ? "current-user" : ""}>
                    <td className="rank-col">
                      <span className={rankClass}>{u.rank}</span>
                    </td>
                    <td className="name-col">
                      <span style={{ fontSize: '1.2rem' }}>{getAvatar(u.username)}</span>
                      <span>{u.display_name}</span>
                      {isMe && <span className="user-tag-current">Tú</span>}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {u.has_paid ? (
                        <span className="payment-badge paid">Pagado</span>
                      ) : (
                        <span className="payment-badge pending">Pendiente</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'center', fontWeight: '600' }}>
                      {u.exact_count}
                    </td>
                    <td style={{ textAlign: 'center', fontWeight: '500', color: 'var(--text-secondary)' }}>
                      {u.outcome_count}
                    </td>
                    <td className="score-col" style={{ textAlign: 'center' }}>
                      {u.score}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

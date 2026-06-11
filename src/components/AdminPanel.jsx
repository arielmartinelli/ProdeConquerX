import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import { getFlag } from '../utils/flags';

export default function AdminPanel({ currentUser, showToast }) {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Track match edits locally
  const [edits, setEdits] = useState({});

  // Filter states
  const [selectedStage, setSelectedStage] = useState('all');
  const [selectedGroup, setSelectedGroup] = useState('all');

  useEffect(() => {
    fetchMatches();
  }, []);

  const fetchMatches = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('matches')
        .select('*')
        .order('id');
      if (error) throw error;
      setMatches(data || []);
      
      const initialEdits = {};
      data.forEach(m => {
        initialEdits[m.id] = {
          homeScore: m.home_score === null ? '' : m.home_score.toString(),
          awayScore: m.away_score === null ? '' : m.away_score.toString(),
          status: m.status,
          homeTeam: m.home_team,
          awayTeam: m.away_team
        };
      });
      setEdits(initialEdits);
    } catch (err) {
      console.error(err);
      showToast("Error al cargar los partidos desde Supabase.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleEditChange = (matchId, field, value) => {
    setEdits(prev => ({
      ...prev,
      [matchId]: {
        ...prev[matchId],
        [field]: value
      }
    }));
  };

  const saveMatchResult = async (matchId) => {
    const edit = edits[matchId];
    if (!edit) return;

    const hScore = edit.homeScore === '' ? null : parseInt(edit.homeScore);
    const aScore = edit.awayScore === '' ? null : parseInt(edit.awayScore);

    try {
      // 1. Update match record in Supabase
      const { error: matchError } = await supabase
        .from('matches')
        .update({
          home_score: hScore,
          away_score: aScore,
          status: edit.status,
          home_team: edit.homeTeam,
          away_team: edit.awayTeam
        })
        .eq('id', parseInt(matchId));

      if (matchError) throw matchError;

      // 2. Perform score recalculations
      await recalculateStandings();

      showToast("Partido actualizado y posiciones recalculadas correctamente. 🏆", "success");
      fetchMatches(); // Reload local states
    } catch (err) {
      console.error(err);
      showToast("Error al guardar: " + err.message, "error");
    }
  };

  const recalculateStandings = async () => {
    // A. Fetch all users
    const { data: users, error: usersErr } = await supabase.from('users').select('*');
    if (usersErr) throw usersErr;

    // B. Fetch all matches
    const { data: allMatches, error: matchesErr } = await supabase.from('matches').select('*');
    if (matchesErr) throw matchesErr;

    // C. Fetch all predictions
    const { data: allPredictions, error: predsErr } = await supabase.from('predictions').select('*');
    if (predsErr) throw predsErr;

    // Map matches that are finished to quickly query results
    const finishedMatches = {};
    allMatches.forEach(m => {
      if (m.status === 'finished' && m.home_score !== null && m.away_score !== null) {
        finishedMatches[m.id] = { home: m.home_score, away: m.away_score };
      }
    });

    // Reset user scores in memory
    const userScores = {};
    users.forEach(u => {
      userScores[u.id] = { score: 0, exact: 0, outcome: 0 };
    });

    // Compute points for each prediction
    const updatedPredictions = [];
    allPredictions.forEach(p => {
      const match = finishedMatches[p.match_id];
      let pts = null;

      if (match) {
        const pH = p.predicted_home_score;
        const pA = p.predicted_away_score;
        const rH = match.home;
        const rA = match.away;

        if (pH === null || pA === null) {
          pts = 0;
        } else if (pH === rH && pA === rA) {
          pts = 3;
          if (userScores[p.user_id]) {
            userScores[p.user_id].score += 3;
            userScores[p.user_id].exact += 1;
          }
        } else if (Math.sign(pH - pA) === Math.sign(rH - rA)) {
          pts = 1;
          if (userScores[p.user_id]) {
            userScores[p.user_id].score += 1;
            userScores[p.user_id].outcome += 1;
          }
        } else {
          pts = 0;
        }
      }

      updatedPredictions.push({
        id: p.id,
        user_id: p.user_id,
        match_id: p.match_id,
        predicted_home_score: p.predicted_home_score,
        predicted_away_score: p.predicted_away_score,
        points_earned: pts
      });
    });

    // D. Update prediction scores in Supabase
    if (updatedPredictions.length > 0) {
      const { error: upsertErr } = await supabase.from('predictions').upsert(updatedPredictions);
      if (upsertErr) throw upsertErr;
    }

    // E. Update user scores in Supabase
    const userUpdates = users.map(u => {
      const stats = userScores[u.id] || { score: 0, exact: 0, outcome: 0 };
      return supabase
        .from('users')
        .update({
          score: stats.score,
          exact_count: stats.exact,
          outcome_count: stats.outcome
        })
        .eq('id', u.id);
    });

    await Promise.all(userUpdates);
  };

  const toggleFinished = (matchId) => {
    setEdits(prev => {
      const current = prev[matchId];
      const newStatus = current.status === 'finished' ? 'pending' : 'finished';
      return {
        ...prev,
        [matchId]: {
          ...current,
          status: newStatus
        }
      };
    });
  };

  const filteredMatches = matches.filter(m => {
    if (selectedStage === 'group' && m.stage !== 'group') return false;
    if (selectedStage === 'kout' && m.stage === 'group') return false;
    if (selectedStage !== 'all' && selectedStage !== 'group' && selectedStage !== 'kout' && m.stage !== selectedStage) return false;

    if (selectedStage !== 'kout') {
      if (selectedGroup !== 'all' && m.group_name !== selectedGroup) return false;
    }
    return true;
  });

  const getStageLabel = (stage) => {
    switch (stage) {
      case 'group': return 'Grupos';
      case 'r32': return 'Dieciseisavos';
      case 'r16': return 'Octavos';
      case 'quarter': return 'Cuartos';
      case 'semi': return 'Semifinal';
      case 'third': return '3er Puesto';
      case 'final': return 'Final';
      default: return stage;
    }
  };

  const parseDate = (dateStr) => {
    if (!dateStr) return new Date();
    if (!dateStr.includes('T')) {
      return new Date(dateStr.replace(/-/g, '/'));
    }
    return new Date(dateStr);
  };

  const formatDate = (dateStr) => {
    try {
      const d = parseDate(dateStr);
      const options = {
        day: 'numeric',
        month: 'short',
        timeZone: 'America/Argentina/Buenos_Aires'
      };
      if (dateStr.includes('T')) {
        options.hour = '2-digit';
        options.minute = '2-digit';
        return d.toLocaleString('es-AR', options) + ' hs';
      }
      return d.toLocaleDateString('es-AR', options);
    } catch (e) {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">🔧</div>
        <p>Cargando panel de administración...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Panel de Administración</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.2rem' }}>
            Ingresa los resultados oficiales para calcular los puntos.
          </p>
        </div>

        <div className="filters-wrapper">
          <select 
            className="filter-select"
            value={selectedStage} 
            onChange={(e) => {
              setSelectedStage(e.target.value);
              setSelectedGroup('all');
            }}
          >
            <option value="all">Todas las Etapas</option>
            <option value="group">Fase de Grupos</option>
            <option value="kout">Etapas Eliminatorias</option>
            <option value="r32">Dieciseisavos (R32)</option>
            <option value="r16">Octavos de Final (R16)</option>
            <option value="quarter">Cuartos de Final</option>
            <option value="semi">Semifinal</option>
            <option value="final">Final</option>
          </select>

          {(selectedStage === 'all' || selectedStage === 'group') && (
            <select
              className="filter-select"
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
            >
              <option value="all">Todos los Grupos</option>
              {['A','B','C','D','E','F','G','H','I','J','K','L'].map(g => (
                <option key={g} value={g}>Grupo {g}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '3rem' }}>
        {filteredMatches.map(m => {
          const edit = edits[m.id] || { homeScore: '', awayScore: '', status: 'pending', homeTeam: '', awayTeam: '' };
          const isKout = m.stage !== 'group';

          return (
            <div key={m.id} className="glass-panel admin-card">
              {/* Left Column: Team Names & Flags */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <span className="sticker-number-badge" style={{ background: 'var(--bg-album-cover)', color: 'white', borderColor: 'var(--bg-album-cover)' }}>N° {m.id}</span>
                  <span>{m.group_name ? `Grupo ${m.group_name}` : getStageLabel(m.stage)} | {formatDate(m.match_date)}</span>
                </div>
                
                {isKout ? (
                  // Editable Team Names for Knockouts
                  <div className="admin-edit-teams">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span>{getFlag(edit.homeTeam)}</span>
                      <input
                        type="text"
                        className="admin-team-edit-input"
                        value={edit.homeTeam}
                        placeholder="Equipo Local"
                        onChange={(e) => handleEditChange(m.id, 'homeTeam', e.target.value)}
                      />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span>{getFlag(edit.awayTeam)}</span>
                      <input
                        type="text"
                        className="admin-team-edit-input"
                        value={edit.awayTeam}
                        placeholder="Equipo Visitante"
                        onChange={(e) => handleEditChange(m.id, 'awayTeam', e.target.value)}
                      />
                    </div>
                  </div>
                ) : (
                  // Static Names for Group Stage
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '600' }}>
                      <span>{getFlag(m.home_team)}</span> {m.home_team}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '600', marginTop: '0.3rem' }}>
                      <span>{getFlag(m.away_team)}</span> {m.away_team}
                    </div>
                  </div>
                )}
              </div>

              {/* Center Column: Score Inputs */}
              <div className="admin-inputs">
                <input
                  type="text"
                  className="admin-score-input"
                  maxLength="2"
                  placeholder="-"
                  value={edit.homeScore}
                  onChange={(e) => handleEditChange(m.id, 'homeScore', e.target.value.replace(/\D/g, ''))}
                />
                <span style={{ color: 'var(--text-secondary)', fontWeight: 'bold' }}>vs</span>
                <input
                  type="text"
                  className="admin-score-input"
                  maxLength="2"
                  placeholder="-"
                  value={edit.awayScore}
                  onChange={(e) => handleEditChange(m.id, 'awayScore', e.target.value.replace(/\D/g, ''))}
                />
              </div>

              {/* Right Column: Actions */}
              <div className="admin-actions">
                <button
                  className={`admin-finished-toggle ${edit.status === 'finished' ? 'finished' : ''}`}
                  onClick={() => toggleFinished(m.id)}
                >
                  {edit.status === 'finished' ? '🏁 Finalizado' : '⏳ Pendiente'}
                </button>
                
                <button
                  className="admin-save-btn"
                  onClick={() => saveMatchResult(m.id)}
                >
                  Guardar
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

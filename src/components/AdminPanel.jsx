import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import { getFlag } from '../utils/flags';

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

export default function AdminPanel({ currentUser, showToast }) {
  const [matches, setMatches] = useState([]);
  const [users, setUsers] = useState([]);
  const [showUsersAdmin, setShowUsersAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const TEAM_TRANSLATIONS = {
    'Algeria': 'Argelia',
    'Argentina': 'Argentina',
    'Australia': 'Australia',
    'Austria': 'Austria',
    'Belgium': 'Bélgica',
    'Bosnia and Herzegovina': 'Bosnia y Herzegovina',
    'Brazil': 'Brasil',
    'Canada': 'Canadá',
    'Cape Verde': 'Cabo Verde',
    'Colombia': 'Colombia',
    'Croatia': 'Croacia',
    'Curaçao': 'Curazao',
    'Czech Republic': 'Chequia',
    'Democratic Republic of the Congo': 'República Democrática del Congo',
    'Ecuador': 'Ecuador',
    'Egypt': 'Egipto',
    'England': 'Inglaterra',
    'France': 'Francia',
    'Germany': 'Alemania',
    'Ghana': 'Ghana',
    'Haiti': 'Haití',
    'Iran': 'Irán',
    'Iraq': 'Irak',
    'Ivory Coast': 'Costa de Marfil',
    'Japan': 'Japón',
    'Jordan': 'Jordania',
    'Mexico': 'México',
    'Morocco': 'Marruecos',
    'Netherlands': 'Países Bajos',
    'New Zealand': 'Nueva Zelanda',
    'Norway': 'Noruega',
    'Panama': 'Panamá',
    'Paraguay': 'Paraguay',
    'Portugal': 'Portugal',
    'Qatar': 'Qatar',
    'Saudi Arabia': 'Arabia Saudita',
    'Scotland': 'Escocia',
    'Senegal': 'Senegal',
    'South Africa': 'Sudáfrica',
    'South Korea': 'Corea del Sur',
    'Spain': 'España',
    'Sweden': 'Suecia',
    'Switzerland': 'Suiza',
    'Tunisia': 'Túnez',
    'Turkey': 'Turquía',
    'United States': 'Estados Unidos',
    'Uruguay': 'Uruguay',
    'Uzbekistan': 'Uzbekistán'
  };

  const translateLabel = (label) => {
    if (!label) return '';
    let trans = label;
    trans = trans.replace(/Winner Group ([A-L])/gi, '1° Grupo $1');
    trans = trans.replace(/Runner-up Group ([A-L])/gi, '2° Grupo $1');
    trans = trans.replace(/3rd Group ([\w\/]+)/gi, 'Mejor 3° ($1)');
    trans = trans.replace(/Winner Match (\d+)/gi, 'Ganador Partido $1');
    trans = trans.replace(/Loser Match (\d+)/gi, 'Perdedor Partido $1');
    return trans;
  };

  const getStadiumOffset = (stadiumId) => {
    const id = parseInt(stadiumId);
    if ([1, 2].includes(id)) return '-06:00'; // Mexico City, Guadalajara
    if ([3, 4, 5, 6].includes(id)) return '-05:00'; // Monterrey, Dallas, Houston, Kansas City
    if ([7, 8, 9, 10, 11, 12].includes(id)) return '-04:00'; // Eastern Time
    if ([13, 14, 15, 16].includes(id)) return '-07:00'; // Pacific Time
    return '-05:00'; // Default
  };

  const handleApiSync = async () => {
    setSyncing(true);
    try {
      showToast("Conectando con la API oficial del Mundial...", "info");
      const res = await fetch('https://worldcup26.ir/get/games');
      const data = await res.json();
      const apiGames = Array.isArray(data) ? data : data.games || Object.values(data);

      if (!apiGames || apiGames.length === 0) {
        throw new Error("No se recibieron partidos de la API.");
      }

      // Fetch current matches from Supabase
      const { data: dbMatches, error: dbErr } = await supabase
        .from('matches')
        .select('*');
      if (dbErr) throw dbErr;

      const updates = [];
      let updatedCount = 0;

      apiGames.forEach(g => {
        const matchId = parseInt(g.id);
        const dbMatch = dbMatches.find(m => m.id === matchId);

        if (dbMatch) {
          const isFinished = g.finished === 'TRUE' || g.finished === true;
          const homeScore = isFinished ? parseInt(g.home_score) : null;
          const awayScore = isFinished ? parseInt(g.away_score) : null;
          const status = isFinished ? 'finished' : 'pending';

          const home = g.home_team_name_en ? (TEAM_TRANSLATIONS[g.home_team_name_en] || g.home_team_name_en) : translateLabel(g.home_team_label);
          const away = g.away_team_name_en ? (TEAM_TRANSLATIONS[g.away_team_name_en] || g.away_team_name_en) : translateLabel(g.away_team_label);

          const parts = g.local_date.split(' ');
          const dateParts = parts[0].split('/');
          const timeParts = parts[1].split(':');
          const month = dateParts[0];
          const day = dateParts[1];
          const year = dateParts[2];
          const hour = timeParts[0];
          const minute = timeParts[1];
          
          const offset = getStadiumOffset(g.stadium_id);
          const matchDateIso = `${year}-${month}-${day}T${hour}:${minute}:00${offset}`;

          const dateChanged = new Date(dbMatch.match_date).getTime() !== new Date(matchDateIso).getTime();
          const teamsChanged = dbMatch.home_team !== home || dbMatch.away_team !== away;
          const scoreChanged = dbMatch.home_score !== homeScore || dbMatch.away_score !== awayScore || dbMatch.status !== status;
          const stadiumChanged = dbMatch.stadium_id !== parseInt(g.stadium_id);

          if (dateChanged || teamsChanged || scoreChanged || stadiumChanged) {
            updates.push({
              id: matchId,
              home_team: home,
              away_team: away,
              group_name: g.type === 'group' ? g.group : null,
              match_date: matchDateIso,
              stage: dbMatch.stage,
              home_score: homeScore,
              away_score: awayScore,
              status: status,
              stadium_id: parseInt(g.stadium_id)
            });
            updatedCount++;
          }
        }
      });

      if (updates.length > 0) {
        showToast(`Actualizando ${updatedCount} partidos en Supabase...`, "info");
        const { error: updateErr } = await supabase.from('matches').upsert(updates);
        if (updateErr) throw updateErr;

        showToast("Recalculando posiciones y standings...", "info");
        await recalculateStandings();
        showToast(`¡Sincronización exitosa! Se actualizaron ${updatedCount} partidos. 🏆`, "success");
        fetchMatches(); // Reload matches list
      } else {
        showToast("Los partidos de la base de datos ya están sincronizados y al día.", "success");
      }
    } catch (err) {
      console.error(err);
      showToast("Error al sincronizar con la API: " + err.message, "error");
    } finally {
      setSyncing(false);
    }
  };
  
  // Track match edits locally
  const [edits, setEdits] = useState({});

  // Filter states
  const [selectedStage, setSelectedStage] = useState('all');
  const [selectedGroup, setSelectedGroup] = useState('all');
  const [selectedDay, setSelectedDay] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  useEffect(() => {
    fetchMatches();
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, username, display_name, score, has_paid')
        .order('display_name');
      if (error) throw error;
      setUsers(data || []);
    } catch (err) {
      console.error(err);
      showToast("Error al cargar los usuarios desde Supabase.", "error");
    }
  };

  const toggleUserPayment = async (userId, currentPaidState) => {
    const newPaidState = !currentPaidState;
    try {
      const { error } = await supabase
        .from('users')
        .update({ has_paid: newPaidState })
        .eq('id', userId);

      if (error) throw error;

      setUsers(prev => prev.map(u => u.id === userId ? { ...u, has_paid: newPaidState } : u));
      showToast("Estado de pago actualizado correctamente. 💰", "success");
    } catch (err) {
      console.error(err);
      showToast("Error al cambiar estado de pago: " + err.message, "error");
    }
  };

  const fetchMatches = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('matches')
        .select('*')
        .order('match_date', { ascending: true })
        .order('id', { ascending: true });
      if (error) throw error;
      setMatches(data || []);
      
      const initialEdits = {};
      data.forEach(m => {
        initialEdits[m.id] = {
          homeScore: m.home_score === null ? '' : m.home_score.toString(),
          awayScore: m.away_score === null ? '' : m.away_score.toString(),
          status: m.status,
          homeTeam: m.home_team,
          awayTeam: m.away_team,
          isLocked: m.is_locked
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

  const toggleMatchLock = async (matchId) => {
    const edit = edits[matchId];
    if (!edit) return;
    const newLockedState = !edit.isLocked;

    try {
      const { error } = await supabase
        .from('matches')
        .update({ is_locked: newLockedState })
        .eq('id', parseInt(matchId));

      if (error) throw error;

      setEdits(prev => ({
        ...prev,
        [matchId]: {
          ...prev[matchId],
          isLocked: newLockedState
        }
      }));

      showToast(
        newLockedState 
          ? "Apuestas bloqueadas para este partido. 🔒" 
          : "Apuestas abiertas para este partido. 🔓", 
        "success"
      );
      fetchMatches();
    } catch (err) {
      console.error(err);
      showToast("Error al bloquear: " + err.message, "error");
    }
  };

  const filteredMatches = matches.filter(m => {
    if (selectedStage === 'group' && m.stage !== 'group') return false;
    if (selectedStage === 'kout' && m.stage === 'group') return false;
    if (selectedStage !== 'all' && selectedStage !== 'group' && selectedStage !== 'kout' && m.stage !== selectedStage) return false;

    if (selectedStatus === 'pending' && m.status !== 'pending') return false;
    if (selectedStatus === 'finished' && m.status !== 'finished') return false;

    if (selectedDay !== 'all') {
      const dateObj = parseDate(m.match_date);
      const dayOptions = {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: 'America/Argentina/Buenos_Aires'
      };
      let dayLabel = dateObj.toLocaleDateString('es-AR', dayOptions);
      if (dayLabel) {
        dayLabel = dayLabel.charAt(0).toUpperCase() + dayLabel.slice(1);
      }
      if (dayLabel !== selectedDay) return false;
    }

    return true;
  });

  const getUniqueDays = () => {
    const days = [];
    matches.forEach(m => {
      const dateObj = parseDate(m.match_date);
      const dayOptions = {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: 'America/Argentina/Buenos_Aires'
      };
      let dayLabel = dateObj.toLocaleDateString('es-AR', dayOptions);
      if (dayLabel) {
        dayLabel = dayLabel.charAt(0).toUpperCase() + dayLabel.slice(1);
      }
      if (!days.includes(dayLabel)) {
        days.push(dayLabel);
      }
    });
    return days;
  };

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
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2>Panel de Administración</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.2rem' }}>
            Ingresa los resultados oficiales para calcular los puntos o sincronízalos con la API.
          </p>
        </div>
        
        <button
          onClick={handleApiSync}
          disabled={syncing}
          className="admin-sync-btn"
          style={{
            background: 'var(--bg-album-cover)',
            color: 'white',
            border: 'none',
            borderRadius: 'var(--border-radius-sm)',
            padding: '10px 18px',
            fontSize: '0.9rem',
            fontWeight: '800',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            boxShadow: 'var(--shadow-sm)',
            transition: 'all 0.2s ease',
            textTransform: 'uppercase'
          }}
        >
          {syncing ? '🔄 Sincronizando...' : '🔄 Sincronizar con API'}
        </button>

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

          <select
            className="filter-select"
            value={selectedDay}
            onChange={(e) => setSelectedDay(e.target.value)}
          >
            <option value="all">Todos los Días</option>
            {getUniqueDays().map(day => (
              <option key={day} value={day}>{day}</option>
            ))}
          </select>

          <select
            className="filter-select"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            <option value="all">Todos los Estados</option>
            <option value="pending">Pendientes</option>
            <option value="finished">Finalizados</option>
          </select>
        </div>
      </div>

      {/* User & Payment Management Panel */}
      <div className="glass-panel" style={{ marginBottom: '2rem', padding: '1.2rem' }}>
        <div 
          onClick={() => setShowUsersAdmin(!showUsersAdmin)} 
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
        >
          <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--bg-album-cover)', textTransform: 'uppercase', fontSize: '1.1rem', fontWeight: '800' }}>
            👥 Gestión de Usuarios y Pagos
          </h3>
          <span style={{ fontSize: '1.2rem', color: 'var(--bg-album-cover)', fontWeight: '850' }}>{showUsersAdmin ? '▲' : '▼'}</span>
        </div>

        {showUsersAdmin && (
          <div style={{ marginTop: '1.5rem', borderTop: '2px solid #f4eede', paddingTop: '1rem' }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              Marca quién pagó la inscripción de $5.000 para calcular el total recaudado y los premios.
            </p>
            <div className="admin-users-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
              {users.map(u => (
                <div key={u.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#faf8f5', padding: '0.8rem', borderRadius: 'var(--border-radius-sm)', border: '1px solid #cbd5e1' }}>
                  <span style={{ fontWeight: '700', textTransform: 'uppercase', fontSize: '0.9rem', color: 'var(--text-dark)' }}>
                    {getAvatar(u.username)} {u.display_name}
                  </span>
                  <button
                    onClick={() => toggleUserPayment(u.id, u.has_paid)}
                    style={{
                      background: u.has_paid ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                      color: u.has_paid ? '#059669' : '#dc2626',
                      border: `1.5px solid ${u.has_paid ? '#10b981' : '#ef4444'}`,
                      borderRadius: '4px',
                      padding: '6px 10px',
                      fontSize: '0.75rem',
                      fontWeight: '800',
                      cursor: 'pointer',
                      textTransform: 'uppercase',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {u.has_paid ? '💸 Pagado' : '⏳ Impago'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
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
                  className={`admin-finished-toggle ${edit.status === 'finished' ? 'finished' : 'pending'}`}
                  onClick={() => toggleFinished(m.id)}
                >
                  {edit.status === 'finished' ? '🏁 Finalizado' : '⏳ Pendiente'}
                </button>

                <button
                  className={`admin-vote-toggle ${edit.isLocked ? 'vote-off' : 'vote-on'}`}
                  onClick={() => toggleMatchLock(m.id)}
                >
                  {edit.isLocked ? '🔒 Votación: OFF' : '🔓 Votación: ON'}
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

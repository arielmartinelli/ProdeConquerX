import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import { getFlag } from '../utils/flags';

export default function MatchList({ currentUser, showToast }) {
  const [matches, setMatches] = useState([]);
  const [predictions, setPredictions] = useState({}); // key: matchId, value: { home, away, saved: true/false }
  const [allPredictions, setAllPredictions] = useState([]); // For comparison modal
  const [usersList, setUsersList] = useState([]); // For usernames mapping in comparison
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const STADIUM_NAMES = {
    1: "Estadio Azteca (Ciudad de México)",
    2: "Estadio Akron (Guadalajara)",
    3: "Estadio Monterrey (Monterrey)",
    4: "AT&T Stadium (Dallas)",
    5: "NRG Stadium (Houston)",
    6: "Estadio de Kansas City (Kansas City)",
    7: "Estadio de Atlanta (Atlanta)",
    8: "Estadio de Miami (Miami)",
    9: "Estadio de Boston (Boston)",
    10: "Estadio de Filadelfia (Filadelfia)",
    11: "Estadio de Nueva York/Nueva Jersey",
    12: "Estadio de Toronto (Toronto)",
    13: "BC Place (Vancouver)",
    14: "Lumen Field (Seattle)",
    15: "Levi's Stadium (San Francisco)",
    16: "SoFi Stadium (Los Angeles)"
  };

  const getStadiumName = (stadiumId) => {
    return STADIUM_NAMES[stadiumId] || "Estadio del Mundial";
  };

  const getMatchHour = (dateStr) => {
    try {
      const d = parseDate(dateStr);
      return d.toLocaleTimeString('es-AR', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'America/Argentina/Buenos_Aires'
      }) + ' hs';
    } catch (e) {
      return 'vs';
    }
  };
  
  // Filter states
  const [selectedStage, setSelectedStage] = useState('all');
  const [selectedGroup, setSelectedGroup] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Comparison Modal state
  const [modalMatch, setModalMatch] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch matches
      const { data: matchesData, error: matchesError } = await supabase
        .from('matches')
        .select('*')
        .order('match_date', { ascending: true })
        .order('id', { ascending: true });
      if (matchesError) throw matchesError;
      setMatches(matchesData || []);

      // 2. Fetch current user predictions
      const { data: predData, error: predError } = await supabase
        .from('predictions')
        .select('*')
        .eq('user_id', currentUser.id);
      if (predError) throw predError;
      
      // Convert predictions array to map
      const predMap = {};
      (predData || []).forEach(p => {
        predMap[p.match_id] = {
          home: p.predicted_home_score === null ? '' : p.predicted_home_score.toString(),
          away: p.predicted_away_score === null ? '' : p.predicted_away_score.toString(),
          saved: true
        };
      });
      setPredictions(predMap);

      // 3. Fetch all predictions (for comparison)
      const { data: allPredData, error: allPredError } = await supabase
        .from('predictions')
        .select('*');
      if (allPredError) throw allPredError;
      setAllPredictions(allPredData || []);

      // 4. Fetch users list
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, display_name');
      if (usersError) throw usersError;
      setUsersList(usersData || []);

      setHasChanges(false);
    } catch (err) {
      console.error("Error loading matches/predictions:", err);
      showToast("Error al cargar los datos de Supabase.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleScoreChange = (matchId, team, val) => {
    const cleanVal = val.replace(/\D/g, '');
    
    setPredictions(prev => {
      const current = prev[matchId] || { home: '', away: '', saved: false };
      const updated = {
        ...current,
        [team]: cleanVal,
        saved: false
      };
      
      if (updated.home === '' && updated.away === '') {
        updated.saved = true;
      }
      
      return {
        ...prev,
        [matchId]: updated
      };
    });
    setHasChanges(true);
  };

  const saveAllPredictions = async () => {
    setSaveLoading(true);
    
    // Identify which predictions need upsert (have values and unsaved) and which need delete (cleared out)
    const toUpsert = [];
    const toDelete = [];

    // Get current pending match IDs that are not manually locked
    const pendingMatchIds = new Set(
      matches
        .filter(m => {
          return m.status === 'pending' && !m.is_locked;
        })
        .map(m => m.id)
    );

    // Validate for partial predictions (one field filled, other empty)
    const invalidMatches = [];
    Object.keys(predictions).forEach(matchIdStr => {
      const matchId = parseInt(matchIdStr);
      const p = predictions[matchIdStr];
      if (p.saved) return;
      
      if (!pendingMatchIds.has(matchId)) return;

      const hasHome = p.home !== '';
      const hasAway = p.away !== '';
      if ((hasHome && !hasAway) || (!hasHome && hasAway)) {
        const match = matches.find(m => m.id === matchId);
        if (match) {
          invalidMatches.push(`${match.home_team} vs ${match.away_team}`);
        }
      }
    });

    if (invalidMatches.length > 0) {
      showToast(`Debes completar ambos resultados (local y visitante) para: ${invalidMatches.join(', ')}`, "error");
      setSaveLoading(false);
      return;
    }

    Object.keys(predictions).forEach(matchIdStr => {
      const matchId = parseInt(matchIdStr);
      const p = predictions[matchIdStr];
      if (p.saved) return; // ignore already saved

      if (!pendingMatchIds.has(matchId)) {
        // Skip matches that are locked or finished
        return;
      }

      if (p.home === '' && p.away === '') {
        toDelete.push(`${currentUser.id}_${matchId}`);
      } else {
        toUpsert.push({
          id: `${currentUser.id}_${matchId}`,
          user_id: currentUser.id,
          match_id: matchId,
          predicted_home_score: parseInt(p.home),
          predicted_away_score: parseInt(p.away),
          points_earned: null // Reset score earnings until admin saves official scores
        });
      }
    });

    try {
      // Execute upserts
      if (toUpsert.length > 0) {
        const { error: upsertError } = await supabase
          .from('predictions')
          .upsert(toUpsert);
        if (upsertError) throw upsertError;
      }

      // Execute deletes
      if (toDelete.length > 0) {
        const { error: deleteError } = await supabase
          .from('predictions')
          .delete()
          .in('id', toDelete);
        if (deleteError) throw deleteError;
      }
      
      showToast("¡Pronósticos guardados correctamente! ⚽", "success");
      fetchData();
    } catch (err) {
      console.error(err);
      showToast(err.message || "Hubo un error al guardar los pronósticos.", "error");
    } finally {
      setSaveLoading(false);
    }
  };

  // Filter logic
  const filteredMatches = matches.filter(m => {
    if (selectedStage === 'group' && m.stage !== 'group') return false;
    if (selectedStage === 'kout' && m.stage === 'group') return false;
    if (selectedStage !== 'all' && selectedStage !== 'group' && selectedStage !== 'kout' && m.stage !== selectedStage) return false;

    if (selectedStage !== 'kout') {
      if (selectedGroup !== 'all' && m.group_name !== selectedGroup) return false;
    }

    const pred = predictions[m.id];
    const hasPred = pred && pred.home !== '' && pred.away !== '';
    if (selectedStatus === 'predicted' && !hasPred) return false;
    if (selectedStatus === 'unpredicted' && hasPred) return false;
    if (selectedStatus === 'finished' && m.status !== 'finished') return false;



    return true;
  });

  const getPointsBadge = (match) => {
    const userPred = allPredictions.find(
      p => p.user_id === currentUser.id && p.match_id === match.id
    );

    if (!userPred || userPred.points_earned === null) return null;
    
    if (userPred.points_earned === 3) {
      return <span className="points-earned-badge exact">+3 Exacto</span>;
    } else if (userPred.points_earned === 1) {
      return <span className="points-earned-badge outcome">+1 Resultado</span>;
    } else {
      return <span className="points-earned-badge none">0 Puntos</span>;
    }
  };

  const openComparisonModal = (match) => {
    setModalMatch(match);
  };

  const getMatchComparisonList = (matchId) => {
    return usersList.map(user => {
      const pred = allPredictions.find(p => p.user_id === user.id && p.match_id === matchId);
      return {
        display_name: user.display_name,
        prediction: pred ? `${pred.predicted_home_score} - ${pred.predicted_away_score}` : 'Sin pronóstico',
        points: pred && pred.points_earned !== null ? pred.points_earned : null
      };
    }).sort((a, b) => {
      if (a.points !== b.points) {
        return (b.points || 0) - (a.points || 0);
      }
      return a.display_name.localeCompare(b.display_name);
    });
  };

  const getStageLabel = (stage) => {
    switch (stage) {
      case 'group': return 'Fase de Grupos';
      case 'r32': return 'Dieciseisavos';
      case 'r16': return 'Octavos de Final';
      case 'quarter': return 'Cuartos de Final';
      case 'semi': return 'Semifinal';
      case 'third': return 'Tercer Puesto';
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

  const getLockTime = (dateStr) => {
    if (!dateStr) return new Date();
    if (!dateStr.includes('T')) {
      return new Date(`${dateStr}T00:00:00-03:00`);
    }
    const d = new Date(dateStr);
    const formatter = new Intl.DateTimeFormat('en-CA', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      timeZone: 'America/Argentina/Buenos_Aires'
    });
    const datePart = formatter.format(d);
    return new Date(`${datePart}T00:00:00-03:00`);
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
        <div className="empty-state-icon">⚽</div>
        <p>Cargando lista de partidos...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h2>Partidos del Mundial 2026</h2>
        
        {/* Filters */}
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
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            <option value="all">Todos los Pronósticos</option>
            <option value="predicted">Pronosticados</option>
            <option value="unpredicted">Sin Pronosticar</option>
            <option value="finished">Finalizados</option>
          </select>
        </div>
      </div>

      {/* Match Layout Grouped by Day */}
      {filteredMatches.length === 0 ? (
        <div className="empty-state glass-panel">
          <div className="empty-state-icon">🔍</div>
          <p>No se encontraron partidos para los filtros seleccionados.</p>
        </div>
      ) : (
        <div className="daily-groups-wrapper" style={{ marginTop: '1.5rem', marginBottom: '3rem' }}>
          {Object.entries(
            filteredMatches.reduce((groups, m) => {
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
                dayLabel = dayLabel.replace(/\s+/g, ' ');
                dayLabel = dayLabel.charAt(0).toUpperCase() + dayLabel.slice(1);
              }
              if (!groups[dayLabel]) groups[dayLabel] = [];
              groups[dayLabel].push(m);
              return groups;
            }, {})
          ).map(([dayLabel, dayMatches]) => (
            <div key={dayLabel} className="daily-group-section">
              <div className="daily-group-header">
                <span className="daily-date-text">{dayLabel}</span>
                <span className="daily-group-link" style={{ pointerEvents: 'none' }}>Mundial 2026</span>
              </div>

              <div className="daily-matches-list">
                {dayMatches.map(m => {
                  const pred = predictions[m.id] || { home: '', away: '', saved: true };
                  const isFinished = m.status === 'finished';
                  const hasScore = pred.home !== '' && pred.away !== '';
                  const hasPredictionSaved = pred && pred.saved && hasScore;

                  const isLocked = isFinished || m.is_locked || hasPredictionSaved;

                  return (
                    <div key={m.id} className={`fifa-match-row ${isFinished ? 'finished' : ''}`}>
                      {/* Main Team vs Team block */}
                      <div className="fifa-match-main">
                        {/* Home Team */}
                        <div className="fifa-team home">
                          <span className="fifa-team-name">{m.home_team}</span>
                          <span className="fifa-flag">{getFlag(m.home_team)}</span>
                        </div>

                        {/* Center Column: Scores or Inputs */}
                        <div className="fifa-center-col">
                          {isFinished ? (
                            <div className="fifa-scores-display">
                              <span className="fifa-score-val">{m.home_score}</span>
                              <span className="fifa-score-divider">-</span>
                              <span className="fifa-score-val">{m.away_score}</span>
                            </div>
                          ) : (
                            <div className="fifa-inputs-display">
                              <input
                                type="text"
                                className="fifa-score-input-field"
                                maxLength="2"
                                value={pred.home}
                                disabled={isLocked}
                                placeholder="-"
                                onChange={(e) => handleScoreChange(m.id, 'home', e.target.value)}
                              />
                              <span className="fifa-vs-divider">
                                {isLocked ? '🔒' : getMatchHour(m.match_date)}
                              </span>
                              <input
                                type="text"
                                className="fifa-score-input-field"
                                maxLength="2"
                                value={pred.away}
                                disabled={isLocked}
                                placeholder="-"
                                onChange={(e) => handleScoreChange(m.id, 'away', e.target.value)}
                              />
                            </div>
                          )}
                        </div>

                        {/* Away Team */}
                        <div className="fifa-team away">
                          <span className="fifa-flag">{getFlag(m.away_team)}</span>
                          <span className="fifa-team-name">{m.away_team}</span>
                        </div>
                      </div>

                      {/* Subtitle Details */}
                      <div className="fifa-match-subtitle">
                        {m.group_name ? `Primera fase · Grupo ${m.group_name}` : getStageLabel(m.stage)} · {getStadiumName(m.stadium_id)}
                      </div>

                      {/* Card Footer Details */}
                      <div className="fifa-match-footer">
                        <div className="fifa-match-footer-left">
                          {isFinished ? (
                            getPointsBadge(m)
                          ) : m.is_locked ? (
                            <span className="voting-locked-badge">🔒 Votación bloqueada</span>
                          ) : hasPredictionSaved ? (
                            <span className="voting-locked-badge" style={{ background: 'rgba(0, 102, 204, 0.08)', color: '#0066cc', borderColor: '#99ccff' }}>
                              🔒 Pronóstico Guardado (Bloqueado)
                            </span>
                          ) : (
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                              Abierto para pronósticos
                            </span>
                          )}
                        </div>

                        <div className="fifa-match-footer-right">
                          {isFinished && (
                            <button 
                              className="compare-grid-btn-small"
                              onClick={() => openComparisonModal(m)}
                            >
                              Ver apuestas 🔍
                            </button>
                          )}
                          {!isFinished && !isLocked && (
                            <div className="fifa-save-status">
                              <span className={`status-indicator ${!hasScore ? 'empty' : pred.saved ? 'saved' : 'unsaved'}`}></span>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                {!hasScore ? 'Sin pronosticar' : pred.saved ? 'Guardado' : 'Sin guardar'}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Floating Save Bar */}
      {hasChanges && (
        <div className="save-bar-fixed">
          <span className="save-bar-text">⚠️ Tienes pronósticos sin guardar</span>
          <button 
            className="save-btn-fixed"
            onClick={saveAllPredictions}
            disabled={saveLoading}
          >
            {saveLoading ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      )}

      {/* Comparison Modal */}
      {modalMatch && (
        <div className="modal-backdrop" onClick={() => setModalMatch(null)}>
          <div className="glass-panel modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                Apuestas: {modalMatch.home_team} {modalMatch.home_score} vs {modalMatch.away_score} {modalMatch.away_team}
              </h3>
              <button className="modal-close" onClick={() => setModalMatch(null)}>×</button>
            </div>
            
            <div className="comparison-list">
              {getMatchComparisonList(modalMatch.id).map((item, idx) => {
                let badgeClass = "";
                if (item.points === 3) badgeClass = "points-earned-badge exact";
                else if (item.points === 1) badgeClass = "points-earned-badge outcome";
                else if (item.points === 0) badgeClass = "points-earned-badge none";

                return (
                  <div key={idx} className="comparison-item">
                    <span className="comparison-username">{item.display_name}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <span className="comparison-score">{item.prediction}</span>
                      {badgeClass && (
                        <span className={badgeClass}>
                          {item.points === 3 ? '+3 pts' : item.points === 1 ? '+1 pt' : '0 pts'}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

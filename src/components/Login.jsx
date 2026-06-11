import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';

export default function Login({ onLoginSuccess }) {
  const [users, setUsers] = useState([]);
  const [selectedUsername, setSelectedUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Fetch usernames for dropdown
    const fetchUsers = async () => {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('username, display_name')
          .order('display_name');

        if (error) throw error;
        
        setUsers(data || []);
        if (data && data.length > 0) {
          setSelectedUsername(data[0].username);
        }
      } catch (err) {
        console.error("Error cargando usuarios:", err);
        setError("Error al conectar con la base de datos de Supabase.");
      }
    };

    fetchUsers();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedUsername || !password) {
      setError("Por favor, completa todos los campos.");
      return;
    }

    setError('');
    setLoading(true);

    try {
      // Fetch user password and details
      const { data, error } = await supabase
        .from('users')
        .select('id, username, display_name, password, is_admin')
        .eq('username', selectedUsername.toLowerCase())
        .maybeSingle();

      if (error) throw error;
      
      if (!data) {
        throw new Error("Usuario no encontrado.");
      }

      if (data.password !== password) {
        throw new Error("Contraseña incorrecta.");
      }

      // Successful login - remove password from session object
      const sessionUser = {
        id: data.id,
        username: data.username,
        display_name: data.display_name,
        is_admin: data.is_admin
      };

      onLoginSuccess(sessionUser);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="glass-panel login-card">
        <h1 className="login-title">Prode Conquer</h1>
        <p className="login-subtitle">Mundial 2026 🏆</p>

        {error && (
          <div className="error-message">
            <span>⚠️</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="username-select">Usuario</label>
            <select
              id="username-select"
              className="form-select"
              value={selectedUsername}
              onChange={(e) => setSelectedUsername(e.target.value)}
              disabled={loading}
            >
              <option value="" disabled>Selecciona tu nombre</option>
              {users.map(u => (
                <option key={u.username} value={u.username}>
                  {u.display_name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password-input">Contraseña</label>
            <input
              id="password-input"
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? "Entrando..." : "Iniciar Sesión"}
          </button>
        </form>
      </div>
    </div>
  );
}

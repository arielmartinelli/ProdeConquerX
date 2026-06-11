import React, { useState } from 'react';
import { supabase } from '../utils/supabaseClient';

export default function Profile({ currentUser, showToast }) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) {
      showToast("Por favor, completa todos los campos.", "error");
      return;
    }

    if (newPassword.length < 4) {
      showToast("La contraseña debe tener al menos 4 caracteres.", "error");
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast("Las contraseñas no coinciden.", "error");
      return;
    }

    setLoading(true);

    try {
      // Update password directly in Supabase
      const { error } = await supabase
        .from('users')
        .update({ password: newPassword })
        .eq('id', currentUser.id);

      if (error) throw error;

      showToast("¡Contraseña actualizada con éxito! 👍", "success");
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel profile-card">
      <h2 style={{ marginBottom: '1rem', fontWeight: 800 }}>Mi Perfil</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '0.95rem' }}>
        Hola <strong>{currentUser.display_name}</strong>. Aquí puedes cambiar tu contraseña de acceso para que nadie más pueda votar en tu nombre.
      </p>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label" htmlFor="new-pass">Nueva Contraseña</label>
          <input
            id="new-pass"
            type="password"
            className="form-input"
            placeholder="Mínimo 4 caracteres"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="confirm-pass">Confirmar Nueva Contraseña</label>
          <input
            id="confirm-pass"
            type="password"
            className="form-input"
            placeholder="Repite la contraseña"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={loading}
          />
        </div>

        <button type="submit" className="login-btn" style={{ marginTop: '1rem' }} disabled={loading}>
          {loading ? "Actualizando..." : "Cambiar Contraseña"}
        </button>
      </form>
    </div>
  );
}

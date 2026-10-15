import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router";

import { errorMessages } from "../api/errors";
import { useAuth } from "../auth/useAuth";

export function RegisterPage() {
  const { register, status } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  if (status === "authenticated") return <Navigate to="/" replace />;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setErrors([]);
    try {
      await register(username, email, password);
      navigate("/");
    } catch (error) {
      setErrors(errorMessages(error));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <form className="card" onSubmit={handleSubmit}>
        <h1>Crear cuenta</h1>
        <label>
          Usuario
          <input value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" required />
        </label>
        <label>
          Email (opcional)
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
        </label>
        <label>
          Contraseña
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            required
          />
        </label>
        {errors.length > 0 && (
          <ul className="errors">
            {errors.map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
        )}
        <button type="submit" disabled={submitting}>
          {submitting ? "Creando cuenta…" : "Crear cuenta"}
        </button>
        <p>
          ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
        </p>
      </form>
    </main>
  );
}

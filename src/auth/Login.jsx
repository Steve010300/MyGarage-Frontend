import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "./AuthContext";

/** A form that allows users to log into an existing account. */
export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState(null);

  const onLogin = async (formData) => {
    const username = formData.get("username");
    const password = formData.get("password");
    try {
      await login({ username, password });
      navigate("/my-cars");
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-panel">
        <h1 className="auth-title">Log in</h1>
        <form className="auth-form" action={onLogin}>
          <input className="input" type="text" name="username" placeholder="Username" required />
          <input className="input" type="password" name="password" placeholder="Password" required />
          <button className="btn btn-primary">Login</button>
          {error && <div className="form-error">{error}</div>}
        </form>
        <div className="auth-footer">
          <Link to="/register">Need an account? Register here.</Link>
        </div>
      </div>
    </div>
  );
}

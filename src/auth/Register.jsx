import { useState } from "react";
import { Link, useNavigate } from "react-router";

import { useAuth } from "./AuthContext";

/** A form that allows users to register for a new account */
export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [error, setError] = useState(null);

  const onRegister = async (formData) => {
    const username = formData.get("username");
    const password = formData.get("password");
    try {
      await register({ username, password });
      navigate("/my-cars");
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-panel">
        <h1 className="auth-title">Sign up</h1>
        <form className="auth-form" action={onRegister}>
          <input className="input" type="text" name="username" placeholder="Username" required />
          <input className="input" type="password" name="password" placeholder="Password" required />
          <button className="btn btn-primary">Create account</button>
          {error && <div className="form-error">{error}</div>}
        </form>
        <div className="auth-footer">
          <Link to="/login">Already have an account? Log in here.</Link>
        </div>
      </div>
    </div>
  );
}

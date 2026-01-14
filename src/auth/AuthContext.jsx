import { createContext, useContext, useEffect, useState } from "react";
import { BASE } from "../constants";
import api, { post, setToken as setApiToken } from "../api";


const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem("token") || null);

  useEffect(() => {
    if (token) localStorage.setItem("token", token);
    else localStorage.removeItem("token");
  }, [token]);

  const register = async (credentials) => {
    const result = await post("/users/register", credentials);
    setToken(result);
    setApiToken(result);
  };

  const login = async (credentials) => {
    const result = await post("/users/login", credentials);
    setToken(result);
    setApiToken(result);
  };

  const logout = () => {
    setToken(null);
    sessionStorage.removeItem("token");
  };
  // keep api helper in sync with initial token
  useEffect(() => {
    if (token) setApiToken(token);
    else api.clearToken && api.clearToken();
  }, [token]);

  const value = { token, register, login, logout };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw Error("useAuth must be used within an AuthProvider");
  return context;
}

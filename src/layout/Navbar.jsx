import { NavLink } from "react-router";
import { useAuth } from "../auth/AuthContext";

export default function Navbar() {
  const { token, logout } = useAuth();
  return (
    <header id="navbar">
      <div className="nav-left">
        <NavLink to="/" className="brand">MyGarage</NavLink>
      </div>
      <div className="nav-right">
        <NavLink to="/cars" className="nav-link">Cars</NavLink>
        {token ? (
          <>
            <NavLink to="/my-cars" className="nav-link">My Cars</NavLink>
            <NavLink to="/upload" className="nav-link">Upload</NavLink>
            <NavLink to="/favorites" className="nav-link">Favorites</NavLink>
            <a
              href="#logout"
              className="nav-link"
              onClick={(e) => {
                e.preventDefault();
                logout();
              }}
            >
              Log out
            </a>
          </>
        ) : (
          <>
            <NavLink to="/login" className="nav-link">Log in</NavLink>
            <NavLink to="/register" className="nav-link">Sign up</NavLink>
          </>
        )}
      </div>
    </header>
  );
}

import { Link, NavLink } from "react-router-dom";

const navClass = ({ isActive }) => (isActive ? "active" : undefined);

export const SiteHeader = () => (
  <header className="header">
    <Link className="logo" to="/">
      TopDog Labs<span>®</span>
    </Link>
    <nav className="nav">
      <NavLink className={navClass} to="/apps">
        Portfolio
      </NavLink>
      <NavLink className={navClass} to="/support">
        Support
      </NavLink>
      <NavLink className={navClass} to="/privacy">
        Privacy
      </NavLink>
      <NavLink className={navClass} to="/contact">
        Contact
      </NavLink>
    </nav>
  </header>
);

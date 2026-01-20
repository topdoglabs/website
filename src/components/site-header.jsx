import { Link, NavLink } from "react-router-dom";
import { useSiteContent } from "../hooks/use-site-content.js";

const navClass = ({ isActive }) => (isActive ? "active" : undefined);

export const SiteHeader = () => {
  const { content } = useSiteContent();
  const links = content.navigation?.headerLinks || [];

  return (
    <header className="header">
      <Link className="logo" to="/">
        <span className="logo-mark" aria-hidden="true"></span>
        TopDog Labs<span>®</span>
      </Link>
      <nav className="nav">
        {links.map((link) => (
          <NavLink key={link.label} className={navClass} to={link.href}>
            {link.label}
          </NavLink>
        ))}
      </nav>
    </header>
  );
};

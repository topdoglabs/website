import { Link, NavLink } from "react-router-dom";
import { useSiteContent } from "../hooks/use-site-content.js";

const navClass = ({ isActive }) => (isActive ? "active" : undefined);

export const SiteHeader = () => {
  const { content } = useSiteContent();
  const links = content.navigation?.headerLinks || [];

  return (
    <header className="header">
      <Link className="logo" to="/">
        <img src="/assets/logos/logo-2.svg" alt="TopDog Labs Logo" className="logo-img" />
        TopDog Labs
      </Link>
      <nav className="nav" aria-label="Main navigation">
        {links.map((link) => (
          <NavLink key={link.label} className={navClass} to={link.href}>
            {link.label}
          </NavLink>
        ))}
      </nav>
    </header>
  );
};

import { Link, NavLink } from "react-router-dom";
import { useSiteContent } from "../hooks/use-site-content.js";

const navClass = ({ isActive }) => (isActive ? "active" : undefined);

export const SiteHeader = () => {
  const { content } = useSiteContent();
  const links = content.navigation?.headerLinks || [];

  return (
    <header className="header">
      <Link className="logo" to="/" aria-label="TopDog Labs home">
        <img src="/assets/logos/schnauzer-160.webp" alt="" width="80" height="80" className="logo-img" />
        <span className="brand-name">TopDog <span className="brand-accent">Labs</span></span>
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

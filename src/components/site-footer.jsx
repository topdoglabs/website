import { Link } from "react-router-dom";
import { useSiteContent } from "../hooks/use-site-content.js";

export const SiteFooter = () => {
  const { content } = useSiteContent();
  const columns = content.footerColumns || [];

  const isExternal = (href) =>
    href.startsWith("mailto:") || href.startsWith("http");

  return (
    <footer className="footer">
      <div className="footer-top">
        <Link className="logo" to="/">
          TopDog Labs<span>®</span>
        </Link>
        <nav className="footer-nav">
          <Link to="/apps">Portfolio</Link>
          <Link to="/support">Support</Link>
          <Link to="/privacy">Privacy</Link>
          <Link to="/contact">Contact</Link>
        </nav>
      </div>
      <div className="footer-grid">
        {columns.map((column) => (
          <div key={column.title}>
            <h4>{column.title}</h4>
            {column.links.map((link) =>
              isExternal(link.href) ? (
                <a key={link.label} href={link.href}>
                  {link.label}
                </a>
              ) : (
                <Link key={link.label} to={link.href}>
                  {link.label}
                </Link>
              )
            )}
          </div>
        ))}
      </div>
      <p className="footer-note">© 2024-2026 TopDog Labs. All rights reserved.</p>
    </footer>
  );
};

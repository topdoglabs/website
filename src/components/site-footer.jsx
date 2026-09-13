import { Link } from "react-router-dom";
import { useSiteContent } from "../hooks/use-site-content.js";

export const SiteFooter = () => {
  const { content } = useSiteContent();
  const columns = content.footerColumns || [];
  const footerNote = content.footerNote || "";

  const isExternal = (href) =>
    href.startsWith("mailto:") || href.startsWith("http");

  return (
    <footer className="footer">
      <div className="footer-grid">
        {columns.map((column) => (
          <div key={column.title}>
            <h2>{column.title}</h2>
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
      {footerNote ? <p className="footer-note">{footerNote}</p> : null}
    </footer>
  );
};

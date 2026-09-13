import { SiteFooter } from "./site-footer.jsx";
import { SiteHeader } from "./site-header.jsx";

export const Layout = ({ children, className = "" }) => (
  <div className={`page ${className}`.trim()}>
    <a className="skip-link" href="#main-content">Skip to main content</a>
    <SiteHeader />
    <main className="content" id="main-content" tabIndex={-1}>{children}</main>
    <SiteFooter />
  </div>
);

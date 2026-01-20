import { SiteFooter } from "./site-footer.jsx";
import { SiteHeader } from "./site-header.jsx";

export const Layout = ({ children }) => (
  <div className="page">
    <SiteHeader />
    <main className="content">{children}</main>
    <SiteFooter />
  </div>
);

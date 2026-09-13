import { Link } from "react-router-dom";
import { Layout } from "../components/layout.jsx";
import { useSiteContent } from "../hooks/use-site-content.js";

export const NotFoundPage = () => {
  const { content } = useSiteContent();
  return (
    <Layout>
      <section className="hero">
        <h1>{content.ui.errorPageTitle}</h1>
        <p className="hero-sub">{content.ui.notFoundHelp}</p>
        <div className="hero-actions"><Link className="button primary" to="/apps">{content.ui.viewAllAppsCta}</Link></div>
      </section>
    </Layout>
  );
};

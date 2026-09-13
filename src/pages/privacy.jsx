import policyHtml from "../../public/privacy-embed.html?raw";
import { Link } from "react-router-dom";
import { Layout } from "../components/layout.jsx";
import { useSiteContent } from "../hooks/use-site-content.js";

export const PrivacyPage = () => {
  const { content } = useSiteContent();
  const privacy = content.privacy || {};

  return (
    <Layout>
      <section className="hero hero-bg">
        {privacy.heroTitle ? <h1>{privacy.heroTitle}</h1> : null}
        {privacy.heroSubtitle ? (
          <p className="hero-sub">{privacy.heroSubtitle}</p>
        ) : null}
        <div className="hero-actions">
          <Link className="button primary" to="/apps">
            {privacy.heroPrimaryCta}
          </Link>
          <Link className="button ghost" to="/support">
            {privacy.heroSecondaryCta}
          </Link>
        </div>
      </section>

      <section className="privacy-content">
        <div className="privacy-shell">
          <div className="privacy-embed" role="region" aria-label="Privacy policy" tabIndex={0} dangerouslySetInnerHTML={{ __html: policyHtml }} />
        </div>
      </section>
    </Layout>
  );
};

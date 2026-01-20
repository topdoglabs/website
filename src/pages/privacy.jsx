import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Layout } from "../components/layout.jsx";
import { useSiteContent } from "../hooks/use-site-content.js";

export const PrivacyPage = () => {
  const [policyHtml, setPolicyHtml] = useState("");
  const [hasError, setHasError] = useState(false);
  const { content } = useSiteContent();
  const privacy = content.privacy || {};
  const ui = content.ui || {};

  useEffect(() => {
    let isMounted = true;

    const loadPolicy = async () => {
      try {
        const response = await fetch("/privacy-embed.html");
        if (!response.ok) {
          throw new Error("Failed to load privacy policy");
        }
        const html = await response.text();
        if (isMounted) {
          setPolicyHtml(html);
          setHasError(false);
        }
      } catch (error) {
        if (isMounted) {
          setHasError(true);
        }
      }
    };

    loadPolicy();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <Layout>
      <section className="hero">
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
          {hasError ? (
            <div>
              {privacy.sectionTitle ? <h2>{privacy.sectionTitle}</h2> : null}
              <p>{ui.errorPolicy}</p>
            </div>
          ) : policyHtml ? (
            <div
              className="privacy-embed"
              dangerouslySetInnerHTML={{ __html: policyHtml }}
            />
          ) : (
            <p>{ui.loadingPolicy}</p>
          )}
        </div>
      </section>
    </Layout>
  );
};

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Layout } from "../components/layout.jsx";

export const PrivacyPage = () => {
  const [policyHtml, setPolicyHtml] = useState("");
  const [hasError, setHasError] = useState(false);

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
        <h1>Privacy matters.</h1>
        <p className="hero-sub">Your data, our promise.</p>
        <div className="hero-actions">
          <Link className="button primary" to="/apps">
            Learn More
          </Link>
          <Link className="button ghost" to="/contact">
            Contact
          </Link>
        </div>
      </section>

      <section className="privacy-content">
        <div className="privacy-shell">
          {hasError ? (
          <div><h2>Privacy policy</h2>
            <p>We could not load the privacy policy. Please try again.</p>
            </div>
          ) : policyHtml ? (
            <div
              className="privacy-embed"
              dangerouslySetInnerHTML={{ __html: policyHtml }}
            />
          ) : (
            <p>Loading policy...</p>
          )}
        </div>
      </section>
    </Layout>
  );
};

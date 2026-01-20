import { Link } from "react-router-dom";
import { Layout } from "../components/layout.jsx";
import { useApps } from "../hooks/use-apps.js";

export const AppsPage = () => {
  const { apps, isLoading, error } = useApps();

  return (
    <Layout>
      <section className="hero">
        <h1>Portfolio</h1>
        <p className="hero-sub">A growing lineup of focused iOS releases.</p>
        <div className="hero-actions">
          <Link className="button primary" to="/contact">
            Contact
          </Link>
          <Link className="button ghost" to="/support">
            Get Support
          </Link>
        </div>
      </section>
      <section className="portfolio-grid">
        {isLoading ? (
          <p className="status">Loading apps...</p>
        ) : error ? (
          <p className="status">Unable to load apps right now.</p>
        ) : (
          apps.map((app) => (
            <Link key={app.slug} className="app-card" to={`/apps/${app.slug}`}>
              <div className="app-thumb" aria-hidden="true">
                {app.icon ? (
                  <img
                    className="app-icon"
                    src={app.icon}
                    alt={`${app.name} app icon`}
                    loading="lazy"
                  />
                ) : (
                  <div className="app-icon placeholder" aria-hidden="true"></div>
                )}
              </div>
              <div className="app-meta">
                <div>
                  <h4>{app.name}</h4>
                  <span>{app.date}</span>
                </div>
                <p>{app.summary}</p>
              </div>
            </Link>
          ))
        )}
      </section>
    </Layout>
  );
};

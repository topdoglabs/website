import { Link } from "react-router-dom";
import { Layout } from "../components/layout.jsx";
import { useApps } from "../hooks/use-apps.js";

export const HomePage = () => {
  const { apps, isLoading, error } = useApps();

  return (
    <Layout>
      <section className="hero">
        <h1>Independent iOS apps.</h1>
        <p className="hero-sub">Portfolio of TopDog Labs.</p>
        <div className="hero-actions">
          <Link className="button primary" to="/apps">
            View Portfolio
          </Link>
          <Link className="button ghost" to="/contact">
            Contact
          </Link>
        </div>
      </section>

      <section className="split">
        <div className="split-text">
          <h2>Building quality iOS apps for everyone.</h2>
          <p>
            Crafted and maintained by TopDog Labs. Focused on performance,
            privacy, and ease of use for players, planners, and power users.
          </p>
        </div>
        <div className="split-card">
          <div className="avatar" aria-hidden="true"></div>
          <div>
            <h3>TopDog Labs</h3>
            <p>
              Explore original iOS experiences ranging from classic casino games
              to modern utilities. Designed with clarity, reliability, and a
              premium feel.
            </p>
          </div>
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
                  <span>{app.year}</span>
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

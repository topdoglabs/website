import { Link } from "react-router-dom";
import { Layout } from "../components/layout.jsx";
import { useApps } from "../hooks/use-apps.js";
import { useSiteContent } from "../hooks/use-site-content.js";

export const HomePage = () => {
  const { apps, isLoading, error } = useApps();
  const { content } = useSiteContent();
  const [featured] = apps;
  const home = content.home || {};
  const ui = content.ui || {};
  const isComingSoon = (app) =>
    app.comingSoon || !app.appStoreUrl || !app.appStoreUrl.trim();
  const getAppName = (app) => app.name || "Untitled app";
  const getAppSubline = (app) => app.date || app.category || "Coming soon";
  const getAppBody = (app) =>
    app.summary || app.tagline || "Details for this app are coming soon.";

  const pillars = home.pillars || [];

  return (
    <Layout>
      <section className="hero hero-bg">
        {home.heroTitle ? <h1>{home.heroTitle}</h1> : null}
        {home.heroSubtitle ? (
          <p className="hero-sub">{home.heroSubtitle}</p>
        ) : null}
        <div className="hero-actions">
          <Link className="button primary" to="/apps">
            {home.heroPrimaryCta}
          </Link>
          <Link className="button ghost" to="/support">
            {home.heroSecondaryCta}
          </Link>
        </div>
      </section>

      <section className="split">
        <div className="split-text">
          {home.splitTitle ? <h2>{home.splitTitle}</h2> : null}
          {home.splitBody ? <p>{home.splitBody}</p> : null}
        </div>
        <div className="split-card">
          <div>
            {home.splitCardTitle ? <h3>{home.splitCardTitle}</h3> : null}
            {home.splitCardBody ? <p>{home.splitCardBody}</p> : null}
          </div>
        </div>
      </section>

      {pillars.length > 0 ? (
        <section className="pillars">
          {pillars.map((pillar) => (
            <article key={pillar.title}>
              <h3>{pillar.title}</h3>
              <p>{pillar.body}</p>
            </article>
          ))}
        </section>
      ) : null}

      <section className="featured">
        <div>
          {home.featuredEyebrow ? (
            <p className="eyebrow">{home.featuredEyebrow}</p>
          ) : null}
          {home.featuredTitle ? <h2>{home.featuredTitle}</h2> : null}
          {home.featuredBody ? <p className="muted">{home.featuredBody}</p> : null}
          <div className="hero-actions left">
            <Link className="button primary" to="/apps">
              {home.featuredPrimaryCta}
            </Link>
            <Link className="button ghost" to="/support">
              {home.featuredSecondaryCta}
            </Link>
          </div>
        </div>
        <div className="featured-card">
          {isLoading ? (
            <p className="status">{ui.loadingApp}</p>
          ) : error ? (
            <p className="status">{ui.errorApps}</p>
          ) : featured ? (
            isComingSoon(featured) ? (
              <Link className="app-card wide coming-soon" to={`/apps/${featured.slug}`}>
                <div className="app-thumb" aria-hidden="true">
                  {featured.icon ? (
                    <img
                      className="app-icon"
                      src={featured.icon}
                      alt={`${getAppName(featured)} app icon`}
                      loading="lazy"
                    />
                  ) : (
                    <div className="app-icon placeholder" aria-hidden="true"></div>
                  )}
                  <span className="coming-soon-badge">Coming<br />Soon</span>
                </div>
                <div className="app-meta">
                  <div>
                    <h4>{getAppName(featured)}</h4>
                    <span>{getAppSubline(featured)}</span>
                  </div>
                  <p>{getAppBody(featured)}</p>
                </div>
              </Link>
            ) : (
              <Link className="app-card wide" to={`/apps/${featured.slug}`}>
                <div className="app-thumb" aria-hidden="true">
                  {featured.icon ? (
                    <img
                      className="app-icon"
                      src={featured.icon}
                      alt={`${getAppName(featured)} app icon`}
                      loading="lazy"
                    />
                  ) : (
                    <div className="app-icon placeholder" aria-hidden="true"></div>
                  )}
                </div>
                <div className="app-meta">
                  <div>
                    <h4>{getAppName(featured)}</h4>
                    <span>{getAppSubline(featured)}</span>
                  </div>
                  <p>{getAppBody(featured)}</p>
                </div>
              </Link>
            )
          ) : null}
        </div>
      </section>

    </Layout>
  );
};

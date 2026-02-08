import { Link } from "react-router-dom";
import { Layout } from "../components/layout.jsx";
import { useApps } from "../hooks/use-apps.js";
import { useSiteContent } from "../hooks/use-site-content.js";

export const AppsPage = () => {
  const { apps, isLoading, error } = useApps();
  const { content } = useSiteContent();
  const appsPage = content.appsPage || {};
  const ui = content.ui || {};
  const appCount = apps.length;
  const categories = Array.from(
    new Set(apps.map((app) => app.category).filter(Boolean))
  );
  const isComingSoon = (app) =>
    app.comingSoon || !app.appStoreUrl || !app.appStoreUrl.trim();
  const getAppName = (app) => app.name || "Untitled app";
  const getAppSubline = (app) => app.date || app.category || "Coming soon";
  const getAppBody = (app) =>
    app.summary || app.tagline || "Details for this app are coming soon.";

  return (
    <Layout>
      <section className="hero hero-bg">
        {appsPage.heroTitle ? <h1>{appsPage.heroTitle}</h1> : null}
        {appsPage.heroSubtitle ? (
          <p className="hero-sub">{appsPage.heroSubtitle}</p>
        ) : null}
        <div className="hero-actions">
          <a className="button primary" href="mailto:info@topdoglabs.com">
            {appsPage.heroPrimaryCta}
          </a>
          <Link className="button ghost" to="/support">
            {appsPage.heroSecondaryCta}
          </Link>
        </div>
      </section>

      <section className="apps-overview">
        <div className="overview-content">
          {appsPage.overviewTitle ? <h2>{appsPage.overviewTitle}</h2> : null}
          {appsPage.overviewBody ? <p>{appsPage.overviewBody}</p> : null}
        </div>
        <div className="apps-stats">
          {appsPage.statsLabels?.apps ? (
            <div className="stat-card">
              <span>{appsPage.statsLabels.apps}</span>
              <strong>{appCount}</strong>
            </div>
          ) : null}
          {appsPage.statsLabels?.categories ? (
            <div className="stat-card">
              <span>{appsPage.statsLabels.categories}</span>
              <strong>{categories.join(", ") || "iOS"}</strong>
            </div>
          ) : null}
          {appsPage.statsLabels?.focus ? (
            <div className="stat-card">
              <span>{appsPage.statsLabels.focus}</span>
              <strong>{appsPage.focusValue}</strong>
            </div>
          ) : null}
        </div>
      </section>

      <section className="portfolio-grid">
        {isLoading ? (
          <p className="status">{ui.loadingApps}</p>
        ) : error ? (
          <p className="status">{ui.errorApps}</p>
        ) : (
          apps.map((app) => (
            <Link
              key={app.slug}
              className={`app-card${isComingSoon(app) ? " coming-soon" : ""}`}
              to={`/apps/${app.slug}`}
            >
                <div className="app-thumb" aria-hidden="true">
                  {app.icon ? (
                    <img
                      className="app-icon"
                      src={app.icon}
                      alt={`${getAppName(app)} app icon`}
                      loading="lazy"
                    />
                  ) : (
                    <div className="app-icon placeholder" aria-hidden="true"></div>
                  )}
                  {isComingSoon(app) ? (
                    <span className="coming-soon-badge">Coming<br />Soon</span>
                  ) : null}
                </div>
                <div className="app-meta">
                  <div>
                    <h4>{getAppName(app)}</h4>
                    <span>{getAppSubline(app)}</span>
                  </div>
                  <p>{getAppBody(app)}</p>
                </div>
            </Link>
          ))
        )}
      </section>
    </Layout>
  );
};

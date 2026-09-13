import { Link } from "react-router-dom";
import { Layout } from "../components/layout.jsx";
import { PillarIcon } from "../components/pillar-icon.jsx";
import { useApps } from "../hooks/use-apps.js";
import { useSiteContent } from "../hooks/use-site-content.js";
import { getAppBody, getAppIcon, getAppName, getLatestReleasedApp } from "../lib/app-model.js";

export const HomePage = () => {
  const { apps, isLoading, error } = useApps();
  const { content } = useSiteContent();
  const featured = getLatestReleasedApp(apps);
  const home = content.home || {};
  const ui = content.ui || {};

  return (
    <Layout className="page--home">
      <section className="home-hero" aria-labelledby="home-title">
        <div className="home-hero__copy">
          <h1 id="home-title">{home.heroTitle}</h1>
          <p className="home-hero__subtitle">{home.heroSubtitle}</p>
          <div className="home-hero__actions">
            <Link className="button primary" to="/apps">{home.heroPrimaryCta}</Link>
            <Link className="button ghost" to="/support">{home.heroSecondaryCta}</Link>
          </div>
        </div>
        <div className="home-hero__portrait">
          <img src="/assets/logos/schnauzer-800.webp" srcSet="/assets/logos/schnauzer-480.webp 480w, /assets/logos/schnauzer-800.webp 800w" sizes="(max-width: 600px) 240px, (max-width: 900px) 280px, 380px" width="800" height="800" alt={home.mascotAlt} fetchPriority="high" decoding="async" />
        </div>
      </section>

      <section className="home-principles" aria-labelledby="quality-title">
        <div className="home-principles__intro">
          <h2 id="quality-title">{home.splitTitle}</h2>
          <p>{home.splitBody}</p>
        </div>
        <div className="home-principles__items">
          {(home.pillars || []).map((pillar) => (
            <article className="home-principle" key={pillar.title}>
              <PillarIcon name={pillar.icon} />
              <h3>{pillar.title}</h3>
              <p>{pillar.body}</p>
            </article>
          ))}
        </div>
      </section>

      {featured ? (
        <section className="home-release" aria-labelledby="release-title">
          <div className="home-release__copy">
            <p className="eyebrow">{home.featuredEyebrow}</p>
            <h2 id="release-title">{getAppName(featured)}</h2>
            <p className="home-release__description">{getAppBody(featured)}</p>
            <Link className="text-link" to={`/apps/${featured.slug}`}>
              {home.featuredAppCta}<span aria-hidden="true"> →</span>
            </Link>
          </div>
          {getAppIcon(featured) ? (
            <Link className="home-release__art" to={`/apps/${featured.slug}`} aria-label={`${home.featuredAppCta}: ${getAppName(featured)}`}>
              <img src={getAppIcon(featured)} alt={`${getAppName(featured)} app icon`} width="240" height="240" loading="lazy" decoding="async" />
            </Link>
          ) : null}
          <div className="home-release__note">
            <p>{home.studioNote}</p>
            <span aria-hidden="true" />
            <Link to="/apps">{home.featuredPrimaryCta} <span aria-hidden="true">↗</span></Link>
          </div>
        </section>
      ) : isLoading || error ? (
        <p className="status" role="status">{isLoading ? ui.loadingApp : ui.errorApps}</p>
      ) : null}
    </Layout>
  );
};

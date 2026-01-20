import { useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Layout } from "../components/layout.jsx";
import { useApps } from "../hooks/use-apps.js";
import { useSiteContent } from "../hooks/use-site-content.js";

export const AppDetailPage = () => {
  const { slug } = useParams();
  const { apps, isLoading, error } = useApps();
  const { content } = useSiteContent();
  const appDetail = content.appDetail || {};
  const ui = content.ui || {};
  const sliderRef = useRef(null);
  const [activeShotIndex, setActiveShotIndex] = useState(null);
  const app = useMemo(
    () => apps.find((item) => item.slug === slug),
    [apps, slug]
  );

  if (isLoading) {
    return (
      <Layout>
        <section className="hero">
          {ui.appLoadingTitle ? <h1>{ui.appLoadingTitle}</h1> : null}
          {ui.appLoadingSubtitle ? (
            <p className="hero-sub">{ui.appLoadingSubtitle}</p>
          ) : null}
        </section>
      </Layout>
    );
  }

  if (error || !app) {
    return (
      <Layout>
        <section className="hero">
          {ui.errorAppTitle ? <h1>{ui.errorAppTitle}</h1> : null}
          {ui.errorAppSubtitle ? (
            <p className="hero-sub">{ui.errorAppSubtitle}</p>
          ) : null}
          <div className="hero-actions">
            <Link className="button primary" to="/apps">
              {ui.viewAllAppsCta}
            </Link>
          </div>
        </section>
      </Layout>
    );
  }

  const highlights = app.highlights || [];
  const features = app.features || [];
  const screenshots = app.screenshots || [];
  const hasShots = screenshots.length > 0;

  const scrollShots = (direction) => {
    if (!sliderRef.current) {
      return;
    }
    const { clientWidth } = sliderRef.current;
    const scrollAmount = clientWidth * 0.9;
    sliderRef.current.scrollBy({
      left: direction === "next" ? scrollAmount : -scrollAmount,
      behavior: "smooth",
    });
  };

  return (
    <Layout>
      <section className="app-hero">
        <div className="app-hero-copy">
          <div className="detail-title">
            <div className="detail-icon">
              {app.icon ? (
                <img src={app.icon} alt={`${app.name} app icon`} loading="lazy" />
              ) : (
                <div className="app-icon placeholder" aria-hidden="true"></div>
              )}
            </div>
            <div>
              <h1>{app.name}</h1>
              <p className="hero-sub">{app.tagline || app.date}</p>
            </div>
          </div>
          <p className="detail-copy left">{app.description}</p>
          <div className="hero-actions">
            {appDetail.primaryCta ? (
              <button className="button primary" type="button">
                {appDetail.primaryCta}
              </button>
            ) : null}
            {appDetail.secondaryCta ? (
              <a className="button ghost" href={`mailto:${app.supportEmail}`}>
                {appDetail.secondaryCta}
              </a>
            ) : null}
          </div>
        </div>
        <div className="app-hero-media">
          <div className="device-mock large" aria-hidden="true">
            {screenshots[0] ? (
              <img src={screenshots[0]} alt="" loading="lazy" />
            ) : (
              <div className="device-screen"></div>
            )}
          </div>
        </div>
      </section>

      <section className="detail-meta">
        <div>
          <span>Category</span>
          <strong>{app.category}</strong>
        </div>
        <div>
          <span>Version</span>
          <strong>{app.version}</strong>
        </div>
        <div>
          <span>Rating</span>
          <strong>{app.rating}</strong>
        </div>
        <div>
          <span>Platform</span>
          <strong>{app.platform}</strong>
        </div>
        <div>
          <span>Price</span>
          <strong>{app.price}</strong>
        </div>
      </section>

      <section className="detail-hero">
        {hasShots ? (
          <div className="shot-shell">
            <button
              className="shot-nav"
              type="button"
              onClick={() => scrollShots("prev")}
              aria-label="Previous screenshots"
            >
              ←
            </button>
            <div className="shot-track" ref={sliderRef}>
              {screenshots.map((shot, index) => (
                <button
                  className="shot-card"
                  key={`${app.slug}-shot-${index}`}
                  type="button"
                  onClick={() => setActiveShotIndex(index)}
                >
                  <img
                    src={shot}
                    alt={`${app.name} screenshot ${index + 1}`}
                    loading="lazy"
                  />
                </button>
              ))}
            </div>
            <button
              className="shot-nav"
              type="button"
              onClick={() => scrollShots("next")}
              aria-label="Next screenshots"
            >
              →
            </button>
          </div>
        ) : (
          <div className="detail-image" aria-hidden="true">
            <div className="shape square"></div>
            <div className="shape circle"></div>
            <div className="shape triangle"></div>
          </div>
        )}
      </section>

      <section className="detail-sections">
        <div>
          {appDetail.highlightsTitle ? (
            <h2>{appDetail.highlightsTitle}</h2>
          ) : null}
          <ul>
            {highlights.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <div>
          {appDetail.featuresTitle ? <h2>{appDetail.featuresTitle}</h2> : null}
          <div className="feature-grid">
            {features.map((feature) => (
              <article key={feature.title}>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="detail-update">
        {appDetail.whatsNewTitle ? <h2>{appDetail.whatsNewTitle}</h2> : null}
        <p>{app.whatsNew}</p>
      </section>

      {activeShotIndex !== null ? (
        <div className="modal" role="dialog" aria-modal="true">
          <div
            className="modal-backdrop"
            onClick={() => setActiveShotIndex(null)}
          />
          <div className="modal-content">
            <button
              className="modal-close"
              type="button"
              onClick={() => setActiveShotIndex(null)}
              aria-label="Close image"
            >
              ✕
            </button>
            <button
              className="modal-nav left"
              type="button"
              onClick={() =>
                setActiveShotIndex((prev) =>
                  prev === 0 ? screenshots.length - 1 : prev - 1
                )
              }
              aria-label="Previous screenshot"
            >
              ←
            </button>
            <img
              src={screenshots[activeShotIndex]}
              alt={`${app.name} screenshot ${activeShotIndex + 1}`}
            />
            <button
              className="modal-nav right"
              type="button"
              onClick={() =>
                setActiveShotIndex((prev) =>
                  prev === screenshots.length - 1 ? 0 : prev + 1
                )
              }
              aria-label="Next screenshot"
            >
              →
            </button>
          </div>
        </div>
      ) : null}
    </Layout>
  );
};

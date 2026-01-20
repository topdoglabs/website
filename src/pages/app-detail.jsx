import { useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Layout } from "../components/layout.jsx";
import { useApps } from "../hooks/use-apps.js";

export const AppDetailPage = () => {
  const { slug } = useParams();
  const { apps, isLoading, error } = useApps();
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
          <h1>Loading...</h1>
          <p className="hero-sub">Fetching app details.</p>
        </section>
      </Layout>
    );
  }

  if (error || !app) {
    return (
      <Layout>
        <section className="hero">
          <h1>App not found.</h1>
          <p className="hero-sub">We could not find that release.</p>
          <div className="hero-actions">
            <Link className="button primary" to="/apps">
              View all apps
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
      <section className="hero detail-hero-head">
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
        <div className="hero-actions">
          <button className="button primary" type="button">
            App Store (soon)
          </button>
          <a className="button ghost" href={`mailto:${app.supportEmail}`}>
            Support
          </a>
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
        <p className="detail-copy">{app.description}</p>
      </section>

      <section className="detail-sections">
        <div>
          <h2>Highlights</h2>
          <ul>
            {highlights.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <div>
          <h2>Features</h2>
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
        <h2>What's new</h2>
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

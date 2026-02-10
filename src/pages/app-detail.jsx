import { useEffect, useMemo, useRef, useState } from "react";
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
  const [brokenShots, setBrokenShots] = useState(new Set());
  const app = useMemo(
    () => apps.find((item) => item.slug === slug),
    [apps, slug]
  );
  useEffect(() => {
    setBrokenShots(new Set());
    setActiveShotIndex(null);
  }, [slug]);

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

  const screenshots = app.screenshots || [];
  const hasAppStoreUrl = Boolean(app.appStoreUrl && app.appStoreUrl.trim());
  const hasShots = screenshots.length > 0;
  const appName = app.name || "Untitled app";
  const description =
    app.description ||
    app.appStore?.description ||
    "Full app details are coming soon.";
  const copy = app.copy || null;
  const copySections = Array.isArray(copy?.sections)
    ? copy.sections.filter(
        (section) =>
          Array.isArray(section?.bullets) && section.bullets.length > 0
      )
    : [];
  const isHighlightsSection = (section) =>
    typeof section?.heading === "string" &&
    section.heading.trim().toLowerCase() === "highlights";
  const hasNamedHighlights = copySections.some((section) =>
    isHighlightsSection(section)
  );
  const highlightSection = hasNamedHighlights
    ? copySections.find((section) => isHighlightsSection(section))
    : copySections[0];
  const highlightsFromCopy =
    Array.isArray(highlightSection?.bullets) ? highlightSection.bullets : [];
  const featureSections = copySections.filter((section, index) => {
    if (hasNamedHighlights) {
      return !isHighlightsSection(section);
    }
    return index > 0;
  });
  const featuresFromCopy = featureSections.map((section, index) => ({
    title: section.heading || `Feature ${index + 1}`,
    description: Array.isArray(section.bullets)
      ? section.bullets.join(" ")
      : "",
  }));
  const highlights =
    highlightsFromCopy.length > 0 ? highlightsFromCopy : app.highlights || [];
  const features =
    featuresFromCopy.length > 0 ? featuresFromCopy : app.features || [];
  const whatsNew = app.whatsNew || "Release notes will be posted soon.";
  const isBrokenShot = (index) => brokenShots.has(index);

  const renderDescription = (text) => {
    const blocks = text
      .split(/\n\s*\n/)
      .map((block) => block.trim())
      .filter(Boolean);

    return blocks.map((block, blockIndex) => {
      const lines = block
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);
      const bulletLines = lines.filter((line) => line.startsWith("- "));
      const textLines = lines.filter((line) => !line.startsWith("- "));
      const heading = textLines.length > 0 && textLines[0].endsWith(":")
        ? textLines[0]
        : null;
      const bodyLines = heading ? textLines.slice(1) : textLines;
      const isLead = blockIndex === 0 && blocks.length > 1;

      return (
        <section className="detail-copy-block" key={`desc-block-${blockIndex}`}>
          {heading ? <h3 className="detail-copy-heading">{heading}</h3> : null}
          {bodyLines.map((line, lineIndex) => (
            <p
              className={`detail-copy-line${isLead ? " lead" : ""}`}
              key={`desc-line-${blockIndex}-${lineIndex}`}
            >
              {line}
            </p>
          ))}
          {bulletLines.length > 0 ? (
            <ul className="detail-copy-list">
              {bulletLines.map((line, lineIndex) => (
                <li key={`desc-bullet-${blockIndex}-${lineIndex}`}>
                  {line.slice(2)}
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      );
    });
  };

  const renderStructuredCopy = (copyContent, showSections = false) => {
    const sections = Array.isArray(copyContent.sections) ? copyContent.sections : [];

    return (
      <>
        {copyContent.lead ? (
          <section className="detail-copy-block">
            <p className="detail-copy-line lead">{copyContent.lead}</p>
          </section>
        ) : null}
        {showSections ? sections.map((section, sectionIndex) => (
          <section className="detail-copy-block" key={`copy-section-${sectionIndex}`}>
            {section.heading ? (
              <h3 className="detail-copy-heading">{section.heading}</h3>
            ) : null}
            {Array.isArray(section.bullets) && section.bullets.length > 0 ? (
              <ul className="detail-copy-list">
                {section.bullets.map((bullet, bulletIndex) => (
                  <li key={`copy-bullet-${sectionIndex}-${bulletIndex}`}>{bullet}</li>
                ))}
              </ul>
            ) : null}
          </section>
        )) : null}
        {copyContent.closing ? (
          <section className="detail-copy-block">
            <p className="detail-copy-line">{copyContent.closing}</p>
          </section>
        ) : null}
      </>
    );
  };

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
                <img src={app.icon} alt={`${appName} app icon`} loading="lazy" />
              ) : (
                <div className="app-icon placeholder" aria-hidden="true"></div>
              )}
            </div>
            <div>
              <h1>{appName}</h1>
              <p className="hero-sub">{app.tagline || app.date || "Coming soon"}</p>
            </div>
          </div>
          <div className="detail-copy left">
            {copy
              ? renderStructuredCopy(
                  copy,
                  !copy.lead && !copy.closing && copySections.length > 0
                )
              : renderDescription(description)}
          </div>
          <div className="hero-actions">
            {hasAppStoreUrl ? (
              <a
                className="button primary"
                href={app.appStoreUrl}
                target="_blank"
                rel="noreferrer"
              >
                {appDetail.primaryCta || "View on App Store"}
              </a>
            ) : null}
            {!hasAppStoreUrl ? (
              <button className="button primary" type="button" disabled>
                {appDetail.primaryCta || "App Store (soon)"}
              </button>
            ) : null}
            {appDetail.secondaryCta ? (
              <a
                className="button ghost"
                href={`mailto:${app.supportEmail || "info@topdoglabs.com"}`}
              >
                {appDetail.secondaryCta}
              </a>
            ) : null}
          </div>
        </div>
        <div className="app-hero-media">
          {screenshots[0] && !isBrokenShot(0) ? (
            <button
              className="device-mock large hero-shot-trigger"
              type="button"
              onClick={() => setActiveShotIndex(0)}
              aria-label={`Open ${appName} screenshot 1`}
            >
              <img
                src={screenshots[0]}
                alt={`${appName} screenshot 1`}
                loading="lazy"
                onError={() =>
                  setBrokenShots((prev) => new Set(prev).add(0))
                }
              />
            </button>
          ) : (
            <div className="device-mock large" aria-hidden="true">
              <div className="image-fallback">Screenshot Coming Soon</div>
            </div>
          )}
        </div>
      </section>

      <section className="detail-meta">
        <div>
          <span>Category</span>
          <strong>{app.category || "TBD"}</strong>
        </div>
        <div>
          <span>Version</span>
          <strong>{app.version || "TBD"}</strong>
        </div>
        <div>
          <span>Rating</span>
          <strong>{app.rating || "TBD"}</strong>
        </div>
        <div>
          <span>Platform</span>
          <strong>{app.platform || "iOS"}</strong>
        </div>
        <div>
          <span>Price</span>
          <strong>{app.price || "TBD"}</strong>
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
                  {isBrokenShot(index) ? (
                    <div className="image-fallback small">
                      Screenshot {index + 1}
                    </div>
                  ) : (
                    <img
                      src={shot}
                      alt={`${appName} screenshot ${index + 1}`}
                      loading="lazy"
                      onError={() =>
                        setBrokenShots((prev) => new Set(prev).add(index))
                      }
                    />
                  )}
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
            {(highlights.length > 0 ? highlights : ["More details coming soon."]).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <div>
          {appDetail.featuresTitle ? <h2>{appDetail.featuresTitle}</h2> : null}
          <div className="feature-grid">
            {(features.length > 0
              ? features
              : [{ title: "Features", description: "Feature list coming soon." }]).map((feature) => (
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
        <p>{whatsNew}</p>
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
            {isBrokenShot(activeShotIndex) ? (
              <div className="image-fallback modal-fallback">
                Screenshot {activeShotIndex + 1} Coming Soon
              </div>
            ) : (
              <img
                src={screenshots[activeShotIndex]}
                alt={`${appName} screenshot ${activeShotIndex + 1}`}
                onError={() =>
                  setBrokenShots((prev) => new Set(prev).add(activeShotIndex))
                }
              />
            )}
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

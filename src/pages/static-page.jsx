import { Layout } from "../components/layout.jsx";
import { useSiteContent } from "../hooks/use-site-content.js";

export const StaticPage = ({ slug }) => {
  const { content, isLoading, error } = useSiteContent();
  const ui = content.ui || {};
  const page = content.pages ? content.pages[slug] : null;

  if (isLoading) {
    return (
      <Layout>
        <section className="hero">
          {ui.pageLoadingTitle ? <h1>{ui.pageLoadingTitle}</h1> : null}
          {ui.pageLoadingSubtitle ? (
            <p className="hero-sub">{ui.pageLoadingSubtitle}</p>
          ) : null}
        </section>
      </Layout>
    );
  }

  if (error || !page) {
    return (
      <Layout>
        <section className="hero">
          {ui.errorPageTitle ? <h1>{ui.errorPageTitle}</h1> : null}
          {ui.errorPageSubtitle ? (
            <p className="hero-sub">{ui.errorPageSubtitle}</p>
          ) : null}
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="hero hero-bg">
        <h1>{page.title}</h1>
        <p className="hero-sub">{page.subtitle}</p>
      </section>

      <section className="split">
        <div className="split-text">
          <h2>{page.summaryTitle}</h2>
          <p>{page.summaryBody}</p>
        </div>
      </section>

      <section className="page-sections">
        {page.sections.map((section) => (
          <article key={section.title} className="page-section">
            <h3>{section.title}</h3>
            <p>{section.body}</p>
          </article>
        ))}
      </section>

      {page.closing ? (
        <section className="page-closing">
          <p>{page.closing}</p>
        </section>
      ) : null}
    </Layout>
  );
};

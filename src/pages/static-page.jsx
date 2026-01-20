import { Layout } from "../components/layout.jsx";
import { useSiteContent } from "../hooks/use-site-content.js";

export const StaticPage = ({ slug }) => {
  const { content, isLoading, error } = useSiteContent();
  const page = content.pages ? content.pages[slug] : null;

  if (isLoading) {
    return (
      <Layout>
        <section className="hero">
          <h1>Loading...</h1>
          <p className="hero-sub">Fetching content.</p>
        </section>
      </Layout>
    );
  }

  if (error || !page) {
    return (
      <Layout>
        <section className="hero">
          <h1>Page not found.</h1>
          <p className="hero-sub">We could not load this section.</p>
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="hero">
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

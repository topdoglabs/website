import { Link } from "react-router-dom";
import { Layout } from "../components/layout.jsx";
import { useApps } from "../hooks/use-apps.js";
import { useSiteContent } from "../hooks/use-site-content.js";

export const SupportPage = () => {
  const { apps } = useApps();
  const { content } = useSiteContent();
  const support = content.support || {};
  const subjects = [
    ...(support.subjectOptions || []),
    ...apps.map((app) => app.name),
  ];

  return (
    <Layout>
      <section className="hero hero-bg">
        {support.heroTitle ? <h1>{support.heroTitle}</h1> : null}
        {support.heroSubtitle ? (
          <p className="hero-sub">{support.heroSubtitle}</p>
        ) : null}
        <div className="hero-actions">
          <a className="button primary" href="mailto:info@topdoglabs.com">
            {support.heroPrimaryCta}
          </a>
        </div>
      </section>

      <section className="support-merge">
        <div className="support-copy">
          {support.bodyTitle ? <h2>{support.bodyTitle}</h2> : null}
          {support.bodyText ? <p>{support.bodyText}</p> : null}
        </div>
        <form className="form wide">
          <label>
            {support.subjectLabel}
            <select>
              {subjects.map((subject) => (
                <option key={subject} value={subject}>
                  {subject}
                </option>
              ))}
            </select>
          </label>
          <label>
            {support.nameLabel}
            <input
              type="text"
              placeholder={support.namePlaceholder}
            />
          </label>
          <label>
            {support.emailLabel}
            <input
              type="email"
              placeholder={support.emailPlaceholder}
            />
          </label>
          <label>
            {support.messageLabel}
            <textarea
              placeholder={support.messagePlaceholder}
              rows="4"
            ></textarea>
          </label>
          <button className="button primary" type="button">
            {support.submitLabel}
          </button>
        </form>
      </section>
    </Layout>
  );
};

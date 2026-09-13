import { useRef, useState } from "react";
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
    ...apps.map((app) => app.identity?.name).filter(Boolean),
  ];

  const [formData, setFormData] = useState({
    subject: subjects[0] || "",
    name: "",
    email: "",
    message: "",
    website: "",
  });

  const statusRef = useRef(null);
  const [status, setStatus] = useState("idle"); // idle, loading, success, error
  const [errorMessage, setErrorMessage] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("loading");
    setErrorMessage("");

    try {
      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok && result.success === true) {
        setStatus("success");
      } else {
        setStatus("error");
        setErrorMessage(result.error || "Failed to send email. Please try again.");
        requestAnimationFrame(() => statusRef.current?.focus());
      }
    } catch (err) {
      setStatus("error");
      setErrorMessage("Network error. Please try again.");
      requestAnimationFrame(() => statusRef.current?.focus());
    }
  };

  if (status === "success") {
    return (
      <Layout>
        <section className="hero hero-bg">
          <h1>Thank you!</h1>
          <p className="hero-sub">Your message has been sent. We'll get back to you soon.</p>
          <div className="hero-actions">
            <Link className="button primary" to="/">Back Home</Link>
          </div>
        </section>
      </Layout>
    );
  }

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
          {status === "error" && (
            <p ref={statusRef} role="alert" tabIndex={-1} style={{ color: "var(--accent)", marginTop: "20px" }}>
              {errorMessage || "Something went wrong. Please try emailing us directly."}
            </p>
          )}
        </div>
        <form className="form wide" onSubmit={handleSubmit}>
          <label>
            {support.subjectLabel}
            <select name="subject" value={formData.subject} onChange={handleChange}>
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
              name="name"
              autoComplete="name"
              maxLength={100}
              type="text"
              required
              placeholder={support.namePlaceholder}
              value={formData.name}
              onChange={handleChange}
            />
          </label>
          <label>
            {support.emailLabel}
            <input
              name="email"
              autoComplete="email"
              spellCheck={false}
              maxLength={254}
              type="email"
              required
              placeholder={support.emailPlaceholder}
              value={formData.email}
              onChange={handleChange}
            />
          </label>
          <label>
            {support.messageLabel}
            <textarea
              name="message"
              maxLength={10000}
              required
              placeholder={support.messagePlaceholder}
              rows="4"
              value={formData.message}
              onChange={handleChange}
            ></textarea>
          </label>
          <label className="form-trap" aria-hidden="true">Leave this empty<input name="website" tabIndex={-1} autoComplete="off" value={formData.website} onChange={handleChange} /></label>
          <button
            className="button primary"
            type="submit"
            disabled={status === "loading"}
          >
            {status === "loading" ? "Sending…" : support.submitLabel}
          </button>
        </form>
      </section>
    </Layout>
  );
};

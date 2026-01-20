import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Layout } from "../components/layout.jsx";
import { useApps } from "../hooks/use-apps.js";

export const ContactPage = () => {
  const { apps } = useApps();
  const [subject, setSubject] = useState("General Inquiry");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const subjects = useMemo(() => {
    const appSubjects = apps.map((app) => app.name);
    return ["General Inquiry", "Partnership", "Press", ...appSubjects];
  }, [apps]);

  const handleSubmit = (event) => {
    event.preventDefault();
    const subjectLine = `TopDog Labs - ${subject}`;
    const bodyLines = [
      `Name: ${name || "-"}`,
      `Email: ${email || "-"}`,
      `Subject: ${subject}`,
      "",
      message || "",
    ];
    const mailto = `mailto:info@topdoglabs.com?subject=${encodeURIComponent(
      subjectLine
    )}&body=${encodeURIComponent(bodyLines.join("\n"))}`;
    window.location.href = mailto;
  };

  return (
    <Layout>
      <section className="hero">
        <h1>Contact us.</h1>
        <p className="hero-sub">We are here to help.</p>
        <div className="hero-actions">
          <a className="button primary" href="mailto:info@topdoglabs.com">
            Email Support
          </a>
          <Link className="button ghost" to="/support">
            Send Inquiry
          </Link>
        </div>
      </section>

      <section className="split">
        <div className="split-text">
          <h2>Get in touch with TopDog Labs.</h2>
          <p>
            Whether you have questions about Blackjack, upcoming titles, or
            support requests, we are a message away.
          </p>
        </div>
      </section>

      <section className="form-section">
        <h2>Reach out to us</h2>
        <p>Support or inquiries</p>
        <form className="form" onSubmit={handleSubmit}>
          <label>
            Subject
            <select
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
            >
              {subjects.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
          <label>
            Name
            <input
              type="text"
              placeholder="Jane Smith"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </label>
          <label>
            Email
            <input
              type="email"
              placeholder="jane@framer.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>
          <label>
            Message
            <textarea
              placeholder="Your message..."
              rows="4"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
            ></textarea>
          </label>
          <button className="button primary" type="submit">
            Submit
          </button>
        </form>
      </section>
    </Layout>
  );
};

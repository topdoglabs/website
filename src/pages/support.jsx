import { Link } from "react-router-dom";
import { Layout } from "../components/layout.jsx";

const supportQuestions = [
  "How do I get support for a TopDog Labs app?",
  "Where can I report a bug or suggest a feature?",
  "Where can I find privacy and legal documents?",
];

export const SupportPage = () => (
  <Layout>
    <section className="hero">
      <h1>Support Center.</h1>
      <p className="hero-sub">Find help for TopDog apps.</p>
      <div className="hero-actions">
        <Link className="button primary" to="/contact">
          Get Help
        </Link>
        <a className="button ghost" href="mailto:info@topdoglabs.com">
          Contact
        </a>
      </div>
    </section>

    <section className="split">
      <div className="split-text">
        <h2>Welcome to TopDog Labs Support.</h2>
        <p>
          We help you get the most out of our iOS apps, including Blackjack by
          TopDog and upcoming releases.
        </p>
      </div>
    </section>

    <section className="faq">
      {supportQuestions.map((question) => (
        <details key={question}>
          <summary>{question}</summary>
          <p>
            Email us at info@topdoglabs.com and we will follow up quickly with
            next steps.
          </p>
        </details>
      ))}
    </section>

    <section className="form-section">
      <h2>Need more help?</h2>
      <p>Contact directly below.</p>
      <form className="form">
        <label>
          Name
          <input type="text" placeholder="Jane Smith" />
        </label>
        <label>
          Email
          <input type="email" placeholder="jane@framer.com" />
        </label>
        <label>
          Message
          <textarea placeholder="Your message..." rows="4"></textarea>
        </label>
        <button className="button primary" type="button">
          Submit
        </button>
      </form>
    </section>
  </Layout>
);

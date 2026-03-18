import Link from "next/link";
import { JoinForm } from "../components/join-form";
import { Reveal, StaggerItem, StaggerList } from "../components/reveal";
import { SiteShell } from "../components/site-shell";
import { conditions, faqs, trustPoints } from "../content/site-data";

export default function JoinPage() {
  return (
    <SiteShell>
      <section className="section page-hero">
        <div className="section-heading narrow">
          <p className="eyebrow">Book your batch call</p>
          <h1 className="page-title">Share your concern and let the team guide you into the right next step.</h1>
          <p className="lead">
            This is the cleanest path into the platform. Fill the form once, and use that to start your wellness call,
            batch recommendation, diet chart direction, and first class placement.
          </p>
        </div>
      </section>

      <section className="section join">
        <div className="join-panel join-visual-panel">
          <Reveal>
            <p className="eyebrow">What happens after this</p>
            <h2>Your intake becomes the starting point for a more personal recommendation.</h2>
            <ul className="check-list">
              {trustPoints.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </Reveal>

          <Reveal delay={0.08}>
            <JoinForm conditions={conditions.map((condition) => condition.title)} />
          </Reveal>
        </div>
      </section>

      <section className="section faq-section">
        <div className="section-heading narrow">
          <p className="eyebrow">Before you submit</p>
          <h2>These answers usually make the booking step feel easier.</h2>
        </div>
        <div className="faq-list">
          {faqs.map((faq) => (
            <details className="faq-item" key={faq.question}>
              <summary>{faq.question}</summary>
              <p>{faq.answer}</p>
            </details>
          ))}
        </div>

        <div className="page-cta-strip">
          <div>
            <p className="eyebrow">Want to look around first?</p>
            <h3>See the program details or student stories before you book.</h3>
          </div>
          <div className="booking-actions">
            <Link className="button button-secondary" href="/programs">
              See programs
            </Link>
            <Link className="button button-secondary" href="/stories">
              See stories
            </Link>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}

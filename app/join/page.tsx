import Link from "next/link";
import { JoinForm } from "../components/join-form";
import { CalendlyButton, CalendlyInline } from "../components/calendly";
import { Reveal, StaggerItem, StaggerList } from "../components/reveal";
import { SiteShell } from "../components/site-shell";
import { booking, conditions, faqs, footerDetails, trustPoints } from "../content/site-data";

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
            <h2>Choose your preferred way to begin: submit the form or book instantly on Calendly.</h2>
            <ul className="check-list">
              {trustPoints.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
            <div className="booking-actions">
              <CalendlyButton className="button" label="Book Your Free Consultation" source="join_primary" />
              <a className="button button-secondary" href={`mailto:${booking.supportEmail}`}>
                Email support
              </a>
            </div>
          </Reveal>

          <Reveal delay={0.08}>
            <div className="join-booking-stack">
              <article className="join-form-card visual-card">
                <p className="eyebrow">Form submission</p>
                <h3>Share your details and let us place you in the right batch.</h3>
                <JoinForm conditions={conditions.map((condition) => condition.title)} />
              </article>

              <article className="join-calendly-card visual-card">
                <p className="eyebrow">Calendly instant booking</p>
                <h3>Prefer booking right away? Choose your slot below.</h3>
                <CalendlyInline title="Book your wellness consultation" source="join_inline_embed" />
              </article>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="section contact-section">
        <div className="section-heading narrow">
          <p className="eyebrow">Quick contact options</p>
          <h2>If you prefer, contact the team directly before booking.</h2>
        </div>
        <StaggerList className="contact-grid">
          <StaggerItem>
            <article className="store-card visual-card contact-card">
              <h3>Call us</h3>
              <p>Speak directly with the team for immediate batch guidance.</p>
              <a className="card-cta" href={`tel:${footerDetails.phone}`}>
                {footerDetails.phone}
              </a>
            </article>
          </StaggerItem>
          <StaggerItem>
            <article className="store-card visual-card contact-card">
              <h3>Email us</h3>
              <p>Share your condition and timing preference. We will suggest the best path.</p>
              <a className="card-cta" href={`mailto:${booking.supportEmail}`}>
                {booking.supportEmail}
              </a>
            </article>
          </StaggerItem>
          <StaggerItem>
            <article className="store-card visual-card contact-card">
              <h3>WhatsApp</h3>
              <p>Send your concern and we will guide you to the right next step.</p>
              <a className="card-cta" href="https://wa.me/916378003480">
                Start WhatsApp chat
              </a>
            </article>
          </StaggerItem>
        </StaggerList>
      </section>

      <section className="section faq-section page-end-section">
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
            <h3>See the program details or student stories before you book your call.</h3>
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

import { CalendlyButton } from "./calendly";
import { SiteShell } from "./site-shell";

type LegalHighlight = {
  title: string;
  body: string;
};

type LegalSection = {
  title: string;
  body: string[];
};

type LegalPageProps = {
  eyebrow: string;
  title: string;
  intro: string;
  highlights: LegalHighlight[];
  sections: LegalSection[];
};

export function LegalPage({ eyebrow, title, intro, highlights, sections }: LegalPageProps) {
  return (
    <SiteShell>
      <section className="section page-hero legal-hero">
        <div className="section-heading narrow">
          <p className="eyebrow">{eyebrow}</p>
          <h1 className="page-title">{title}</h1>
          <p className="lead">{intro}</p>
        </div>
      </section>

      <section className="section legal-highlights">
        <div className="legal-grid">
          {highlights.map((item) => (
            <article className="legal-card" key={item.title}>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section legal-content page-end-section">
        <div className="legal-stack">
          {sections.map((section) => (
            <article className="legal-card legal-detail-card" key={section.title}>
              <h2>{section.title}</h2>
              {section.body.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </article>
          ))}
        </div>

        <div className="page-cta-strip legal-cta">
          <div>
            <p className="eyebrow">Need help?</p>
            <h3>If you want clarification before joining, speak with the team directly.</h3>
          </div>
          <CalendlyButton className="button" label="Book Your Free Consultation" source="legal_bottom_cta" />
        </div>
      </section>
    </SiteShell>
  );
}

import Image from "next/image";
import { ProgramExplorer } from "../components/program-explorer";
import { CalendlyButton } from "../components/calendly";
import { Reveal } from "../components/reveal";
import { SiteShell } from "../components/site-shell";
import { conditions, dietFeatures, liveClassHighlights, programFilters, programs } from "../content/site-data";

export default function ProgramsPage() {
  return (
    <SiteShell>
      <section className="section page-hero">
        <div className="section-heading narrow">
          <p className="eyebrow">Programs and concerns</p>
          <h1 className="page-title">Find the program that feels closest to what your body needs right now.</h1>
          <p className="lead">
            Explore the condition-specific batches, women&apos;s wellness support, meditation paths, and food guidance
            layers that make the platform feel more personal.
          </p>
        </div>
      </section>

      <section className="section programs-page-section">
        <ProgramExplorer filters={programFilters} programs={programs} />
      </section>

      <section className="section alternating-section">
        <div className="split-layout reverse-on-desktop">
          <Reveal className="split-copy">
            <div className="section-heading narrow">
              <p className="eyebrow">Conditions we support</p>
              <h2>Choose a concern and start with the batch style that feels relevant from day one.</h2>
            </div>
            <div className="condition-grid">
              {conditions.map((condition) => (
                <article className="condition-card visual-card" key={condition.title}>
                  <h3>{condition.title}</h3>
                  <p>
                    <strong>Symptoms:</strong> {condition.symptoms}
                  </p>
                  <p>
                    <strong>How yoga helps:</strong> {condition.help}
                  </p>
                  <p>
                    <strong>Classes:</strong> {condition.classes}
                  </p>
                  <CalendlyButton className="card-cta" label="Book this program" source={`condition_${condition.title.toLowerCase()}`} />
                </article>
              ))}
            </div>
          </Reveal>

          <Reveal className="split-media" delay={0.08}>
            <div className="stacked-panels">
              <article className="support-panel media-panel">
                <div className="panel-image-shell">
                  <Image src="/media/program-home-yoga.jpg" alt="Woman practicing yoga at home" fill className="section-image" />
                </div>
                <div className="panel-copy">
                  <p className="eyebrow">Blood-group diet support</p>
                  <h3>Food guidance that feels simpler and easier to follow.</h3>
                  <ul className="check-list">
                    {dietFeatures.map((feature) => (
                      <li key={feature}>{feature}</li>
                    ))}
                  </ul>
                </div>
              </article>

              <article className="support-panel media-panel">
                <div className="panel-image-shell">
                  <Image src="/media/program-meditation.jpg" alt="Meditation scene in warm natural light" fill className="section-image" />
                </div>
                <div className="panel-copy">
                  <p className="eyebrow">Live class rhythm</p>
                  <h3>Structured Zoom support without making your routine feel heavy.</h3>
                  <ul className="check-list">
                    {liveClassHighlights.map((feature) => (
                      <li key={feature}>{feature}</li>
                    ))}
                  </ul>
                </div>
              </article>
            </div>
          </Reveal>
        </div>
      </section>
    </SiteShell>
  );
}

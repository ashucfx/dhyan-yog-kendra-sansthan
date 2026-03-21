import Link from "next/link";
import { Reveal, StaggerItem, StaggerList } from "../components/reveal";
import { ScheduleView } from "../components/schedule-view";
import { SiteShell } from "../components/site-shell";
import { benefits, schedules, zoomBatches } from "../content/site-data";

export default function BatchesPage() {
  return (
    <SiteShell>
      <section className="section page-hero">
        <div className="section-heading narrow">
          <p className="eyebrow">Batch formats</p>
          <h1 className="page-title">See how focused, merged, and common wellness batches are organized.</h1>
          <p className="lead">
            This page is here to make the decision feel clearer. Some people need one-condition support. Some need a
            more blended routine. The structure should reflect real life.
          </p>
        </div>
      </section>

      <section className="section">
        <StaggerList className="plan-grid preview-grid">
          {zoomBatches.map((batch) => (
            <StaggerItem key={batch.title}>
              <article className="plan-card batch-card visual-card">
                <p className="plan-name">{batch.mood}</p>
                <h3 className="batch-intro">{batch.title}</h3>
                <p className="program-short">{batch.intro}</p>
                <p>{batch.description}</p>
                <ul className="check-list">
                  {batch.includes.map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>
              </article>
            </StaggerItem>
          ))}
        </StaggerList>
      </section>

      <section className="section">
        <Reveal className="schedule-strip">
          <div className="section-heading narrow">
            <p className="eyebrow">Schedule preview</p>
            <h2>Preview how the day can feel before you even join.</h2>
          </div>
          <p className="schedule-intro">
            Tap between batch moods to see sample timings and get a quick feel for the rhythm before booking.
          </p>
          <ScheduleView schedules={schedules} />
        </Reveal>
      </section>

      <section className="section benefits page-end-section">
        <div className="section-heading narrow">
          <p className="eyebrow">What people usually want most</p>
          <h2>Less confusion, more fit, and a much easier routine to stay with.</h2>
        </div>
        <StaggerList className="benefit-grid">
          {benefits.map((benefit) => (
            <StaggerItem key={benefit.title}>
              <div className="benefit-card">
                <h3>{benefit.title}</h3>
                <p>{benefit.body}</p>
              </div>
            </StaggerItem>
          ))}
        </StaggerList>

        <div className="page-cta-strip">
          <div>
            <p className="eyebrow">Need help choosing?</p>
            <h3>Book a quick call and let the team recommend the best batch.</h3>
          </div>
          <Link className="button" href="/join">
            Book My Batch Call
          </Link>
        </div>
      </section>
    </SiteShell>
  );
}

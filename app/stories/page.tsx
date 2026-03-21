import Image from "next/image";
import Link from "next/link";
import { Reveal, StaggerItem, StaggerList } from "../components/reveal";
import { SiteShell } from "../components/site-shell";
import { instructors, stories, trustPoints } from "../content/site-data";

export default function StoriesPage() {
  return (
    <SiteShell>
      <section className="section page-hero">
        <div className="section-heading narrow">
          <p className="eyebrow">Trust and stories</p>
          <h1 className="page-title">People trust people, so this page shows the faces, guidance style, and lived results.</h1>
          <p className="lead">
            If someone is about to invest in a premium wellness batch, they should be able to feel the warmth and the
            credibility behind it.
          </p>
        </div>
      </section>

      <section className="section trust-section">
        <StaggerList className="instructor-grid">
          {instructors.map((instructor) => (
            <StaggerItem key={instructor.name}>
              <article className="instructor-card visual-card">
                <div className="instructor-photo-shell">
                  <Image src={instructor.image} alt={instructor.name} fill className="section-image" />
                </div>
                <div className="instructor-copy">
                  <h3>{instructor.name}</h3>
                  <p>{instructor.detail}</p>
                </div>
              </article>
            </StaggerItem>
          ))}
        </StaggerList>

        <Reveal className="trust-panel expanded-trust-panel" delay={0.1}>
          <p>
            The teaching style is designed to feel gentle, grounded, and supportive. People should not feel like they
            are entering a cold system. They should feel like someone will guide them well.
          </p>
          <ul className="check-list">
            {trustPoints.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        </Reveal>
      </section>

      <section className="section stories page-end-section">
        <div className="section-heading">
          <p className="eyebrow">Student voices</p>
          <h2>Real names and real stories make the whole decision feel more grounded.</h2>
        </div>
        <StaggerList className="story-grid visual-story-grid">
          {stories.map((story) => (
            <StaggerItem key={story.name}>
              <article className="story-card">
                <div className="story-avatar-shell">
                  <Image src={story.image} alt={story.name} fill className="story-avatar" />
                </div>
                <div className="story-copy">
                  <span className="quote-mark">&ldquo;</span>
                  <p>{story.quote}</p>
                  <strong>{story.name}</strong>
                  <small>{story.role}</small>
                </div>
              </article>
            </StaggerItem>
          ))}
        </StaggerList>

        <div className="page-cta-strip">
          <div>
            <p className="eyebrow">Ready to take the next step?</p>
            <h3>Move from reading stories to booking a call with the team.</h3>
          </div>
          <Link className="button" href="/join">
            Book My Wellness Call
          </Link>
        </div>
      </section>
    </SiteShell>
  );
}

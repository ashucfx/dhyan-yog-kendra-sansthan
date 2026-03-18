import Image from "next/image";
import Link from "next/link";
import { BrandSeal } from "./components/brand-seal";
import { Reveal, StaggerItem, StaggerList } from "./components/reveal";
import { SiteShell } from "./components/site-shell";
import {
  aboutStory,
  brand,
  heroHighlights,
  heroProblems,
  previewPrograms,
  proofItems,
  stats,
  stories,
  therapies,
  zoomBatches
} from "./content/site-data";

export default function Home() {
  return (
    <SiteShell>
      <section className="hero visual-hero" id="top">
        <div className="hero-backdrop">
          <Image src="/media/hero-yoga.jpg" alt="Woman practicing yoga at home in soft sunlight" fill priority className="hero-background-image" />
          <div className="hero-background-overlay" />
        </div>
        <div className="hero-orb hero-orb-one" />
        <div className="hero-orb hero-orb-two" />
        <div className="hero-orb hero-orb-three" />

        <div className="section hero-shell">
          <Reveal className="hero-story">
            <div className="hero-pills">
              {heroHighlights.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>

            <div className="hero-brand-row">
              <BrandSeal className="hero-seal" />
              <div className="hero-brand-copy">
                <p className="hero-kicker">{brand.organizationName}</p>
                <p className="hero-kicker-sub">{brand.hindiName}</p>
              </div>
            </div>

            <p className="eyebrow hero-eyebrow">High-touch wellness support on live Zoom</p>
            <h1>Feel guided into the right batch instead of guessing what your body needs.</h1>
            <p className="lead hero-lead">
              This is a calmer way to begin. You share your concern, your blood group, and your routine. Then the
              team helps place you into a focused, merged, or common wellness batch that actually suits real life.
            </p>

            <div className="hero-actions">
              <Link className="button" href="/join">
                Book My Wellness Call
              </Link>
              <Link className="button button-ghost" href="/programs">
                Explore Programs
              </Link>
            </div>

            <div className="hero-proof-strip">
              {proofItems.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
          </Reveal>

          <Reveal className="hero-side-panel" delay={0.1}>
            <div className="hero-side-card glass-card">
              <p className="card-topline">This is for you if</p>
              <ul className="check-list">
                {heroProblems.map((problem) => (
                  <li key={problem}>{problem}</li>
                ))}
              </ul>
              <div className="hero-note">
                <strong>Best next step:</strong> book a quick wellness call and let the team suggest the right batch
                before you join.
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="section visual-proof">
        <StaggerList className="stats-grid">
          {stats.map((stat) => (
            <StaggerItem key={stat.label}>
              <article className="stat-card">
                <p className="stat-value">{stat.value}</p>
                <h2 className="stat-label">{stat.label}</h2>
                <p>{stat.detail}</p>
              </article>
            </StaggerItem>
          ))}
        </StaggerList>
      </section>

      <section className="section alternating-section" id="about">
        <div className="split-layout">
          <Reveal className="split-media">
            <div className="image-panel">
              <Image src={aboutStory.image} alt="Calm lifestyle wellness portrait" fill className="section-image" />
            </div>
          </Reveal>

          <Reveal className="split-copy" delay={0.08}>
            <p className="eyebrow">Why this platform feels different</p>
            <h2>A clear path into the right class, the right rhythm, and the right support.</h2>
            {aboutStory.body.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
            <div className="therapy-grid compact-therapy-grid">
              {therapies.map((therapy) => (
                <article className="therapy-card" key={therapy.title}>
                  <h3>{therapy.title}</h3>
                  <p>{therapy.body}</p>
                </article>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <section className="section home-preview-section">
        <div className="section-heading">
          <p className="eyebrow">Choose your starting point</p>
          <h2>Begin with the program that sounds closest to your body, your phase of life, or your current struggle.</h2>
        </div>

        <StaggerList className="visual-program-grid preview-grid">
          {previewPrograms.map((program) => (
            <StaggerItem key={program.title}>
              <article className="program-card visual-card">
                <div className="card-image-shell">
                  <Image src={program.image} alt={program.title} fill className="card-image" />
                  <div className="card-image-overlay" />
                  <span className="program-badge">{program.concern}</span>
                </div>
                <div className="card-copy">
                  <h3>{program.title}</h3>
                  <p className="program-short">{program.shortDescription}</p>
                  <p>{program.description}</p>
                  <Link className="card-cta" href="/programs">
                    See program details
                  </Link>
                </div>
              </article>
            </StaggerItem>
          ))}
        </StaggerList>

        <div className="page-cta-strip">
          <div>
            <p className="eyebrow">Want to compare properly?</p>
            <h3>See all programs, conditions, and diet guidance on one dedicated page.</h3>
          </div>
          <Link className="button" href="/programs">
            Open Programs Page
          </Link>
        </div>
      </section>

      <section className="section home-preview-section">
        <div className="section-heading narrow">
          <p className="eyebrow">Batch flow</p>
          <h2>You do not have to fit perfectly into one label. There is a batch structure for real life.</h2>
        </div>

        <StaggerList className="plan-grid preview-grid">
          {zoomBatches.map((batch) => (
            <StaggerItem key={batch.title}>
              <article className="plan-card batch-card visual-card">
                <p className="plan-name">{batch.mood}</p>
                <h3 className="batch-intro">{batch.title}</h3>
                <p className="program-short">{batch.intro}</p>
                <p>{batch.description}</p>
                <Link className="button button-secondary" href="/batches">
                  Explore batch types
                </Link>
              </article>
            </StaggerItem>
          ))}
        </StaggerList>
      </section>

      <section className="section stories" id="stories">
        <div className="section-heading">
          <p className="eyebrow">Real voices</p>
          <h2>When people can see real results and real faces, the decision to join feels much easier.</h2>
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
      </section>

      <section className="section final-booking-panel">
        <div className="join-panel booking-panel">
          <div>
            <p className="eyebrow">Ready to speak with the team?</p>
            <h2>Book your batch call and let the right path feel obvious.</h2>
            <p>
              This is the easiest way to begin if you want premium support. Share your concern, ask your questions,
              and let the team guide you into the batch that makes the most sense.
            </p>
          </div>
          <div className="booking-actions">
            <Link className="button" href="/join">
              Go to Booking Form
            </Link>
            <Link className="button button-secondary" href="/stories">
              See Trust and Stories
            </Link>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}

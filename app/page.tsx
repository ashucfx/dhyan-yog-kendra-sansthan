import { BrandSeal } from "./components/brand-seal";
import {
  benefits,
  conditions,
  contactOptions,
  dietFeatures,
  faqs,
  instructors,
  liveClassHighlights,
  plans,
  problems,
  programs,
  proofItems,
  stats,
  steps,
  storeProducts,
  stories,
  therapies,
  trustPoints
} from "./content/site-data";

export default function Home() {
  return (
    <main>
      <header className="site-header">
        <a className="brand brand-lockup" href="#top">
          <BrandSeal className="nav-seal" />
          <span>
            <strong>Dhyan Yog Kendra Sansthan</strong>
            <small>Yoga, meditation and natural wellness</small>
          </span>
        </a>
        <nav className="main-nav" aria-label="Primary">
          <a href="#about">About</a>
          <a href="#programs">Programs</a>
          <a href="#conditions">Conditions</a>
          <a href="#plans">Plans</a>
          <a href="#store">Store</a>
          <a href="#join">Join</a>
        </nav>
        <a className="button button-small" href="#join">
          Start Your Wellness Journey
        </a>
      </header>

      <section className="hero section" id="top">
        <div className="hero-copy">
          <p className="eyebrow">Restore balance in your body and mind</p>
          <div className="hero-brand-row">
            <BrandSeal className="hero-seal" />
            <div className="hero-brand-copy">
              <p className="hero-kicker">Yoga, Meditation and Natural Wellness</p>
              <p className="hero-kicker-sub">
                Live Zoom classes, supportive batches, and a more personal path to feeling better.
              </p>
            </div>
          </div>
          <h1>Join personalized yoga and meditation sessions designed around your body, your condition, and your lifestyle.</h1>
          <p className="lead">
            Whether you are dealing with stress, hormone imbalance, pregnancy wellness, low energy, or a body that
            just feels out of rhythm, this platform helps you start with calm guidance and a plan that actually feels
            doable from home.
          </p>
          <div className="hero-actions">
            <a className="button" href="#join">
              Start Your Wellness Journey
            </a>
            <a className="button button-secondary" href="#programs">
              Explore Programs
            </a>
          </div>
          <p className="microcopy">Live on Zoom. Condition-based batches. Gentle support you can stay consistent with.</p>
        </div>

        <aside className="hero-card" aria-label="Member benefits">
          <div className="card-topline">This is for you if</div>
          <ul className="check-list">
            {problems.map((problem) => (
              <li key={problem}>{problem}</li>
            ))}
          </ul>
          <div className="hero-note">
            <strong>Imagine this:</strong> you start feeling calmer, lighter, and more in control because your wellness
            routine finally fits your life.
          </div>
        </aside>
      </section>

      <section className="section proof-strip" aria-label="Quick trust points">
        <div className="proof-row">
          {proofItems.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
      </section>

      <section className="section about-section" id="about">
        <div className="section-heading narrow">
          <p className="eyebrow">About the platform</p>
          <h2>A calmer, more complete wellness platform built around classes, guidance, and everyday support.</h2>
        </div>
        <div className="about-grid">
          <div className="about-copy">
            <p>
              This is more than a yoga website. It is a guided wellness platform where students join live Zoom classes,
              follow condition-based programs, receive practical lifestyle support, and move at a pace that feels
              gentle and realistic.
            </p>
            <p>
              The goal is simple: help people feel better in their body, quieter in their mind, and more supported in
              daily life.
            </p>
          </div>
          <div className="therapy-grid">
            {therapies.map((therapy) => (
              <article className="therapy-card" key={therapy.title}>
                <h3>{therapy.title}</h3>
                <p>{therapy.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section stats-strip" aria-label="Quick highlights">
        <div className="stats-grid">
          {stats.map((stat) => (
            <article className="stat-card" key={stat.label}>
              <p className="stat-value">{stat.value}</p>
              <h2 className="stat-label">{stat.label}</h2>
              <p>{stat.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section steps-section">
        <div className="section-heading narrow">
          <p className="eyebrow">How classes work</p>
          <h2>Choose your program, tell us about your condition, and get placed into the right Zoom batch.</h2>
        </div>
        <div className="step-grid">
          {steps.map((step) => (
            <article className="step-card" key={step.number}>
              <p className="step-number">{step.number}</p>
              <h3>{step.title}</h3>
              <p>{step.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section" id="programs">
        <div className="section-heading">
          <p className="eyebrow">Courses and programs</p>
          <h2>Clear programs people can join right away, each built around a real wellness need.</h2>
        </div>
        <div className="program-grid">
          {programs.map((program) => (
            <article className="program-card" key={program.title}>
              <p className="program-accent">{program.accent}</p>
              <h3>{program.title}</h3>
              <p className="program-short">{program.shortDescription}</p>
              <p>{program.description}</p>
              <p className="program-for">
                <strong>Who it is for:</strong> {program.for}
              </p>
              <div className="mini-benefits">
                {program.benefits.map((benefit) => (
                  <span key={benefit}>{benefit}</span>
                ))}
              </div>
              <a href="#join">{program.cta}</a>
            </article>
          ))}
        </div>
      </section>

      <section className="section conditions-section" id="conditions">
        <div className="section-heading">
          <p className="eyebrow">Health conditions</p>
          <h2>Select the condition you want support with and start from there.</h2>
        </div>
        <div className="condition-grid">
          {conditions.map((condition) => (
            <article className="condition-card" key={condition.title}>
              <h3>{condition.title}</h3>
              <p>
                <strong>Symptoms:</strong> {condition.symptoms}
              </p>
              <p>
                <strong>How yoga helps:</strong> {condition.help}
              </p>
              <p>
                <strong>Available classes:</strong> {condition.classes}
              </p>
              <a href="#join">Explore {condition.title}</a>
            </article>
          ))}
        </div>
      </section>

      <section className="section support-grid-section">
        <div className="support-grid">
          <article className="support-panel">
            <p className="eyebrow">Blood-group diet plans</p>
            <h2>Your food guidance should support your body in a simple, practical way.</h2>
            <p>
              Students also receive food support based on their blood group and health condition. The goal is not to
              make meals complicated. It is to help daily choices feel clearer and more supportive.
            </p>
            <ul className="check-list">
              {dietFeatures.map((feature) => (
                <li key={feature}>{feature}</li>
              ))}
            </ul>
          </article>

          <article className="support-panel">
            <p className="eyebrow">Live Zoom classes</p>
            <h2>Practice from home while still feeling guided, structured, and supported.</h2>
            <p>
              All classes are conducted live through Zoom. Students are placed into condition-based batches so the
              classes feel relevant and more focused from the beginning.
            </p>
            <ul className="check-list">
              {liveClassHighlights.map((highlight) => (
                <li key={highlight}>{highlight}</li>
              ))}
            </ul>
          </article>
        </div>
      </section>

      <section className="section benefits" id="benefits">
        <div className="section-heading">
          <p className="eyebrow">Why it works</p>
          <h2>Small, steady steps can change how you feel every day.</h2>
        </div>
        <div className="benefit-grid">
          {benefits.map((benefit) => (
            <div key={benefit.title}>
              <h3>{benefit.title}</h3>
              <p>{benefit.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section plans-section" id="plans">
        <div className="section-heading">
          <p className="eyebrow">Choose your pace</p>
          <h2>Pick the level of support that feels right for you.</h2>
        </div>
        <div className="plan-grid">
          {plans.map((plan) => (
            <article className={`plan-card${plan.featured ? " featured-plan" : ""}`} key={plan.name}>
              <p className="plan-name">{plan.name}</p>
              <h3 className="plan-price">{plan.price}</h3>
              <p>{plan.intro}</p>
              <ul className="check-list">
                {plan.features.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
              <a className={`button${plan.featured ? "" : " button-secondary"}`} href="#join">
                {plan.cta}
              </a>
            </article>
          ))}
        </div>
      </section>

      <section className="section store-section" id="store">
        <div className="section-heading">
          <p className="eyebrow">Wellness store</p>
          <h2>Natural products that feel like an extension of the wellness journey, not a random shop.</h2>
        </div>
        <div className="store-grid">
          {storeProducts.map((product) => (
            <article className="store-card" key={product.title}>
              <h3>{product.title}</h3>
              <p>{product.description}</p>
              <a href="#join">Explore wellness products</a>
            </article>
          ))}
        </div>
      </section>

      <section className="section trust-section" id="trust">
        <div className="section-heading">
          <p className="eyebrow">Instructor and trust</p>
          <h2>Trust matters when someone is looking for health support. This platform is designed to feel reassuring.</h2>
        </div>
        <div className="about-grid">
          <div className="therapy-grid">
            {instructors.map((item) => (
              <article className="therapy-card" key={item.name}>
                <h3>{item.name}</h3>
                <p>{item.detail}</p>
              </article>
            ))}
          </div>
          <div className="trust-panel">
            <p>
              The teaching approach stays simple, caring, and condition-aware so people do not feel lost after joining.
              Every part of the journey is designed to answer the same question: does this feel trustworthy enough to
              begin with confidence?
            </p>
            <ul className="check-list">
              {trustPoints.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="section stories" id="stories">
        <div className="section-heading">
          <p className="eyebrow">What people love</p>
          <h2>Transformation stories help people feel the platform is real, supportive, and worth joining.</h2>
        </div>
        <div className="story-grid">
          {stories.map((story) => (
            <blockquote key={story}>{story}</blockquote>
          ))}
        </div>
      </section>

      <section className="section faq-section">
        <div className="section-heading narrow">
          <p className="eyebrow">Questions you may have</p>
          <h2>You can begin gently, even if your routine has not worked before.</h2>
        </div>
        <div className="faq-list">
          {faqs.map((faq) => (
            <details className="faq-item" key={faq.question}>
              <summary>{faq.question}</summary>
              <p>{faq.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="section join" id="join">
        <div className="join-panel">
          <div>
            <p className="eyebrow">Start today</p>
            <h2>Your body already has the power to heal. Sometimes it just needs the right guidance.</h2>
            <p>
              Join a condition-based yoga and wellness program, get placed into the right Zoom batch, and begin a
              routine that feels calmer, clearer, and much easier to follow.
            </p>
            <div className="join-points">
              <span>Live on Zoom</span>
              <span>Condition-based batches</span>
              <span>Diet and lifestyle support</span>
            </div>
          </div>

          <form className="signup-form">
            <label htmlFor="name">
              Your name
              <input id="name" type="text" placeholder="Enter your name" />
            </label>
            <label htmlFor="email">
              Email address
              <input id="email" type="email" placeholder="you@example.com" />
            </label>
            <label htmlFor="goal">
              Your main goal
              <select id="goal" defaultValue="Balance hormones">
                <option>Balance hormones</option>
                <option>Reduce stress</option>
                <option>Sleep better</option>
                <option>Build strength</option>
                <option>Improve focus</option>
              </select>
            </label>
            <label htmlFor="message">
              Tell us your condition
              <input id="message" type="text" placeholder="PCOS, thyroid, pregnancy wellness, stress..." />
            </label>
            <button className="button" type="button">
              Start My Wellness Journey Today
            </button>
            <p className="microcopy">We will help place you into the right batch and guide you on the next step.</p>
          </form>
        </div>
      </section>

      <section className="section contact-section">
        <div className="section-heading narrow">
          <p className="eyebrow">Need help before joining?</p>
          <h2>You do not have to figure everything out on your own before you start.</h2>
        </div>
        <div className="contact-grid">
          {contactOptions.map((option) => (
            <article className="store-card" key={option.title}>
              <h3>{option.title}</h3>
              <p>{option.detail}</p>
              <a href="#join">Get guidance</a>
            </article>
          ))}
        </div>
      </section>

      <div className="mobile-cta">
        <a className="button" href="#join">
          Join a Zoom Batch
        </a>
      </div>
    </main>
  );
}

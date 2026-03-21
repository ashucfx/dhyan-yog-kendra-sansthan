import Link from "next/link";
import Image from "next/image";
import { StaggerItem, StaggerList } from "../components/reveal";
import { SiteShell } from "../components/site-shell";
import { contactOptions, storeProducts } from "../content/site-data";

export default function StorePage() {
  return (
    <SiteShell>
      <section className="section page-hero">
        <div className="section-heading narrow">
          <p className="eyebrow">Wellness store</p>
          <h1 className="page-title">Products should feel like part of the care experience, not a random extra.</h1>
          <p className="lead">
            The store supports the classes. It should feel like a thoughtful extension of the platform, with practical
            items people can actually use around their routine.
          </p>
        </div>
      </section>

      <section className="section store-section">
        <StaggerList className="store-grid">
          {storeProducts.map((product) => (
            <StaggerItem key={product.title}>
              <article className="store-card visual-card product-card">
                <div className="product-image-shell">
                  <Image src={product.image} alt={product.title} fill className="product-image" />
                </div>
                <h3>{product.title}</h3>
                <p>{product.description}</p>
                <Link className="card-cta" href="/join">
                  Shop now
                </Link>
              </article>
            </StaggerItem>
          ))}
        </StaggerList>
      </section>

      <section className="section contact-section page-end-section">
        <div className="section-heading narrow">
          <p className="eyebrow">Need product guidance?</p>
          <h2>Ask before you buy so the store still feels personal and supportive.</h2>
        </div>
        <StaggerList className="contact-grid">
          {contactOptions.map((option) => (
            <StaggerItem key={option.title}>
              <article className="store-card visual-card contact-card">
                <h3>{option.title}</h3>
                <p>{option.detail}</p>
                <Link className="card-cta" href="/join">
                  Talk to the team
                </Link>
              </article>
            </StaggerItem>
          ))}
        </StaggerList>
      </section>
    </SiteShell>
  );
}

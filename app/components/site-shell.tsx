import Link from "next/link";
import { ReactNode } from "react";
import { BrandSeal } from "./brand-seal";
import { SocialIcon } from "./social-icon";
import { brand, footerDetails, footerLegal, footerPrograms, footerSocials } from "../content/site-data";

type SiteShellProps = {
  children: ReactNode;
};

const primaryNav = [
  { label: "About", href: "/" },
  { label: "Programs", href: "/programs" },
  { label: "Batches", href: "/batches" },
  { label: "Stories", href: "/stories" },
  { label: "Store", href: "/store" },
  { label: "Join", href: "/join" }
];

export function SiteShell({ children }: SiteShellProps) {
  return (
    <main>
      <header className="site-header">
        <Link className="brand brand-lockup" href="/">
          <BrandSeal className="nav-seal" />
          <span>
            <strong>{brand.organizationName}</strong>
            <small>{brand.hindiName}</small>
          </span>
        </Link>

        <nav className="main-nav" aria-label="Primary">
          {primaryNav.map((item) => (
            <Link key={item.label} href={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>

        <Link className="button button-small" href="/join">
          Book a Wellness Call
        </Link>
      </header>

      {children}

      <div className="mobile-cta">
        <Link className="button" href="/join">
          Book My Batch Call
        </Link>
      </div>

      <footer className="site-footer footer-shell">
        <div className="footer-main">
          <div className="footer-brand">
            <div className="brand brand-lockup">
              <BrandSeal className="footer-seal" />
              <span>
                <strong>{footerDetails.organizationName}</strong>
                <small>{footerDetails.hindiName}</small>
              </span>
            </div>
            <p className="footer-entity">{footerDetails.brandLine}</p>
            <div className="entity-chip">Registered Entity: {footerDetails.entityName}</div>
            <div className="footer-contact-list">
              <a className="footer-contact-item" href={`tel:${footerDetails.phone}`}>
                <span className="footer-item-label">Phone</span>
                <span className="footer-item-value">{footerDetails.phone}</span>
              </a>
              <a className="footer-contact-item" href={`mailto:${footerDetails.email}`}>
                <span className="footer-item-label">Email</span>
                <span className="footer-item-value">{footerDetails.email}</span>
              </a>
              <div className="footer-contact-item">
                <span className="footer-item-label">Address</span>
                <span className="footer-item-value footer-address">{footerDetails.address}</span>
              </div>
            </div>
          </div>

          <div className="footer-utility">
            <div className="footer-map">
              <p className="footer-title">Visit the center</p>
              <div className="map-card" aria-label="Organization map placeholder">
                <div className="map-grid" />
                <div className="map-pin">
                  <span className="map-pin-dot" />
                </div>
                <div className="map-label">
                  <strong>{footerDetails.organizationName}</strong>
                  <span>{footerDetails.address}</span>
                </div>
              </div>
            </div>

            <div className="footer-side">
              <div className="footer-column">
                <p className="footer-title">Pages</p>
                {primaryNav.slice(1).map((item) => (
                  <Link key={item.label} href={item.href}>
                    {item.label}
                  </Link>
                ))}
              </div>

              <div className="footer-column">
                <p className="footer-title">Programs</p>
                {footerPrograms.map((item) => (
                  <Link key={item.label} href={item.href}>
                    {item.label}
                  </Link>
                ))}
              </div>

              <div className="footer-column">
                <p className="footer-title">Legal</p>
                {footerLegal.map((item) => (
                  <a key={item.label} href={item.href}>
                    {item.label}
                  </a>
                ))}
                <Link href="/admin/submissions">Admin login</Link>
              </div>

              <div className="footer-column">
                <p className="footer-title">Social</p>
                <div className="social-grid">
                  {footerSocials.map((item) => (
                    <a key={item.label} href={item.href} className="social-link">
                      <span className="social-badge">
                        <SocialIcon className="social-icon" label={item.label} />
                      </span>
                      <span>{item.label}</span>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>(c) 2026 {footerDetails.organizationName}. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}

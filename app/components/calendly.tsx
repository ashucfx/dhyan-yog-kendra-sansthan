"use client";

import Script from "next/script";
import { useMemo } from "react";

const calendlyBaseUrl = "https://calendly.com/dhyanvedaglobal";

declare global {
  interface Window {
    Calendly?: {
      initPopupWidget: (options: { url: string }) => void;
    };
  }
}

function buildCalendlyUrl(source?: string) {
  const params = new URLSearchParams({
    hide_gdpr_banner: "1",
    primary_color: "8f251b"
  });

  if (source) {
    params.set("utm_source", source);
  }

  return `${calendlyBaseUrl}?${params.toString()}`;
}

type CalendlyButtonProps = {
  className: string;
  label: string;
  source?: string;
};

export function CalendlyButton({ className, label, source }: CalendlyButtonProps) {
  const calendlyUrl = useMemo(() => buildCalendlyUrl(source), [source]);

  function openCalendly() {
    if (typeof window === "undefined") {
      return;
    }

    if (window.Calendly?.initPopupWidget) {
      window.Calendly.initPopupWidget({ url: calendlyUrl });
      return;
    }

    window.open(calendlyUrl, "_blank", "noopener,noreferrer");
  }

  return (
    <button type="button" className={className} onClick={openCalendly}>
      {label}
    </button>
  );
}

export function CalendlyInline({ title, source }: { title: string; source?: string }) {
  const calendlyUrl = useMemo(() => buildCalendlyUrl(source), [source]);

  return (
    <div className="calendly-inline-shell">
      <iframe
        title={title}
        src={calendlyUrl}
        className="calendly-inline-frame"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
    </div>
  );
}

export function CalendlyAssets() {
  return (
    <Script
      src="https://assets.calendly.com/assets/external/widget.js"
      strategy="afterInteractive"
    />
  );
}

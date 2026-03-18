"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";

type Program = {
  title: string;
  concern: string;
  image: string;
  shortDescription: string;
  description: string;
  for: string;
  benefits: string[];
  cta: string;
};

type ProgramExplorerProps = {
  filters: string[];
  programs: Program[];
};

export function ProgramExplorer({ filters, programs }: ProgramExplorerProps) {
  const [activeFilter, setActiveFilter] = useState("All");

  const visiblePrograms = useMemo(() => {
    if (activeFilter === "All") {
      return programs;
    }

    return programs.filter((program) => program.concern === activeFilter);
  }, [activeFilter, programs]);

  return (
    <div className="program-explorer">
      <div className="filter-row" role="tablist" aria-label="Program categories">
        {filters.map((filter) => (
          <button
            key={filter}
            type="button"
            className={`filter-chip${activeFilter === filter ? " active-filter" : ""}`}
            onClick={() => setActiveFilter(filter)}
          >
            {filter}
          </button>
        ))}
      </div>

      <div className="program-grid visual-program-grid">
        {visiblePrograms.map((program) => (
          <motion.article
            layout
            key={program.title}
            className="program-card visual-card"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="card-image-shell">
              <Image src={program.image} alt={program.title} fill className="card-image" />
              <div className="card-image-overlay" />
              <span className="program-badge">{program.concern}</span>
            </div>
            <div className="card-copy">
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
              <a className="card-cta" href="/join">
                {program.cta}
              </a>
            </div>
          </motion.article>
        ))}
      </div>
    </div>
  );
}

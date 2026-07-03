import { corePages, runnerTypes } from "@/lib/product-contract";

const readinessItems = [
  "Next.js app router foundation",
  "Strict TypeScript configuration",
  "Lint, typecheck, unit test, E2E smoke, and build scripts",
  "Radar product contract captured in typed constants",
] as const;

export default function Home() {
  return (
    <main className="site-shell">
      <section className="hero-section" aria-labelledby="page-title">
        <div className="hero-copy">
          <h1 id="page-title">
            Radar continuously tests that your customer-facing business still works.
          </h1>
          <p>
            Catch broken customer-facing promises before your customers do. This baseline app is ready for
            assertion-led product work.
          </p>
        </div>
      </section>

      <section className="content-grid" aria-label="Radar foundation status">
        <article className="status-panel">
          <h2>Baseline app ready</h2>
          <p>
            RAD-001 establishes the local development workflow without adding product surfaces ahead of the
            route and shell tickets.
          </p>
          <ul>
            {readinessItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>

        <article className="status-panel">
          <h2>Locked product model</h2>
          <p>
            Radar starts from business assertions, connects only the required evidence, runs the right
            verifier, and creates business-readable findings.
          </p>
          <div className="page-list" aria-label="Locked core pages">
            {corePages.map((page) => (
              <div key={page.name} className="page-list-item">
                <strong>{page.name}</strong>
                <span>{page.purpose}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="status-panel status-panel-wide">
          <h2>Runner boundary</h2>
          <p>
            The foundation preserves Radar&apos;s three approved runner types and avoids generic AI eval,
            workflow-builder, trace-explorer, and marketplace scope.
          </p>
          <div className="runner-row" aria-label="Approved runner types">
            {runnerTypes.map((runner) => (
              <span key={runner}>{runner}</span>
            ))}
          </div>
        </article>
      </section>
    </main>
  );
}

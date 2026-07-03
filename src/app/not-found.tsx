import Link from "next/link";

export default function NotFound() {
  return (
    <main className="site-shell">
      <section className="status-panel">
        <h1>Page not found</h1>
        <p>Radar has not introduced that route in the active build phase.</p>
        <Link className="text-button" href="/">
          Return to Radar
        </Link>
      </section>
    </main>
  );
}

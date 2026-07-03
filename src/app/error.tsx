"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="site-shell">
      <section className="status-panel" role="alert">
        <h1>Radar could not load</h1>
        <p>
          The baseline app hit an unexpected runtime error. Try again, and check the local logs if the
          issue repeats.
        </p>
        <button className="text-button" type="button" onClick={reset}>
          Try again
        </button>
        {error.digest ? <p className="error-reference">Reference: {error.digest}</p> : null}
      </section>
    </main>
  );
}

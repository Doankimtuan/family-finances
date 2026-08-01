"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  console.error(error);

  return (
    <html lang="en">
      <body style={{ minHeight: "100vh", background: "hsl(350 30% 98%)", padding: "2.5rem 1rem" }}>
        <section style={{ maxWidth: "36rem", margin: "0 auto", background: "#fff", border: "1px solid hsl(345 82% 52% / 0.3)", borderRadius: "1rem", padding: "1.5rem", boxShadow: "0 1px 3px 0 rgb(0 0 0 / .1)" }}>
          <p style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.14em", color: "hsl(345 82% 52%)" }}>Critical error</p>
          <h1 style={{ marginTop: "0.25rem", fontSize: "1.25rem", fontWeight: 600, color: "hsl(345 10% 10%)" }}>The app hit an unexpected failure.</h1>
          <p style={{ marginTop: "0.5rem", fontSize: "0.875rem", color: "hsl(345 10% 42%)" }}>Try again. If this persists, restart the app session.</p>
          <button
            type="button"
            onClick={reset}
            style={{ marginTop: "1rem", borderRadius: "0.75rem", background: "hsl(345 82% 52%)", padding: "0.5rem 1rem", fontSize: "0.875rem", fontWeight: 600, color: "#fff", border: "none", cursor: "pointer" }}
          >
            Retry
          </button>
        </section>
      </body>
    </html>
  );
}

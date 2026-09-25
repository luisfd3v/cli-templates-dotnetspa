export default function AboutPage() {
  return (
    <section className="card">
      <h1>About</h1>
      <p className="muted">
        This SPA was scaffolded by <code>create-dotnetspa</code> and talks to the ASP.NET Core
        backend through the <code>/api</code> proxy.
      </p>

      <dl className="facts">
        <dt>Framework</dt>
        <dd>React + Vite + TypeScript</dd>
        <dt>Backend</dt>
        <dd>ASP.NET Core (.NET 10)</dd>
      </dl>
    </section>
  );
}

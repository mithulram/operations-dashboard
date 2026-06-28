const coverageItems = [
  {
    title: 'API availability',
    detail: 'Scheduled HTTP checks with response-time history and consecutive failure tracking.',
  },
  {
    title: 'Public status page',
    detail: 'Share component health at /status/{slug} — readable without admin access.',
  },
  {
    title: 'Incident timeline',
    detail: 'Automatic outage incidents with acknowledge, resolve, and update notes.',
  },
  {
    title: 'Email alerts',
    detail: 'Optional down and recovery emails configured through backend SMTP env.',
  },
];

export function OperationalCoverage() {
  return (
    <section className="operational-coverage" aria-label="Operational coverage">
      <h3>What this product protects</h3>
      <ul className="operational-coverage__list">
        {coverageItems.map((item) => (
          <li key={item.title}>
            <strong>{item.title}</strong>
            <span>{item.detail}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

import type { Summary } from '../types';
import { hasFleetSummary } from '../types';
import { formatMilliseconds, formatPercent } from '../utils';

interface FleetSummaryCardsProps {
  summary: Summary;
}

export function FleetSummaryCards({ summary }: FleetSummaryCardsProps) {
  if (!hasFleetSummary(summary)) {
    return null;
  }

  const cards = [
    {
      key: 'total',
      label: 'Monitors',
      value: String(summary.monitors_total ?? 0),
      hint: 'Persisted URL monitors',
    },
    {
      key: 'up',
      label: 'Up',
      value: String(summary.monitors_up ?? 0),
      hint: 'Currently healthy monitors',
    },
    {
      key: 'down',
      label: 'Down',
      value: String(summary.monitors_down ?? 0),
      hint: 'Monitors failing checks',
    },
    {
      key: 'paused',
      label: 'Paused',
      value: String(summary.monitors_paused ?? 0),
      hint: 'Checks temporarily disabled',
    },
    {
      key: 'unknown',
      label: 'Unknown',
      value: String(summary.monitors_unknown ?? 0),
      hint: 'No check history yet',
    },
    {
      key: 'latency',
      label: 'Avg Response (24h)',
      value: formatMilliseconds(summary.average_response_time_ms_24h),
      hint: 'Fleet average response time',
    },
    {
      key: 'availability',
      label: 'Synthetic Availability',
      value: formatPercent(summary.availability_ratio),
      hint: 'Legacy demo SLO signal',
    },
  ] as const;

  return (
    <section aria-label="Monitor fleet summary" className="summary-grid">
      {cards.map((card) => (
        <article key={card.key} className="summary-card" aria-labelledby={`fleet-${card.key}`}>
          <p id={`fleet-${card.key}`} className="summary-label">
            {card.label}
          </p>
          <p className="summary-value">{card.value}</p>
          <p className="summary-hint">{card.hint}</p>
        </article>
      ))}
    </section>
  );
}

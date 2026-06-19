import type { Summary } from '../types';
import { formatPercent } from '../utils';

interface SummaryCardsProps {
  summary: Summary;
}

const cards = [
  {
    key: 'availability',
    label: 'Availability',
    getValue: (s: Summary) => formatPercent(s.availability_ratio),
    hint: 'Successful requests / total requests',
  },
  {
    key: 'slo',
    label: 'SLO Target',
    getValue: (s: Summary) => formatPercent(s.slo_target_ratio),
    hint: 'Configured availability objective',
  },
  {
    key: 'budget',
    label: 'Error Budget Remaining',
    getValue: (s: Summary) => formatPercent(s.error_budget_remaining_ratio),
    hint: 'Headroom before SLO breach',
  },
  {
    key: 'incidents',
    label: 'Open Incidents',
    getValue: (s: Summary) => String(s.open_incident_count),
    hint: 'Active incidents requiring attention',
  },
] as const;

export function SummaryCards({ summary }: SummaryCardsProps) {
  return (
    <section aria-label="Service health summary" className="summary-grid">
      {cards.map((card) => (
        <article key={card.key} className="summary-card" aria-labelledby={`summary-${card.key}`}>
          <p id={`summary-${card.key}`} className="summary-label">
            {card.label}
          </p>
          <p className="summary-value" aria-describedby={`summary-${card.key}-hint`}>
            {card.getValue(summary)}
          </p>
          <p id={`summary-${card.key}-hint`} className="summary-hint">
            {card.hint}
          </p>
        </article>
      ))}
    </section>
  );
}

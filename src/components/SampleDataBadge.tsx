interface SampleDataBadgeProps {
  reason?: string;
}

export function SampleDataBadge({ reason }: SampleDataBadgeProps) {
  return (
    <p className="sample-data-badge" title={reason}>
      Sample data · setup preview
    </p>
  );
}

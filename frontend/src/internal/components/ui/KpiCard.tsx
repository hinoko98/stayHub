type KpiCardProps = {
  label: string;
  value: string | number;
  tone?: "neutral" | "success" | "warning" | "danger";
};

export function KpiCard({ label, value, tone = "neutral" }: KpiCardProps) {
  return (
    <article className={`kpi-card tone-${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}


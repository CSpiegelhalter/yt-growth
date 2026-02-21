/**
 * Shared SVG gradient definitions for recharts AreaChart components.
 * Avoids duplicating linearGradient defs across chart components.
 */

export function ViewsGradientDef({ id = "viewsGradient" }: { id?: string }) {
  return (
    <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
    </linearGradient>
  );
}

export function SubsGradientDef({ id = "subsGradient" }: { id?: string }) {
  return (
    <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
    </linearGradient>
  );
}

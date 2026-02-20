type TocItem = {
  readonly id: string;
  readonly label: string;
};

type TocItemCompat = { id: string; title?: string; label?: string };

export function normalizeItems(
  items: readonly TocItemCompat[]
): TocItem[] {
  return items.map((item) => ({
    id: item.id,
    label: item.label ?? item.title ?? item.id,
  }));
}

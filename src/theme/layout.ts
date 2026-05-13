export const getLayoutSize = (compact: boolean) => ({
  cardPadding: compact ? 12 : 16,
  rowHeight: compact ? 56 : 76,
  sectionGap: compact ? 8 : 16,
  screenPadding: compact ? 12 : 16,
  cardGap: compact ? 8 : 12,
  headerVertical: compact ? 8 : 12,
  listGap: compact ? 6 : 8,
});

export type LayoutSize = ReturnType<typeof getLayoutSize>;

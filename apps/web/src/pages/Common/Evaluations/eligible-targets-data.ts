export interface EligibleTargetGroup<T> {
  key: string;
  label: string;
  targets: T[];
}

export function paginateEligibleGroups<T, G extends EligibleTargetGroup<T>>(
  groups: G[],
  requestedPage: number,
  pageSize: number,
) {
  const allTargets = groups.flatMap((group) =>
    group.targets.map((target) => ({ group, target })),
  );
  const total = allTargets.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(Math.max(1, requestedPage), totalPages);
  const startIndex = (page - 1) * pageSize;
  const visibleTargets = allTargets.slice(startIndex, startIndex + pageSize);
  const visibleGroups = groups.flatMap((group) => {
    const targets = visibleTargets
      .filter((entry) => entry.group.key === group.key)
      .map((entry) => entry.target);

    return targets.length > 0 ? [{ ...group, targets }] : [];
  });

  return {
    groups: visibleGroups,
    total,
    page,
    totalPages,
    start: total === 0 ? 0 : startIndex + 1,
    end: Math.min(startIndex + pageSize, total),
  };
}

export default function followPath<Tm, Tv>(
  model: Tm,
  path: string[]
): Tv | undefined {
  let queriedValue = model;
  for (const key of path) {
    if (queriedValue == null) {
      return undefined;
    }
    queriedValue = queriedValue[key];
  }
  return queriedValue as unknown as Tv | undefined;
}

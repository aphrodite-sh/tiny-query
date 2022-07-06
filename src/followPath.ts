export default function followPath<Tm, Tv>(model: Tm, path: string[]): Tv {
  let queriedValue = model;
  for (const key of path) {
    queriedValue = queriedValue[key];
  }
  return queriedValue as unknown as Tv;
}

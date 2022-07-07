import { Paths } from "paths";

export default function followPath<Tm, Tv>(
  model: Tm,
  path: Paths<Tm>
): Tv | undefined {
  let queriedValue = model;
  for (const key of path) {
    if (queriedValue === undefined) {
      return undefined;
    }
    queriedValue = queriedValue[key] as any;
  }
  return queriedValue as unknown as Tv | undefined;
}

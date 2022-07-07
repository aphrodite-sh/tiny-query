import followPath from "./followPath.js";
import { ChunkIterable, TakeChunkIterable } from "./ChunkIterable.js";
import HopPlan from "./plan/HopPlan.js";
import Plan, { IPlan } from "./plan/Plan.js";
import { Predicate } from "./Predicate.js";
import { Paths } from "paths.js";

export interface FieldGetter<Tm, Tv> {
  readonly get: (Tm) => Tv | undefined;
}

export class ObjectFieldGetter<Tm, Tv> implements FieldGetter<Tm, Tv> {
  constructor(public readonly path: Paths<Tm>) {}

  get(model: Tm): Tv | undefined {
    return followPath(model, this.path);
  }
}

export type Direction = "asc" | "desc";

export type ExpressionType =
  | "take"
  | "filter"
  | "orderBy"
  | "orderByLambda"
  | "hop"
  | "count"
  | "map"
  | "hop"
  | "groupBy";

export type Expression =
  | ReturnType<typeof take>
  | ReturnType<typeof filter>
  | ReturnType<typeof orderBy>
  | ReturnType<typeof orderByLambda>
  | ReturnType<typeof count>
  | ReturnType<typeof map>
  | ReturnType<typeof hop>
  | ReturnType<typeof groupBy>;

export interface SourceExpression<TOut> {
  readonly iterable: ChunkIterable<TOut>;
  optimize(plan: Plan, nextHop?: HopPlan): Plan;
}

export interface DerivedExpression<TIn, TOut> {
  chainAfter(iterable: ChunkIterable<TIn>): ChunkIterable<TOut>;
  type: ExpressionType;
}

export interface HopExpression<TIn, TOut> {
  chainAfter(iterable: ChunkIterable<TIn>): ChunkIterable<TOut>;
  /**
   * Optimizes the current plan (plan) and folds in the nxet hop (nextHop) if possible.
   */
  optimize(sourcePlan: IPlan, plan: HopPlan, nextHop?: HopPlan): HopPlan;
  type: "hop";
}

export function take<T>(num: number): {
  type: "take";
  num: number;
} & DerivedExpression<T, T> {
  return {
    type: "take",
    num,
    chainAfter(iterable) {
      return new TakeChunkIterable(iterable, num);
    },
  };
}

export function filter<Tm, Tv>(
  getter: FieldGetter<Tm, Tv> | null,
  predicate: Predicate<Tv>
): {
  type: "filter";
  getter: FieldGetter<Tm, Tv> | null;
  predicate: Predicate<Tv>;
} & DerivedExpression<Tm, Tm> {
  return {
    type: "filter",
    getter,
    predicate,
    chainAfter(iterable) {
      return iterable.filter((m) =>
        // TODO:
        // @ts-ignore
        predicate.call(getter == null ? m : getter.get(m))
      );
    },
  };
}

export function map<T, R>(
  fn: (f: T) => R
): { type: "map" } & DerivedExpression<T, R> {
  return {
    type: "map",
    chainAfter(iterable) {
      return iterable.map(fn);
    },
  };
}

export function orderBy<Tm, Tv>(
  getter: FieldGetter<Tm, Tv>,
  direction: Direction
): {
  type: "orderBy";
  getter: FieldGetter<Tm, Tv>;
  direction: Direction;
} & DerivedExpression<Tm, Tm> {
  return {
    type: "orderBy",
    getter,
    direction,
    chainAfter(iterable) {
      return iterable.orderBy((leftModel: Tm, rightModel: Tm) => {
        const leftValue = getter.get(leftModel);
        const rightValue = getter.get(rightModel);

        if (leftValue == rightValue) {
          return 0;
        }

        if (leftValue == null) {
          return -1;
        }
        if (rightValue == null) {
          return 1;
        }

        if (leftValue > rightValue) {
          return direction === "asc" ? 1 : -1;
        }
        return direction === "asc" ? -1 : 1;
      });
    },
  };
}

export function orderByLambda<Tm>(fn: (l: Tm, r: Tm) => number): {
  type: "orderByLambda";
} & DerivedExpression<Tm, Tm> {
  return {
    type: "orderByLambda",
    chainAfter(iterable) {
      return iterable.orderBy(fn);
    },
  };
}

export function count<Tm>(): { type: "count" } & DerivedExpression<Tm, number> {
  return {
    type: "count",
    chainAfter(iterable) {
      return iterable.count();
    },
  };
}

export function groupBy<Tm, Tv>(
  fn: (x: Tm) => Tv
): {
  type: "groupBy";
} & DerivedExpression<Tm, [Tv, Tm[]]> {
  return {
    type: "groupBy",
    chainAfter(iterable) {
      return iterable.groupBy(fn);
    },
  };
}

export function hop<TIn, TOut>(): HopExpression<TIn, TOut> {
  throw new Error();
}

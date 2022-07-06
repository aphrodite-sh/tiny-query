import followPath from "followPath.js";
import { HopQuery, Query } from "Query.js";
import { BaseChunkIterable, ChunkIterable } from "./ChunkIterable.js";
import { HopExpression } from "./Expression.js";
import HopPlan from "./plan/HopPlan.js";
import { IPlan } from "./plan/Plan.js";

export default class ObjectFieldHopExpression<
  TIn extends Object,
  TOut extends Object
> implements HopExpression<TIn, TOut>
{
  constructor(public readonly path: string[]) {}

  chainAfter(iterable: ChunkIterable<TIn>): ChunkIterable<TOut> {
    return new ObjectFieldHopChunkIterable(iterable, this.path);
  }

  optimize(sourcePlan: IPlan, plan: HopPlan, nextHop?: HopPlan): HopPlan {
    let derivs = [...plan.derivations];
    if (nextHop) {
      derivs.push(nextHop.hop);
      derivs = derivs.concat(nextHop.derivations);
    }
    return new HopPlan(
      sourcePlan,
      new ObjectFieldHopExpression(this.path),
      derivs
    );
  }

  type: "hop" = "hop";

  implicatedDataset(): string | null {
    return null;
  }
}

class ObjectFieldHopChunkIterable<TIn, TOut> extends BaseChunkIterable<TOut> {
  constructor(
    private readonly source: ChunkIterable<TIn>,
    private readonly path: string[]
  ) {
    super();
  }

  async *[Symbol.asyncIterator](): AsyncIterator<readonly TOut[]> {
    for await (const chunk of this.source) {
      yield chunk.flatMap((i) => followPath(i, this.path));
    }
  }
}

export class ObjectFieldHopQuery<
  TIn extends Object,
  TOut extends Object
> extends HopQuery<TIn, TOut> {
  static create<TIn extends Object, TOut extends Object>(
    sourceQuery: Query<TIn>,
    path: string[]
  ) {
    return new ObjectFieldHopQuery<TIn, TOut>(
      sourceQuery,
      new ObjectFieldHopExpression(path)
    );
  }
}

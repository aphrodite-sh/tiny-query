import { ChunkIterable } from "../ChunkIterable.js";
import { HopExpression } from "../expression/Expression.js";
import HopPlan from "../plan/HopPlan.js";
import { IPlan } from "../plan/Plan.js";
import ObjectFieldHopChunkIterable from "./ObjectFieldHopChunkIterable.js";

export default class ObjectFieldHopExpression<
  TIn extends Object,
  TOut extends Object
> implements HopExpression<TIn, TOut>
{
  constructor(public readonly fn: (x: TIn) => TOut) {}

  chainAfter(iterable: ChunkIterable<TIn>): ChunkIterable<TOut> {
    return new ObjectFieldHopChunkIterable(iterable, this.fn);
  }

  optimize(sourcePlan: IPlan, plan: HopPlan, nextHop?: HopPlan): HopPlan {
    let derivs = [...plan.derivations];
    if (nextHop) {
      derivs.push(nextHop.hop);
      derivs = derivs.concat(nextHop.derivations);
    }
    return new HopPlan(
      sourcePlan,
      new ObjectFieldHopExpression(this.fn),
      derivs
    );
  }

  type: "hop" = "hop";

  implicatedDataset(): string | null {
    return null;
  }
}

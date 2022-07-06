import Plan from "../plan/Plan.js";
import { SourceExpression } from "../Expression.js";
import { ChunkIterable } from "../ChunkIterable.js";
import MemorySourceChunkIterable from "./MemorySourceChunkIterable.js";
import { ModelType } from "./MemoryDb.js";
import HopPlan from "plan/HopPlan.js";

export default class MemorySourceExpression<T extends ModelType>
  implements SourceExpression<T>
{
  constructor(private collection: string) {}

  optimize(plan: Plan, nextHop?: HopPlan): Plan {
    // Here we would visit all expressions in the plan (plan.derivations) and decide
    // how to optimize them.
    // Examples:
    // -if those expressions get fulfilled from different indices
    // - if they are hoisted to the database server
    //
    // Perofming no optimizations would just execute expression in the application server
    //
    // As a concerete example --
    // If a filter exists on an indexed field in the derivations, we could pull that out
    // and query against the index first.
    //
    // For SQL -- we can "hoist" expressions to the backend. As in, convert each hoistable expression to SQL
    // and remove the expression from `plan.derivations`.
    //
    // Note -- expressions don't have to only do query operations.
    // Expression can also be responsible for:
    // 1. Mapping from one type to another
    // 2. Evaluating row level security policies
    // 3. Converting from raw DB results to a "model" class (similar to 1)
    //
    // Expressions may also "hop" / traverse edges.

    let derivs = [...plan.derivations];
    if (nextHop) {
      derivs.push(nextHop.hop);
      derivs = derivs.concat(nextHop.derivations);
    }
    return new Plan(new MemorySourceExpression(this.collection), derivs);
  }

  // All expressions return an `iterable` such that non-optimized expressions may be chained
  // one after another and thus fulfill the user's query.
  get iterable(): ChunkIterable<T> {
    return new MemorySourceChunkIterable({
      type: "read",
      collection: this.collection,
      // roots could be populated during optimization based on presence of `id filter` expressions
      roots: undefined,
    });
  }

  implicatedDataset(): string {
    return this.collection;
  }
}

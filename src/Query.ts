import StaticSourceExpression from "./db/StaticSourceExpression.js";
import HopPlan from "./plan/HopPlan.js";
import Plan, { IPlan } from "./plan/Plan.js";
import {
  Direction,
  Expression,
  filter,
  HopExpression,
  map,
  ObjectFieldGetter,
  orderBy,
  SourceExpression,
  take,
} from "./Expression.js";
import P, { Predicate } from "./Predicate.js";
import ObjectFieldHopExpression from "./hop/ObjectFieldHopExpression.js";
import { Paths } from "./paths.js";

export abstract class Query<T> {
  // async since we allow application of async filters, maps, etc.
  async gen(): Promise<T[]> {
    const plan = this.plan().optimize();
    let results: T[] = [];
    for await (const chunk of plan.iterable) {
      results = results.concat(chunk);
    }

    return results;
  }

  abstract plan(): IPlan;
}

class SourceQuery<T> extends Query<T> {
  constructor(public readonly expression: SourceExpression<T>) {
    super();
  }

  plan() {
    return new Plan(this.expression, []);
  }
}

class DerivedQuery<TOut> extends Query<TOut> {
  #priorQuery: Query<any>;
  #expression?: Expression;

  constructor(priorQuery: Query<any>, expression?: Expression) {
    super();
    this.#priorQuery = priorQuery;
    this.#expression = expression;
  }

  protected derive<TDerivation>(
    expression: Expression
  ): DerivedQuery<TDerivation> {
    return new DerivedQuery(this, expression);
  }

  query<T>(path: Paths<TOut>): DerivedQuery<T> {
    // ObjectFieldSourceExpression
    // we get the thing along the path
    // turn it into a StaticChunkIterable
    return new DerivedQuery<T>(ObjectFieldHopQuery.create(this, path));
  }

  where<T>(path: Paths<TOut>, predicate: Predicate<T>) {
    return this.derive<TOut>(
      filter<TOut, T>(new ObjectFieldGetter(path), predicate)
    );
  }

  orderBy(path: Paths<TOut>, direction: Direction) {
    return this.derive<TOut>(orderBy(new ObjectFieldGetter(path), direction));
  }

  take(n: number) {
    return this.derive<TOut>(take(n));
  }

  whereLambda(fn: (t: TOut) => boolean): DerivedQuery<TOut> {
    return this.derive<TOut>(filter<TOut, TOut>(null, P.lambda(fn)));
  }

  map<TMapped>(fn: (t: TOut) => TMapped): DerivedQuery<TMapped> {
    return this.derive<TMapped>(map(fn));
  }

  plan() {
    const plan = this.#priorQuery.plan();
    if (this.#expression) {
      plan.addDerivation(this.#expression);
    }

    return plan;
  }
}

export abstract class HopQuery<TIn, TOut> extends Query<TOut> {
  constructor(
    private priorQuery: Query<TIn>,
    public readonly expression: HopExpression<TIn, TOut>
  ) {
    super();
  }

  plan() {
    return new HopPlan(this.priorQuery.plan(), this.expression, []);
  }
}

export function querify<TOut>(collection: Iterable<TOut>): DerivedQuery<TOut> {
  const source = new SourceQuery(new StaticSourceExpression(collection));
  return new DerivedQuery(source);
}

export default class ObjectFieldHopQuery<
  TIn extends Object,
  TOut extends Object
> extends HopQuery<TIn, TOut> {
  static create<TIn extends Object, TOut extends Object>(
    sourceQuery: Query<TIn>,
    path: Paths<TIn>
  ) {
    return new ObjectFieldHopQuery<TIn, TOut>(
      sourceQuery,
      new ObjectFieldHopExpression(path)
    );
  }
}

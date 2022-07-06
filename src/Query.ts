import MemorySourceExpression from "./db/MemorySourceExpression.js";
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
  abstract implicatedDatasets(): Set<string>;
}

class SourceQuery<T> extends Query<T> {
  constructor(public readonly expression: SourceExpression<T>) {
    super();
  }

  plan() {
    return new Plan(this.expression, []);
  }

  implicatedDatasets(): Set<string> {
    return new Set([this.expression.implicatedDataset()]);
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

  query<T>(path: string[]): DerivedQuery<T> {
    // ObjectFieldSourceExpression
    // we get the thing along the path
    // turn it into a StaticChunkIterable
    return new DerivedQuery(ObjectFieldHopQuery.create(this, path));
  }

  where<T>(path: string[], predicate: Predicate<T>) {
    return this.derive(filter<TOut, T>(new ObjectFieldGetter(path), predicate));
  }

  orderBy(path: string[], direction: Direction) {
    return this.derive(orderBy(new ObjectFieldGetter(path), direction));
  }

  take(n: number) {
    return this.derive(take(n));
  }

  whereLambda(fn: (t: TOut) => boolean): DerivedQuery<TOut> {
    return this.derive(filter<TOut, TOut>(null, P.lambda(fn)));
  }

  map<TMapped>(fn: (t: TOut) => TMapped): DerivedQuery<TMapped> {
    return this.derive(map(fn));
  }

  plan() {
    const plan = this.#priorQuery.plan();
    if (this.#expression) {
      plan.addDerivation(this.#expression);
    }

    return plan;
  }

  implicatedDatasets(): Set<string> {
    return this.#priorQuery.implicatedDatasets();
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

  implicatedDatasets(): Set<string> {
    const s = this.priorQuery.implicatedDatasets();
    const ds = this.expression.implicatedDataset();
    if (ds != null) {
      s.add(ds);
    }
    return s;
  }
}

export function queryAll<TOut>(collection: string): DerivedQuery<TOut> {
  const source = new SourceQuery(new MemorySourceExpression(collection));
  return new DerivedQuery(source);
}

export default class ObjectFieldHopQuery<
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

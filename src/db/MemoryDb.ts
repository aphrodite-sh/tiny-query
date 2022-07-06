export type IDType = string | number;

export type MemoryReadQuery = {
  type: "read";
  collection: string;
  roots?: (string | number)[];
};

// We don't have to enforce every model has an id but will for illustrative purposes
// e.g., indexing on id
export type ModelType = { id: IDType };

export type MemoryWriteQuery<T extends ModelType> = {
  type: "write";
  op: "delete" | "upsert";
  collection: string;
  models: T[];
};

export type MemoryQuery<T extends ModelType> =
  | MemoryReadQuery
  | MemoryWriteQuery<T>;

/**
 * Holds node by "collection." All nodes in a given collection should be of the same type.
 *
 * Assumes nodes have an ID and indexes nodes by ID. This speeds up traversals of edges
 * in a _relational model_.
 *
 * A document mode (e.g., nodes directly referenced other nodes) hasn't been fully considered.
 * You could support this via new HopExpressions. You probably would not have nested nodes pulled
 * out into top level collections, however.
 */
class MemoryDB {
  private collections: Map<string, { [key: IDType]: Object }> = new Map();

  query<T extends ModelType>(q: MemoryQuery<T>): T[] {
    switch (q.type) {
      case "read":
        return this.read(q);
      case "write":
        this.write(q);
        return [];
    }
  }

  read<T>(q: MemoryReadQuery): T[] {
    const collection = this.collections.get(q.collection);
    if (collection == null) {
      return [];
    }

    if (q.roots == null) {
      return Object.values(collection) as T[];
    }

    return q.roots.map((r) => collection[r]) as T[];
  }

  write<T extends ModelType>(q: MemoryWriteQuery<T>): void {
    const c = this.collections.get(q.collection);
    let collection: { [key: IDType]: any };
    // To make the type checker happy
    if (c == null) {
      collection = {};
      this.collections.set(q.collection, collection);
    } else {
      collection = c;
    }

    switch (q.op) {
      case "delete":
        q.models.forEach((m) => delete collection[m.id]);
        return;
      case "upsert":
        q.models.forEach((m) => (collection[m.id] = m));
        return;
    }
  }

  upsert<T extends ModelType>(collection: string, models: T[]): void {
    this.write({
      type: "write",
      op: "upsert",
      collection,
      models,
    });
  }

  dispose(): void {
    this.collections = new Map();
  }
}

export const memoryDb = new MemoryDB();

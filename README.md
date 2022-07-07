# tiny-query

A layer to query in-memory records.

There's no real point to the `linq-like` version as that can be accomplished with standard `flatMap`, `filter` and `reduce`.

The original form (paths, predicates, field getters) is useful as it tells the runtime:
1. What fields are being accessed
2. What operations on those fields are being run

So we can then optimize the query by leveraging indices.
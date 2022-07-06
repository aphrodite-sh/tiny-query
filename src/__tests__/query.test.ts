import { memoryDb } from "db/MemoryDb";

test("basic query", () => {
  memoryDb.upsert("farmers", [
    {
      id: 0,
      name: "Brown",
      partner: {
        name: "Nancy",
      },
    },
  ]);
});

// nested collections...
// contains, not contains...
// but also can we treat them like edges and do wheres against their contents?

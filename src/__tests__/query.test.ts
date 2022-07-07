import { querify } from "../Query.js";

test("basic query", async () => {
  const farmers: {
    name: string;
    animals: { type: string; weight: number; ageInWeeks: number }[];
    partner?: { name: string };
  }[] = [
    {
      name: "Brown",
      partner: {
        name: "Nancy",
      },
      animals: [
        {
          type: "pig",
          weight: 160,
          ageInWeeks: 18,
        },
        {
          type: "cow",
          weight: 300,
          ageInWeeks: 24,
        },
        {
          type: "dog",
          weight: 25,
          ageInWeeks: 7 * 52,
        },
      ],
    },
    {
      name: "Billy",
      animals: [
        {
          type: "alligator",
          weight: 250,
          ageInWeeks: 10 * 52,
        },
      ],
    },
    {
      name: "Arvin",
      partner: {
        name: "Alice",
      },
      animals: [],
    },
  ];

  // Query a collection, filter for "farmer brown", query the sub-collection
  // of his animals, filter for heavy ones.
  // queryAll is async given we allow async filters to be applied.
  // e.g., async lambdas.
  const brownsLargeAnimals = await querify(farmers)
    .where((x) => x.name === "Brown")
    .query((x) => x.animals)
    .where((x) => x.weight > 30)
    .orderBy((l, r) => r.weight - l.weight)
    .gen();

  console.log(brownsLargeAnimals);
  expect(brownsLargeAnimals).toEqual([
    {
      type: "cow",
      weight: 300,
      ageInWeeks: 24,
    },
    {
      type: "pig",
      weight: 160,
      ageInWeeks: 18,
    },
  ]);

  const alicePartner = await querify(farmers)
    .where((x) => x.partner?.name === "Alice")
    .gen();

  console.log(alicePartner);
  expect(alicePartner).toEqual([
    {
      name: "Arvin",
      partner: {
        name: "Alice",
      },
      animals: [],
    },
  ]);

  const allLargeAnimals = await querify(farmers)
    .query((x) => x.animals)
    .where((x) => x.weight > 30)
    .gen();

  console.log(allLargeAnimals);
  expect(allLargeAnimals).toEqual([
    { type: "pig", weight: 160, ageInWeeks: 18 },
    { type: "cow", weight: 300, ageInWeeks: 24 },
    { type: "alligator", weight: 250, ageInWeeks: 520 },
  ]);

  const animalTypes = await querify(farmers)
    .query((x) => x.animals)
    .map((a) => a.type)
    .gen();

  console.log(animalTypes);
  expect(animalTypes).toEqual(["pig", "cow", "dog", "alligator"]);

  const bGroup = await querify(farmers)
    .groupBy((x) => x.name[0])
    .where((x) => x[0] === "B")
    .flatMap((x) => x[1])
    .gen();
  console.log(bGroup);

  // TODO: if we want to return _farmers_ that _have_ large animals
  // we need to port over `whereQueryExists`
  // this looks like:
  /*
  queryAll("farmers")
    .whereQueryExists(q => q.query(["animals"]).where(["weight"], P.greaterThan(30)))
  */
});

// nested collections...
// contains, not contains...
// but also can we treat them like edges and do wheres against their contents?

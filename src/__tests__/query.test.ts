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

  const brownsLargeAnimalsQuery = querify(farmers)
    .where((x) => x.name === "Brown")
    .query((x) => x.animals)
    .where((x) => x.weight > 30)
    .orderBy((l, r) => r.weight - l.weight);
  const brownsLargeAnimals = await brownsLargeAnimalsQuery.gen();
  const brownsLargeAnimalsSync = brownsLargeAnimalsQuery.genSync();

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
  expect(brownsLargeAnimals).toEqual(brownsLargeAnimalsSync);

  const aliceQuery = querify(farmers).where((x) => x.partner?.name === "Alice");
  const alicePartner = await aliceQuery.gen();
  const alicePartnerSync = aliceQuery.genSync();

  expect(alicePartner).toEqual([
    {
      name: "Arvin",
      partner: {
        name: "Alice",
      },
      animals: [],
    },
  ]);
  expect(alicePartner).toEqual(alicePartnerSync);

  const allLargeAnimalsQuery = querify(farmers)
    .query((x) => x.animals)
    .where((x) => x.weight > 30);

  const allLargeAnimals = await allLargeAnimalsQuery.gen();
  const allLargeAnimalsSync = allLargeAnimalsQuery.genSync();

  expect(allLargeAnimals).toEqual([
    { type: "pig", weight: 160, ageInWeeks: 18 },
    { type: "cow", weight: 300, ageInWeeks: 24 },
    { type: "alligator", weight: 250, ageInWeeks: 520 },
  ]);
  expect(allLargeAnimals).toEqual(allLargeAnimalsSync);

  const animalTypesQuery = querify(farmers)
    .query((x) => x.animals)
    .map((a) => a.type);
  const animalTypes = await animalTypesQuery.gen();
  const animalTypesSync = animalTypesQuery.genSync();

  expect(animalTypes).toEqual(["pig", "cow", "dog", "alligator"]);
  expect(animalTypes).toEqual(animalTypesSync);

  const bGroup = await querify(farmers)
    .groupBy((x) => x.name[0])
    .where((x) => x[0] === "B")
    .flatMap((x) => x[1])
    .gen();

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

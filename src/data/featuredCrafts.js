// "Featured Crafts": the two crafts the Quote page opens on. This used to live in App.jsx. Models are only ever added at the end, so the first model of each
// role (index 0, what a new quote starts on) and every name saved jobs and templates point at stay as they were.
export const FEATURED = {
  "Featured Crafts": {
    color: "#ffd6e8",
    accent: "#d94a8a",
    roles: [
      {
        name: "Photography",
        models: [
          { type: "Standard Session", unit: "per hour", base: 25 },
          { type: "Portrait / Headshot Session", unit: "per session", base: 150, hours: 3 },
          { type: "Event Photography", unit: "per event", base: 500, hours: 6 },
          { type: "Commercial / Editorial Day Rate", unit: "per day", base: 1000 },
          { type: "Licensing Fee", unit: "per image use", base: 100 },
          { type: "Retouching", unit: "per image", base: 10, hours: 0.2 },
        ],
        materials: [
          { name: "Film Roll (36exp)", cost: 14 },
          { name: "Print 8x10 (each)", cost: 4 },
          { name: "USB Delivery Drive", cost: 12 },
        ],
      },
      {
        name: "Illustration",
        models: [
          { type: "Commission", unit: "per hour", base: 30 },
          { type: "Per Illustration", unit: "per piece", base: 100, hours: 3 },
          { type: "Character / Portrait Commission", unit: "per piece", base: 150, hours: 5 },
          { type: "Editorial / Publishing", unit: "per project", base: 200, hours: 5 },
        ],
        materials: [
          { name: "Arches Watercolor Sheet", cost: 5 },
          { name: "Copic Markers (set/12)", cost: 55 },
        ],
      },
    ],
  },
};

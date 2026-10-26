import { describe, expect, it } from "vitest";

import { mapToRows, rowsToMap } from "./persistence";
import type { LearningMap } from "@/types/map";

const map: LearningMap = {
  id: "map-1",
  title: "Learning",
  description: "A small map",
  category: "Personal growth",
  accent: "lavender",
  bibbles: [
    {
      id: "b-1",
      title: "Start",
      description: "Begin",
      status: "learning",
      progress: 25,
      position: { x: 10, y: 20 },
      resources: [{ id: "r-1", label: "Guide", url: "https://example.com" }],
      notes: "Keep going",
    },
    {
      id: "b-2",
      title: "Continue",
      description: "",
      status: "not-started",
      progress: 0,
      position: { x: 40, y: 20 },
      resources: [],
      notes: "",
    },
  ],
  edges: [{ id: "e-1", source: "b-1", target: "b-2" }],
};

describe("map persistence mapping", () => {
  it("stores nested bibble positions and ownership-free rows", () => {
    const rows = mapToRows(map);
    expect(rows.map).toEqual({ id: "map-1", title: "Learning", description: "A small map", category: "Personal growth", accent: "lavender" });
    expect(rows.bibbles[0]).toMatchObject({ map_id: "map-1", position_x: 10, position_y: 20 });
    expect(rows.bibbles[0]).not.toHaveProperty("user_id");
    expect(rows.edges[0]).toMatchObject({ map_id: "map-1", source_id: "b-1", target_id: "b-2" });
  });

  it("round-trips a map through database row shapes", () => {
    const rows = mapToRows(map);
    const domainMap = rowsToMap(rows.map, rows.bibbles, rows.edges);
    expect(domainMap).toEqual(map);
    expect(domainMap.bibbles[0]).not.toHaveProperty("map_id");
    expect(domainMap.edges[0]).not.toHaveProperty("source_id");
    expect(domainMap.edges[0]).not.toHaveProperty("target_id");
  });
});

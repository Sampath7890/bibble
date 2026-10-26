import type { Bibble, LearningMap, MapEdge } from "@/types/map";
import { createClient } from "@/lib/supabase/client";

type MapRow = Pick<LearningMap, "id" | "title" | "description" | "category" | "accent">;
type BibbleRow = Omit<Bibble, "position"> & { map_id: string; position_x: number; position_y: number };
type EdgeRow = Pick<MapEdge, "id"> & { map_id: string; source_id: string; target_id: string };

function isSupabaseConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
}

export function mapToRows(map: LearningMap) {
  return {
    map: { id: map.id, title: map.title, description: map.description, category: map.category, accent: map.accent },
    bibbles: map.bibbles.map((bibble) => ({
      id: bibble.id,
      map_id: map.id,
      title: bibble.title,
      description: bibble.description ?? "",
      status: bibble.status,
      progress: bibble.progress,
      position_x: bibble.position.x,
      position_y: bibble.position.y,
      resources: bibble.resources ?? [],
      notes: bibble.notes ?? "",
    })),
    edges: map.edges.map((edge) => ({ id: edge.id, map_id: map.id, source_id: edge.source, target_id: edge.target })),
  };
}

export function rowsToMap(map: MapRow, bibbles: BibbleRow[], edges: EdgeRow[]): LearningMap {
  return {
    id: map.id,
    title: map.title,
    description: map.description,
    category: map.category,
    accent: map.accent,
    bibbles: bibbles.map(({ id, title, description, status, progress, position_x, position_y, resources, notes }) => ({
      id,
      title,
      description,
      status,
      progress,
      position: { x: position_x, y: position_y },
      resources,
      notes,
    })),
    edges: edges.map(({ id, source_id, target_id }) => ({ id, source: source_id, target: target_id })),
  };
}

export async function saveMapToSupabase(map: LearningMap): Promise<boolean> {
  if (!isSupabaseConfigured()) return true;
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return true;

    const rows = mapToRows(map);
    const { error: mapError } = await supabase.from("learning_maps").upsert(rows.map);
    if (mapError) return false;
    const { error: bibbleDeleteError } = await supabase.from("map_bibbles").delete().eq("map_id", map.id);
    const { error: edgeDeleteError } = await supabase.from("map_edges").delete().eq("map_id", map.id);
    if (bibbleDeleteError || edgeDeleteError) return false;
    if (rows.bibbles.length) {
      const { error } = await supabase.from("map_bibbles").insert(rows.bibbles);
      if (error) return false;
    }
    if (rows.edges.length) {
      const { error } = await supabase.from("map_edges").insert(rows.edges);
      if (error) return false;
    }
    return true;
  } catch {
    return false;
  }
}

export async function deleteMapFromSupabase(id: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return true;
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return true;
    const { error } = await supabase.from("learning_maps").delete().eq("id", id);
    return !error;
  } catch {
    return false;
  }
}

export async function loadMapFromSupabase(id: string): Promise<LearningMap | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: map, error } = await supabase.from("learning_maps").select("id,title,description,category,accent").eq("id", id).maybeSingle();
  if (error || !map) return null;
  const [{ data: bibbles, error: bibblesError }, { data: edges, error: edgesError }] = await Promise.all([
    supabase.from("map_bibbles").select("id,map_id,title,description,status,progress,position_x,position_y,resources,notes").eq("map_id", id),
    supabase.from("map_edges").select("id,map_id,source_id,target_id").eq("map_id", id),
  ]);
  if (bibblesError || edgesError) return null;
  return rowsToMap(map, bibbles ?? [], edges ?? []);
}

export async function listMapsFromSupabase(): Promise<LearningMap[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = createClient();
  const { data: maps } = await supabase.from("learning_maps").select("id,title,description,category,accent").order("updated_at", { ascending: false });
  if (!maps) return [];
  const loaded = await Promise.all(maps.map((map) => loadMapFromSupabase(map.id)));
  return loaded.filter((map): map is LearningMap => Boolean(map));
}

export async function downloadMapExport(map: LearningMap): Promise<void> {
  const blob = new Blob([JSON.stringify(map, null, 2)], { type: "application/json" });
  try {
    const supabase = isSupabaseConfigured() ? createClient() : null;
    if (!supabase) return downloadBlob(blob, map.id);
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const path = `${user.id}/${map.id}/map.json`;
      const { error } = await supabase.storage.from("map-exports").upload(path, blob, { upsert: true, contentType: "application/json" });
      if (!error) {
        const { data } = await supabase.storage.from("map-exports").createSignedUrl(path, 60);
        if (data?.signedUrl) {
          window.open(data.signedUrl, "_blank", "noopener,noreferrer");
          return;
        }
      }
    }
  } catch {
    // Fall back to a local download when Storage is unavailable.
  }

  downloadBlob(blob, map.id);
}

function downloadBlob(blob: Blob, mapId: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${mapId}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

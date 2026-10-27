"use client";

import { LearningMapCanvas } from "@/components/map/learning-map";
import { MapHeader } from "@/components/map/map-header";
import { getMapById } from "@/data/sample-maps";
import { useLocalStorage } from "@/hooks/use-local-storage";
import type { LearningMap } from "@/types/map";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function EditMapPage() {
  const { id } = useParams<{ id: string }>();
  const [storedMaps, , storedHydrated] = useLocalStorage<LearningMap[]>("bibble-maps", []);
  const [deletedMapIds, , deletedHydrated] = useLocalStorage<string[]>("bibble-deleted-maps", []);
  const hydrated = storedHydrated && deletedHydrated;
  const map = deletedMapIds.includes(id)
    ? undefined
    : storedMaps.find((storedMap) => storedMap.id === id) ?? getMapById(id);

  if (!hydrated) {
    return (
      <main className="empty-state">
        <h2>Loading map…</h2>
      </main>
    );
  }

  if (!map) {
    return (
      <main className="empty-state">
        <h2>This map wandered off.</h2>
        <Link href="/explore" className="text-link">
          Back to explore <ArrowLeft size={15} />
        </Link>
      </main>
    );
  }

  return (
    <main className="map-page">
      <MapHeader
        title={map.title}
        category={map.category}
        mapId={map.id}
        isEditing
      />
      <LearningMapCanvas key={map.id} initialMap={map} editable />
    </main>
  );
}

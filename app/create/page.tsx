"use client";

import { CreateMapForm } from "@/app/create/_components/create-map-form";
import { CreateMapHeader } from "@/app/create/_components/create-map-header";
import { CreateMapIntro } from "@/app/create/_components/create-map-intro";
import { useLocalStorage } from "@/hooks/use-local-storage";
import {
  createLearningMap,
  type CreateLearningMapInput,
} from "@/lib/maps/create-learning-map";
import type { LearningMap } from "@/types/map";
import { saveMapToSupabase } from "@/lib/maps/persistence";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import styles from "./create-page.module.css";

export default function CreatePage() {
  const router = useRouter();
  const [, setMaps] = useLocalStorage<LearningMap[]>("bibble-maps", []);
  const [values, setValues] = useState<CreateLearningMapInput>({
    title: "",
    description: "",
    category: "Personal growth",
  });
  const [saveError, setSaveError] = useState<string | null>(null);
  const previewMap = useMemo(
    () => createLearningMap({ ...values, title: values.title || "Your learning map" }, "map-preview"),
    [values],
  );

  async function handleCreateMap(values: CreateLearningMapInput) {
    const newMap = createLearningMap(values);

    setMaps((currentMaps) => [...currentMaps, newMap]);
    const persisted = await saveMapToSupabase(newMap);
    if (!persisted) {
      setSaveError("The map was kept in this browser, but Supabase could not save it. Please try again.");
      return;
    }
    router.push(`/map/${newMap.id}/edit`);
  }

  return (
    <main className={styles.page}>
      <CreateMapHeader />
      <div className={styles.layout}>
        <CreateMapIntro map={previewMap} />
        <CreateMapForm values={values} onChange={setValues} onCreate={handleCreateMap} />
        {saveError && <p role="alert" style={{ color: "var(--danger, #b42318)" }}>{saveError}</p>}
      </div>
    </main>
  );
}

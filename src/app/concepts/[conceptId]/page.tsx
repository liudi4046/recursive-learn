import { ConceptDetailPage } from "@/components/ConceptDetailPage";
import { createInitialState } from "@/domain/app-state";

export default async function Page({ params }: { params: Promise<{ conceptId: string }> }) {
  const { conceptId } = await params;
  return <ConceptDetailPage state={createInitialState("Transformer")} conceptId={conceptId} />;
}

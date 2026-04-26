import { LearningMapPage } from "@/components/LearningMapPage";
import { createInitialState } from "@/domain/app-state";

export default function Page() {
  const state = createInitialState("Transformer");
  return <LearningMapPage state={state} onStateChange={() => undefined} />;
}

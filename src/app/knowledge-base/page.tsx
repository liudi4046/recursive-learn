import { KnowledgeBasePage } from "@/components/KnowledgeBasePage";
import { createInitialState } from "@/domain/app-state";

export default function Page() {
  return <KnowledgeBasePage state={createInitialState("Transformer")} />;
}

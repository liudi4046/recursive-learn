import { NodeDetailPage } from "@/components/NodeDetailPage";
import { createInitialState } from "@/domain/app-state";

export default function Page() {
  return <NodeDetailPage state={createInitialState("Transformer")} onStateChange={() => undefined} />;
}

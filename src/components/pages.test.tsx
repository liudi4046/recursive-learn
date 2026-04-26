import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { createInitialState } from "@/domain/app-state";
import { HomePage } from "./HomePage";
import { NodeDetailPage } from "./NodeDetailPage";
import { LearningMapPage } from "./LearningMapPage";
import { KnowledgeBasePage } from "./KnowledgeBasePage";

describe("pages", () => {
  it("renders homepage start form", () => {
    render(<HomePage onStart={() => undefined} />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(/learning map/i);
    expect(screen.getByPlaceholderText("What do you want to learn?")).toBeInTheDocument();
  });

  it("renders node detail with ask mode switch", () => {
    const state = createInitialState("Transformer");
    render(<NodeDetailPage state={state} onStateChange={() => undefined} />);
    expect(screen.getAllByRole("button", { name: "Create child node" }).length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "Continue here" })).toBeInTheDocument();
  });

  it("renders learning map as a tree page", () => {
    const state = createInitialState("Transformer");
    render(<LearningMapPage state={state} onStateChange={() => undefined} />);
    expect(screen.getByRole("heading", { level: 1, name: "Transformer" })).toBeInTheDocument();
    expect(screen.getAllByText("Unmastered").length).toBeGreaterThan(0);
  });

  it("renders knowledge base as a network page", () => {
    const state = createInitialState("Transformer");
    render(<KnowledgeBasePage state={state} />);
    expect(screen.getByText("Knowledge Base")).toBeInTheDocument();
    expect(screen.getByLabelText("Concept network")).toBeInTheDocument();
  });
});

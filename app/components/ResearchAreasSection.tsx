"use client";

import * as Accordion from "@radix-ui/react-accordion";
import AccordionItem from "./AccordionItem";
import AnimatedSection from "./AnimatedSection";

export default function ResearchAreasSection() {
  const researchAreas = [
    { id: "scientific-ml", title: "Scientific ML", description: "Do LLMs have the ability to solve novel research problems in SciML?", topics: ["SciML", "PINN", "NeuralODE", "UDE", "Symbolic regression"] },
    { id: "model-efficiency", title: "Model Efficiency", description: "Can we build a useful SLM with a very small dataset?", topics: ["SLM", "Attention heads", "MOE", "Tiny stories", "Inference"] },
    { id: "language-processing", title: "Language Processing", description: "Does repetitive translation create loss in meaning while using LLMs?", topics: ["LLM", "Reasoning", "Cognition", "Bias", "Misinformation", "XAI", "RLHF", "Deepseek clone"] },
    { id: "healthcare-ai", title: "Healthcare AI", description: "Can we build a comprehensive epidemiological model for COVID using ML?", topics: ["XAI", "Inference"] },
    { id: "physics-ai", title: "Physics AI", description: "Can we predict droplet impact dynamics using SciML?", topics: ["PINN", "NeuralODE", "UDE"] },
    { id: "optimization", title: "Optimization", description: "Can we generate timetable schedules without conflicts using multi-constraint optimization?", topics: ["RL", "MOE"] },
    { id: "chemistry-ai", title: "Chemistry AI", description: "Is it possible to predict effective chemical reaction pathways using ML?", topics: ["Symbolic regression", "SciML", "UDE"] },
  ];

  const leftColumn = researchAreas.filter((_, i) => i % 2 === 0);
  const rightColumn = researchAreas.filter((_, i) => i % 2 === 1);

  return (
    <section id="research-areas" className="scroll-mt-20">
      <AnimatedSection>
        <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-fg-muted">
          <span className="w-6 h-px bg-steel" /> Research
        </span>
        <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-fg tracking-tight">
          Research Areas
        </h2>
        <p className="mt-3 text-fg-muted max-w-2xl leading-relaxed mb-8">
          Our research spans multiple domains of AI and ML, from scientific discovery to real-world optimization.
        </p>
      </AnimatedSection>

      <div className="grid md:grid-cols-2 gap-4">
        <Accordion.Root type="single" collapsible defaultValue={leftColumn[0]?.id} className="space-y-3">
          {leftColumn.map((area) => (
            <AccordionItem key={area.id} value={area.id} title={area.title} description={area.description} topics={area.topics} />
          ))}
        </Accordion.Root>
        <Accordion.Root type="single" collapsible defaultValue={rightColumn[0]?.id} className="space-y-3">
          {rightColumn.map((area) => (
            <AccordionItem key={area.id} value={area.id} title={area.title} description={area.description} topics={area.topics} />
          ))}
        </Accordion.Root>
      </div>
    </section>
  );
}

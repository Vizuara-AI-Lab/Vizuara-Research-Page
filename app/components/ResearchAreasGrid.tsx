"use client";

import { useState } from "react";
import AnimatedSection from "./AnimatedSection";

interface SubArea {
  title: string;
  desc: string;
  image: string;
}

interface BootcampResearch {
  bootcamp: string;
  color: string;
  areas: SubArea[];
}

const bootcampResearch: BootcampResearch[] = [
  {
    bootcamp: "Scientific ML",
    color: "#0118D8",
    areas: [
      { title: "Physics-Informed Neural Networks", desc: "Encoding physical laws directly into neural network training for constrained, interpretable predictions.", image: "/generated/area-pinns.png" },
      { title: "Universal Differential Equations", desc: "Combining mechanistic models with neural networks to discover missing dynamics from data.", image: "/generated/area-udes.png" },
      { title: "Neural ODEs", desc: "Continuous-depth models that parameterize dynamics as neural networks for time-series and physics.", image: "/generated/area-nodes.png" },
      { title: "Hybrid Models", desc: "Blending analytical knowledge with data-driven learning for robust scientific predictions.", image: "/generated/area-hybrid.png" },
      { title: "GenAI + SciML", desc: "Leveraging large language models and generative AI to accelerate scientific ML research.", image: "/generated/area-genai-sciml.png" },
    ],
  },
  {
    bootcamp: "Reinforcement Learning",
    color: "#7C3AED",
    areas: [
      { title: "Fine-tuning LLMs with RL", desc: "Using reinforcement learning to fine-tune large language models for specific tasks and alignment.", image: "/generated/area-rl-llm.png" },
      { title: "Aligning SLMs to Human Preferences", desc: "Training small language models toward human preferences using RLHF and DPO techniques.", image: "/generated/area-rl-align.png" },
      { title: "Reasoning LLMs via RL", desc: "Developing chain-of-thought and reasoning capabilities in LLMs through RL-driven training.", image: "/generated/area-rl-reasoning.png" },
      { title: "Agentic Reinforcement Learning", desc: "Building autonomous agents that use RL to navigate, plan, and interact with tool environments.", image: "/generated/area-rl-agentic.png" },
      { title: "Smart Reward Construction", desc: "Designing reward functions that guide RL agents toward desired behaviors without reward hacking.", image: "/generated/area-rl-reward.png" },
      { title: "RL in Robotics", desc: "Applying reinforcement learning to robotic manipulation and locomotion using the LeRobot library.", image: "/generated/area-rl-robotics.png" },
    ],
  },
  {
    bootcamp: "ML / Deep Learning",
    color: "#0891B2",
    areas: [
      { title: "Deep Architectures", desc: "Designing and training CNNs, RNNs, Transformers, and other modern deep learning architectures for research.", image: "/generated/area-mldl-arch.png" },
      { title: "Transfer & Few-Shot Learning", desc: "Adapting pre-trained models to new domains and tasks with minimal labeled data.", image: "/generated/area-mldl-transfer.png" },
      { title: "Training Acceleration", desc: "Optimizers, learning rate schedules, mixed-precision, and distributed training for faster convergence.", image: "/generated/area-mldl-accel.png" },
    ],
  },
  {
    bootcamp: "Computer Vision",
    color: "#DC2626",
    areas: [
      { title: "Object Detection", desc: "Localizing and classifying objects in images using modern detection architectures.", image: "/generated/area-cv-detection.png" },
      { title: "Segmentation", desc: "Pixel-level scene understanding with clean contour boundaries and region parsing.", image: "/generated/area-cv-segment.png" },
      { title: "3D Vision", desc: "Reconstructing 3D geometry from multi-view images using neural implicit representations.", image: "/generated/area-cv-3d.png" },
      { title: "Generative Vision", desc: "Diffusion models, GANs, and VAEs for image synthesis, editing, and style transfer.", image: "/generated/area-cv-gen.png" },
      { title: "Video Understanding", desc: "Temporal modeling, action recognition, and motion estimation across video sequences.", image: "/generated/area-cv-video.png" },
      { title: "Medical Imaging", desc: "AI-driven analysis of medical scans for detection, segmentation, and diagnosis support.", image: "/generated/area-cv-medical.png" },
      { title: "Vision-Language Models", desc: "Bridging visual and textual understanding with multimodal transformers and VLMs.", image: "/generated/area-cv-vlm.png" },
    ],
  },
  {
    bootcamp: "Generative AI",
    color: "#2563EB",
    areas: [
      { title: "Transformer Architectures", desc: "Deep dive into attention mechanisms, positional encodings, and architecture innovations.", image: "/generated/area-genai-arch.png" },
      { title: "Prompt Engineering", desc: "Crafting and optimizing prompts for controlled, high-quality LLM outputs.", image: "/generated/area-genai-prompt.png" },
      { title: "RAG Systems", desc: "Combining external knowledge retrieval with LLMs for grounded, factual generation.", image: "/generated/area-genai-rag.png" },
      { title: "AI Agents & Tools", desc: "Building autonomous agents that plan, reason, and interact with APIs and external tools.", image: "/generated/area-genai-agent.png" },
      { title: "LLM Evaluation", desc: "Systematic evaluation of LLM capabilities across reasoning, safety, and domain tasks.", image: "/generated/area-genai-eval.png" },
    ],
  },
  {
    bootcamp: "AI High School Research",
    color: "#D97706",
    areas: [
      { title: "Intro to AI & ML", desc: "Foundational concepts in machine learning, neural networks, and data-driven thinking for beginners.", image: "/generated/area-hs-intro.png" },
      { title: "Scientific Method", desc: "Learning to formulate hypotheses, design experiments, and analyze results in AI research.", image: "/generated/area-hs-method.png" },
      { title: "Paper Writing", desc: "Structuring abstracts, methods, results, and discussions for publication-ready academic papers.", image: "/generated/area-hs-writing.png" },
      { title: "AI Ethics", desc: "Understanding bias, fairness, transparency, and societal impacts of artificial intelligence.", image: "/generated/area-hs-ethics.png" },
    ],
  },
];

/* ── Expand-on-hover row for a single bootcamp ── */
function BootcampExpandRow({ br }: { br: BootcampResearch }) {
  const [expanded, setExpanded] = useState(0);

  return (
    <div>
      {/* Heading */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-1 h-7 rounded-full" style={{ backgroundColor: br.color }} />
        <h3 className="text-xl md:text-2xl font-bold text-fg">{br.bootcamp}</h3>
        <span className="text-sm text-fg-muted font-medium">
          {br.areas.length} areas
        </span>
      </div>

      {/* Expand cards row — full width */}
      <div className="flex w-full items-stretch gap-1.5">
        {br.areas.map((area, idx) => {
          const isExpanded = idx === expanded;
          return (
            <div
              key={idx}
              className="relative cursor-pointer overflow-hidden rounded-2xl"
              style={{
                flex: isExpanded ? "6" : "1",
                height: "24rem",
                minWidth: 0,
                transition: "flex 500ms cubic-bezier(0.4, 0, 0.2, 1)",
                backgroundColor: "#0118D8",
              }}
              onMouseEnter={() => setExpanded(idx)}
            >
              {/* Image — always mounted, fades in when expanded */}
              <img
                className="absolute inset-0 w-full h-full object-cover"
                style={{
                  opacity: isExpanded ? 1 : 0,
                  transition: "opacity 400ms ease",
                }}
                src={area.image}
                alt={area.title}
                loading="lazy"
              />

              {/* Dark gradient overlay */}
              <div
                className="absolute inset-0"
                style={{
                  opacity: isExpanded ? 1 : 0,
                  transition: "opacity 400ms ease",
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/10" />
              </div>

              {/* Collapsed: vertical label */}
              <div
                className="absolute inset-0 flex items-center justify-center"
                style={{
                  opacity: isExpanded ? 0 : 1,
                  transition: "opacity 300ms ease",
                }}
              >
                <span
                  className="text-sm font-extrabold uppercase tracking-wider whitespace-nowrap text-white"
                  style={{
                    writingMode: "vertical-rl",
                    textOrientation: "mixed",
                    transform: "rotate(180deg)",
                  }}
                >
                  {area.title}
                </span>
              </div>

              {/* Expanded: full info */}
              <div
                className="absolute bottom-0 left-0 right-0 p-6"
                style={{
                  opacity: isExpanded ? 1 : 0,
                  transition: "opacity 400ms ease 100ms",
                }}
              >
                <div
                  className="inline-block w-8 h-1 rounded-full mb-3"
                  style={{ backgroundColor: br.color }}
                />
                <h4 className="text-xl font-extrabold text-white leading-snug mb-2 drop-shadow-md">
                  {area.title}
                </h4>
                <p className="text-sm font-semibold text-white/90 leading-relaxed line-clamp-3 drop-shadow-sm">
                  {area.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Main section ── */
export default function ResearchAreasGrid() {
  return (
    <section id="research" className="scroll-mt-16 py-24 bg-surface">
      {/* Header — centered */}
      <div className="max-w-7xl mx-auto px-6">
        <AnimatedSection>
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-2.5 text-xs font-semibold uppercase tracking-[0.2em] text-accent">
              <span className="w-8 h-px bg-accent/40" />
              Research Areas
              <span className="w-8 h-px bg-accent/40" />
            </span>
            <h2 className="mt-4 text-4xl md:text-5xl font-bold text-fg mb-5 tracking-tight">
              Areas of Investigation
            </h2>
            <p className="text-lg md:text-xl text-fg-muted max-w-3xl mx-auto leading-relaxed">
              Each bootcamp has dedicated research tracks. Hover to explore the
              focus areas across all six programs.
            </p>
          </div>
        </AnimatedSection>
      </div>

      {/* Cards — same max-width as other sections */}
      <div className="max-w-7xl mx-auto px-6 space-y-20">
        {bootcampResearch.map((br) => (
          <AnimatedSection key={br.bootcamp} className="pt-4">
            <BootcampExpandRow br={br} />
          </AnimatedSection>
        ))}
      </div>
    </section>
  );
}

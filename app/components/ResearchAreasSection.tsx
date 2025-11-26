'use client';

import * as Accordion from '@radix-ui/react-accordion';
import AccordionItem from './AccordionItem';

export default function ResearchAreasSection() {
  const researchAreas = [
    {
      id: 'scientific-ml',
      title: 'Scientific ML',
      description: 'Do LLMs have the ability to solve novel research problems in SciML?',
      topics: ['SciML', 'PINN', 'NeuralODE', 'UDE', 'Symbolic regression'],
    },
    {
      id: 'model-efficiency',
      title: 'Model Efficiency',
      description: 'Can we build a useful SLM with a very small dataset?',
      topics: ['SLM', 'Attention heads', 'MOE', 'Tiny stories', 'Inference'],
    },
    {
      id: 'language-processing',
      title: 'Language Processing',
      description: 'Does repetitive translation create loss in meaning while using LLMs?',
      topics: ['LLM', 'Reasoning', 'Cognition', 'Bias', 'Misinformation', 'XAI', 'RLHF', 'Deepseek clone'],
    },
    {
      id: 'healthcare-ai',
      title: 'Healthcare AI',
      description: 'Can we build a comprehensive epidemiological model for COVID using ML?',
      topics: ['XAI', 'Inference'], // tailor as needed
    },
    {
      id: 'physics-ai',
      title: 'Physics AI',
      description: 'Can we predict droplet impact dynamics using SciML?',
      topics: ['PINN', 'NeuralODE', 'UDE'],
    },
    {
      id: 'optimization',
      title: 'Optimization',
      description: 'Can we generate timetable schedules without conflicts using multi-constraint optimization?',
      topics: ['RL', 'MOE'],
    },
    {
      id: 'chemistry-ai',
      title: 'Chemistry AI',
      description: 'Is it possible to predict effective chemical reaction pathways using ML?',
      topics: ['Symbolic regression', 'SciML', 'UDE'],
    },
  ];

  // Split into two columns
  const leftColumn = researchAreas.filter((_, index) => index % 2 === 0);
  const rightColumn = researchAreas.filter((_, index) => index % 2 === 1);

  return (
    <section id="research-areas" className="mb-20 scroll-mt-20">
      <h2 className="text-3xl font-normal text-gray-900 mb-2 tracking-tight border-b border-gray-300 pb-2">
        Research Areas
      </h2>
      <p className="text-lg text-gray-600 mb-8 leading-relaxed font-light">
        Our research spans multiple domains of AI and ML, from scientific discovery to real-world optimization.
      </p>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Left Column */}
        <Accordion.Root
          type="single"
          collapsible
          defaultValue={leftColumn[0]?.id}
          className="space-y-4"
          aria-label="Left column research areas"
        >
          {leftColumn.map((area) => (
            <AccordionItem
              key={area.id}
              value={area.id}
              title={area.title}
              description={area.description}
              topics={area.topics}
            />
          ))}
        </Accordion.Root>

        {/* Right Column */}
        <Accordion.Root
          type="single"
          collapsible
          defaultValue={rightColumn[0]?.id}
          className="space-y-4"
          aria-label="Right column research areas"
        >
          {rightColumn.map((area) => (
            <AccordionItem
              key={area.id}
              value={area.id}
              title={area.title}
              description={area.description}
              topics={area.topics}
            />
          ))}
        </Accordion.Root>
      </div>
    </section>
  );
}
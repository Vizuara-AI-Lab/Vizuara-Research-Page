"use client";

import * as Accordion from "@radix-ui/react-accordion";

interface AccordionItemProps {
  value: string;
  title: string;
  description: string;
  topics?: string[];
}

export default function AccordionItem({ value, title, description, topics }: AccordionItemProps) {
  return (
    <Accordion.Item value={value} className="rounded-xl border border-border bg-surface overflow-hidden transition-colors hover:border-steel/40">
      <Accordion.Header>
        <Accordion.Trigger className="w-full text-left px-5 py-4 flex justify-between items-center hover:bg-surface-alt/50 transition-colors group cursor-pointer">
          <h3 className="text-sm font-semibold text-fg">{title}</h3>
          <span className="text-steel text-lg transition-transform duration-200 group-data-[state=open]:rotate-45">+</span>
        </Accordion.Trigger>
      </Accordion.Header>
      <Accordion.Content className="overflow-hidden data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
        <div className="px-5 pb-4 border-t border-border">
          <p className="text-fg-muted text-sm leading-relaxed mt-3">{description}</p>
          {topics && topics.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {topics.map((t) => (
                <span key={t} className="rounded-md bg-surface-alt px-2 py-0.5 text-[11px] text-fg-muted font-medium">{t}</span>
              ))}
            </div>
          )}
        </div>
      </Accordion.Content>
    </Accordion.Item>
  );
}

'use client';

import * as Accordion from '@radix-ui/react-accordion';

interface AccordionItemProps {
  value: string;
  title: string;
  description: string;
  topics?: string[];
}

export default function AccordionItem({ value, title, description, topics }: AccordionItemProps) {
  return (
    <Accordion.Item value={value} className="border border-gray-300 hover:cursor-pointer">
      <Accordion.Header className="hover:cursor-pointer">
        <Accordion.Trigger className="w-full text-left px-6 py-4 flex justify-between items-center hover:bg-gray-50 transition-colors group hover:cursor-pointer">
          <h3 className="text-lg font-normal text-gray-900">{title}</h3>
          <span className="text-vblue text-xl transition-transform group-data-[state=open]:rotate-45">+</span>
        </Accordion.Trigger>
      </Accordion.Header>

      <Accordion.Content className="overflow-hidden data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
        <div className="px-6 pb-4 border-t border-gray-200">
          <p className="text-gray-700 leading-relaxed font-light mt-3">{description}</p>

          {topics && topics.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {topics.map((t) => (
                <span
                  key={t}
                  className="rounded-full border border-gray-300 px-3 py-1 text-sm text-gray-700 hover:border-vblue hover:text-vblue transition-colors"
                >
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>
      </Accordion.Content>
    </Accordion.Item>
  );
}
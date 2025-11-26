import { ChevronRightIcon } from "@radix-ui/react-icons";

interface BootcampCardProps {
  title: string;
  level: string;
  duration: string;
  highlights: string;
  participants: string;
  link: string;
  isHighlighted?: boolean;
}

export default function BootcampCard({
  title,
  level,
  duration,
  highlights,
  participants,
  link,
  isHighlighted = false,
}: BootcampCardProps) {
  const base =
    "group relative flex flex-col rounded-lg border-2 overflow-hidden transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vblue";

  const variant = isHighlighted
    ? "border-vblue bg-gradient-to-br from-blue-50/30 to-white"
    : "border-gray-300 hover:border-vblue bg-white";

  return (
    <a
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Bootcamp: ${title}`}
      className={`${base} ${variant}`}
    >
      {/* Top accent bar for highlighted cards */}
      {isHighlighted && (
        <span className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-vblue" />
      )}

      <div className="p-6 flex flex-col grow">
        <h3 className="text-2xl font-normal text-gray-900 tracking-tight mb-6">
          {title}
        </h3>

        {/* Meta: Level / Duration */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-600 font-light mb-1">
              Level
            </p>
            <p className="text-gray-900 font-normal">{level}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-600 font-light mb-1">
              Duration
            </p>
            <p className="text-gray-900 font-normal">{duration}</p>
          </div>
        </div>

        {/* Highlights */}
        <p className="text-gray-700 font-light mb-6">
          <span className={`font-normal ${isHighlighted ? "text-vblue" : "text-gray-900"}`}>
            Key Highlights:
          </span>{" "}
          {highlights}
        </p>

        {/* Footer row */}
        <div className="mt-auto flex items-center justify-between">
          <p className={`text-sm font-normal ${isHighlighted ? "text-vblue" : "text-gray-600"}`}>
            {participants}
          </p>
          <ChevronRightIcon
            className={`transition-transform ${isHighlighted ? "text-vblue" : "text-gray-600"} group-hover:translate-x-1`}
            aria-hidden="true"
          />
        </div>
      </div>
    </a>
  );
}
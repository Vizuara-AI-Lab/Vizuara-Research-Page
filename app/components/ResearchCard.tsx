interface ResearchCardProps {
  category: string;
  title: string;
  authors: string;
  publication?: string;
  paperLink?: string;
  imageUrl?: string;
}

export default function ResearchCard({
  category,
  title,
  authors,
  publication,
  paperLink,
  imageUrl,
}: ResearchCardProps) {
  return (
    <article className="relative overflow-hidden rounded-md border-l-2 border-gray-300 bg-white transition-colors hover:border-vblue">
      <div className="p-6 flex gap-4">
        {/* Text */}
        <div className="flex-1">
          {/* Category badge */}
          <div className="inline-flex items-center rounded-full border border-gray-300 px-2.5 py-0.5 text-xs text-gray-700">
            {category}
          </div>

          {/* Title */}
          <h3 className="mt-3 text-lg sm:text-xl font-normal text-gray-900 leading-snug">
            {title}
          </h3>

          {/* Authors */}
          <p className="mt-2 text-gray-600 font-light text-sm">
            Authors: {authors}
          </p>

          {/* Meta + link */}
          <div className="mt-3 flex items-center justify-between gap-4">
            <p className="text-gray-700 font-light text-sm">{publication}</p>
            {paperLink && (
              <a
                href={paperLink}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Read paper: ${title}`}
                className="text-sm text-vblue hover:opacity-90 underline underline-offset-4 font-light whitespace-nowrap"
              >
                Read Paper →
              </a>
            )}
          </div>
        </div>

        {/* Thumb */}
        <div className="w-24 h-24 md:w-28 md:h-28 shrink-0 overflow-hidden rounded bg-gray-100">
          {imageUrl ? (
            paperLink ? (
              <a
                href={paperLink}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Open paper: ${title}`}
                className="block h-full w-full"
              >
                <img
                  src={imageUrl}
                  alt={title}
                  className="h-full w-full object-cover"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
              </a>
            ) : (
              <img
                src={imageUrl}
                alt={title}
                className="h-full w-full object-cover"
                loading="lazy"
                referrerPolicy="no-referrer"
              />
            )
          ) : (
            <div className="grid h-full w-full place-items-center text-gray-400 text-xs uppercase">
              No image
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
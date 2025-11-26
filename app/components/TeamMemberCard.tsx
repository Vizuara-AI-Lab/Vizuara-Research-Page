// components/TeamMemberCard.tsx
interface TeamMemberCardProps {
  name: string;
  title: string;
  education: string;
  imageUrl: string;
  linkedInUrl: string;
}

export default function TeamMemberCard({
  name,
  title,
  education,
  imageUrl,
  linkedInUrl,
}: TeamMemberCardProps) {
  return (
    <div className="text-center">
      <div className="mx-auto mb-4 h-40 w-40 overflow-hidden rounded-full border-2 border-vblue transition group-hover:scale-[1.01]">
        <img
          src={imageUrl}
          alt={name}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      </div>
      <h4 className="mb-1 text-lg font-normal text-gray-900">{name}</h4>
      <p className="mb-2 text-sm font-light text-gray-600">{title}</p>
      <p className="mb-3 text-sm font-light text-gray-700">{education}</p>
      <a
        href={linkedInUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm text-vblue hover:underline"
      >
        LinkedIn →
      </a>
    </div>
  );
}
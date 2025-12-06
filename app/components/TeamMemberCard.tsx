interface TeamMemberCardProps {
  name: string;
  title: string;
  education?: string;
  imageUrl?: string;
  linkedInUrl?: string;
  small?: boolean;
}

export default function TeamMemberCard({
  name,
  title,
  education,
  imageUrl,
  linkedInUrl,
  small = false,
}: TeamMemberCardProps) {
  // Create initials avatar fallback
  const initials = name
    ? name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "U";

  const avatarFallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(
    initials
  )}&background=0D8ABC&color=fff&size=200`;

  const finalImage =
    imageUrl && imageUrl.trim() !== "" ? imageUrl : avatarFallback;

  return (
    <div
      className={`text-center ${
        small ? "scale-90" : ""
      } transition-transform hover:scale-[1.02]`}
    >
      <div
        className={`mx-auto mb-3 overflow-hidden rounded-full border-2 border-vblue 
          ${small ? "h-28 w-28" : "h-40 w-40"}`}
      >
        <img
          src={finalImage}
          alt={name}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      </div>

      <h4
        className={`font-medium text-gray-900 ${small ? "text-sm" : "text-lg"}`}
      >
        {name}
      </h4>

      <p
        className={`font-light text-gray-600 ${small ? "text-xs" : "text-sm"}`}
      >
        {title}
      </p>

      {education && (
        <p
          className={`text-gray-700 mt-1 ${small ? "text-[10px]" : "text-sm"}`}
        >
          {education}
        </p>
      )}

      {linkedInUrl && (
        <a
          href={linkedInUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`block mt-2 text-vblue hover:underline ${
            small ? "text-xs" : "text-sm"
          }`}
        >
          LinkedIn →
        </a>
      )}
    </div>
  );
}

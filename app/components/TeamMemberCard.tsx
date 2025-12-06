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
 
  const initials = name
    ? name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "U";

  const fallbackAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(
    initials
  )}&background=0D8ABC&color=fff&size=200&rounded=true`;

  const avatar = imageUrl && imageUrl.trim() !== "" ? imageUrl : fallbackAvatar;

  return (
    <div className="text-center flex flex-col items-center">
      {/* Avatar container */}
      <div
        className={`rounded-full overflow-hidden border-2 border-vblue mb-4 
          flex items-center justify-center
          ${small ? "h-28 w-28" : "h-40 w-40"}`}
      >
        <img
          src={avatar}
          alt={name}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      </div>

      {/* Name */}
      <h4
        className={`font-medium text-gray-900 mb-1 
          ${small ? "text-sm" : "text-lg"}`}
      >
        {name}
      </h4>

      {/* Position */}
      <p
        className={`text-gray-600 font-light 
          ${small ? "text-xs" : "text-sm"}`}
      >
        {title}
      </p>

      {/* Education */}
      {education && (
        <p
          className={`mt-1 text-gray-700 font-light
            ${small ? "text-[10px]" : "text-xs"}`}
        >
          {education}
        </p>
      )}

      {/* LinkedIn */}
      {linkedInUrl && (
        <a
          href={linkedInUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`mt-3 text-vblue hover:underline 
            ${small ? "text-xs" : "text-sm"}`}
        >
          LinkedIn →
        </a>
      )}
    </div>
  );
}

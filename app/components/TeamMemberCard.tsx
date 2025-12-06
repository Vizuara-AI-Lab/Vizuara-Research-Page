import { FaLinkedin } from "react-icons/fa6";
import { SiGooglescholar } from "react-icons/si";

interface TeamMemberCardProps {
  name: string;
  title: string;
  education?: string;
  imageUrl?: string;
  scholarUrl?: string;
  linkedInUrl?: string;
  small?: boolean;
}

export default function TeamMemberCard({
  name,
  title,
  education,
  imageUrl,
  scholarUrl,
  linkedInUrl,
  small = false,
}: TeamMemberCardProps) {
  // --- Fun dynamic avatar backgrounds ---
  const pastelColors = [
    "06B6D4", // cyan
    "3B82F6", // blue
    "8B5CF6", // violet
    "EC4899", // pink
    "F59E0B", // orange
    "10B981", // emerald
    "F43F5E", // rose
  ];
  const colorIndex = name
    ? name.charCodeAt(0) % pastelColors.length
    : Math.floor(Math.random() * pastelColors.length);
  const bgColor = pastelColors[colorIndex];

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
  )}&background=${bgColor}&color=fff&size=240&rounded=true`;

  const avatar = imageUrl && imageUrl.trim() !== "" ? imageUrl : fallbackAvatar;

  // --- Layout ---
  return (
    <div
      className={`flex flex-col items-center text-center rounded-xl   hover:shadow-md transition-shadow duration-300 p-4 bg-white`}
    >
      {/* Avatar */}
      <div
        className={`rounded-full overflow-hidden border-2 border-vblue
          flex items-center justify-center mb-4
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
        className={`font-semibold text-gray-900 mb-1 
          ${small ? "text-sm" : "text-lg"}`}
      >
        {name}
      </h4>

      {/* Role/Title */}
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

      {/* Social icons */}
      <div className="flex items-center justify-center gap-4 mt-3">
        {linkedInUrl && (
          <a
            href={linkedInUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`text-[#0A66C2] hover:opacity-80 ${
              small ? "text-lg" : "text-xl"
            }`}
            aria-label="LinkedIn"
          >
            <FaLinkedin />
          </a>
        )}
        {scholarUrl && (
          <a
            href={scholarUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`text-[#4285F4] hover:opacity-80 ${
              small ? "text-lg" : "text-xl"
            }`}
            aria-label="Google Scholar"
          >
            <SiGooglescholar />
          </a>
        )}
      </div>
    </div>
  );
}

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
  const pastelColors = ["6B7280", "7C3AED", "0891B2", "059669", "D97706", "DC2626", "2563EB"];
  const colorIndex = name ? name.charCodeAt(0) % pastelColors.length : 0;
  const bgColor = pastelColors[colorIndex];

  const initials = name
    ? name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
    : "U";

  const fallbackAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=${bgColor}&color=fff&size=240&rounded=true`;
  const avatar = imageUrl?.trim() ? imageUrl : fallbackAvatar;

  return (
    <div className="flex flex-col items-center text-center p-2">
      <div
        className={`rounded-full overflow-hidden ring-2 ring-border ring-offset-2 ring-offset-surface mb-3 ${
          small ? "h-20 w-20" : "h-28 w-28"
        }`}
      >
        <img src={avatar} alt={name} className="h-full w-full object-cover" loading="lazy" />
      </div>

      <h4 className={`font-semibold text-fg ${small ? "text-xs" : "text-sm"}`}>{name}</h4>
      <p className={`text-fg-muted ${small ? "text-[10px]" : "text-xs"} mt-0.5`}>{title}</p>
      {education && (
        <p className={`text-fg-muted/60 ${small ? "text-[9px]" : "text-[10px]"} mt-0.5`}>{education}</p>
      )}

      <div className="flex items-center justify-center gap-3 mt-2">
        {linkedInUrl && (
          <a href={linkedInUrl} target="_blank" rel="noopener noreferrer" className="text-steel hover:text-fg transition-colors" aria-label="LinkedIn">
            <FaLinkedin className={small ? "w-3.5 h-3.5" : "w-4 h-4"} />
          </a>
        )}
        {scholarUrl && (
          <a href={scholarUrl} target="_blank" rel="noopener noreferrer" className="text-steel hover:text-fg transition-colors" aria-label="Google Scholar">
            <SiGooglescholar className={small ? "w-3.5 h-3.5" : "w-4 h-4"} />
          </a>
        )}
      </div>
    </div>
  );
}

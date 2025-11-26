interface SidebarProps {
  activeSection: string;
  onSectionClick: (sectionId: string) => void;
}

export default function Sidebar({ activeSection, onSectionClick }: SidebarProps) {
  const navItems = [
    { id: 'overview', label: 'Overview' },
    { id: 'team', label: 'Team' },
    { id: 'research-areas', label: 'Research Areas' },
    { id: 'impact', label: 'Impact' },
    { id: 'publications', label: 'Publications' },
    { id: 'junior-research', label: 'Junior Research' },
    { id: 'bootcamps', label: 'Bootcamps' },
  ];

  return (
    <nav className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-56 border-r border-gray-300 bg-white p-6 hidden lg:block">
      <div className="sticky top-8">
        <h2 className="text-xs font-medium text-gray-700 mb-5 tracking-wider uppercase">
          Contents
        </h2>
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gray-200"></div>
          
          <ul className="space-y-1 relative">
            {navItems.map((item) => (
              <li key={item.id} className="relative">
                {/* Active/Hover indicator line segment */}
                <div 
                  className={`absolute left-0 top-0 bottom-0 w-0.5 transition-all duration-200 ${
                    activeSection === item.id 
                      ? 'bg-[#2596be]' 
                      : 'bg-transparent hover:bg-gray-400'
                  }`}
                ></div>
                <button
                  onClick={() => onSectionClick(item.id)}
                  className={`
                    text-left w-full px-4 py-1.5 text-sm transition-all duration-200 relative
                    ${activeSection === item.id 
                      ? 'text-[#2596be] font-normal' 
                      : 'text-gray-600 hover:text-gray-900 font-light'
                    }
                  `}
                >
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </nav>
  );
}

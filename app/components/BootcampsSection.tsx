import BootcampCard from './BootcampCard';

interface SmallStatCardProps {
  value: string;
  label: string;
}

function SmallStatCard({ value, label }: SmallStatCardProps) {
  return (
    <div className="rounded-lg bg-gray-50 border border-gray-300 p-6 text-center transition-shadow hover:shadow-md">
      <div className="text-3xl font-normal text-gray-900 mb-1">{value}</div>
      <div className="text-gray-700 font-light text-sm">{label}</div>
    </div>
  );
}

export default function BootcampsSection() {
  const bootcamps = [
   {
  title: 'Reinforcement Learning Research Bootcamp',
  level: 'Intermediate to Advanced',
  duration: '7 weeks of intensive foundations + 3 months of hands-on research',
  highlights:
    'Comprehensive program to write high-quality research papers in Reinforcement Learning',
  participants: 'Open for applications',
  link: 'https://rlresearcherbootcamp.vizuara.ai/',
  isHighlighted: true,
},
    {
      title: 'Scientific Machine Learning Bootcamp',
      level: 'Advanced',
      duration: '4 months',
      highlights: 'PINNs, Scientific Computing, Publication Guidance',
      participants: '80+ Participants',
      link: 'https://flyvidesh.online/ml-bootcamp/',
      isHighlighted: true,
    },
    {
      title: 'ML/DL Research Bootcamp',
      level: 'Intermediate to Advanced',
      duration: '4 months',
      highlights:
        'Deep Learning Architectures, Research Papers, Industry Applications',
      participants: '30+ Participants',
      link: 'https://flyvidesh.online/ml-dl-bootcamp/',
      isHighlighted: true,
    },
    {
      title: 'Gen AI Professional Bootcamp',
      level: 'Professional',
      duration: '4 months',
      highlights:
        'Advanced Model Architectures, Research Methodologies, Novel Algorithm Development',
      participants: '40+ Participants',
      link: 'https://flyvidesh.online/gen-ai-professional-bootcamp/',
      isHighlighted: true,
    },
    {
      title: 'AI High School Research Bootcamp',
      level: 'Beginner to Intermediate',
      duration: '8 weeks',
      highlights: 'Research Fundamentals, Mentorship, College Prep',
      participants: '25+ Participants',
      link: 'https://ai-highschool-research.vizuara.ai/',
      isHighlighted: true,
    },
  ];

  const stats = [
    { value: '5', label: 'Specialized Programs' }, // updated count
    { value: '120+', label: 'Participants Trained' },
    { value: '15+', label: 'Research Publications' },
  ];

  return (
    <section id="bootcamps" className="mb-20 scroll-mt-20" aria-labelledby="bootcamps-title">
      {/* Header */}
      <div className="mb-4">
        <div className="inline-flex items-center gap-2 rounded-full border border-gray-300 px-3 py-1 text-xs text-gray-700">
          <span className="h-2 w-2 rounded-full bg-vblue" />
          Programs
        </div>
        <h2 id="bootcamps-title" className="mt-3 text-3xl font-normal text-gray-900 tracking-tight">
          Research Bootcamps
        </h2>
        <p className="text-lg text-gray-600 mt-2 mb-6 leading-relaxed font-light">
          Intensive training programs designed to accelerate your journey in AI and ML research.
        </p>
      </div>

      {/* Bootcamp cards */}
      <div className="grid gap-6 md:grid-cols-2 mb-10">
        {bootcamps.map((b, i) => (
          <BootcampCard key={i} {...b} />
        ))}
      </div>

      {/* Stats panel */}
      <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-blue-50/30 to-transparent p-6 md:p-8 mb-6">
        <div className="grid gap-4 md:grid-cols-3">
          {stats.map((s, i) => (
            <SmallStatCard key={i} value={s.value} label={s.label} />
          ))}
        </div>
      </div>

      {/* CTA */}
      <a
        href="mailto:contact@vizuara.ai?subject=Bootcamp Enrollment Inquiry"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex w-full md:w-auto items-center justify-center px-8 py-3 rounded-md bg-vblue text-white font-normal hover:opacity-90 transition-colors shadow-md hover:shadow-lg"
      >
        Contact Us for Enrollment →
      </a>
    </section>
  );
}
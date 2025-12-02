import ResearchCard from './ResearchCard';

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

export default function JuniorResearchSection() {
  const researchProjects = [
    {
      category: 'Scientific ML',
      title:
        'A Scientific Machine Learning Approach for Predicting and Forecasting Battery Degradation in Electric Vehicles',
      authors:
        'Sharv Murgai, Hrishikesh Bhagwat, Raj Abhijit Dandekar, Rajat Dandekar, Sreedath Panat',
      publication: undefined,
      paperLink: 'https://arxiv.org/abs/2410.14347',
      imageUrl:
        'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=600&h=400&fit=crop',
    },
    {
      category: 'Machine Learning',
      title:
        'Enhancing Music Recommendation Systems with Regional Tune Recognition',
      authors: 'Tilak Bhimrajka, Sanchita Goel, Omkar Nitin Lalla',
      publication: 'Published in: Journal of Emerging Investigators (2024)',
      paperLink: undefined,
      imageUrl:
        'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=600&h=400&fit=crop',
    },
    {
      category: 'Aerospace AI',
      title:
        'A Systematic Review and Analysis of Machine Learning Models in Liquid Rocket Engine Control',
      authors: 'Malhar Gandho',
      publication: 'Published in: Journal of Student Research (2024)',
      paperLink:
        'https://www.jsr.org/hs/index.php/path/article/view/7649',
      imageUrl:
        'https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?w=600&h=400&fit=crop',
    },
    {
      category: 'Computer Vision',
      title:
        'Comparing Rice Leaf Disease Detection Accuracy of AI Models',
      authors: 'Avani Gupta, Vidhi Singhal, Deepti Vaidya',
      publication: 'Status: Under Review (2024)',
      paperLink: undefined,
      imageUrl:
        'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=600&h=400&fit=crop',
    },
    {
      category: 'Environmental AI',
      title:
        'Enhanced Modeling of Harmful Algal Bloom (HAB) Growth Using Scientific Machine Learning',
      authors: 'Kaizar Rangwala',
      publication: 'Published in: MIT URTC Conference Poster (2024)',
      paperLink: undefined,
      imageUrl:
        'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=600&h=400&fit=crop',
    },
  ];

  const stats = [
    { value: '10', label: 'Research Papers' },
    { value: '15+', label: 'Active Projects' },
    { value: '30+', label: 'Program Participants' },
  ];

  return (
    <section id="junior-research" className="mb-20 scroll-mt-20" aria-labelledby="jr-title">
      {/* Header */}
      <div className="mb-4">
        <div className="inline-flex items-center gap-2 rounded-full border border-gray-300 px-3 py-1 text-xs text-gray-700">
          <span className="h-2 w-2 rounded-full bg-vblue" />
          Student Research
        </div>
        <h2 id="jr-title" className="mt-3 text-3xl font-normal text-gray-900 tracking-tight">
          Junior Research
        </h2>
        <p className="text-lg text-gray-600 mt-2 mb-6 leading-relaxed font-light">
          Student research from our AI High School Program.
        </p>
      </div>

      {/* Projects */}
      <div className="grid md:grid-cols-2 gap-6 mb-10">
        {researchProjects.map((project, index) => (
          <ResearchCard
            key={index}
            category={project.category}
            title={project.title}
            authors={project.authors}
            publication={project.publication}
            paperLink={project.paperLink}
            imageUrl={project.imageUrl}
          />
        ))}
      </div>

      {/* Stats panel */}
      <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-blue-50/30 to-transparent p-6 md:p-8 mb-6">
        <div className="grid gap-4 md:grid-cols-3">
          {stats.map((stat, index) => (
            <SmallStatCard key={index} value={stat.value} label={stat.label} />
          ))}
        </div>
      </div>

      {/* CTA (anchor styled as button) */}
      <a
        href="https://ai-highschool-research.vizuara.ai/"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex w-full md:w-auto items-center justify-center px-8 py-3 rounded-md bg-vblue text-white font-normal hover:opacity-90 transition-colors shadow-md hover:shadow-lg"
      >
        Join Our Program →
      </a>
    </section>
  );
}
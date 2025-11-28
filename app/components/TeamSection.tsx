import TeamMemberCard from "./TeamMemberCard";

export default function TeamSection() {
  const coFounders = [
    {
      name: "Dr. Raj Dandekar",
      title: "Co-founder",
      education: "PhD, MIT | B.Tech, IIT Madras",
      imageUrl:
        "https://www.vizuara.com/lovable-uploads/6bb7f718-7a63-42f1-9839-3a8b15bdacec.png",
      linkedInUrl: "https://www.linkedin.com/in/raj-abhijit-dandekar-67a33118a",
    },
    {
      name: "Dr. Rajat Dandekar",
      title: "Co-founder",
      education: "PhD, Purdue | B.Tech, IIT Madras",
      imageUrl:
        "https://www.vizuara.com/lovable-uploads/93d168b8-3f90-4854-8ccb-1e39ae2a3b4c.png",
      linkedInUrl: "https://www.linkedin.com/in/rajat-dandekar-901324b1",
    },
    {
      name: "Dr. Sreedath Panat",
      title: "Co-founder",
      education: "PhD, MIT | B.Tech, IIT Madras",
      imageUrl:
        "https://www.vizuara.com/lovable-uploads/1cb0b8c2-ad88-4e95-879b-b0cae6ae9ecb.png",
      linkedInUrl: "https://www.linkedin.com/in/sreedath-panat",
    },
  ];

  // Fill these with your real team members (ensure unique linkedInUrl or add an `id` field)
  const teamMembers = [
    {
      name: "Pritam Kudale",
      title: "AI ML Researcher",
      education: "AI/ML Research ",
      imageUrl:
        "https://research.vizuara.ai/lovable-uploads/5075f0a6-f761-4a0d-b487-754211e5acf0.png",
      linkedInUrl: "https://www.linkedin.com/in/pritam-kudale/",
    },
    {
      name: "Vikash Chandra Mishra ",
      title: "AI ML Researcher",
      education: "Machine Learning",
      imageUrl:
        "https://research.vizuara.ai/lovable-uploads/1f29e0b6-c186-4834-85da-f500f2adefcc.png",
      linkedInUrl:
        "https://www.linkedin.com/in/vikash-chandra-mishra-3362a222a/",
    },
    {
      name: "Prathamesh Joshi",
      title: "AI ML Researcher",
      education: "Scientific Machine Learning",
      imageUrl:
        "https://i0.wp.com/vizuara.ai/wp-content/uploads/2024/08/17.png?w=1200&ssl=1",
      linkedInUrl: "https://www.linkedin.com/in/prathamesh-joshi-b49b31242/",
    },
    {
      name: "Abraar ",
      title: "AI ML Researcher",
      education: "AI/ML Researcher",
      imageUrl:
        "https://research.vizuara.ai/lovable-uploads/a274be4e-0d9f-4daf-9b07-54284e35c00c.png",
      linkedInUrl: "https://www.linkedin.com/in/mohammed-abraar03/",
    },
  ];

  return (
    <section
      id="team"
      className="mb-20 scroll-mt-20"
      aria-labelledby="team-title"
    >
      {/* Section header */}
      <div className="mb-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-gray-300 px-3 py-1 text-xs text-gray-700">
          <span className="h-2 w-2 rounded-full bg-vblue" />
          Lab leadership
        </div>
        <h2
          id="team-title"
          className="mt-3 text-3xl font-normal text-gray-900 tracking-tight"
        >
          Team
        </h2>
        <p className="mt-2 text-gray-600 font-light">
          We’re an interdisciplinary group with roots in MIT, Purdue, and IIT
          Madras, working across scientific ML, model efficiency, and applied
          AI.
        </p>

        {/* Quick jump */}
        <div className="mt-3 flex flex-wrap gap-2 text-sm">
          <a
            href="#founders"
            className="rounded-full border border-gray-300 px-3 py-1 text-gray-700 hover:border-vblue hover:text-vblue transition-colors"
          >
            Founders
          </a>
          {teamMembers.length > 0 && (
            <a
              href="#core-team"
              className="rounded-full border border-gray-300 px-3 py-1 text-gray-700 hover:border-vblue hover:text-vblue transition-colors"
            >
              Team
            </a>
          )}
        </div>
      </div>

      {/* Founders */}
      <div id="founders" className="mb-10">
        <h3 className="text-2xl font-normal text-gray-900 mb-6">Founders</h3>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {coFounders.map((member, idx) => (
            <article
              key={`founder-${member.linkedInUrl || member.name || idx}`}
              className="rounded-lg border border-gray-300 bg-white p-6 text-center transition hover:border-vblue hover:shadow-md"
            >
              <TeamMemberCard {...member} small={false} />
            </article>
          ))}
        </div>
      </div>

      {/* Core Team */}
      {teamMembers.length > 0 && (
        <div id="core-team" className="mb-10">
          <h3 className="text-2xl font-normal text-gray-900 mb-6">Team</h3>
          <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {teamMembers.map((member, idx) => (
              <article
                key={`team-${member.linkedInUrl || member.name || idx}`}
                className="rounded-lg border border-gray-300 bg-white p-2 text-center transition hover:border-vblue hover:shadow-md"
              >
                <TeamMemberCard {...member} small />
              </article>
            ))}
          </div>
        </div>
      )}

      {/* Optional CTA */}
      <div className="mt-8 flex flex-wrap items-center gap-3">
        <a
          href="/publications"
          className="inline-flex items-center rounded-md bg-vblue px-4 py-2 text-white hover:opacity-90"
        >
          See recent publications →
        </a>
        <a
          href="/junior-research"
          className="inline-flex items-center rounded-md border border-vblue px-4 py-2 text-vblue hover:bg-blue-50/50"
        >
          Explore student research
        </a>
      </div>
    </section>
  );
}

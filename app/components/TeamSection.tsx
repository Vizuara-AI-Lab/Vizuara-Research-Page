"use client";

import { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { clientDb } from "@/app/lib/firebaseClient";
import TeamMemberCard from "./TeamMemberCard";
import AnimatedSection from "./AnimatedSection";
import { motion } from "framer-motion";
import { FaLinkedin, FaGraduationCap } from "react-icons/fa6";

type TeamMember = {
  id: string;
  name: string;
  title: string;
  education?: string;
  linkedInUrl?: string;
  imageUrl?: string;
  published?: boolean;
  scholarUrl?: string;
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-fg-muted">
      <span className="w-6 h-px bg-steel" />
      {children}
    </span>
  );
}

const FOUNDERS = [
  {
    name: "Dr. Raj Dandekar",
    role: "Co-founder, Vizuara AI Labs",
    badge: "MIT PhD",
    photo: "/instructors/Raj.jpeg",
    bio: "PhD from MIT, B.Tech from IIT Madras. Dr. Raj specializes in building LLMs from scratch, including DeepSeek-style architectures. His expertise spans AI agents, scientific machine learning, and end-to-end model development.",
    topics: ["GenAI", "LLMs", "AI Agents", "RAG", "SLMs"],
    unis: [
      { name: "MIT", logo: "/instructors/mit-logo.png" },
      { name: "IIT Madras", logo: "/instructors/iitmadras-logo.png" },
    ],
    linkedin: "https://www.linkedin.com/in/raj-abhijit-dandekar-67a33118a/",
    scholar: "https://scholar.google.com/citations?user=xTLUWMIAAAAJ&hl=en",
  },
  {
    name: "Dr. Sreedath Panat",
    role: "Co-founder, Vizuara AI Labs",
    badge: "MIT PhD",
    photo: "/instructors/SreedathP.png",
    bio: "PhD from MIT, B.Tech from IIT Madras. 10+ years of research experience. Dr. Panat brings deep technical expertise from both academia and industry to make complex AI concepts accessible and practical.",
    topics: ["Computer Vision", "ML Foundations", "Scientific ML"],
    unis: [
      { name: "MIT", logo: "/instructors/mit-logo.png" },
      { name: "IIT Madras", logo: "/instructors/iitmadras-logo.png" },
    ],
    linkedin: "https://in.linkedin.com/in/sreedath-panat",
    scholar: "https://scholar.google.com/citations?user=qq8OirYAAAAJ&hl=en",
  },
  {
    name: "Dr. Rajat Dandekar",
    role: "Co-founder, Vizuara AI Labs",
    badge: "Purdue PhD",
    photo: "/instructors/Rajat.png",
    bio: "PhD from Purdue University, B.Tech and M.Tech from IIT Madras. Dr. Rajat brings deep expertise in reinforcement learning and reasoning models, focusing on advanced AI techniques for real-world applications.",
    topics: ["Reinforcement Learning", "RLHF", "Reasoning Models"],
    unis: [
      { name: "Purdue", logo: "/instructors/purdue-logo.png" },
      { name: "IIT Madras", logo: "/instructors/iitmadras-logo.png" },
    ],
    linkedin: "https://www.linkedin.com/in/rajat-dandekar-901324b1/",
    scholar: "https://scholar.google.com/citations?user=bU7G7K8AAAAJ&hl=en",
  },
];

const RESEARCHERS = [
  {
    name: "Prathamesh Joshi",
    photo: "https://media.licdn.com/dms/image/v2/D5603AQGh4Xubppy3nQ/profile-displayphoto-shrink_400_400/B56ZcGret3GoAs-/0/1748163756447?e=1778112000&v=beta&t=vFO5M9QHm0aqwZIY7rFCS9szxmsJv06qXGeXMwPN-GQ",
    role: "Lead Research Scientist, Vizuara",
    work: "NeurIPS Workshops, ICLR, JuliaCon, AAAI Workshops",
  },
  {
    name: "Mayank Pratap Singh",
    photo: "https://media.licdn.com/dms/image/v2/D5603AQEuCepvo7Zg8Q/profile-displayphoto-shrink_200_200/profile-displayphoto-shrink_200_200/0/1718224107918?e=1778112000&v=beta&t=PphHXFwJnngN_VE74k6uGuxrJH4ippn6p_HUugj-U8Q",
    role: "AI Researcher @Vizuara",
  },
  {
    name: "Vikash Chandra Mishra",
    photo: "https://media.licdn.com/dms/image/v2/D4D03AQFn-QQJTucx0A/profile-displayphoto-shrink_200_200/B4DZUZxOsuG8AY-/0/1739894093468?e=1778112000&v=beta&t=lvQZsCJeq9Zw_DTVBMp_5-PxBT-c9nbSmststFzNHSU",
    role: "AI Researcher @Vizuara",
  },
  {
    name: "Naman Dwivedi",
    photo: "https://media.licdn.com/dms/image/v2/D5603AQHxGRiKjlhgAg/profile-displayphoto-shrink_200_200/profile-displayphoto-shrink_200_200/0/1722351538133?e=1778112000&v=beta&t=ABVuHhjboBOIASb9UFED98_GyZh5jJK5zwy63YtdyUc",
    role: "AI Researcher @Vizuara",
  },
  {
    name: "Mohammed Abraar",
    photo: "https://media.licdn.com/dms/image/v2/D4D03AQHJVKmPeyf5ig/profile-displayphoto-shrink_400_400/B4DZXMBTeoHkAg-/0/1742884649496?e=1778112000&v=beta&t=jX2_XhocztFVox_Mq_8c1kewL-LXSkdSHUauDae0ZCI",
    role: "AI Researcher @Vizuara",
    work: "ICLR, EACL Workshops",
  },
];

export default function TeamSection() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTeam() {
      try {
        setLoading(true);
        const membersSnap = await getDocs(collection(clientDb, "teamMembers"));
        setTeamMembers(
          membersSnap.docs
            .map((d) => ({ id: d.id, ...(d.data() as Omit<TeamMember, "id">) }))
            .filter((m) => m.published !== false)
        );
      } catch (err) {
        console.error(err);
        setError("Team data is temporarily unavailable.");
      } finally {
        setLoading(false);
      }
    }
    fetchTeam();
  }, []);

  return (
    <div>
      <AnimatedSection>
        <SectionLabel>Team</SectionLabel>
        <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-fg tracking-tight leading-tight">
          Our Team
        </h2>
        <p className="mt-3 text-fg-muted leading-relaxed max-w-2xl">
          An interdisciplinary group with roots in MIT, Purdue, and IIT Madras.
        </p>
      </AnimatedSection>

      {/* Founders — rich cards */}
      <div className="mt-10">
        <h3 className="text-sm font-semibold text-fg-muted uppercase tracking-wider mb-6">Founders</h3>
        <div className="grid gap-8 md:grid-cols-3">
          {FOUNDERS.map((f, i) => (
            <motion.div
              key={f.name}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
            >
              <div className="rounded-2xl border border-border bg-surface p-6 h-full flex flex-col items-center text-center transition-all hover:shadow-lg hover:border-teal/30">
                {/* Photo */}
                <div className="relative mb-4">
                  <img
                    src={f.photo}
                    alt={f.name}
                    className="w-28 h-28 rounded-full object-cover border-2 border-border"
                  />
                  <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-[10px] font-bold uppercase tracking-wider bg-accent text-white px-3 py-0.5 rounded-full whitespace-nowrap">
                    {f.badge}
                  </span>
                </div>

                {/* Topics */}
                <div className="flex flex-wrap justify-center gap-1.5 mt-3 mb-3">
                  {f.topics.map((t) => (
                    <span key={t} className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-surface-alt text-fg-muted">
                      {t}
                    </span>
                  ))}
                </div>

                {/* Name & Role */}
                <h3 className="text-lg font-bold text-fg">{f.name}</h3>
                <p className="text-sm text-teal font-medium mb-3">{f.role}</p>

                {/* Bio */}
                <p className="text-sm text-fg-muted leading-relaxed mb-5 grow">{f.bio}</p>

                {/* University logos */}
                <div className="flex items-center justify-center gap-4 mb-5">
                  {f.unis.map((u) => (
                    <div key={u.name} className="flex items-center gap-1.5">
                      <img src={u.logo} alt={u.name} className="h-6 w-auto object-contain" />
                      <span className="text-xs text-fg-muted font-medium">{u.name}</span>
                    </div>
                  ))}
                </div>

                {/* Links */}
                <div className="flex items-center gap-3 pt-4 border-t border-border w-full justify-center">
                  <a href={f.linkedin} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-fg-muted hover:text-teal transition-colors">
                    <FaLinkedin className="w-3.5 h-3.5" /> LinkedIn
                  </a>
                  <a href={f.scholar} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-fg-muted hover:text-teal transition-colors">
                    <FaGraduationCap className="w-3.5 h-3.5" /> Scholar
                  </a>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Researchers */}
      <div className="mt-12">
        <h3 className="text-sm font-semibold text-fg-muted uppercase tracking-wider mb-6">Researchers</h3>
        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          {RESEARCHERS.map((r, i) => (
            <motion.div
              key={r.name}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: i * 0.06 }}
              className="rounded-2xl border border-border bg-surface p-5 text-center transition-all hover:shadow-md hover:border-teal/30 flex flex-col items-center"
            >
              <img
                src={r.photo}
                alt={r.name}
                referrerPolicy="no-referrer"
                className="w-24 h-24 rounded-full object-cover border-2 border-border mb-3"
              />
              <h4 className="text-sm font-semibold text-fg leading-snug">{r.name}</h4>
              {r.role && (
                <p className="text-xs text-teal font-medium mt-1">{r.role}</p>
              )}
              {r.work && (
                <p className="text-xs text-fg-muted mt-2 leading-relaxed">{r.work}</p>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Collaborators (bootcamp students) */}
      {loading && (
        <div className="mt-12 flex items-center gap-3 text-fg-muted text-sm">
          <div className="h-4 w-4 border-2 border-steel border-t-transparent rounded-full animate-spin" />
          Loading collaborators...
        </div>
      )}

      {error && <p className="mt-12 text-red-500 text-sm">{error}</p>}

      {!loading && teamMembers.length > 0 && (
        <div className="mt-12">
          <h3 className="text-sm font-semibold text-fg-muted uppercase tracking-wider mb-6">Collaborators</h3>
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {teamMembers.map((member, i) => (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: i * 0.04 }}
                className="rounded-xl border border-border bg-surface p-3 text-center transition-all hover:shadow-md hover:border-steel/40"
              >
                <TeamMemberCard {...member} small />
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

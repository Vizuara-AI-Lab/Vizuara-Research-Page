"use client";

import { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { clientDb } from "@/app/lib/firebaseClient";
import TeamMemberCard from "./TeamMemberCard";

// Optional type for safety
type TeamMember = {
  id: string;
  name: string;
  title: string;
  education?: string;
  linkedInUrl?: string;
  imageUrl?: string;
  published?: boolean;
};

export default function TeamSection() {
  const [founders, setFounders] = useState<TeamMember[]>([])
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTeam() {
      try {
        setLoading(true);

        const founderSnap = await getDocs(collection(clientDb, "founders")); // 🔥 client DB
        const membersSnap = await getDocs(collection(clientDb, "teamMembers")); // 🔥 correct collection

        const foundersData = founderSnap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<TeamMember, "id">),
        }));

        const membersData = membersSnap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<TeamMember, "id">),
        }));

        // Only show published members
        setFounders(foundersData.filter((m) => m.published !== false));
        setTeamMembers(membersData.filter((m) => m.published !== false));
      } catch (err) {
        console.error(err);
        setError("Failed to load team. Please try again later.");
      } finally {
        setLoading(false);
      }
    }

    fetchTeam();
  }, []);

  // Loading UI
  if (loading) {
    return (
      <section id="team" className="mb-20 scroll-mt-20">
        <p className="text-gray-500">Loading team…</p>
      </section>
    );
  }

  // Error UI
  if (error) {
    return (
      <section id="team" className="mb-20 scroll-mt-20">
        <p className="text-red-600 text-sm">{error}</p>
      </section>
    );
  }

  return (
    <section id="team" className="mb-20 scroll-mt-20">
      {/* Founders */}
      <div id="founders" className="mb-10">
        <h3 className="text-2xl font-normal text-gray-900 mb-6">Founders</h3>

        {founders.length === 0 ? (
          <p className="text-gray-500 text-sm">Founders will be added soon.</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {founders.map((member) => (
              <article
                key={member.id}
                className="rounded-lg border border-gray-300 bg-white p-6 text-center hover:border-vblue hover:shadow-md"
              >
                <TeamMemberCard {...member} />
              </article>
            ))}
          </div>
        )}
      </div>

      {/* Core Team */}
      <div id="core-team">
        <h3 className="text-2xl font-normal text-gray-900 mb-6">Team</h3>

        {teamMembers.length === 0 ? (
          <p className="text-gray-500 text-sm">
            Team members will be added soon.
          </p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {teamMembers.map((member) => (
              <article
                key={member.id}
                className="rounded-lg border border-gray-300 bg-white p-2 text-center hover:border-vblue hover:shadow-md"
              >
                <TeamMemberCard {...member} small />
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

import { SectionHeader } from './section-header';
import type { TeamMember } from '@/types/about-type';

interface TeamSectionProps {
  team: TeamMember[];
}

const TeamCard = ({ member }: { member: TeamMember }) => (
  <div className="text-center p-6 rounded-xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 hover:border-indigo-200 dark:hover:border-indigo-800 transition-all duration-300">
    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 flex items-center justify-center mx-auto mb-4">
      <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
        {member.name.split(' ').map(n => n[0]).join('')}
      </span>
    </div>
    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
      {member.name}
    </h3>
    <p className="text-sm text-indigo-600 dark:text-indigo-400 font-medium mb-2">
      {member.role}
    </p>
    <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
      {member.bio}
    </p>
  </div>
);

export const TeamSection = ({ team }: TeamSectionProps) => (
  <section id="team" className="py-20 md:py-24">
    <div className="container mx-auto px-4">
      <SectionHeader 
        badge="Meet the Team"
        title="The People Behind the Platform"
        description="Passionate individuals dedicated to your success"
      />
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {team.map((member) => (
          <TeamCard key={member.name} member={member} />
        ))}
      </div>
    </div>
  </section>
);
'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { FiBook, FiAward, FiTrendingUp, FiCheckCircle } from 'react-icons/fi';
import { useRouter } from 'next/navigation';

interface Skill {
  id: string;
  name: string;
  description: string;
  category: string;
  level: string;
}

interface LearningPath {
  id: string;
  name: string;
  description: string;
  skill_id: string;
  order_index: number;
}

interface UserSkill {
  id: string;
  skill_id: string;
  level: string;
  certified: boolean;
  skill: Skill;
}

interface UserProgress {
  id: string;
  material_id: string;
  status: 'not_started' | 'in_progress' | 'completed';
  score?: number;
}

export default function KnowledgeBasePage() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [skills, setSkills] = useState<Skill[]>([]);
  const [userSkills, setUserSkills] = useState<UserSkill[]>([]);
  const [learningPaths, setLearningPaths] = useState<LearningPath[]>([]);
  const [userProgress, setUserProgress] = useState<UserProgress[]>([]);
  const [activeTab, setActiveTab] = useState<'skills' | 'paths' | 'progress'>('skills');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }
      fetchData();
    };
    
    checkAuth();
  }, [router]);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Fetch skills
      const { data: skillsData, error: skillsError } = await supabase
        .from('zen_skills')
        .select('*')
        .order('category', { ascending: true });

      if (skillsError) throw skillsError;
      setSkills(skillsData);

      // Fetch user's skills
      const { data: userSkillsData, error: userSkillsError } = await supabase
        .from('zen_user_skills')
        .select(`
          *,
          skill:zen_skills(*)
        `)
        .eq('user_id', user.id);

      if (userSkillsError) throw userSkillsError;
      setUserSkills(userSkillsData);

      // Fetch learning paths
      const { data: pathsData, error: pathsError } = await supabase
        .from('zen_learning_paths')
        .select('*')
        .order('order_index', { ascending: true });

      if (pathsError) throw pathsError;
      setLearningPaths(pathsData);

      // Fetch user's progress
      const { data: progressData, error: progressError } = await supabase
        .from('zen_user_progress')
        .select('*')
        .eq('user_id', user.id);

      if (progressError) throw progressError;
      setUserProgress(progressData);

      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'beginner':
        return 'bg-green-500/10 text-green-400';
      case 'intermediate':
        return 'bg-yellow-500/10 text-yellow-400';
      case 'expert':
        return 'bg-red-500/10 text-red-400';
      default:
        return 'bg-white/10 text-white';
    }
  };

  const handleSkillClick = (skillId: string) => {
    router.push(`/knowledge-base/skills/${skillId}`);
  };

  const handlePathClick = (pathId: string) => {
    router.push(`/knowledge-base/paths/${pathId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-white/10 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="h-64 bg-white/10 rounded-lg"></div>
              <div className="h-64 bg-white/10 rounded-lg"></div>
              <div className="h-64 bg-white/10 rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">Knowledge Base & Skills Development</h1>

        {/* Tabs */}
        <div className="flex space-x-4 mb-8">
          <button
            onClick={() => setActiveTab('skills')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
              activeTab === 'skills'
                ? 'bg-violet-500 text-white'
                : 'bg-white/5 text-white/60 hover:bg-white/10'
            }`}
          >
            <FiBook className="w-5 h-5" />
            <span>Available Skills</span>
          </button>
          <button
            onClick={() => setActiveTab('paths')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
              activeTab === 'paths'
                ? 'bg-violet-500 text-white'
                : 'bg-white/5 text-white/60 hover:bg-white/10'
            }`}
          >
            <FiTrendingUp className="w-5 h-5" />
            <span>Learning Paths</span>
          </button>
          <button
            onClick={() => setActiveTab('progress')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
              activeTab === 'progress'
                ? 'bg-violet-500 text-white'
                : 'bg-white/5 text-white/60 hover:bg-white/10'
            }`}
          >
            <FiAward className="w-5 h-5" />
            <span>My Progress</span>
          </button>
        </div>

        {/* Skills Tab */}
        {activeTab === 'skills' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {skills.map((skill) => {
              const userSkill = userSkills.find(us => us.skill_id === skill.id);
              return (
                <div
                  key={skill.id}
                  onClick={() => handleSkillClick(skill.id)}
                  className="bg-white/5 backdrop-blur-sm rounded-lg p-6 hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-semibold text-white">{skill.name}</h3>
                    <span className={`px-3 py-1 rounded-full text-sm ${getLevelColor(skill.level)}`}>
                      {skill.level}
                    </span>
                  </div>
                  <p className="text-white/60 mb-4">{skill.description}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-white/40 text-sm">{skill.category}</span>
                    {userSkill?.certified && (
                      <div className="flex items-center text-green-400">
                        <FiCheckCircle className="w-5 h-5 mr-2" />
                        <span>Certified</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Learning Paths Tab */}
        {activeTab === 'paths' && (
          <div className="space-y-6">
            {learningPaths.map((path) => {
              const relatedSkill = skills.find(s => s.id === path.skill_id);
              return (
                <div
                  key={path.id}
                  onClick={() => handlePathClick(path.id)}
                  className="bg-white/5 backdrop-blur-sm rounded-lg p-6 hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <h3 className="text-xl font-semibold text-white mb-2">{path.name}</h3>
                  <p className="text-white/60 mb-4">{path.description}</p>
                  {relatedSkill && (
                    <div className="flex items-center">
                      <span className="text-white/40 text-sm mr-2">Related Skill:</span>
                      <span className={`px-3 py-1 rounded-full text-sm ${getLevelColor(relatedSkill.level)}`}>
                        {relatedSkill.name}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Progress Tab */}
        {activeTab === 'progress' && (
          <div className="space-y-8">
            <div className="bg-white/5 backdrop-blur-sm rounded-lg p-6">
              <h3 className="text-xl font-semibold text-white mb-6">My Skills</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {userSkills.map((userSkill) => (
                  <div
                    key={userSkill.id}
                    className="bg-white/5 rounded-lg p-4"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="text-white font-medium">{userSkill.skill.name}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs ${getLevelColor(userSkill.level)}`}>
                        {userSkill.level}
                      </span>
                    </div>
                    {userSkill.certified && (
                      <div className="flex items-center text-green-400 text-sm">
                        <FiCheckCircle className="w-4 h-4 mr-1" />
                        <span>Certified</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-sm rounded-lg p-6">
              <h3 className="text-xl font-semibold text-white mb-6">Learning Progress</h3>
              <div className="space-y-4">
                {userProgress.map((progress) => (
                  <div
                    key={progress.id}
                    className="bg-white/5 rounded-lg p-4"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="text-white font-medium">Material {progress.material_id}</h4>
                        <p className="text-white/60 text-sm capitalize">{progress.status.replace('_', ' ')}</p>
                      </div>
                      {progress.score !== null && (
                        <span className="text-white/80">Score: {progress.score}%</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 
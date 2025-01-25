'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { FiArrowLeft, FiCheckCircle, FiBook, FiAward } from 'react-icons/fi';

interface Skill {
  id: string;
  name: string;
  description: string;
  level: string;
  materials?: LearningMaterial[];
}

interface LearningMaterial {
  id: string;
  title: string;
  description: string;
  content: string;
  path_id: string;
  order_index: number;
}

interface UserProgress {
  id: string;
  user_id: string;
  material_id: string;
  status: string;
  completed_at: string | null;
}

export default function SkillDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [skill, setSkill] = useState<Skill | null>(null);
  const [userProgress, setUserProgress] = useState<UserProgress[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const supabase = createClientComponentClient();

        // Get user session
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push('/login');
          return;
        }

        // Fetch skill details
        const { data: skillData, error: skillError } = await supabase
          .from('zen_skills')
          .select('*')
          .eq('id', params.id)
          .single();

        if (skillError) throw skillError;
        setSkill(skillData);

        // First get learning paths for this skill
        const { data: pathsData, error: pathsError } = await supabase
          .from('zen_learning_paths')
          .select('id')
          .eq('skill_id', params.id);

        if (pathsError) throw pathsError;

        if (pathsData && pathsData.length > 0) {
          // Get learning materials for these paths
          const pathIds = pathsData.map(path => path.id);
          const { data: materialsData, error: materialsError } = await supabase
            .from('zen_learning_materials')
            .select('*')
            .in('path_id', pathIds)
            .order('order_index');

          if (materialsError) throw materialsError;
          setSkill(prevSkill => ({ ...prevSkill!, materials: materialsData || [] }));

          // Get user progress for these materials
          const { data: progressData, error: progressError } = await supabase
            .from('zen_user_progress')
            .select('*')
            .in('material_id', materialsData?.map(m => m.id) || [])
            .eq('user_id', session.user.id);

          if (progressError) throw progressError;
          setUserProgress(progressData || []);
        } else {
          setSkill(prevSkill => ({ ...prevSkill!, materials: [] }));
          setUserProgress([]);
        }
      } catch (err) {
        console.error('Error fetching skill details:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params.id, router]);

  const handleMaterialClick = (materialId: string) => {
    router.push(`/knowledge-base/materials/${materialId}`);
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

  const getMaterialIcon = (type: string) => {
    switch (type) {
      case 'video':
        return '🎥';
      case 'article':
        return '📄';
      case 'quiz':
        return '✍️';
      default:
        return '📚';
    }
  };

  const getMaterialProgress = (materialId: string) => {
    const progress = userProgress.find(p => p.material_id === materialId);
    return progress?.status || 'not_started';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-900 to-green-700 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!skill) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 p-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-white">Skill not found</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 p-8">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => router.back()}
          className="flex items-center text-white/60 hover:text-white mb-8 transition-colors"
        >
          <FiArrowLeft className="w-5 h-5 mr-2" />
          Back to Knowledge Base
        </button>

        <div className="bg-white/5 backdrop-blur-sm rounded-lg p-8 mb-8">
          <div className="flex justify-between items-start mb-4">
            <h1 className="text-3xl font-bold text-white">{skill.name}</h1>
            <span className={`px-3 py-1 rounded-full text-sm ${getLevelColor(skill.level)}`}>
              {skill.level}
            </span>
          </div>
          <p className="text-white/80 text-lg mb-4">{skill.description}</p>
          <div className="flex items-center text-white/60">
            <FiBook className="w-5 h-5 mr-2" />
            <span>{skill.category}</span>
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-white mb-6">Learning Materials</h2>
          {skill.materials?.map((material) => {
            const progress = getMaterialProgress(material.id);
            return (
              <div
                key={material.id}
                onClick={() => handleMaterialClick(material.id)}
                className="bg-white/5 backdrop-blur-sm rounded-lg p-6 hover:bg-white/10 transition-colors cursor-pointer"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <span className="text-2xl mr-3">{getMaterialIcon(material.type)}</span>
                      <h3 className="text-xl font-semibold text-white">{material.title}</h3>
                    </div>
                    <p className="text-white/60">{material.description}</p>
                  </div>
                  <div className="ml-6">
                    {progress === 'completed' ? (
                      <div className="flex items-center text-green-400">
                        <FiCheckCircle className="w-5 h-5 mr-2" />
                        <span>Completed</span>
                      </div>
                    ) : progress === 'in_progress' ? (
                      <div className="flex items-center text-yellow-400">
                        <FiBook className="w-5 h-5 mr-2" />
                        <span>In Progress</span>
                      </div>
                    ) : (
                      <div className="flex items-center text-white/40">
                        <FiAward className="w-5 h-5 mr-2" />
                        <span>Start Learning</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
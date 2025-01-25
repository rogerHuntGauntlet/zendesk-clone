'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/auth-config';
import { FiArrowLeft, FiCheckCircle, FiBook, FiAward } from 'react-icons/fi';

interface LearningPath {
  id: string;
  name: string;
  description: string;
  skill_id: string;
  order_index: number;
  materials: LearningMaterial[];
  skill: {
    id: string;
    name: string;
    level: string;
    category: string;
  };
}

interface LearningMaterial {
  id: string;
  title: string;
  description: string;
  type: 'video' | 'article' | 'quiz';
  content: string;
  order: number;
}

interface UserProgress {
  id: string;
  material_id: string;
  status: 'not_started' | 'in_progress' | 'completed';
  score?: number;
}

export default function LearningPathDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [path, setPath] = useState<LearningPath | null>(null);
  const [userProgress, setUserProgress] = useState<UserProgress[]>([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const supabase = createServerSupabaseClient();

        // Fetch path details with related skill
        const { data: pathData, error: pathError } = await supabase
          .from('zen_learning_paths')
          .select(`
            *,
            skill:zen_skills (
              id,
              name,
              level,
              category
            )
          `)
          .eq('id', params.id)
          .single();

        if (pathError) throw pathError;
        setPath(pathData);

        // Fetch learning materials
        const { data: materialsData, error: materialsError } = await supabase
          .from('zen_learning_materials')
          .select('*')
          .eq('path_id', params.id)
          .order('order', { ascending: true });

        if (materialsError) throw materialsError;

        // Fetch user progress
        const { data: progressData, error: progressError } = await supabase
          .from('zen_user_progress')
          .select('*')
          .eq('user_id', supabase.auth.user()?.id)
          .eq('path_id', params.id);

        if (progressError && progressError.code !== 'PGRST116') {
          throw progressError;
        }
        setUserProgress(progressData || []);

      } catch (err) {
        console.error('Error fetching path details:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params.id]);

  const handleMaterialClick = (materialId: string) => {
    router.push(`/knowledge-base/materials/${materialId}`);
  };

  const handleSkillClick = () => {
    if (path?.skill_id) {
      router.push(`/knowledge-base/skills/${path.skill_id}`);
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
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-white/10 rounded w-1/4"></div>
            <div className="space-y-6">
              <div className="h-32 bg-white/10 rounded-lg"></div>
              <div className="h-64 bg-white/10 rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!path) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 p-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-white">Learning path not found</h1>
        </div>
      </div>
    );
  }

  const totalMaterials = path.materials?.length || 0;
  const completedMaterials = userProgress.filter(p => p.status === 'completed').length;
  const progressPercentage = totalMaterials > 0 ? (completedMaterials / totalMaterials) * 100 : 0;

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
          <h1 className="text-3xl font-bold text-white mb-4">{path.name}</h1>
          <p className="text-white/80 text-lg mb-6">{path.description}</p>
          
          {path.skill && (
            <div 
              onClick={handleSkillClick}
              className="inline-flex items-center bg-white/5 hover:bg-white/10 transition-colors rounded-lg px-4 py-2 cursor-pointer"
            >
              <FiBook className="w-5 h-5 mr-2 text-white/60" />
              <span className="text-white/80 mr-3">Related Skill:</span>
              <span className={`px-3 py-1 rounded-full text-sm ${getLevelColor(path.skill.level)}`}>
                {path.skill.name}
              </span>
            </div>
          )}
        </div>

        <div className="bg-white/5 backdrop-blur-sm rounded-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-white">Overall Progress</h3>
            <span className="text-white/80">{Math.round(progressPercentage)}%</span>
          </div>
          <div className="w-full bg-white/5 rounded-full h-2">
            <div
              className="bg-violet-500 rounded-full h-2 transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-white mb-6">Learning Materials</h2>
          {path.materials?.map((material, index) => {
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
                      <div>
                        <span className="text-white/40 text-sm mb-1">Step {index + 1}</span>
                        <h3 className="text-xl font-semibold text-white">{material.title}</h3>
                      </div>
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
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { BookOpen, Video, CheckCircle, Play, GraduationCap, ArrowRight } from 'lucide-react';
import { api } from '@/lib/api';

interface Course {
  id: string;
  title: string;
  description: string;
  duration: string;
  modules: Module[];
  progress: number;
  category: string;
  type?: 'standard' | 'knowledge-base';
}

interface Module {
  id: string;
  title: string;
  type: 'video' | 'interactive' | 'quiz';
  duration: string;
  completed: boolean;
  steps?: {
    id: string;
    title: string;
    completed: boolean;
    content: string;
    requiredArticles?: string[];
  }[];
}

interface LearningProps {
  suggestedCourseId?: string;
}

export function Learning({ suggestedCourseId }: LearningProps) {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [activeModule, setActiveModule] = useState<Module | null>(null);
  const [courseProgress, setCourseProgress] = useState<Record<string, number>>({});
  const [courses, setCourses] = useState<Course[]>([]);

  useEffect(() => {
    // Load courses from localStorage
    if (typeof window !== 'undefined') {
      const storedCourses = localStorage.getItem('courses');
      if (storedCourses) {
        const parsedCourses = JSON.parse(storedCourses);
        setCourses(parsedCourses);
        
        // If there's a suggested course, select it
        if (suggestedCourseId) {
          const suggested = parsedCourses.find((c: Course) => c.id === suggestedCourseId);
          if (suggested) {
            setSelectedCourse(suggested);
          }
        }
      }
    }
  }, [suggestedCourseId]);

  useEffect(() => {
    const loadProgress = async () => {
      try {
        const currentUser = await api.getCurrentUser();
        if (!currentUser) return;

        const progress = await api.getLearningProgress(currentUser.id);
        
        // Calculate progress for knowledge base course
        const kbCourse = courses.find(c => c.type === 'knowledge-base');
        if (!kbCourse) return;

        const articleViews = new Set(
          progress
            .filter(p => p.type === 'article_view')
            .map(p => p.articleId)
        );
        
        const articleFeedback = new Set(
          progress
            .filter(p => p.type === 'article_feedback')
            .map(p => p.articleId)
        );

        // Calculate total required articles
        const totalRequired = kbCourse.modules.reduce((total, module) => {
          return total + (module.steps?.reduce((stepTotal, step) => {
            return stepTotal + (step.requiredArticles?.length || 0);
          }, 0) || 0);
        }, 0);

        // Calculate viewed and feedback articles
        let completedCount = 0;
        kbCourse.modules.forEach(module => {
          module.steps?.forEach(step => {
            step.requiredArticles?.forEach(articleId => {
              if (articleViews.has(articleId)) {
                completedCount += 0.5; // 50% for viewing
              }
              if (articleFeedback.has(articleId)) {
                completedCount += 0.5; // 50% for feedback
              }
            });
          });
        });

        // Update progress
        const progressPercentage = totalRequired > 0 
          ? Math.round((completedCount / totalRequired) * 100)
          : 0;

        setCourseProgress(prev => ({
          ...prev,
          [kbCourse.id]: progressPercentage
        }));
      } catch (error) {
        console.error('Failed to load learning progress:', error);
      }
    };

    if (courses.length > 0) {
      loadProgress();
    }
  }, [courses]);

  const filteredCourses = courses.filter(
    course => selectedCategory === "All" || course.category === selectedCategory
  ).map(course => ({
    ...course,
    progress: courseProgress[course.id] || course.progress
  }));

  const categories = ["All", ...new Set(courses.map(course => course.category))];

  const ModuleIcon = ({ type }: { type: Module['type'] }) => {
    switch (type) {
      case 'video':
        return <Video className="h-4 w-4" />;
      case 'quiz':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Play className="h-4 w-4" />;
    }
  };

  return (
    <div className="flex h-[80vh]">
      {/* Left Panel - Categories and Courses */}
      <div className="w-[280px] border-r border-gray-200 dark:border-gray-800 p-4 space-y-6">
        <div className="space-y-1">
          <h3 className="font-medium text-sm text-gray-500 dark:text-gray-400 px-2">Categories</h3>
          <div className="space-y-1">
            {categories.map(category => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "ghost"}
                className="w-full justify-between text-sm h-8 px-2"
                onClick={() => setSelectedCategory(category)}
              >
                {category}
                {selectedCategory === category && <ArrowRight className="h-4 w-4" />}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="font-medium text-sm text-gray-500 dark:text-gray-400 px-2">Available Courses</h3>
          <div className="space-y-2">
            {filteredCourses.map(course => (
              <Button
                key={course.id}
                variant="ghost"
                className={`w-full text-left p-3 h-auto ${
                  selectedCourse?.id === course.id ? 'bg-gray-100 dark:bg-gray-800' : ''
                }`}
                onClick={() => {
                  setSelectedCourse(course);
                  setActiveModule(null);
                }}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{course.title}</span>
                    <span className="text-xs text-gray-500">{course.duration}</span>
                  </div>
                  <Progress value={course.progress} className="h-1" />
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{course.category}</span>
                    <span>{course.progress}% Complete</span>
                  </div>
                </div>
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Course Content */}
      <div className="flex-1 p-6 overflow-y-auto">
        {selectedCourse ? (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">{selectedCourse.title}</h2>
              <p className="text-gray-600 dark:text-gray-400">{selectedCourse.description}</p>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Course Modules</h3>
              <div className="space-y-3">
                {selectedCourse.modules.map(module => (
                  <Button
                    key={module.id}
                    variant="outline"
                    className={`w-full justify-start p-4 h-auto ${
                      activeModule?.id === module.id ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => setActiveModule(module)}
                  >
                    <div className="flex items-start gap-4 w-full">
                      <div className={`p-2 rounded-full ${
                        module.completed 
                          ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400'
                          : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                      }`}>
                        <ModuleIcon type={module.type} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{module.title}</span>
                          <span className="text-sm text-gray-500">{module.duration}</span>
                        </div>
                        {module.type === 'interactive' && module.steps && (
                          <div className="mt-2 space-y-2">
                            {module.steps.map(step => (
                              <div
                                key={step.id}
                                className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"
                              >
                                <div className={`h-1.5 w-1.5 rounded-full ${
                                  step.completed ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                                }`} />
                                {step.title}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            </div>

            {activeModule && activeModule.type === 'interactive' && activeModule.steps && (
              <div className="mt-8 space-y-6">
                <h3 className="text-lg font-semibold">Interactive Steps</h3>
                <div className="space-y-4">
                  {activeModule.steps.map(step => (
                    <Card key={step.id}>
                      <CardHeader>
                        <CardTitle className="text-base">
                          {step.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-600 dark:text-gray-400">{step.content}</p>
                        <Button className="mt-4" disabled={step.completed}>
                          {step.completed ? 'Completed' : 'Start Step'}
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500">
            <div className="text-center">
              <GraduationCap className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>Select a course to begin learning</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 
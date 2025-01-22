"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/use-toast";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import * as db from "@/lib/db";
import type { Project } from "@/types";

export default function ProjectEmployeeDashboard() {
  const params = useParams();
  const projectId = params?.projectId as string;
  const { user } = useAuth();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [employee, setEmployee] = useState<{
    id: string;
    name: string;
    email: string;
    role: string;
    department: string;
    specialties: string[];
    activeTickets: number;
    performance: {
      resolvedTickets: number;
      avgResponseTime: string;
      customerRating: number;
    };
    createdAt: string;
    lastLogin: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    // Verify user is an employee
    if (user.user_metadata?.role !== 'employee') {
      toast({
        title: "Access Denied",
        description: "This dashboard is only accessible to employees.",
        variant: "destructive"
      });
      router.push('/');
      return;
    }

    loadData();
  }, [user, projectId]);

  const loadData = async () => {
    if (!user || !projectId) return;

    try {
      // Load project data
      const projectData = await db.getProject(projectId);
      if (!projectData) {
        toast({
          title: "Project Not Found",
          description: "The requested project could not be found.",
          variant: "destructive"
        });
        router.push('/project-admin');
        return;
      }
      setProject(projectData);

      // Load employee data
      const employeeData = await db.getEmployeeForProject(projectId, user.id);
      if (!employeeData) {
        toast({
          title: "Access Denied",
          description: "You do not have access to this project.",
          variant: "destructive"
        });
        router.push('/project-admin');
        return;
      }
      setEmployee(employeeData);
    } catch (error) {
      console.error('Error loading project data:', error);
      toast({
        title: "Error",
        description: "Failed to load project data. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="text-lg">Loading project dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!project || !employee) {
    return (
      <DashboardLayout>
        <div className="p-8">
          <Card className="p-6">
            <CardTitle className="mb-4">Error Loading Dashboard</CardTitle>
            <CardDescription>
              Unable to load project dashboard data. Please try refreshing the page.
            </CardDescription>
            <Button
              className="mt-4"
              onClick={() => window.location.reload()}
            >
              Refresh Page
            </Button>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">
              {project.name} - Employee Dashboard
            </h1>
            <p className="text-gray-600">
              Welcome back, {employee.name}
            </p>
          </div>
          <Button
            onClick={() => router.push('/project-admin')}
            variant="outline"
          >
            Back to Projects
          </Button>
        </div>

        {/* Add your project-specific dashboard content here */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Project Overview</CardTitle>
              <CardDescription>Key metrics and information</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Add project metrics */}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
} 
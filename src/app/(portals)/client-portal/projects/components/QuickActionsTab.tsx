"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";

export function QuickActionsTab() {
  const router = useRouter();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>Common tasks and shortcuts</CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Button 
          variant="outline" 
          className="w-full justify-start text-left border-green-200 text-green-700 hover:bg-green-50 h-auto py-4"
          onClick={() => router.push('/client-portal/new-ticket')}
        >
          <div className="flex items-center">
            <span className="mr-3 text-2xl">➕</span>
            <div>
              <div className="font-medium">Create New Ticket</div>
              <div className="text-sm text-green-600">Submit a new support request</div>
            </div>
          </div>
        </Button>

        <Button 
          variant="outline" 
          className="w-full justify-start text-left border-green-200 text-green-700 hover:bg-green-50 h-auto py-4"
          onClick={() => router.push('/client-portal/knowledge-base')}
        >
          <div className="flex items-center">
            <span className="mr-3 text-2xl">📚</span>
            <div>
              <div className="font-medium">Knowledge Base</div>
              <div className="text-sm text-green-600">Browse help articles and guides</div>
            </div>
          </div>
        </Button>

        <Button 
          variant="outline" 
          className="w-full justify-start text-left border-green-200 text-green-700 hover:bg-green-50 h-auto py-4"
        >
          <div className="flex items-center">
            <span className="mr-3 text-2xl">📅</span>
            <div>
              <div className="font-medium">Schedule Meeting</div>
              <div className="text-sm text-green-600">Book time with support team</div>
            </div>
          </div>
        </Button>

        <Button 
          variant="outline" 
          className="w-full justify-start text-left border-green-200 text-green-700 hover:bg-green-50 h-auto py-4"
        >
          <div className="flex items-center">
            <span className="mr-3 text-2xl">📊</span>
            <div>
              <div className="font-medium">Generate Report</div>
              <div className="text-sm text-green-600">Download activity summary</div>
            </div>
          </div>
        </Button>
      </CardContent>
    </Card>
  );
} 
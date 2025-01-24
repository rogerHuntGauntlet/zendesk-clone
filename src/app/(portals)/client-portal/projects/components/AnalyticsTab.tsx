"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { LineChart, BarChart, Wallet } from "lucide-react";

export function AnalyticsTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Analytics Overview</CardTitle>
        <CardDescription>Track your support metrics and activity</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <LineChart className="h-5 w-5 text-green-600" />
              <h4 className="font-medium text-green-800">Response Time</h4>
            </div>
            <div className="text-2xl font-semibold text-green-900">2.4 hrs</div>
            <div className="text-sm text-green-600">Avg. first response</div>
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <BarChart className="h-5 w-5 text-green-600" />
              <h4 className="font-medium text-green-800">Resolution Rate</h4>
            </div>
            <div className="text-2xl font-semibold text-green-900">94%</div>
            <div className="text-sm text-green-600">Within SLA</div>
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Wallet className="h-5 w-5 text-green-600" />
              <h4 className="font-medium text-green-800">Active Tickets</h4>
            </div>
            <div className="text-2xl font-semibold text-green-900">12</div>
            <div className="text-sm text-green-600">Currently open</div>
          </div>
        </div>

        {/* Placeholder for charts */}
        <div className="space-y-6">
          <div className="h-64 bg-green-50 rounded-lg flex items-center justify-center">
            <p className="text-green-600">Ticket Volume Trend</p>
          </div>
          <div className="h-64 bg-green-50 rounded-lg flex items-center justify-center">
            <p className="text-green-600">Resolution Time Distribution</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";

export function HelpSupportTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Help & Support Resources</CardTitle>
        <CardDescription>Get assistance and learn more about our platform</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-green-50 p-6 rounded-lg">
            <h4 className="text-lg font-medium text-green-800 mb-4">Documentation</h4>
            <div className="space-y-4">
              <Button 
                variant="outline" 
                className="w-full justify-start text-left border-green-200 text-green-700 hover:bg-green-100"
              >
                <span className="mr-2">📖</span>
                User Guide
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start text-left border-green-200 text-green-700 hover:bg-green-100"
              >
                <span className="mr-2">🎥</span>
                Video Tutorials
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start text-left border-green-200 text-green-700 hover:bg-green-100"
              >
                <span className="mr-2">❓</span>
                FAQs
              </Button>
            </div>
          </div>

          <div className="bg-green-50 p-6 rounded-lg">
            <h4 className="text-lg font-medium text-green-800 mb-4">Contact Support</h4>
            <div className="space-y-4">
              <Button 
                variant="outline" 
                className="w-full justify-start text-left border-green-200 text-green-700 hover:bg-green-100"
              >
                <span className="mr-2">💬</span>
                Live Chat
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start text-left border-green-200 text-green-700 hover:bg-green-100"
              >
                <span className="mr-2">📞</span>
                Schedule a Call
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start text-left border-green-200 text-green-700 hover:bg-green-100"
              >
                <span className="mr-2">📧</span>
                Email Support
              </Button>
            </div>
          </div>

          <div className="md:col-span-2 bg-green-50 p-6 rounded-lg">
            <h4 className="text-lg font-medium text-green-800 mb-4">Training & Onboarding</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button 
                variant="outline" 
                className="w-full justify-start text-left border-green-200 text-green-700 hover:bg-green-100"
              >
                <span className="mr-2">🎓</span>
                Get Started Guide
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start text-left border-green-200 text-green-700 hover:bg-green-100"
              >
                <span className="mr-2">👥</span>
                Book Training Session
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start text-left border-green-200 text-green-700 hover:bg-green-100"
              >
                <span className="mr-2">📱</span>
                Mobile App Guide
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 
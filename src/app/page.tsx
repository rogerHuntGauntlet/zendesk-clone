"use client";

import { Shield, Users, Building2, ArrowRight, CheckCircle2, BarChart3, MessageSquare, Zap, Clock, Star, ChevronRight, Settings, Layout, Workflow } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Home() {
  const router = useRouter();
  const [activeFeature, setActiveFeature] = useState('support');

  const features = {
    support: {
      title: "Customer Support Hub",
      description: "Transform your customer service with AI-powered ticketing, live chat, and knowledge base integration.",
      icon: MessageSquare,
      color: "from-purple-500 to-pink-500"
    },
    crm: {
      title: "Intelligent CRM",
      description: "Track leads, manage relationships, and automate your sales pipeline with customizable workflows.",
      icon: Users,
      color: "from-blue-500 to-cyan-500"
    },
    team: {
      title: "Team Collaboration",
      description: "Unite your team with project management, task tracking, and real-time collaboration tools.",
      icon: Building2,
      color: "from-green-500 to-emerald-500"
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900">
      {/* Navbar */}
      <nav className="w-full py-6 px-4 bg-white/10 backdrop-blur-md fixed top-0 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">OHFdesk</h1>
          <div className="flex items-center gap-6">
            <button className="text-white hover:text-white/80 transition-colors">Features</button>
            <button className="text-white hover:text-white/80 transition-colors">Pricing</button>
            <button 
              onClick={() => router.push('/knowledge-base')}
              className="text-white hover:text-white/80 transition-colors"
            >
              Knowledge Base
            </button>
            <button
              onClick={() => router.push('/admin-portal/login')}
              className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-full transition-all"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center bg-white/10 rounded-full px-4 py-2 mb-6">
            <Star className="w-4 h-4 text-yellow-400 mr-2" />
            <span className="text-white/90 text-sm">Trusted by 10,000+ teams worldwide</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
            One Platform,<br />Endless Possibilities
          </h1>
          <p className="text-xl text-white/80 mb-12 max-w-2xl mx-auto">
            Adapt OHFdesk to your workflow. Whether it's customer support, CRM, or team collaboration, 
            we flex to match your unique business needs.
          </p>

          {/* Interactive Feature Showcase */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto mt-12">
            {Object.entries(features).map(([key, feature]) => (
              <div
                key={key}
                onClick={() => setActiveFeature(key)}
                className={`cursor-pointer transition-all duration-300 ${
                  activeFeature === key
                    ? 'bg-gradient-to-r ' + feature.color + ' scale-105'
                    : 'bg-white/10 hover:bg-white/20'
                } backdrop-blur-sm p-6 rounded-xl text-white`}
              >
                <feature.icon className="w-8 h-8 mb-4" />
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-white/70">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>

          {/* Customization Features */}
          <div className="mt-20 grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white/5 p-6 rounded-xl backdrop-blur-sm">
              <Settings className="w-6 h-6 text-purple-400 mb-4" />
              <h4 className="text-lg font-semibold text-white mb-2">Custom Workflows</h4>
              <p className="text-sm text-white/70">Design your perfect process flow</p>
            </div>
            <div className="bg-white/5 p-6 rounded-xl backdrop-blur-sm">
              <Layout className="w-6 h-6 text-purple-400 mb-4" />
              <h4 className="text-lg font-semibold text-white mb-2">Flexible UI</h4>
              <p className="text-sm text-white/70">Customize your workspace view</p>
            </div>
            <div className="bg-white/5 p-6 rounded-xl backdrop-blur-sm">
              <Zap className="w-6 h-6 text-purple-400 mb-4" />
              <h4 className="text-lg font-semibold text-white mb-2">API Access</h4>
              <p className="text-sm text-white/70">Integrate with your tools</p>
            </div>
            <div className="bg-white/5 p-6 rounded-xl backdrop-blur-sm">
              <Shield className="w-6 h-6 text-purple-400 mb-4" />
              <h4 className="text-lg font-semibold text-white mb-2">Role-Based Access</h4>
              <p className="text-sm text-white/70">Control team permissions</p>
            </div>
          </div>

          {/* Enhanced CTA */}
          <div className="mt-16 flex flex-col items-center gap-4">
            <button
              onClick={() => router.push('/admin-portal/login')}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 
                transition-all text-white font-bold py-4 px-8 rounded-full flex items-center gap-2 group"
            >
              Start Customizing
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <p className="text-white/60 text-sm">No credit card required • Free 14-day trial</p>
          </div>
        </div>
      </section>

      {/* Stats Section with Animation */}
      <section className="py-20 px-4 bg-white/5 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center transform hover:scale-105 transition-transform">
              <p className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">99.9%</p>
              <p className="text-white/70">Uptime</p>
            </div>
            <div className="text-center transform hover:scale-105 transition-transform">
              <p className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">2M+</p>
              <p className="text-white/70">Tickets Resolved</p>
            </div>
            <div className="text-center transform hover:scale-105 transition-transform">
              <p className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">10k+</p>
              <p className="text-white/70">Active Users</p>
            </div>
            <div className="text-center transform hover:scale-105 transition-transform">
              <p className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">15min</p>
              <p className="text-white/70">Avg. Response Time</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            Why Choose OHFdesk?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 bg-white/5 rounded-xl">
              <div className="flex items-center gap-3 mb-4">
                <Zap className="w-6 h-6 text-purple-400" />
                <h3 className="text-xl font-semibold text-white">Smart Routing</h3>
              </div>
              <p className="text-white/70">
                Automatically assign tickets to the right team members based on expertise and workload.
              </p>
            </div>
            <div className="p-6 bg-white/5 rounded-xl">
              <div className="flex items-center gap-3 mb-4">
                <MessageSquare className="w-6 h-6 text-purple-400" />
                <h3 className="text-xl font-semibold text-white">Real-time Chat</h3>
              </div>
              <p className="text-white/70">
                Instant communication between clients and support staff for faster resolution.
              </p>
            </div>
            <div className="p-6 bg-white/5 rounded-xl">
              <div className="flex items-center gap-3 mb-4">
                <BarChart3 className="w-6 h-6 text-purple-400" />
                <h3 className="text-xl font-semibold text-white">Analytics</h3>
              </div>
              <p className="text-white/70">
                Deep insights into your support performance and team productivity.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 bg-white/5">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            Trusted by Industry Leaders
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 bg-white/10 rounded-xl">
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                ))}
              </div>
              <p className="text-white/70 mb-4">
                "OHFdesk has transformed how we handle customer support. The smart routing alone has cut our response time in half."
              </p>
              <div>
                <p className="text-white font-medium">Sarah Johnson</p>
                <p className="text-white/60 text-sm">Support Director, TechCorp</p>
              </div>
            </div>
            <div className="p-6 bg-white/10 rounded-xl">
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                ))}
              </div>
              <p className="text-white/70 mb-4">
                "The analytics and reporting features give us incredible insights into our support operations."
              </p>
              <div>
                <p className="text-white font-medium">Michael Chen</p>
                <p className="text-white/60 text-sm">CTO, CloudScale</p>
              </div>
            </div>
            <div className="p-6 bg-white/10 rounded-xl">
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                ))}
              </div>
              <p className="text-white/70 mb-4">
                "Implementation was smooth and our team was up and running in no time. Great onboarding experience."
              </p>
              <div>
                <p className="text-white font-medium">Emily Rodriguez</p>
                <p className="text-white/60 text-sm">Support Manager, GrowthLabs</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-white/70 text-center mb-12 max-w-2xl mx-auto">
            Choose the plan that best fits your team's needs. All plans include our core features.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 bg-white/10 rounded-xl border border-white/20">
              <h3 className="text-xl font-semibold text-white mb-2">Starter</h3>
              <p className="text-purple-400 text-3xl font-bold mb-4">$29<span className="text-sm text-white/60">/mo</span></p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-2 text-white/70">
                  <CheckCircle2 className="w-5 h-5 text-purple-400" />
                  <span>Up to 5 team members</span>
                </li>
                <li className="flex items-center gap-2 text-white/70">
                  <CheckCircle2 className="w-5 h-5 text-purple-400" />
                  <span>Basic ticket management</span>
                </li>
                <li className="flex items-center gap-2 text-white/70">
                  <CheckCircle2 className="w-5 h-5 text-purple-400" />
                  <span>Email support</span>
                </li>
              </ul>
              <button className="w-full py-2 px-4 rounded-lg bg-purple-500 hover:bg-purple-600 text-white transition-colors">
                Get Started
              </button>
            </div>
            <div className="p-6 bg-white/10 rounded-xl border-2 border-purple-400 relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-purple-400 text-white px-4 py-1 rounded-full text-sm">
                Most Popular
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Professional</h3>
              <p className="text-purple-400 text-3xl font-bold mb-4">$99<span className="text-sm text-white/60">/mo</span></p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-2 text-white/70">
                  <CheckCircle2 className="w-5 h-5 text-purple-400" />
                  <span>Up to 20 team members</span>
                </li>
                <li className="flex items-center gap-2 text-white/70">
                  <CheckCircle2 className="w-5 h-5 text-purple-400" />
                  <span>Advanced ticket routing</span>
                </li>
                <li className="flex items-center gap-2 text-white/70">
                  <CheckCircle2 className="w-5 h-5 text-purple-400" />
                  <span>Real-time chat</span>
                </li>
                <li className="flex items-center gap-2 text-white/70">
                  <CheckCircle2 className="w-5 h-5 text-purple-400" />
                  <span>Basic analytics</span>
                </li>
              </ul>
              <button className="w-full py-2 px-4 rounded-lg bg-purple-500 hover:bg-purple-600 text-white transition-colors">
                Get Started
              </button>
            </div>
            <div className="p-6 bg-white/10 rounded-xl border border-white/20">
              <h3 className="text-xl font-semibold text-white mb-2">Enterprise</h3>
              <p className="text-purple-400 text-3xl font-bold mb-4">Custom</p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-2 text-white/70">
                  <CheckCircle2 className="w-5 h-5 text-purple-400" />
                  <span>Unlimited team members</span>
                </li>
                <li className="flex items-center gap-2 text-white/70">
                  <CheckCircle2 className="w-5 h-5 text-purple-400" />
                  <span>Custom integrations</span>
                </li>
                <li className="flex items-center gap-2 text-white/70">
                  <CheckCircle2 className="w-5 h-5 text-purple-400" />
                  <span>24/7 priority support</span>
                </li>
                <li className="flex items-center gap-2 text-white/70">
                  <CheckCircle2 className="w-5 h-5 text-purple-400" />
                  <span>Advanced analytics</span>
                </li>
              </ul>
              <button className="w-full py-2 px-4 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-colors">
                Contact Sales
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-white/5">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-6">
            Ready to Transform Your Customer Support?
          </h2>
          <p className="text-white/70 mb-8 max-w-xl mx-auto">
            Join thousands of companies that trust OHFdesk to deliver exceptional customer support.
          </p>
          <button className="inline-flex items-center gap-2 bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded-lg transition-colors">
            Start Free Trial
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 bg-white/5">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="text-white font-semibold mb-4">Product</h3>
            <ul className="space-y-2">
              <li><button className="text-white/60 hover:text-white">Features</button></li>
              <li><button className="text-white/60 hover:text-white">Pricing</button></li>
              <li><button className="text-white/60 hover:text-white">Security</button></li>
              <li><button className="text-white/60 hover:text-white">Roadmap</button></li>
            </ul>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-4">Company</h3>
            <ul className="space-y-2">
              <li><button className="text-white/60 hover:text-white">About</button></li>
              <li><button className="text-white/60 hover:text-white">Careers</button></li>
              <li><button className="text-white/60 hover:text-white">Blog</button></li>
              <li><button className="text-white/60 hover:text-white">Press</button></li>
            </ul>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-4">Resources</h3>
            <ul className="space-y-2">
              <li><button className="text-white/60 hover:text-white">Documentation</button></li>
              <li><button className="text-white/60 hover:text-white">Help Center</button></li>
              <li><button className="text-white/60 hover:text-white">API Reference</button></li>
              <li><button className="text-white/60 hover:text-white">Status</button></li>
            </ul>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-4">Contact</h3>
            <ul className="space-y-2">
              <li><button className="text-white/60 hover:text-white">Sales</button></li>
              <li><button className="text-white/60 hover:text-white">Support</button></li>
              <li><button className="text-white/60 hover:text-white">Partners</button></li>
              <li><button className="text-white/60 hover:text-white">Media</button></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10 pt-8">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-white/60"> 2024 OHFdesk. All rights reserved.</p>
            <div className="flex gap-6">
              <button className="text-white/60 hover:text-white">Terms</button>
              <button className="text-white/60 hover:text-white">Privacy</button>
              <button className="text-white/60 hover:text-white">Cookies</button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
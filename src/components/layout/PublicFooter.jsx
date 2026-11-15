import React from 'react';
import { GraduationCap, Github, Linkedin, Server, Shield, Layers, Database, Cpu } from 'lucide-react';
import { Link } from 'react-router-dom';

export const PublicFooter = () => {
  return (
    <footer className="bg-slate-900 text-slate-400 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12">
          {/* Column 1: Info */}
          <div className="md:col-span-1 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center text-white">
                <GraduationCap className="w-5 h-5" />
              </div>
              <span className="font-bold text-lg text-white tracking-tight">CloudEdu</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Cloud-Based Student Management & Assignment Submission Portal built for modern higher education institutions with an event-driven AWS Serverless architecture.
            </p>
            <div className="pt-2">
              <span className="inline-block px-2.5 py-1 rounded-md text-[11px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
                MCA Cloud Computing Capstone
              </span>
            </div>
          </div>

          {/* Column 2: AWS Services */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white mb-4">
              AWS Serverless Stack
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li className="flex items-center gap-2">
                <Shield className="w-3.5 h-3.5 text-brand-400" />
                <span>Amazon Cognito (Auth & RBAC)</span>
              </li>
              <li className="flex items-center gap-2">
                <Server className="w-3.5 h-3.5 text-sky-400" />
                <span>Amazon API Gateway (REST APIs)</span>
              </li>
              <li className="flex items-center gap-2">
                <Cpu className="w-3.5 h-3.5 text-amber-400" />
                <span>AWS Lambda (Node.js Microservices)</span>
              </li>
              <li className="flex items-center gap-2">
                <Database className="w-3.5 h-3.5 text-blue-400" />
                <span>Amazon DynamoDB (NoSQL Data)</span>
              </li>
              <li className="flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-emerald-400" />
                <span>Amazon S3 (PDF Assignment Files)</span>
              </li>
            </ul>
          </div>

          {/* Column 3: Quick Navigation */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white mb-4">
              Portal Navigation
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/login" className="hover:text-white transition-colors">
                  Sign In (Student / Faculty)
                </Link>
              </li>
              <li>
                <Link to="/register" className="hover:text-white transition-colors">
                  Student Registration
                </Link>
              </li>
              <li>
                <Link to="/student" className="hover:text-white transition-colors">
                  Student Dashboard Demo
                </Link>
              </li>
              <li>
                <Link to="/admin" className="hover:text-white transition-colors">
                  Faculty Admin Dashboard Demo
                </Link>
              </li>
              <li>
                <a href="#architecture" className="hover:text-white transition-colors">
                  System Architecture Specs
                </a>
              </li>
            </ul>
          </div>

          {/* Column 4: Portfolio Context */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white mb-4">
              Portfolio & Project Showcase
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Engineered as a production-grade full-stack cloud portfolio demonstration emphasizing zero-cost tier optimization, high scalability, and clean modular code.
            </p>
            <div className="flex items-center gap-3">
              <a
                href="https://github.com"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition-colors border border-slate-700"
                aria-label="GitHub Repository"
              >
                <Github className="w-4 h-4" />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition-colors border border-slate-700"
                aria-label="LinkedIn Profile"
              >
                <Linkedin className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© 2026 CloudEdu Portal • Built for MCA Cloud Computing Evaluation</p>
          <div className="flex items-center gap-4">
            <span>Client: React 18 + Vite + Tailwind CSS</span>
            <span>•</span>
            <span>Cloud: AWS Serverless Native</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default PublicFooter;

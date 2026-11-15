import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  Cloud,
  Shield,
  Server,
  Database,
  Layers,
  Cpu,
  ArrowRight,
  CheckCircle2,
  FileCheck2,
  Users,
  Award,
  Zap,
  Code2,
  UploadCloud,
  Eye,
  FileText
} from 'lucide-react';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import { useAuth } from '../../hooks/useAuth';

export const LandingPage = () => {
  const { login, isCognitoConfigured } = useAuth();
  const navigate = useNavigate();

  const handleQuickDemo = async (targetRole) => {
    if (!isCognitoConfigured) {
      const email = targetRole === 'faculty' ? 'faculty@cloudedu.ac.in' : 'student@cloudedu.ac.in';
      try {
        await login(email, 'password123');
        navigate(targetRole === 'faculty' ? '/admin/dashboard' : '/student/dashboard');
      } catch (err) {
        navigate('/login');
      }
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-20 lg:pt-24 lg:pb-32 bg-gradient-to-b from-brand-50/60 via-slate-50 to-white">
        {/* Subtle grid background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-40 pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-100/70 border border-brand-200 text-brand-800 text-xs font-semibold mb-6 shadow-subtle">
            <span className="flex h-2 w-2 rounded-full bg-brand-600 animate-pulse"></span>
            MCA Cloud Computing Capstone Project
            <span className="text-brand-300">•</span>
            AWS Serverless Architecture
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight max-w-4xl mx-auto leading-[1.15]">
            Cloud-Based Student Management &{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-sky-600">
              Assignment Portal
            </span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            A centralized, enterprise-grade academic platform built for seamless student submission workflows, faculty assignment lifecycle management, and transparent grading.
          </p>

          {/* Action Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              size="lg"
              variant="primary"
              onClick={() => handleQuickDemo('student')}
              icon={ArrowRight}
              iconPosition="right"
              className="w-full sm:w-auto shadow-md shadow-brand-500/20"
            >
              Launch Student Demo
            </Button>
            <Button
              size="lg"
              variant="secondary"
              onClick={() => handleQuickDemo('faculty')}
              icon={Shield}
              className="w-full sm:w-auto"
            >
              Launch Faculty Admin Demo
            </Button>
          </div>

          {/* Stats Bar */}
          <div className="mt-14 max-w-3xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-white border border-slate-200/90 shadow-card">
            <div className="p-2 text-center">
              <div className="text-2xl font-black text-brand-600">100%</div>
              <div className="text-xs font-medium text-slate-500 mt-0.5">Serverless Target</div>
            </div>
            <div className="p-2 text-center border-l border-slate-100">
              <div className="text-2xl font-black text-slate-900">&lt; 10MB</div>
              <div className="text-xs font-medium text-slate-500 mt-0.5">S3 PDF Submissions</div>
            </div>
            <div className="p-2 text-center border-l border-slate-100">
              <div className="text-2xl font-black text-emerald-600">4-Stage</div>
              <div className="text-xs font-medium text-slate-500 mt-0.5">Review Lifecycle</div>
            </div>
            <div className="p-2 text-center border-l border-slate-100">
              <div className="text-2xl font-black text-slate-900">Zero-Cost</div>
              <div className="text-xs font-medium text-slate-500 mt-0.5">Free Tier Optimized</div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive AWS Serverless Architecture Showcase */}
      <section id="architecture" className="py-20 bg-slate-900 text-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold tracking-widest text-brand-400 uppercase">
              Cloud Computing Blueprint
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mt-2">
              End-to-End AWS Serverless Architecture
            </h2>
            <p className="text-slate-400 text-sm sm:text-base mt-4 leading-relaxed">
              Designed from the ground up for high availability, automatic scaling, and zero server maintenance overhead. Every service aligns with the AWS Well-Architected Framework.
            </p>
          </div>

          {/* Architectural Flow Visual */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative mb-12">
            {/* Step 1: Frontend */}
            <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-5 relative group hover:border-brand-500 transition-all">
              <div className="w-10 h-10 rounded-xl bg-brand-500/20 text-brand-400 flex items-center justify-center mb-3">
                <Code2 className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold tracking-wider uppercase text-slate-400">Layer 1</span>
              <h3 className="text-base font-bold text-white mt-1">AWS Amplify & React</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Single Page Application built with Vite and Tailwind CSS, hosted globally via AWS Amplify and CloudFront CDN.
              </p>
            </div>

            {/* Step 2: Auth */}
            <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-5 relative group hover:border-brand-500 transition-all">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center mb-3">
                <Shield className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold tracking-wider uppercase text-slate-400">Layer 2</span>
              <h3 className="text-base font-bold text-white mt-1">Amazon Cognito</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Handles user authentication, JWT token issuance, and granular Role-Based Access Control (Student vs Faculty).
              </p>
            </div>

            {/* Step 3: API Gateway */}
            <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-5 relative group hover:border-brand-500 transition-all">
              <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center mb-3">
                <Server className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold tracking-wider uppercase text-slate-400">Layer 3</span>
              <h3 className="text-base font-bold text-white mt-1">Amazon API Gateway</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Secure REST API endpoints with request validation, throttling, CORS support, and Cognito Authorizers.
              </p>
            </div>

            {/* Step 4: Compute */}
            <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-5 relative group hover:border-brand-500 transition-all">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-3">
                <Cpu className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold tracking-wider uppercase text-slate-400">Layer 4</span>
              <h3 className="text-base font-bold text-white mt-1">AWS Lambda</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Stateless Node.js microservices executing assignment lifecycle, submission tracking, and grading logic on-demand.
              </p>
            </div>

            {/* Step 5: Data & Storage */}
            <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-5 relative group hover:border-brand-500 transition-all">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3">
                <Database className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold tracking-wider uppercase text-slate-400">Layer 5</span>
              <h3 className="text-base font-bold text-white mt-1">DynamoDB & S3</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                DynamoDB provides single-digit millisecond NoSQL persistence; Amazon S3 securely stores PDF submissions via presigned URLs.
              </p>
            </div>
          </div>

          {/* Architecture Benefits Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6 border-t border-slate-800">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-brand-400 shrink-0">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Zero Idle Cost</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Costs strictly scale with student request volume. 100% compliant with the AWS Free Tier.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-brand-400 shrink-0">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Least-Privilege Security</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Fine-grained AWS IAM execution roles isolate student submissions and protect faculty review actions.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-brand-400 shrink-0">
                <Cloud className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Full Observability</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Amazon CloudWatch logs API latencies, Lambda invocation metrics, and captures audit trails.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Role Workflows & Features */}
      <section id="roles" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold tracking-widest text-brand-600 uppercase">
              Role-Based Experience
            </span>
            <h2 className="text-3xl font-extrabold text-slate-900 mt-2">
              Dedicated Workspaces for Students and Faculty
            </h2>
            <p className="text-slate-600 text-sm mt-3">
              Engineered with clean separation of concerns, providing distinct views and permission boundaries.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Student Card */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-8 shadow-card flex flex-col justify-between hover:shadow-card-hover transition-all">
              <div>
                <div className="w-12 h-12 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-600 mb-6">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Student Portal Experience</h3>
                <p className="text-sm text-slate-500 mt-2 mb-6 leading-relaxed">
                  Students manage their academic coursework, track live countdowns for upcoming deadlines, upload PDF assignments, and review grades with faculty feedback.
                </p>

                <ul className="space-y-3 text-sm text-slate-700">
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Real-time dashboard with pending and completed counts</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Drag-and-drop PDF file uploader with file validation</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Transparent submission history with status tracking</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>View detailed faculty feedback and performance scores</span>
                  </li>
                </ul>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-100">
                <Button
                  variant="primary"
                  className="w-full"
                  onClick={() => handleQuickDemo('student')}
                  icon={ArrowRight}
                  iconPosition="right"
                >
                  Enter Student Portal Demo
                </Button>
              </div>
            </div>

            {/* Faculty Card */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-8 shadow-card flex flex-col justify-between hover:shadow-card-hover transition-all">
              <div>
                <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 mb-6">
                  <Shield className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Faculty & Admin Console</h3>
                <p className="text-sm text-slate-500 mt-2 mb-6 leading-relaxed">
                  Instructors design assignments, enforce submission deadlines, view registered student rosters, download submissions, and grade work with structured feedback.
                </p>

                <ul className="space-y-3 text-sm text-slate-700">
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-purple-500 shrink-0" />
                    <span>Full Assignment CRUD (Create, Edit, Delete, Close)</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-purple-500 shrink-0" />
                    <span>Submissions review queue with status filters</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-purple-500 shrink-0" />
                    <span>4-State Evaluation: Pending, Reviewed, Approved, Rejected</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-purple-500 shrink-0" />
                    <span>Student enrollment directory and GPA tracking</span>
                  </li>
                </ul>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-100">
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={() => handleQuickDemo('faculty')}
                  icon={ArrowRight}
                  iconPosition="right"
                >
                  Enter Faculty Admin Console Demo
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MCA Project & Portfolio Context Section */}
      <section id="about" className="py-16 bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl bg-gradient-to-r from-brand-900 via-slate-900 to-brand-950 p-8 sm:p-12 text-white relative overflow-hidden">
            <div className="relative z-10 max-w-2xl">
              <span className="text-xs font-semibold uppercase tracking-wider text-brand-300">
                Academic & Portfolio Showcase
              </span>
              <h3 className="text-2xl sm:text-3xl font-extrabold mt-2">
                Engineered for Excellence in Cloud Computing
              </h3>
              <p className="text-slate-300 text-sm mt-3 leading-relaxed">
                This project exemplifies practical mastery over modern full-stack web development and AWS Cloud Architecture. Complete with modular microservices boundaries, role-based security, and cloud scalability.
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Link to="/register">
                  <Button variant="primary" size="md">
                    Register as Student
                  </Button>
                </Link>
                <Link to="/login">
                  <Button variant="secondary" size="md">
                    Sign In with Credentials
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;

/**
 * Realistic Mock Data for MCA Cloud Computing Project
 */

export const initialUsers = [
  {
    id: 'usr-student-001',
    role: 'student',
    name: 'Aarav Patel',
    email: 'student@cloudedu.ac.in',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    rollNumber: 'MCA2024042',
    program: 'Master of Computer Applications (MCA)',
    department: 'Department of Computer Science & Engineering',
    semester: 'Semester 4',
    academicYear: '2025-2026',
    enrolledCourses: [
      { code: 'MCA-401', name: 'Cloud Computing & AWS Serverless', credits: 4 },
      { code: 'MCA-402', name: 'Distributed Systems & NoSQL Databases', credits: 4 },
      { code: 'MCA-403', name: 'Deep Learning & Neural Networks', credits: 3 },
      { code: 'MCA-404', name: 'Full-Stack Enterprise Systems', credits: 3 }
    ],
    contact: {
      phone: '+91 98765 43210',
      address: 'Tech Innovation Park, Campus Hostel B-302, Bengaluru, Karnataka',
      github: 'https://github.com/cloud-student'
    }
  },
  {
    id: 'usr-faculty-001',
    role: 'faculty',
    name: 'Dr. Radhika Sharma',
    email: 'faculty@cloudedu.ac.in',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    facultyId: 'FAC-CS-892',
    designation: 'Professor & Head of Cloud Systems Lab',
    department: 'Department of Computer Science & Engineering',
    specialization: 'Cloud Computing, Serverless Architecture & Distributed Systems',
    officeHours: 'Mon & Wed: 2:00 PM - 5:00 PM',
    contact: {
      phone: '+91 98111 22334',
      office: 'Turing Hall, Room CS-412'
    }
  }
];

export const initialStudents = [
  {
    id: 'usr-student-001',
    name: 'Aarav Patel',
    email: 'student@cloudedu.ac.in',
    rollNumber: 'MCA2024042',
    department: 'CSE / MCA',
    semester: 'Semester 4',
    submissionsCount: 4,
    status: 'Active',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    gpa: '8.92'
  },
  {
    id: 'usr-student-002',
    name: 'Ananya Deshmukh',
    email: 'ananya.d@cloudedu.ac.in',
    rollNumber: 'MCA2024018',
    department: 'CSE / MCA',
    semester: 'Semester 4',
    submissionsCount: 5,
    status: 'Active',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    gpa: '9.40'
  },
  {
    id: 'usr-student-003',
    name: 'Rohan Mehra',
    email: 'rohan.m@cloudedu.ac.in',
    rollNumber: 'MCA2024075',
    department: 'CSE / MCA',
    semester: 'Semester 4',
    submissionsCount: 3,
    status: 'Active',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    gpa: '8.15'
  },
  {
    id: 'usr-student-004',
    name: 'Priyanka Sen',
    email: 'priyanka.s@cloudedu.ac.in',
    rollNumber: 'MCA2024033',
    department: 'CSE / MCA',
    semester: 'Semester 4',
    submissionsCount: 4,
    status: 'Active',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    gpa: '9.10'
  },
  {
    id: 'usr-student-005',
    name: 'Vikramaditya Roy',
    email: 'vikram.roy@cloudedu.ac.in',
    rollNumber: 'MCA2024089',
    department: 'CSE / MCA',
    semester: 'Semester 4',
    submissionsCount: 2,
    status: 'Pending Verification',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    gpa: '7.85'
  }
];

export const initialAssignments = [
  {
    id: 'asn-001',
    code: 'MCA-401',
    courseName: 'Cloud Computing & AWS Serverless',
    title: 'Serverless REST API using AWS Lambda, API Gateway & DynamoDB',
    description: 'Design and document a scalable serverless backend microservice architecture for an e-commerce order processing pipeline. Include IAM least-privilege policies, DynamoDB single-table design schema, and CloudWatch metrics alarms.',
    instructions: [
      'Document the architectural diagram detailing AWS Cognito, API Gateway, Lambda, and DynamoDB.',
      'Specify the DynamoDB Primary Key (PK), Sort Key (SK), and Global Secondary Indexes (GSIs).',
      'Provide Node.js / Python Lambda code snippets for CRUD operations.',
      'Submit your final report as a consolidated PDF (Max 10MB).'
    ],
    deadline: '2026-11-25T23:59:59',
    createdAt: '2026-11-01T10:00:00',
    totalMarks: 100,
    facultyId: 'usr-faculty-001',
    facultyName: 'Dr. Radhika Sharma',
    status: 'Active',
    allowLateSubmissions: false,
    fileAttachment: 'AWS_Serverless_Architecture_Specification_v2.pdf'
  },
  {
    id: 'asn-002',
    code: 'MCA-402',
    courseName: 'Distributed Systems & NoSQL Databases',
    title: 'CAP Theorem Analysis & DynamoDB Consensus Protocols',
    description: 'Provide an in-depth analytical breakdown comparing Amazon DynamoDB and Apache Cassandra. Analyze tunable consistency, write isolation levels, multi-region replication (DynamoDB Global Tables), and Paxos/Raft consensus guarantees.',
    instructions: [
      'Perform quantitative throughput benchmarking comparison.',
      'Analyze failure recovery scenarios in distributed partitions.',
      'Format in IEEE conference paper format (double-column PDF).'
    ],
    deadline: '2026-11-30T23:59:59',
    createdAt: '2026-11-05T14:30:00',
    totalMarks: 50,
    facultyId: 'usr-faculty-001',
    facultyName: 'Dr. Radhika Sharma',
    status: 'Active',
    allowLateSubmissions: true,
    fileAttachment: 'Distributed_Systems_Research_Template.pdf'
  },
  {
    id: 'asn-003',
    code: 'MCA-403',
    courseName: 'Deep Learning & Neural Networks',
    title: 'Object Detection & Semantic Segmentation using PyTorch',
    description: 'Train a YOLOv8 or Mask R-CNN network on custom medical radiology datasets. Evaluate Mean Average Precision (mAP@50-95), precision-recall curves, and perform ablation studies on backbone feature extractors.',
    instructions: [
      'Provide train/val loss curves and confusion matrix.',
      'Include inference latency benchmarks across CPU vs GPU instances.',
      'Export PDF report including sample inference masks.'
    ],
    deadline: '2026-12-05T23:59:59',
    createdAt: '2026-11-10T09:15:00',
    totalMarks: 100,
    facultyId: 'usr-faculty-001',
    facultyName: 'Dr. Radhika Sharma',
    status: 'Active',
    allowLateSubmissions: false,
    fileAttachment: null
  },
  {
    id: 'asn-004',
    code: 'MCA-404',
    courseName: 'Full-Stack Enterprise Systems',
    title: 'Modern SPA State Architecture & Micro-Frontends',
    description: 'Architect a production-grade single page application using React 18, Vite, Module Federation, and Tailwind CSS. Implement optimistic UI updates, resilient caching, and accessibility standards (WCAG 2.1 AA).',
    instructions: [
      'Submit system component hierarchy and data flow charts.',
      'Explain bundle size optimization techniques employed (tree shaking, code splitting).',
      'Submit project summary PDF with repository links.'
    ],
    deadline: '2026-12-12T23:59:59',
    createdAt: '2026-11-12T11:00:00',
    totalMarks: 75,
    facultyId: 'usr-faculty-001',
    facultyName: 'Dr. Radhika Sharma',
    status: 'Active',
    allowLateSubmissions: true,
    fileAttachment: 'Enterprise_SPA_Guidelines.pdf'
  },
  {
    id: 'asn-005',
    code: 'MCA-401',
    courseName: 'Cloud Computing & AWS Serverless',
    title: 'Automated CI/CD Pipeline with AWS CodePipeline & GitHub',
    description: 'Configure a zero-downtime Blue/Green deployment pipeline for containerized ECS tasks using AWS CodeBuild, CodeDeploy, and GitHub webhooks with automated canary verification.',
    instructions: [
      'Include complete buildspec.yml and appspec.yaml files.',
      'Show rollback triggering upon synthetic canary health failure.',
      'Submit PDF with CloudWatch alarm metric screenshots.'
    ],
    deadline: '2026-10-28T23:59:59',
    createdAt: '2026-10-10T08:00:00',
    totalMarks: 50,
    facultyId: 'usr-faculty-001',
    facultyName: 'Dr. Radhika Sharma',
    status: 'Closed',
    allowLateSubmissions: false,
    fileAttachment: null
  }
];

export const initialSubmissions = [
  {
    id: 'sub-001',
    assignmentId: 'asn-001',
    assignmentTitle: 'Serverless REST API using AWS Lambda, API Gateway & DynamoDB',
    courseCode: 'MCA-401',
    studentId: 'usr-student-001',
    studentName: 'Aarav Patel',
    studentRoll: 'MCA2024042',
    studentEmail: 'student@cloudedu.ac.in',
    fileName: 'Aarav_Patel_MCA2024042_Serverless_API_Project.pdf',
    fileSize: '4.2 MB',
    submittedAt: '2026-11-18T16:45:00',
    status: 'Approved', // Pending, Reviewed, Approved, Rejected
    grade: 96,
    maxMarks: 100,
    feedback: 'Exceptional architectural breakdown! The DynamoDB GSI partitioning strategy and least-privilege IAM policies are industry-grade. Well done.',
    remarks: 'Included Terraform IaC script repository link and CloudWatch dashboard snapshot on page 14.',
    reviewedAt: '2026-11-20T11:30:00',
    reviewedBy: 'Dr. Radhika Sharma'
  },
  {
    id: 'sub-002',
    assignmentId: 'asn-002',
    assignmentTitle: 'CAP Theorem Analysis & DynamoDB Consensus Protocols',
    courseCode: 'MCA-402',
    studentId: 'usr-student-001',
    studentName: 'Aarav Patel',
    studentRoll: 'MCA2024042',
    studentEmail: 'student@cloudedu.ac.in',
    fileName: 'Aarav_Patel_DynamoDB_Paxos_Research.pdf',
    fileSize: '2.8 MB',
    submittedAt: '2026-11-22T09:12:00',
    status: 'Reviewed',
    grade: 44,
    maxMarks: 50,
    feedback: 'Solid analysis of DynamoDB Global Tables replication lag. Consider adding more details on write isolation under high contention.',
    remarks: 'Tested with 10k concurrent simulated client writes using Locust framework.',
    reviewedAt: '2026-11-23T14:10:00',
    reviewedBy: 'Dr. Radhika Sharma'
  },
  {
    id: 'sub-003',
    assignmentId: 'asn-003',
    assignmentTitle: 'Object Detection & Semantic Segmentation using PyTorch',
    courseCode: 'MCA-403',
    studentId: 'usr-student-001',
    studentName: 'Aarav Patel',
    studentRoll: 'MCA2024042',
    studentEmail: 'student@cloudedu.ac.in',
    fileName: 'YOLOv8_Medical_Segmentation_Aarav.pdf',
    fileSize: '8.4 MB',
    submittedAt: '2026-11-24T18:20:00',
    status: 'Pending',
    grade: null,
    maxMarks: 100,
    feedback: null,
    remarks: 'Model weights and checkpoints are hosted on Hugging Face hub as referenced in section 3.',
    reviewedAt: null,
    reviewedBy: null
  },
  {
    id: 'sub-004',
    assignmentId: 'asn-001',
    assignmentTitle: 'Serverless REST API using AWS Lambda, API Gateway & DynamoDB',
    courseCode: 'MCA-401',
    studentId: 'usr-student-002',
    studentName: 'Ananya Deshmukh',
    studentRoll: 'MCA2024018',
    studentEmail: 'ananya.d@cloudedu.ac.in',
    fileName: 'Ananya_MCA2024018_AWS_Serverless_Submission.pdf',
    fileSize: '5.1 MB',
    submittedAt: '2026-11-19T11:05:00',
    status: 'Approved',
    grade: 98,
    maxMarks: 100,
    feedback: 'Flawless execution! Excellent API Gateway rate-limiting and JWT authorizer integration.',
    remarks: 'Tested against OWASP Top 10 API Security risks.',
    reviewedAt: '2026-11-21T10:00:00',
    reviewedBy: 'Dr. Radhika Sharma'
  },
  {
    id: 'sub-005',
    assignmentId: 'asn-002',
    assignmentTitle: 'CAP Theorem Analysis & DynamoDB Consensus Protocols',
    courseCode: 'MCA-402',
    studentId: 'usr-student-003',
    studentName: 'Rohan Mehra',
    studentRoll: 'MCA2024075',
    studentEmail: 'rohan.m@cloudedu.ac.in',
    fileName: 'Rohan_Mehra_CAP_DynamoDB.pdf',
    fileSize: '3.6 MB',
    submittedAt: '2026-11-23T14:40:00',
    status: 'Pending',
    grade: null,
    maxMarks: 50,
    feedback: null,
    remarks: 'Draft submission covering quorum intersection formulas.',
    reviewedAt: null,
    reviewedBy: null
  },
  {
    id: 'sub-006',
    assignmentId: 'asn-001',
    assignmentTitle: 'Serverless REST API using AWS Lambda, API Gateway & DynamoDB',
    courseCode: 'MCA-401',
    studentId: 'usr-student-004',
    studentName: 'Priyanka Sen',
    studentRoll: 'MCA2024033',
    studentEmail: 'priyanka.s@cloudedu.ac.in',
    fileName: 'Priyanka_Sen_Serverless_Submission_v1.pdf',
    fileSize: '3.9 MB',
    submittedAt: '2026-11-20T16:15:00',
    status: 'Rejected',
    grade: 30,
    maxMarks: 100,
    feedback: 'The submission is missing the DynamoDB Single-Table Schema design diagram and the IAM security policy definitions required by the rubric. Please update and re-submit.',
    remarks: 'Resubmission requested by faculty.',
    reviewedAt: '2026-11-21T15:20:00',
    reviewedBy: 'Dr. Radhika Sharma'
  }
];

export const initialActivities = [
  {
    id: 'act-1',
    title: 'Assignment Submitted',
    description: 'Submitted PDF for "Object Detection & Semantic Segmentation using PyTorch"',
    time: '2 hours ago',
    type: 'submission',
    status: 'info'
  },
  {
    id: 'act-2',
    title: 'Grade Published',
    description: 'Dr. Radhika Sharma graded "CAP Theorem Analysis" (44/50)',
    time: 'Yesterday at 2:10 PM',
    type: 'grade',
    status: 'success'
  },
  {
    id: 'act-3',
    title: 'New Assignment Posted',
    description: 'Modern SPA State Architecture & Micro-Frontends has been published',
    time: '3 days ago',
    type: 'assignment',
    status: 'warning'
  },
  {
    id: 'act-4',
    title: 'Submission Approved',
    description: 'Your Serverless REST API submission received a score of 96/100',
    time: '5 days ago',
    type: 'approved',
    status: 'success'
  }
];

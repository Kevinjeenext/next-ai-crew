/**
 * AI Department Seeding — 10 departments with Korean/English names
 * Called during org creation to populate default departments.
 */

export interface DepartmentSeed {
  name: string;
  description: string;
  icon: string;
  color: string;
  roles: string[];
}

export const DEFAULT_DEPARTMENTS: DepartmentSeed[] = [
  {
    name: "Engineering",
    description: "소프트웨어 개발, 인프라, 아키텍처",
    icon: "💻",
    color: "#2563EB",
    roles: ["Backend Developer", "Frontend Developer", "Fullstack Developer", "DevOps Engineer", "Data Engineer"],
  },
  {
    name: "Design",
    description: "UI/UX 디자인, 그래픽, 브랜딩",
    icon: "🎨",
    color: "#6366F1",
    roles: ["UI Designer", "UX Researcher", "Graphic Designer", "Brand Designer", "Motion Designer"],
  },
  {
    name: "Marketing",
    description: "콘텐츠 마케팅, 그로스, SEO, 광고",
    icon: "📣",
    color: "#06B6D4",
    roles: ["Content Marketer", "Growth Hacker", "SEO Specialist", "Ad Manager", "Social Media Manager"],
  },
  {
    name: "Finance",
    description: "회계, 재무분석, 예산 관리",
    icon: "💰",
    color: "#10B981",
    roles: ["Accountant", "Financial Analyst", "Budget Manager", "Tax Specialist"],
  },
  {
    name: "HR",
    description: "채용, 교육, 조직문화, 인사관리",
    icon: "👥",
    color: "#F59E0B",
    roles: ["Recruiter", "Training Manager", "HR Business Partner", "Culture Lead"],
  },
  {
    name: "Sales",
    description: "영업, 제안서, 고객 관계 관리",
    icon: "🤝",
    color: "#EF4444",
    roles: ["Sales Manager", "Account Executive", "Business Development Rep", "Proposal Writer"],
  },
  {
    name: "Customer Success",
    description: "고객 지원, 온보딩, 기술 지원",
    icon: "💬",
    color: "#8B5CF6",
    roles: ["Support Agent", "Onboarding Specialist", "Technical Support", "Customer Success Manager"],
  },
  {
    name: "Legal",
    description: "계약, 컴플라이언스, 법률 자문",
    icon: "⚖️",
    color: "#64748B",
    roles: ["Legal Counsel", "Contract Manager", "Compliance Officer", "IP Specialist"],
  },
  {
    name: "Planning",
    description: "전략 기획, 프로젝트 관리, 사업 분석",
    icon: "📐",
    color: "#0EA5E9",
    roles: ["Strategic Planner", "Project Manager", "Business Analyst", "Product Manager"],
  },
  {
    name: "Operations",
    description: "운영 관리, 프로세스 최적화, 물류",
    icon: "⚙️",
    color: "#F97316",
    roles: ["Operations Manager", "Process Analyst", "Logistics Coordinator", "Quality Assurance"],
  },
];

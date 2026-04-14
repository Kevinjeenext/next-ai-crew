/**
 * Skill Store Presets — 하드코딩 15종 (DB 없이)
 */
export interface SkillPreset {
  id: string;
  name: string;
  version: string;
  author: string;
  category: string;
  icon: string;
  description: string;
  features: string[];
  whenToUse: string[];
  cautions: string[];
  size: string;
  downloads: number;
  updatedAt: string;
  tags: string[];
}

export const SKILL_CATEGORIES = [
  { id: "all", label: "전체" },
  { id: "productivity", label: "생산성" },
  { id: "memory", label: "메모리" },
  { id: "coding", label: "코딩" },
  { id: "automation", label: "자동화" },
  { id: "communication", label: "커뮤니케이션" },
  { id: "analytics", label: "분석" },
];

export const SKILL_PRESETS: SkillPreset[] = [
  {
    id: "web-search", name: "웹 검색", version: "2.1.0", author: "NEXT AI",
    category: "productivity", icon: "🔍",
    description: "실시간 웹 검색으로 최신 정보를 수집하고 요약합니다. DuckDuckGo, Google 검색 엔진을 활용합니다.",
    features: ["실시간 검색 결과 수집", "URL 콘텐츠 추출 및 요약", "다국어 검색 지원", "검색 결과 필터링"],
    whenToUse: ["최신 뉴스나 트렌드 확인", "기술 문서 검색", "경쟁사 분석"],
    cautions: ["실시간 데이터는 변동 가능", "일부 사이트 접근 제한"],
    size: "1.2 MB", downloads: 8420, updatedAt: "2026-04-10", tags: ["검색", "정보수집", "웹"],
  },
  {
    id: "doc-writer", name: "문서 작성", version: "3.0.1", author: "NEXT AI",
    category: "productivity", icon: "📝",
    description: "보고서, 기획서, 제안서 등 비즈니스 문서를 전문적으로 작성합니다.",
    features: ["템플릿 기반 문서 생성", "마크다운/HTML 출력", "목차 자동 생성", "다국어 작성"],
    whenToUse: ["주간/월간 보고서", "프로젝트 기획서", "투자 제안서"],
    cautions: ["최종 검토 필수", "기밀 정보 포함 시 주의"],
    size: "0.8 MB", downloads: 12350, updatedAt: "2026-04-12", tags: ["문서", "보고서", "작성"],
  },
  {
    id: "code-review", name: "코드 리뷰", version: "1.5.2", author: "NEXT AI",
    category: "coding", icon: "🔧",
    description: "코드 품질 분석, 버그 탐지, 최적화 제안을 제공합니다.",
    features: ["정적 분석 및 린트 체크", "보안 취약점 탐지", "리팩토링 제안", "PR 리뷰 자동화"],
    whenToUse: ["코드 머지 전 리뷰", "레거시 코드 분석", "보안 감사"],
    cautions: ["모든 버그를 잡을 수 없음", "언어별 지원 범위 차이"],
    size: "2.4 MB", downloads: 6890, updatedAt: "2026-04-08", tags: ["코드", "리뷰", "품질"],
  },
  {
    id: "data-analysis", name: "데이터 분석", version: "2.3.0", author: "NEXT AI",
    category: "analytics", icon: "📊",
    description: "CSV, JSON 데이터를 분석하고 인사이트를 도출합니다. 시각화 차트도 생성합니다.",
    features: ["데이터 통계 분석", "트렌드 및 패턴 탐지", "차트/그래프 생성", "이상치 탐지"],
    whenToUse: ["매출 데이터 분석", "사용자 행동 분석", "KPI 모니터링"],
    cautions: ["대용량 데이터 처리 시간", "데이터 품질에 따라 결과 차이"],
    size: "3.1 MB", downloads: 5430, updatedAt: "2026-04-11", tags: ["데이터", "분석", "차트"],
  },
  {
    id: "email-sender", name: "이메일 발송", version: "1.2.0", author: "NEXT AI",
    category: "communication", icon: "📧",
    description: "이메일 초안 작성, 포맷팅, 발송 기능을 제공합니다.",
    features: ["이메일 초안 자동 생성", "HTML 템플릿 지원", "수신자 관리", "예약 발송"],
    whenToUse: ["고객 뉴스레터", "팀 공지사항", "거래처 커뮤니케이션"],
    cautions: ["발송 전 내용 확인 필수", "스팸 필터 주의"],
    size: "0.6 MB", downloads: 4210, updatedAt: "2026-04-09", tags: ["이메일", "발송", "커뮤니케이션"],
  },
  {
    id: "calendar-mgmt", name: "캘린더 관리", version: "1.8.0", author: "NEXT AI",
    category: "productivity", icon: "📅",
    description: "일정 관리, 미팅 조율, 리마인더 설정 기능을 제공합니다.",
    features: ["일정 추가/수정/삭제", "미팅 시간 자동 조율", "리마인더 알림", "반복 일정 관리"],
    whenToUse: ["팀 미팅 일정 조율", "데드라인 관리", "정기 회의 설정"],
    cautions: ["시간대 설정 확인", "외부 캘린더 연동 필요"],
    size: "0.5 MB", downloads: 7650, updatedAt: "2026-04-13", tags: ["캘린더", "일정", "미팅"],
  },
  {
    id: "report-gen", name: "보고서 생성", version: "2.0.0", author: "NEXT AI",
    category: "analytics", icon: "📋",
    description: "데이터 기반 보고서를 자동 생성합니다. 차트, 표, 요약을 포함합니다.",
    features: ["자동 보고서 템플릿", "데이터 시각화 포함", "PDF/HTML 출력", "주기적 자동 생성"],
    whenToUse: ["주간 실적 보고", "프로젝트 진행 보고", "재무 보고서"],
    cautions: ["데이터 소스 연결 필요", "커스텀 포맷 제한"],
    size: "1.8 MB", downloads: 3980, updatedAt: "2026-04-07", tags: ["보고서", "자동화", "분석"],
  },
  {
    id: "translator", name: "번역", version: "3.1.0", author: "NEXT AI",
    category: "communication", icon: "🌐",
    description: "한/영/일/중 등 다국어 번역 및 로컬라이제이션을 지원합니다.",
    features: ["실시간 번역", "문맥 기반 자연스러운 번역", "전문 용어 사전", "일괄 번역"],
    whenToUse: ["다국어 문서 번역", "해외 고객 커뮤니케이션", "기술 문서 번역"],
    cautions: ["전문 용어는 검토 필요", "문화적 맥락 차이"],
    size: "0.9 MB", downloads: 9870, updatedAt: "2026-04-14", tags: ["번역", "다국어", "로컬라이제이션"],
  },
  {
    id: "brainstorm", name: "브레인스토밍", version: "1.4.0", author: "NEXT AI",
    category: "productivity", icon: "💡",
    description: "아이디어 발산, 마인드맵 생성, 창의적 사고를 지원합니다.",
    features: ["아이디어 자동 생성", "마인드맵 구조화", "SWOT 분석", "What-If 시나리오"],
    whenToUse: ["신제품 기획", "문제 해결 세션", "전략 수립"],
    cautions: ["아이디어 검증은 별도 필요", "실현 가능성 평가 필수"],
    size: "0.4 MB", downloads: 6230, updatedAt: "2026-04-06", tags: ["아이디어", "창의성", "기획"],
  },
  {
    id: "project-mgmt", name: "프로젝트 관리", version: "2.2.0", author: "NEXT AI",
    category: "automation", icon: "🎯",
    description: "프로젝트 계획 수립, 진행 추적, 리스크 관리를 자동화합니다.",
    features: ["WBS 자동 생성", "간트 차트 출력", "리스크 매트릭스", "진행률 자동 계산"],
    whenToUse: ["신규 프로젝트 킥오프", "프로젝트 상태 점검", "리소스 배분"],
    cautions: ["팀원 입력 데이터 필요", "복잡한 의존 관계 수동 조정"],
    size: "1.5 MB", downloads: 4560, updatedAt: "2026-04-10", tags: ["프로젝트", "관리", "계획"],
  },
  {
    id: "memory-long", name: "장기 기억", version: "1.1.0", author: "NEXT AI",
    category: "memory", icon: "🧠",
    description: "대화 내용을 장기 기억으로 저장하고, 필요할 때 정확히 회상합니다.",
    features: ["자동 기억 저장", "연관 기억 검색", "기억 우선순위 관리", "기억 정리/삭제"],
    whenToUse: ["장기 프로젝트 맥락 유지", "고객 선호도 기억", "반복 질문 방지"],
    cautions: ["저장 용량 제한", "민감 정보 기억 주의"],
    size: "2.0 MB", downloads: 7890, updatedAt: "2026-04-13", tags: ["기억", "맥락", "지속성"],
  },
  {
    id: "code-gen", name: "코드 생성", version: "2.5.0", author: "NEXT AI",
    category: "coding", icon: "⚡",
    description: "요구사항 기반 코드 자동 생성. TypeScript, Python, SQL 등 다국어 지원.",
    features: ["요구사항→코드 변환", "테스트 코드 자동 생성", "API 엔드포인트 생성", "DB 스키마 생성"],
    whenToUse: ["CRUD API 빠른 생성", "보일러플레이트 코드", "프로토타입"],
    cautions: ["생성 코드 리뷰 필수", "복잡한 비즈니스 로직 수동 보완"],
    size: "3.5 MB", downloads: 11200, updatedAt: "2026-04-14", tags: ["코드", "생성", "자동화"],
  },
  {
    id: "workflow-auto", name: "워크플로우 자동화", version: "1.6.0", author: "NEXT AI",
    category: "automation", icon: "⚙️",
    description: "반복 업무를 자동화 워크플로우로 구성합니다.",
    features: ["트리거 기반 자동 실행", "조건 분기", "외부 API 연동", "실행 로그"],
    whenToUse: ["정기 보고서 자동 발송", "데이터 파이프라인", "알림 자동화"],
    cautions: ["에러 핸들링 설정 필요", "외부 서비스 의존성"],
    size: "1.1 MB", downloads: 3450, updatedAt: "2026-04-11", tags: ["자동화", "워크플로우", "효율"],
  },
  {
    id: "sentiment", name: "감성 분석", version: "1.3.0", author: "NEXT AI",
    category: "analytics", icon: "😊",
    description: "텍스트의 감성/톤을 분석하여 긍정/부정/중립을 판별합니다.",
    features: ["감성 점수 산출", "핵심 키워드 추출", "톤 분류", "시계열 감성 추적"],
    whenToUse: ["고객 리뷰 분석", "SNS 모니터링", "팀 커뮤니케이션 톤 체크"],
    cautions: ["언어별 정확도 차이", "풍자/아이러니 감지 한계"],
    size: "1.4 MB", downloads: 2870, updatedAt: "2026-04-09", tags: ["감성", "분석", "NLP"],
  },
  {
    id: "meeting-notes", name: "회의록 작성", version: "1.0.0", author: "NEXT AI",
    category: "productivity", icon: "🎙️",
    description: "회의 내용을 정리하여 구조화된 회의록을 자동 작성합니다.",
    features: ["핵심 안건 자동 추출", "액션 아이템 정리", "참석자별 발언 정리", "후속 조치 리마인더"],
    whenToUse: ["팀 미팅 후", "고객 미팅 기록", "스프린트 회고"],
    cautions: ["음성 입력 미지원 (텍스트만)", "참석자 이름 확인 필요"],
    size: "0.7 MB", downloads: 5120, updatedAt: "2026-04-12", tags: ["회의", "기록", "정리"],
  },
];

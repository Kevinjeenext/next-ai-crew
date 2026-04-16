# A2A 협업 채팅 아키텍처

> CTO Soojin | 2026-04-16 | Kevin 요청: Soul 간 업무 위임 + 실시간 관전

## 태영 담당 (프론트엔드)

### 라우팅
- /org-chat → 조직 대화 목록
- /org-chat/:roomId → 대화 상세 (SSE 실시간)

### 컴포넌트
- OrgChatPage: 좌측 방 목록 + 우측 메시지 뷰
- MessageBubble: message_type별 분기 (chat/delegation/delegation_result/system)
- DelegationBanner: 위임 시작/완료 배너
- ResultBubble: Soul 아바타 + 결과 + 토큰 뱃지

### API 연동
- GET /api/a2a/rooms/:id/stream (SSE)
- GET /api/a2a/rooms/:id/delegations
- POST /api/a2a/delegate (위임 트리거)

### 예상: 11h (대화 UI 8h + 위임 컴포넌트 3h)

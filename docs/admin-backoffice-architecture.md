# Next AI Crew — 백오피스 + 멀티테넌트 + 권한 체계

> CTO Soojin | 2026-04-12 | Kevin 지시: 슈퍼어드민 + 백오피스

---

## 1. 권한 체계 (4-Tier RBAC)

```
┌─────────────────────────────────────────────────────────┐
│  Level 1: SUPER_ADMIN (시스템 전체)                      │
│  ├── kevin@nextpay.co.kr (시드)                          │
│  ├── 전체 테넌트 관리 / 유저 관리 / 시스템 설정          │
│  ├── 관리자 임명/해임                                    │
│  └── 빌링/플랜 오버라이드                                │
│                                                          │
│  Level 2: ADMIN (운영팀)                                 │
│  ├── 슈퍼어드민이 임명                                   │
│  ├── 테넌트 모니터링 / 유저 지원                         │
│  └── 감사 로그 열람                                      │
│                                                          │
│  Level 3: TENANT_ADMIN (조직 관리자)                     │
│  ├── 회원가입 시 자동 (org owner)                        │
│  ├── 자기 조직 Soul 관리 / 멤버 초대                     │
│  ├── 빌링/플랜 관리 (자기 조직)                          │
│  └── org_members.role = 'owner' or 'admin'               │
│                                                          │
│  Level 4: MEMBER (일반 사용자)                           │
│  ├── Soul 사용 (채팅)만 가능                             │
│  ├── Soul 생성/삭제 불가                                 │
│  └── org_members.role = 'member' or 'viewer'             │
└─────────────────────────────────────────────────────────┘
```

### 권한 매트릭스

| 기능 | Super Admin | Admin | Tenant Admin | Member |
|------|:-----------:|:-----:|:------------:|:------:|
| 전체 테넌트 목록 | ✅ | ✅ | ❌ | ❌ |
| 테넌트 생성/삭제 | ✅ | ❌ | ❌ | ❌ |
| 테넌트 정지/활성화 | ✅ | ✅ | ❌ | ❌ |
| 유저 목록 (전체) | ✅ | ✅ | ❌ | ❌ |
| 유저 역할 변경 | ✅ | ❌ | ❌ | ❌ |
| 관리자 임명/해임 | ✅ | ❌ | ❌ | ❌ |
| 시스템 설정 | ✅ | ❌ | ❌ | ❌ |
| 감사 로그 | ✅ | ✅ | ❌ | ❌ |
| 자기 조직 Soul 관리 | ✅ | ✅ | ✅ | ❌ |
| 자기 조직 멤버 관리 | ✅ | ✅ | ✅ | ❌ |
| 자기 조직 빌링 | ✅ | ✅ | ✅ | ❌ |
| Soul 사용 (채팅) | ✅ | ✅ | ✅ | ✅ |

---

## 2. DB 스키마

### 기존 테이블 활용 (변경 없음)
- `organizations` = **테넌트** (이미 존재)
- `org_members` = **테넌트 멤버** (이미 존재, role: owner/admin/member/viewer)

### 새로 추가
- `profiles` — auth.users 확장 (system_role: super_admin/admin/user)
- `admin_audit_log` — 관리자 행동 추적
- `system_settings` — 글로벌 설정 (가입 허용, 기본 플랜 등)

### organizations 확장 컬럼
- `status` — active/suspended/trial/expired
- `max_souls` — Soul 정원 (플랜별)
- `max_members` — 멤버 정원
- `trial_ends_at` — 트라이얼 종료일
- `suspended_reason` — 정지 사유

### 관계도

```
auth.users (Supabase Auth)
    │
    ├── profiles (1:1)
    │   └── system_role: super_admin / admin / user
    │
    ├── organizations (owner_id → auth.users.id)
    │   ├── status, max_souls, max_members
    │   ├── org_members (N:M)
    │   │   └── role: owner / admin / member / viewer
    │   ├── agents (souls)
    │   ├── soul_conversations
    │   └── soul_usage
    │
    └── admin_audit_log (actor_id)
```

---

## 3. 회원가입 플로우

```
[사용자]
    │
    ▼
[nextaicrew.com/login]
    │
    ├── Google OAuth
    ├── GitHub OAuth
    ├── Kakao OAuth
    └── Email + Password
    │
    ▼
[Supabase Auth — auth.users INSERT]
    │
    ▼
[handle_new_user() 트리거]
    ├── 1. profiles INSERT (system_role = 'user')
    │      └── kevin@nextpay.co.kr → system_role = 'super_admin'
    ├── 2. organizations INSERT (자동 테넌트 생성)
    └── 3. org_members INSERT (role = 'owner')
    │
    ▼
[온보딩 위저드] (Phase 2)
    ├── Step 1: 조직 이름 설정
    ├── Step 2: Soul 첫 채용 (/hire)
    └── Step 3: 첫 대화
    │
    ▼
[대시보드]
```

---

## 4. 백오피스 라우팅 + API

### 프론트엔드 라우팅

```
/admin                    → 백오피스 대시보드 (통계 요약)
/admin/users              → 전체 유저 목록 + 검색 + 역할 변경
/admin/tenants            → 전체 테넌트 목록 + 상태 관리
/admin/tenants/:id        → 테넌트 상세 (멤버/Soul/사용량)
/admin/souls              → 전체 Soul 목록 (모든 테넌트)
/admin/admins             → 관리자 목록 + 임명/해임
/admin/audit              → 감사 로그
/admin/settings           → 시스템 설정
/admin/billing            → 빌링 오버뷰 (MRR, 플랜 분포)
```

### API 엔드포인트

```
# 인증 + 권한 체크
GET  /api/auth/me               → 내 프로필 + system_role + org 목록

# 백오피스 (super_admin + admin only)
GET  /api/admin/stats            → 대시보드 통계
GET  /api/admin/users            → 유저 목록 (페이지네이션, 검색)
PUT  /api/admin/users/:id/role   → 시스템 역할 변경 (super_admin only)
GET  /api/admin/tenants          → 테넌트 목록
GET  /api/admin/tenants/:id      → 테넌트 상세
PUT  /api/admin/tenants/:id      → 테넌트 수정 (상태, 플랜 오버라이드)
GET  /api/admin/souls            → 전체 Soul 목록
GET  /api/admin/audit            → 감사 로그
GET  /api/admin/settings         → 시스템 설정 읽기
PUT  /api/admin/settings/:key    → 시스템 설정 변경 (super_admin only)
POST /api/admin/admins           → 관리자 임명 (super_admin only)
DELETE /api/admin/admins/:id     → 관리자 해임 (super_admin only)
```

---

## 5. API 미들웨어

### role 기반 Guard

```typescript
// server/middleware/role-guard.ts

function requireSystemRole(...roles: string[]) {
  return async (req, res, next) => {
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('system_role')
      .eq('id', req.userId)
      .single();

    if (!profile || !roles.includes(profile.system_role)) {
      return res.status(403).json({ 
        error: 'Forbidden',
        message: 'Insufficient system role' 
      });
    }

    req.systemRole = profile.system_role;
    next();
  };
}

// 사용 예
app.use('/api/admin', requireSystemRole('super_admin', 'admin'));
app.put('/api/admin/users/:id/role', requireSystemRole('super_admin'));
app.put('/api/admin/settings/:key', requireSystemRole('super_admin'));
```

### Tenant Isolation

```typescript
// server/middleware/tenant-guard.ts

function requireTenantRole(...roles: string[]) {
  return async (req, res, next) => {
    const orgId = req.params.orgId || req.body.org_id;
    
    const { data: member } = await supabaseAdmin
      .from('org_members')
      .select('role')
      .eq('org_id', orgId)
      .eq('user_id', req.userId)
      .single();

    if (!member || !roles.includes(member.role)) {
      // 시스템 관리자는 모든 테넌트 접근 가능
      const isAdmin = await isSystemAdmin(req.userId);
      if (!isAdmin) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Not a member of this organization'
        });
      }
    }

    req.tenantRole = member?.role;
    next();
  };
}
```

### Audit Logger

```typescript
// server/middleware/audit-logger.ts

async function logAdminAction(actorId: string, action: string, target: any) {
  await supabaseAdmin.from('admin_audit_log').insert({
    actor_id: actorId,
    actor_email: await getEmail(actorId),
    action,
    target_type: target.type,
    target_id: target.id,
    details: target.details || {}
  });
}

// 사용 예
await logAdminAction(req.userId, 'user.role_change', {
  type: 'user', id: targetUserId,
  details: { from: 'user', to: 'admin' }
});
```

---

## 6. 백오피스 UI 구조

```
┌──────────────────────────────────────────────────────────┐
│  [◆ Admin] Next AI Crew 백오피스         [Kevin] [Logout] │
├──────────────┬───────────────────────────────────────────┤
│  Admin Nav   │  Main Content                             │
│              │                                           │
│  📊 대시보드  │  ┌─────────────────────────────────────┐ │
│  👥 유저 관리 │  │ 통계: 전체 유저 / 테넌트 / Soul     │ │
│  🏢 테넌트   │  │ MRR / 활성 사용자 / 토큰 사용량     │ │
│  🤖 Soul     │  └─────────────────────────────────────┘ │
│  🔑 관리자   │                                           │
│  📋 감사로그  │  ┌─────────────────────────────────────┐ │
│  ⚙️ 설정     │  │ 테이블: 유저/테넌트/Soul 목록        │ │
│  💳 빌링     │  │ 검색 + 필터 + 페이지네이션            │ │
│              │  └─────────────────────────────────────┘ │
└──────────────┴───────────────────────────────────────────┘
```

---

## 7. 구현 우선순위

| # | 태스크 | 담당 | 예상 |
|---|--------|------|------|
| 1 | 006_admin_rbac.sql DDL 실행 | Kevin | 5분 |
| 2 | /api/auth/me (프로필 + role) | 태영 | 2시간 |
| 3 | requireSystemRole 미들웨어 | 태영 | 1시간 |
| 4 | /api/admin/stats + /users + /tenants | 태영 | 4시간 |
| 5 | /admin 프론트엔드 (사이드바 + 테이블) | 태영 | 4시간 |
| 6 | 감사 로그 미들웨어 + UI | 태영 | 2시간 |
| 7 | 온보딩 위저드 | Phase 2 | — |

---

*이 문서는 Kevin 의장님의 "백오피스 + 슈퍼어드민 + 멀티테넌트" 지시에 대한 CTO 기술 설계입니다.*

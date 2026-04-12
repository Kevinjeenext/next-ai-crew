# Soul 아바타 가이드라인 — 가상 인물 프로필 사진

> 2026-04-12 | Designer: Ivy | Kevin 지시
> 핵심 UX: Soul 채용 = "진짜 사람을 뽑는 느낌"
> 이니셜/아이콘 → AI 생성 가상 인물 프로필 사진으로 전환

---

## 1. 디자인 원칙

### "Soul = 동료" 원칙
- Soul 아바타는 **실제 직원 프로필 사진처럼** 보여야 함
- 다양성 필수: 성별·인종·연령·스타일 글로벌 대표성
- 자연스럽고 친근한 표정 (증명사진 X, 자연스러운 직장인 느낌)
- 배경: 단색 또는 블러 처리된 오피스/뉴트럴 배경

### UX 임팩트
- /hire 카드: "이 사람을 내 팀에 채용한다" 실감
- 사이드바: "오늘 Alex에게 물어봐야지" 친근함
- 채팅: 실제 메신저에서 대화하는 감각

---

## 2. 이미지 소스 (무료 상업 라이선스)

### ✅ 1순위 — Generated Photos API
- 사이트: https://generated.photos
- 특징: 다양성 필터 (성별·나이·인종·표정·헤어) API 제공
- 라이선스: **상업용 포함 Pro plan** ($19/mo, 10,000장)
- 해상도: 최대 1024×1024
- 추천: Soul 프리셋 확장 시 API로 자동 생성 가능

### ✅ 2순위 — UI Faces (Avataaars)
- 사이트: https://uifaces.co
- 특징: 디자이너용 무료 아바타 모음, 다양성 보장
- 라이선스: **CC0 (완전 무료 상업 사용)**
- 추천: 빠른 프로토타입에 즉시 활용

### ✅ 3순위 — Unsplash / Pexels (실제 인물)
- 라이선스: **Unsplash License / CC0** 상업 가능
- 조건: "사람 얼굴" 검색 → 자연스러운 프로필 컷
- 주의: 실제 인물 → 모델 릴리즈 확인 필요

### ✅ 4순위 — thispersondoesnotexist.com 스타일
- 직접 스크랩은 라이선스 불명확 → **직접 생성 권장**
- Stable Diffusion / Midjourney로 자체 생성
- 프롬프트 가이드 → 섹션 5 참고

### ❌ 피해야 할 소스
- Google 이미지 검색 결과
- 라이선스 불명확한 SNS 사진
- 유명인 얼굴 (저작권/초상권)

---

## 3. Soul 프리셋 20종 — 인물 배정표

다양성 기준: 성별 10:10, 인종 4그룹 균등, 연령 20s~50s 분포

| # | 이름 | 부서 | 성별 | 인종 | 연령대 | 분위기 |
|---|------|------|------|------|--------|--------|
| 01 | Alex | Engineering | 남 | 백인 | 30s | 캐주얼 후드, 자신감 있는 눈빛 |
| 02 | Sophia | Design | 여 | 아시아 | 20s | 밝은 미소, 크리에이티브 스타일 |
| 03 | Marcus | Security | 남 | 흑인 | 40s | 신뢰감, 전문적 표정 |
| 04 | Yuna | PM | 여 | 한국 | 30s | 깔끔한 비즈니스 캐주얼 |
| 05 | Liam | DevOps | 남 | 백인 | 20s | 자유로운 스타일, 개발자 느낌 |
| 06 | Priya | Data | 여 | 인도 | 30s | 분석적, 스마트한 인상 |
| 07 | Carlos | Marketing | 남 | 라틴 | 30s | 활기차고 외향적 |
| 08 | Emma | QA | 여 | 백인 | 20s | 꼼꼼해 보이는, 친근한 미소 |
| 09 | Jin | Backend | 남 | 동아시아 | 30s | 차분하고 집중된 표정 |
| 10 | Amara | EA | 여 | 흑인 | 30s | 프로페셔널, 따뜻한 미소 |
| 11 | Noah | Frontend | 남 | 혼혈 | 20s | 트렌디, 창의적 |
| 12 | Hana | UX Research | 여 | 일본 | 30s | 관찰력 있는 눈빛, 차분함 |
| 13 | Diego | Mobile | 남 | 라틴 | 30s | 에너제틱, 기술적 |
| 14 | Nadia | Content | 여 | 중동 | 30s | 창의적, 아티스틱 스타일 |
| 15 | Ryan | Infra | 남 | 아시아 | 40s | 경험 있어 보이는, 안정감 |
| 16 | Zoe | Growth | 여 | 백인 | 20s | 밝고 에너제틱 |
| 17 | Samuel | Data Science | 남 | 흑인 | 30s | 지적, 분석적 인상 |
| 18 | Mei | Frontend | 여 | 중국 | 20s | 테크 감성, 친근한 |
| 19 | Ethan | DevRel | 남 | 백인 | 30s | 커뮤니케이터, 발표자 느낌 |
| 20 | Isabel | Ops | 여 | 라틴 | 40s | 베테랑, 신뢰감 |

---

## 4. 이미지 스펙

### 크기 & 포맷
```
원본: 400×400px 이상 (square)
저장 포맷: WebP (용량 최적화) + JPEG fallback
품질: WebP 85%, JPEG 90%

서비스 사이즈:
- xs  (24px)  → 48×48 @2x
- sm  (32px)  → 64×64 @2x
- md  (40px)  → 80×80 @2x
- lg  (56px)  → 112×112 @2x
- xl  (72px)  → 144×144 @2x
- 2xl (96px)  → 192×192 @2x (채용 모달)
```

### 얼굴 프레이밍 규칙
```
✅ 올바른 크롭:
- 얼굴이 프레임의 60~75% 차지
- 이마 위 여백 약간 (10~15%)
- 턱 아래 여백 조금 (5~10%)
- 중앙 배치 (약간 위쪽 오프셋)

❌ 피해야 할 크롭:
- 이마 잘림
- 너무 작은 얼굴 (전신 사진 크롭 X)
- 옆모습 또는 극단적 각도
```

### 배경 규칙
```
✅ 추천:
- 단색 (뉴트럴 그레이, 소프트 블루 계열)
- 자연스럽게 블러된 오피스/카페 배경
- 그라디언트 단색

❌ 피해야 할 배경:
- 복잡한 배경 (사람 많은 거리 등)
- 강한 색상 배경 (빨강, 노랑 등)
- 야외 밝은 태양 역광
```

---

## 5. AI 생성 프롬프트 가이드

### Midjourney / Stable Diffusion 공통 기본 프롬프트
```
professional profile photo, [DESCRIPTION], 
headshot, neutral background, soft studio lighting, 
looking at camera, confident smile, sharp focus,
photorealistic, 85mm lens, shallow depth of field
--ar 1:1 --style raw
```

### 인물별 프롬프트 예시

**Alex (Engineering, 남, 백인, 30s)**
```
professional profile photo, caucasian male software engineer in his early 30s,
wearing casual navy hoodie, confident friendly expression, 
slight stubble, short brown hair, 
neutral gray background, soft studio lighting, sharp focus
--ar 1:1
```

**Sophia (Design, 여, 아시아, 20s)**
```
professional profile photo, east asian female UI designer in her late 20s,
bright genuine smile, creative casual style, black hair with highlights,
wearing simple white blouse, soft blurred office background,
natural lighting, photorealistic headshot
--ar 1:1
```

**Marcus (Security, 남, 흑인, 40s)**
```
professional profile photo, black male cybersecurity professional in his 40s,
serious trustworthy expression, slight smile, short hair,
wearing dark business casual shirt, clean studio background,
authoritative professional headshot, sharp focus
--ar 1:1
```

**Yuna (PM, 여, 한국, 30s)**
```
professional profile photo, korean female product manager in her early 30s,
confident warm smile, straight black hair, business casual attire,
soft background blur, clean professional headshot,
competent friendly expression, studio lighting
--ar 1:1
```

### 네거티브 프롬프트 (공통)
```
--no cartoon, illustration, anime, distorted, blur, 
watermark, text, logo, ugly, deformed, extra fingers,
sunglasses, hat, extreme angle, full body
```

---

## 6. 파일 관리 구조

```
public/
└── avatars/
    ├── souls/
    │   ├── alex.webp       (400×400)
    │   ├── alex@2x.webp    (800×800, optional)
    │   ├── sophia.webp
    │   ├── marcus.webp
    │   ├── yuna.webp
    │   ├── liam.webp
    │   ├── priya.webp
    │   ├── carlos.webp
    │   ├── emma.webp
    │   ├── jin.webp
    │   ├── amara.webp
    │   ├── noah.webp
    │   ├── hana.webp
    │   ├── diego.webp
    │   ├── nadia.webp
    │   ├── ryan.webp
    │   ├── zoe.webp
    │   ├── samuel.webp
    │   ├── mei.webp
    │   ├── ethan.webp
    │   └── isabel.webp
    └── placeholder/
        └── default.webp    (이니셜 폴백용)
```

---

## 7. SoulAvatar 컴포넌트 업데이트

```typescript
// SoulAvatar.tsx — 사진 우선, 이니셜 폴백
interface SoulAvatarProps {
  name: string;
  photoUrl?: string;        // /avatars/souls/alex.webp
  size?: 'xs'|'sm'|'md'|'lg'|'xl'|'2xl';
  status?: 'active'|'idle'|'offline';
  dept?: string;
}

const SoulAvatar = ({ name, photoUrl, size = 'md', status, dept }: SoulAvatarProps) => {
  const [imgError, setImgError] = useState(false);
  const colors = getDeptColors(dept || name);
  const px = sizeMap[size]; // 40, 56, 72...

  return (
    <div
      className={`soul-avatar soul-avatar-${size}`}
      style={{
        width: px, height: px,
        background: imgError || !photoUrl
          ? colors.bg   // 이미지 없을 때 → 부서 컬러 폴백
          : 'transparent',
        boxShadow: `0 0 8px ${colors.glow}`,
      }}
    >
      {photoUrl && !imgError ? (
        <img
          src={photoUrl}
          alt={name}
          onError={() => setImgError(true)}
          style={{
            width: '100%', height: '100%',
            borderRadius: '50%',
            objectFit: 'cover',
            objectPosition: 'center top',  // 얼굴 상단 기준
          }}
        />
      ) : (
        <span className="soul-avatar-initials" style={{ color: colors.fg }}>
          {getInitials(name)}
        </span>
      )}
      {status && (
        <span className={`soul-avatar-status ${status}`} />
      )}
    </div>
  );
};
```

---

## 8. Soul 프리셋 데이터 업데이트

```typescript
// souls/presets.ts
export const SOUL_PRESETS = [
  {
    id: 'alex',
    name: 'Alex',
    dept: 'engineering',
    photoUrl: '/avatars/souls/alex.webp',
    // ...
  },
  {
    id: 'sophia',
    name: 'Sophia',
    dept: 'design',
    photoUrl: '/avatars/souls/sophia.webp',
    // ...
  },
  // ... 20종
];
```

---

## 9. 접근성 (WCAG)

```typescript
// alt 텍스트 규칙
<img alt={`${name} 프로필 사진`} />

// 이미지 없을 때 aria-label
<div role="img" aria-label={`${name} 이니셜 아바타`}>
  {initials}
</div>
```

---

## 10. 구현 우선순위

| 단계 | 작업 | 담당 | 기한 |
|------|------|------|------|
| P0 | Generated Photos에서 20종 다운로드 | Ivy/한빈 | 즉시 |
| P0 | WebP 변환 + 크롭 최적화 | 태영 스크립트 | P0 후 |
| P0 | SoulAvatar img 폴백 로직 추가 | 태영 | P0 후 |
| P1 | /hire 카드 photoUrl 연결 | 태영 | 구현 후 |
| P1 | 사이드바 목록 photoUrl 연결 | 태영 | 구현 후 |
| P1 | 채팅 아바타 photoUrl 연결 | 태영 | 구현 후 |
| P2 | Generated Photos API 연동 (자동 생성) | 수진/태영 | 추후 |

---

## 11. Generated Photos 즉시 활용 가이드

```bash
# 무료 샘플 (라이선스 확인 필수)
# https://generated.photos/faces — 직접 다운로드

# 필터 기준
성별: Male/Female 각 10명
나이: 20-25 (4명), 26-35 (8명), 36-45 (5명), 46+ (3명)
인종: Asian (5), Black (4), Caucasian (6), Latino (3), Middle Eastern (2)
표정: Neutral smile (추천), Confident
```

> **즉시 실행 가능한 무료 대안**: https://uifaces.co/category/generated
> CC0 라이선스, 다양성 보장, 바로 다운로드 가능

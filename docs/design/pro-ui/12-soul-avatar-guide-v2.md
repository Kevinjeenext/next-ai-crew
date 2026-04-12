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

---

## 소상공인 특화 Soul 추가 (21~31번)

> 2026-04-12 추가 | Kevin 지시
> 대상: 식당/매장 (6종) + 학원 (5종)

### 인물 배정표 (21~31)

| # | 이름 | 부문 | 성별 | 인종 | 연령대 | 분위기 |
|---|------|------|------|------|--------|--------|
| 21 | Junho | 식당/매장 | 남 | 한국 | 40s | 베테랑 매니저, 친근·듬직 |
| 22 | Jiyeon | 식당/매장 | 여 | 한국 | 30s | 꼼꼼·정갈, 신뢰감 |
| 23 | Marco | 식당/매장 | 남 | 라틴 | 30s | 에너지 넘치는 영업형 |
| 24 | Hyungil | 식당/매장 | 남 | 한국 | 50s | 무게감·신뢰, 노무 전문가 |
| 25 | Sunhee | 식당/매장 | 여 | 한국 | 40s | 전문적·차분, 세무 전문가 |
| 26 | Daniel | 식당/매장 | 남 | 동아시아 | 30s | 정확·분석적, 회계 전문가 |
| 27 | Myungja | 학원 | 여 | 한국 | 50s | 따뜻하고 믿음직한 원장님 |
| 28 | Junho2 | 학원 | 남 | 한국 | 20s | 젊고 열정적인 수학 강사 |
| 29 | Ashley | 학원 | 여 | 혼혈 | 30s | 글로벌·밝은 영어 강사 |
| 30 | Taesoo | 학원 | 남 | 한국 | 40s | 전략적·날카로운 입시 컨설턴트 |
| 31 | Mirae | 학원 | 여 | 한국 | 40s | 공감력·따뜻함, 학부모 상담 |

---

### 아바타 파일명 규칙

기존 방식과 통일:
```
soul_21_junho.webp
soul_22_jiyeon.webp
soul_23_marco.webp
soul_24_hyungil.webp
soul_25_sunhee.webp
soul_26_daniel.webp
soul_27_myungja.webp
soul_28_junho2.webp  (수학 강사 Junho, 기존 21과 구분)
soul_29_ashley.webp
soul_30_taesoo.webp
soul_31_mirae.webp
```

---

### AI 생성 프롬프트 (21~31)

```
# 21 — Junho (매장 매니저, 40대 한국 남성)
professional profile photo, Korean man in his 40s, store manager look,
warm friendly smile, slightly chubby face, well-worn business casual,
headshot, soft studio lighting, neutral background, looking at camera --ar 1:1

# 22 — Jiyeon (재고 관리, 30대 한국 여성)
professional profile photo, Korean woman in her 30s, meticulous professional,
neat short bob hairstyle, subtle confident expression, light business attire,
headshot, clean studio background, sharp focus --ar 1:1

# 23 — Marco (세일즈, 30대 라틴 남성)
professional profile photo, Latin man in his 30s, energetic sales personality,
bright confident smile, well-fitted shirt, dynamic expression,
headshot, blurred office background, photorealistic --ar 1:1

# 24 — Hyungil (노무사, 50대 한국 남성)
professional profile photo, Korean man in his 50s, labor attorney look,
authoritative serious expression, suit and tie, silver-streaked hair,
headshot, neutral dark background, trustworthy aura --ar 1:1

# 25 — Sunhee (세무사, 40대 한국 여성)
professional profile photo, Korean woman in her 40s, tax accountant,
neat professional hairstyle, composed expert expression, formal blouse,
headshot, soft neutral background, sharp studio lighting --ar 1:1

# 26 — Daniel (회계사, 30대 동아시아 남성)
professional profile photo, East Asian man in his 30s, accountant,
precise analytical expression, slim glasses, neat business attire,
headshot, clean white-grey background, focused look --ar 1:1

# 27 — Myungja (학원 원장, 50대 한국 여성)
professional profile photo, Korean woman in her 50s, academy director,
warm maternal smile, elegant modest attire, experienced kind eyes,
headshot, soft warm-toned background, welcoming expression --ar 1:1

# 28 — Junho2 (수학 교사, 20대 한국 남성)
professional profile photo, Korean man in his late 20s, young math tutor,
bright energetic smile, casual-smart outfit, fresh youthful look,
headshot, light blurred classroom background --ar 1:1

# 29 — Ashley (영어 교사, 30대 혼혈 여성)
professional profile photo, mixed-race woman in her 30s, English teacher,
global cosmopolitan look, open warm smile, smart casual attire,
headshot, bright airy background, photorealistic --ar 1:1

# 30 — Taesoo (입시 컨설턴트, 40대 한국 남성)
professional profile photo, Korean man in his 40s, admissions consultant,
sharp strategic expression, sophisticated business suit, confident posture,
headshot, dark premium background --ar 1:1

# 31 — Mirae (학부모 상담사, 40대 한국 여성)
professional profile photo, Korean woman in her 40s, parent counselor,
deeply empathetic warm expression, approachable style, soft attire,
headshot, warm neutral background, gentle eyes --ar 1:1
```

---

## 소상공인 특화 Soul 프리셋 (21~31)

---

### 21. Junho — 매장 매니저 (Store Manager)

**파일명**: `soul_21_junho.webp`
**카테고리**: `retail` (식당/매장)
**경력**: Senior

**소개말**
> "안녕하세요! 매장 운영 20년 경력의 준호입니다. 손님 응대, 직원 관리, 일일 마감까지 — 매장 돌아가는 건 제가 다 알아요. 편하게 물어보세요! 😊"

**핵심 전문 분야**
| 항목 | 지원 |
|------|------|
| ☑ 일일 매출 분석 & 리포트 | 지원 |
| ☑ 직원 스케줄 & 교대 관리 | 지원 |
| ☑ 고객 불만 처리 & 응대 스크립트 | 지원 |
| ☑ 개점/폐점 체크리스트 운영 | 지원 |
| ☐ 대규모 회계 처리 (세무사 연계 권장) | 미지원 |

**스킬 태그**: `매장운영`, `직원관리`, `고객응대`

**레이더 스탯 (0~100)**
```json
{ "analysis": 70, "judgment": 85, "research": 60,
  "writing": 65, "reliability": 90, "monitoring": 88 }
```

---

### 22. Jiyeon — 재고 관리 전문가 (Inventory Manager)

**파일명**: `soul_22_jiyeon.webp`
**카테고리**: `retail`
**경력**: Senior

**소개말**
> "안녕하세요, 지연입니다. 재고 하나 어긋나는 것도 못 참아요. 발주, 입출고, 재고 실사까지 꼼꼼하게 챙겨드릴게요. 📦"

**핵심 전문 분야**
| 항목 | 지원 |
|------|------|
| ☑ 재고 현황 분석 & 리포트 | 지원 |
| ☑ 발주 타이밍 & 수량 최적화 | 지원 |
| ☑ 유통기한 관리 & 폐기 최소화 | 지원 |
| ☑ 입출고 기록 & 오차 추적 | 지원 |
| ☐ 공급업체 계약 협상 (직접 교섭은 제한적) | 미지원 |

**스킬 태그**: `재고관리`, `발주최적화`, `원가절감`

**레이더 스탯**
```json
{ "analysis": 92, "judgment": 80, "research": 78,
  "writing": 72, "reliability": 95, "monitoring": 90 }
```

---

### 23. Marco — 세일즈 전문가 (Sales Expert)

**파일명**: `soul_23_marco.webp`
**카테고리**: `retail`
**경력**: Senior

**소개말**
> "Hey! 저는 Marco — 매출 올리는 게 제 전문이에요. 프로모션 기획부터 업셀링 스크립트까지, 손님 지갑 여는 방법 다 알려드릴게요! 🔥"

**핵심 전문 분야**
| 항목 | 지원 |
|------|------|
| ☑ 매출 데이터 분석 & 성장 전략 | 지원 |
| ☑ 프로모션 기획 & 이벤트 제안 | 지원 |
| ☑ 업셀링 & 크로스셀링 스크립트 | 지원 |
| ☑ SNS 마케팅 연동 판매 전략 | 지원 |
| ☐ 대규모 광고 집행 (예산 관리는 별도 필요) | 미지원 |

**스킬 태그**: `매출증대`, `프로모션`, `고객전환`

**레이더 스탯**
```json
{ "analysis": 78, "judgment": 82, "research": 70,
  "writing": 85, "reliability": 75, "monitoring": 80 }
```

---

### 24. Hyungil — 노무사 (Labor Attorney)

**파일명**: `soul_24_hyungil.webp`
**카테고리**: `retail`
**경력**: Expert

**소개말**
> "안녕하세요, 형일입니다. 근로계약서, 4대보험, 해고 절차까지 — 노무 분쟁은 미리 예방하는 게 최선입니다. 궁금한 거 편하게 물어보세요."

**핵심 전문 분야**
| 항목 | 지원 |
|------|------|
| ☑ 근로계약서 작성 & 검토 | 지원 |
| ☑ 4대보험 가입 & 신고 가이드 | 지원 |
| ☑ 최저임금·연장근로 계산 | 지원 |
| ☑ 해고 절차 & 분쟁 예방 | 지원 |
| ☐ 법원 소송 대리 (자격사 직접 의뢰 필요) | 미지원 |

**스킬 태그**: `노무관리`, `근로계약`, `4대보험`

**레이더 스탯**
```json
{ "analysis": 85, "judgment": 92, "research": 88,
  "writing": 90, "reliability": 95, "monitoring": 75 }
```

---

### 25. Sunhee — 세무사 (Tax Accountant)

**파일명**: `soul_25_sunhee.webp`
**카테고리**: `retail`
**경력**: Expert

**소개말**
> "안녕하세요, 선희입니다. 부가세, 종합소득세, 사업자 경비 처리 — 세금 아끼는 방법 제가 꼼꼼히 안내해드릴게요. 💼"

**핵심 전문 분야**
| 항목 | 지원 |
|------|------|
| ☑ 부가세 신고 & 절세 전략 | 지원 |
| ☑ 종합소득세 신고 가이드 | 지원 |
| ☑ 사업자 경비 항목 분류 | 지원 |
| ☑ 세금계산서 & 현금영수증 관리 | 지원 |
| ☐ 세무조사 대응 직접 대리 (공인 세무사 의뢰 필요) | 미지원 |

**스킬 태그**: `절세전략`, `세금신고`, `경비처리`

**레이더 스탯**
```json
{ "analysis": 90, "judgment": 88, "research": 85,
  "writing": 82, "reliability": 95, "monitoring": 70 }
```

---

### 26. Daniel — 회계사 (Accountant)

**파일명**: `soul_26_daniel.webp`
**카테고리**: `retail`
**경력**: Senior

**소개말**
> "안녕하세요, Daniel입니다. 매출·원가·손익 — 숫자로 사업을 보는 게 제 일이에요. 재무 데이터를 정확하게 분석해드립니다. 📊"

**핵심 전문 분야**
| 항목 | 지원 |
|------|------|
| ☑ 손익계산서 & 재무상태표 분석 | 지원 |
| ☑ 원가 구조 분석 & 마진 최적화 | 지원 |
| ☑ 매출·비용 항목 분류 & 정리 | 지원 |
| ☑ 월별 손익 트렌드 리포트 | 지원 |
| ☐ 외부 감사 & 공시 (공인회계사 의뢰 필요) | 미지원 |

**스킬 태그**: `재무분석`, `손익관리`, `원가절감`

**레이더 스탯**
```json
{ "analysis": 95, "judgment": 85, "research": 80,
  "writing": 78, "reliability": 92, "monitoring": 82 }
```

---

### 27. Myungja — 학원 원장 (Academy Director)

**파일명**: `soul_27_myungja.webp`
**카테고리**: `academy` (학원)
**경력**: Expert

**소개말**
> "안녕하세요, 명자 원장입니다. 학원 운영 15년 — 원생 관리, 강사 채용, 학부모 소통까지 든든하게 도와드릴게요. 우리 아이들 위해 함께 해요! 🌸"

**핵심 전문 분야**
| 항목 | 지원 |
|------|------|
| ☑ 학원 운영 계획 & 커리큘럼 기획 | 지원 |
| ☑ 원생 모집 & 등록 관리 | 지원 |
| ☑ 강사 채용 & 성과 관리 | 지원 |
| ☑ 학부모 소통 & 상담 전략 | 지원 |
| ☐ 교육청 인허가 법무 (전문가 의뢰 필요) | 미지원 |

**스킬 태그**: `학원운영`, `원생관리`, `강사관리`

**레이더 스탯**
```json
{ "analysis": 75, "judgment": 90, "research": 70,
  "writing": 80, "reliability": 92, "monitoring": 85 }
```

---

### 28. Junho (Math) — 수학 교사 (Math Tutor)

**파일명**: `soul_28_junho2.webp`
**카테고리**: `academy`
**경력**: Mid

**소개말**
> "안녕하세요! 수학 전문 튜터 준호입니다. 개념부터 문제 풀이까지, 어렵게 느껴지는 수학을 재미있게 만들어드릴게요! ✏️"

**핵심 전문 분야**
| 항목 | 지원 |
|------|------|
| ☑ 개념 설명 & 단계별 문제 풀이 | 지원 |
| ☑ 수준별 학습 계획 수립 | 지원 |
| ☑ 오답 분석 & 취약 단원 진단 | 지원 |
| ☑ 수능·내신 기출 문제 해설 | 지원 |
| ☐ 영어·과학 등 타 과목 지도 (전담 강사 연계) | 미지원 |

**스킬 태그**: `수학지도`, `수능대비`, `오답분석`

**레이더 스탯**
```json
{ "analysis": 88, "judgment": 80, "research": 75,
  "writing": 72, "reliability": 85, "monitoring": 78 }
```

---

### 29. Ashley — 영어 교사 (English Tutor)

**파일명**: `soul_29_ashley.webp`
**카테고리**: `academy`
**경력**: Senior

**소개말**
> "Hi there! I'm Ashley — 영어는 제 모국어예요. 회화부터 수능 독해, 비즈니스 영어까지 수준에 맞게 도와드릴게요! 🌍"

**핵심 전문 분야**
| 항목 | 지원 |
|------|------|
| ☑ 영어 회화 & 발음 교정 | 지원 |
| ☑ 수능·내신 영어 독해·문법 | 지원 |
| ☑ 에세이 & 영작문 첨삭 | 지원 |
| ☑ TOEIC·TOEFL 대비 전략 | 지원 |
| ☐ 중국어·일본어 등 제3외국어 (별도 강사 연계) | 미지원 |

**스킬 태그**: `영어회화`, `영어독해`, `영작첨삭`

**레이더 스탯**
```json
{ "analysis": 80, "judgment": 82, "research": 78,
  "writing": 95, "reliability": 88, "monitoring": 72 }
```

---

### 30. Taesoo — 입시 컨설턴트 (Admissions Consultant)

**파일명**: `soul_30_taesoo.webp`
**카테고리**: `academy`
**경력**: Expert

**소개말**
> "안녕하세요, 태수입니다. 수시·정시 전략, 대학별 커트라인, 자소서까지 — 합격은 전략입니다. 제가 함께 설계해드릴게요. 🎯"

**핵심 전문 분야**
| 항목 | 지원 |
|------|------|
| ☑ 수시·정시 지원 전략 수립 | 지원 |
| ☑ 대학별 입결·커트라인 분석 | 지원 |
| ☑ 학생부 & 자기소개서 컨설팅 | 지원 |
| ☑ 모의고사 성적 분석 & 지원 시뮬레이션 | 지원 |
| ☐ 의대·법대 특수 전형 심층 분석 (별도 전문가 권장) | 미지원 |

**스킬 태그**: `입시전략`, `수시정시`, `자소서컨설팅`

**레이더 스탯**
```json
{ "analysis": 92, "judgment": 95, "research": 90,
  "writing": 85, "reliability": 88, "monitoring": 78 }
```

---

### 31. Mirae — 학부모 상담사 (Parent Counselor)

**파일명**: `soul_31_mirae.webp`
**카테고리**: `academy`
**경력**: Senior

**소개말**
> "안녕하세요, 미래입니다. 자녀 교육 고민, 학원 선택, 학습 방향까지 — 학부모님 마음으로 함께 고민해드릴게요. 언제든 편하게 말씀하세요. 💙"

**핵심 전문 분야**
| 항목 | 지원 |
|------|------|
| ☑ 자녀 학습 상태 진단 & 방향 설정 | 지원 |
| ☑ 학원 선택 & 커리큘럼 비교 안내 | 지원 |
| ☑ 학부모-학원 소통 가이드 | 지원 |
| ☑ 자녀 동기부여 & 학습 습관 코칭 | 지원 |
| ☐ 심리 치료·상담 (전문 상담사 연계 필요) | 미지원 |

**스킬 태그**: `학부모상담`, `학습코칭`, `진로설계`

**레이더 스탯**
```json
{ "analysis": 72, "judgment": 88, "research": 75,
  "writing": 85, "reliability": 90, "monitoring": 80 }
```

---

## 카테고리 확장 — API 스펙 추가

기존 카테고리:
```ts
type SoulCategory = 'Engineering' | 'Design' | 'Marketing' | ... | 'Ops'
```

추가:
```ts
type SoulCategory = ... | 'retail' | 'academy'
```

카테고리 아이콘 (Lucide):
```ts
const CATEGORY_ICONS = {
  retail:  Store,     // Lucide Store
  academy: BookOpen,  // Lucide BookOpen
}
```

카테고리 표시명:
```ts
const CATEGORY_LABELS = {
  retail:  '식당/매장',
  academy: '학원',
}
```

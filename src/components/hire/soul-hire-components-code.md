# Soul Hire Components CSS

> 2026-04-12 | Designer: Ivy
> 13섹션 완전판 — 채용센터/카드/모달/환영/온보딩

```css
/* ============================================================
   Soul Hire Components — nextaicrew.com
   Designer: Ivy  |  2026-04-12
   ============================================================ */

/* ─── 1. Soul 채용 센터 레이아웃 ─────────────────────────────── */

.soul-hire-section {
  max-width: 1200px;
  margin: 0 auto;
  padding: 48px 24px;
}

.soul-hire-header {
  text-align: center;
  margin-bottom: 40px;
}
.soul-hire-header h1 {
  font-family: "Space Grotesk", sans-serif;
  font-size: 32px;
  font-weight: 700;
  color: var(--th-text-heading);
  margin-bottom: 8px;
}
.soul-hire-header p {
  font-size: 15px;
  color: var(--th-text-muted);
}

/* 필터 탭 */
.soul-filter-bar {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 24px;
  align-items: center;
}
.soul-filter-tab {
  padding: 6px 16px;
  border-radius: 8px;
  border: 1px solid var(--th-card-border);
  background: transparent;
  color: var(--th-text-muted);
  font-family: "Space Grotesk", sans-serif;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}
.soul-filter-tab:hover,
.soul-filter-tab.active {
  background: rgba(37, 99, 235, 0.12);
  border-color: #2563EB;
  color: #2563EB;
}
.soul-search-input {
  margin-left: auto;
  padding: 7px 14px;
  border-radius: 8px;
  border: 1px solid var(--th-card-border);
  background: var(--th-card-bg);
  color: var(--th-text-body);
  font-size: 13px;
  width: 220px;
  outline: none;
  transition: border-color 0.2s;
}
.soul-search-input:focus {
  border-color: rgba(6, 182, 212, 0.5);
}

/* 카드 그리드 */
.soul-hire-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}
@media (max-width: 1024px) {
  .soul-hire-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 560px) {
  .soul-hire-grid { grid-template-columns: 1fr; }
}


/* ─── 2. Soul 채용 카드 ──────────────────────────────────────── */

.soul-hire-card {
  background: var(--th-card-bg);
  border: 1px solid var(--th-card-border);
  border-radius: 16px;
  padding: 24px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  position: relative;
  overflow: hidden;
}
/* 상단 부서 컬러 밴드 */
.soul-hire-card::before {
  content: "";
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 3px;
  background: var(--soul-dept-color, linear-gradient(90deg, #2563EB, #06B6D4));
  border-radius: 16px 16px 0 0;
}
.soul-hire-card:hover {
  transform: translateY(-4px);
  border-color: rgba(6, 182, 212, 0.4);
  box-shadow: 0 8px 32px rgba(6, 182, 212, 0.10), 0 2px 8px rgba(0,0,0,0.15);
}
.soul-hire-card.hired {
  border: 2px solid #FBBF24;
  box-shadow: 0 0 20px rgba(251, 191, 36, 0.18);
}
.soul-hire-card.capacity-full {
  opacity: 0.5;
  filter: grayscale(0.6);
  cursor: not-allowed;
}
.soul-hire-card.capacity-full:hover {
  transform: none;
  border-color: var(--th-card-border);
  box-shadow: none;
}

/* 채용됨 뱃지 */
.soul-hired-badge {
  position: absolute;
  top: 14px; right: 14px;
  padding: 3px 8px;
  background: rgba(251, 191, 36, 0.15);
  border: 1px solid rgba(251, 191, 36, 0.5);
  border-radius: 6px;
  font-size: 10px;
  font-family: "Space Grotesk", sans-serif;
  font-weight: 600;
  color: #FBBF24;
}


/* ─── 3. 아바타 + 상태 배지 ──────────────────────────────────── */

.soul-avatar-wrapper {
  position: relative;
  display: inline-block;
  margin-bottom: 12px;
}
.soul-avatar {
  width: 56px;
  height: 56px;
  image-rendering: pixelated;
  image-rendering: crisp-edges;
  display: block;
}
/* 상태 배지 (도트) */
.soul-status {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 13px;
  height: 13px;
  border-radius: 3px;
  border: 2px solid var(--th-bg-primary, #0B1120);
}
.soul-status.online  { background: #10B981; box-shadow: 0 0 6px rgba(16,185,129,0.6); animation: soul-pulse 3s infinite; }
.soul-status.working { background: #06B6D4; box-shadow: 0 0 6px rgba(6,182,212,0.6); animation: soul-pulse 1.5s infinite; }
.soul-status.meeting { background: #6366F1; }
.soul-status.offline { background: #475569; }
.soul-status.levelup { background: #FBBF24; animation: soul-spark 0.5s 3; }

@keyframes soul-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}


/* ─── 4. Soul 이름 + 직군 + 레벨 ─────────────────────────────── */

.soul-card-header {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  margin-bottom: 12px;
}
.soul-card-info { flex: 1; }

.soul-name {
  font-family: "Press Start 2P", monospace;
  font-size: 11px;
  color: var(--th-text-heading);
  letter-spacing: 1px;
  line-height: 1.4;
  margin-bottom: 4px;
}
.soul-role {
  font-family: "Space Grotesk", sans-serif;
  font-size: 12px;
  color: var(--th-text-muted);
  margin-bottom: 4px;
}
.soul-level {
  font-family: "Press Start 2P", monospace;
  font-size: 9px;
  color: #FBBF24;
  letter-spacing: 0.5px;
}
.soul-level .lv-number { color: #FBBF24; }


/* ─── 5. Soul 한 줄 소개 ─────────────────────────────────────── */

.soul-quote {
  font-family: "Pretendard", sans-serif;
  font-size: 12px;
  font-style: italic;
  color: var(--th-text-muted);
  line-height: 1.6;
  padding: 10px 0;
  border-top: 1px solid var(--th-card-border);
  border-bottom: 1px solid var(--th-card-border);
  margin: 4px 0 12px;
}
.soul-quote::before { content: '"'; margin-right: 2px; }
.soul-quote::after  { content: '"'; margin-left: 2px; }


/* ─── 6. 스킬 뱃지 ───────────────────────────────────────────── */

.soul-skills {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-bottom: 12px;
}
.soul-skill-tag {
  padding: 2px 8px;
  background: rgba(37, 99, 235, 0.10);
  border: 1px solid rgba(37, 99, 235, 0.25);
  border-radius: 5px;
  font-family: "JetBrains Mono", monospace;
  font-size: 10px;
  color: #93BBFC;
}


/* ─── 7. 성격 지표 도트 바 ───────────────────────────────────── */

.soul-personality {
  display: flex;
  flex-direction: column;
  gap: 5px;
  margin-bottom: 12px;
}
.personality-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.personality-label {
  font-family: "Pretendard", sans-serif;
  font-size: 11px;
  color: var(--th-text-muted);
  width: 40px;
  flex-shrink: 0;
}
.personality-bar {
  display: flex;
  gap: 3px;
}
.personality-dot {
  width: 8px;
  height: 8px;
  border-radius: 2px;
  background: var(--th-card-border);
  transition: background 0.2s;
}
.personality-dot.filled { background: var(--dot-color, #06B6D4); }

/* 성격 색상 지정 */
.soul-personality[data-trait="thoroughness"] .filled { background: #2563EB; }
.soul-personality[data-trait="creativity"]   .filled { background: #06B6D4; }
.soul-personality[data-trait="speed"]        .filled { background: #10B981; }
.soul-personality[data-trait="teamwork"]     .filled { background: #6366F1; }


/* ─── 8. 이번 달 실적 ────────────────────────────────────────── */

.soul-stats {
  display: flex;
  gap: 10px;
  margin-bottom: 14px;
  padding: 8px 0;
  border-top: 1px solid var(--th-card-border);
}
.soul-stat-item {
  font-family: "Space Grotesk", sans-serif;
  font-size: 11px;
  color: var(--th-text-muted);
}
.soul-stat-item strong {
  color: var(--th-text-body);
  font-weight: 600;
}


/* ─── 9. 채용 버튼 ───────────────────────────────────────────── */

.soul-card-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}
.soul-profile-btn {
  flex: 1;
  padding: 9px 0;
  background: transparent;
  border: 1px solid var(--th-card-border);
  border-radius: 10px;
  color: var(--th-text-muted);
  font-family: "Space Grotesk", sans-serif;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}
.soul-profile-btn:hover {
  border-color: rgba(6,182,212,0.4);
  color: #06B6D4;
}
.hire-btn {
  flex: 2;
  padding: 9px 0;
  background: linear-gradient(135deg, #2563EB, #06B6D4);
  color: white;
  border: none;
  border-radius: 10px;
  font-family: "Space Grotesk", sans-serif;
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}
.hire-btn:hover {
  box-shadow: 0 4px 20px rgba(6, 182, 212, 0.30);
  transform: translateY(-1px);
}
.hire-btn:disabled,
.hire-btn.already-hired {
  background: rgba(37, 99, 235, 0.2);
  color: rgba(255,255,255,0.4);
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}


/* ─── 10. 레벨 성장 — 카드 테두리 티어 ──────────────────────── */

.soul-hire-card[data-level-tier="rookie"]  { border-color: var(--th-card-border); }
.soul-hire-card[data-level-tier="junior"]  { border-color: var(--soul-dept-color, #2563EB); }
.soul-hire-card[data-level-tier="mid"]     { border-color: var(--soul-dept-color, #2563EB); box-shadow: 0 0 8px rgba(37,99,235,0.12); }
.soul-hire-card[data-level-tier="senior"]  { border-color: var(--soul-dept-color, #06B6D4); box-shadow: 0 0 16px rgba(6,182,212,0.14); }
.soul-hire-card[data-level-tier="lead"]    { border: 2px solid #FBBF24; box-shadow: 0 0 20px rgba(251,191,36,0.18); }
.soul-hire-card[data-level-tier="legend"] {
  border: 2px solid transparent;
  background-image:
    linear-gradient(var(--th-card-bg), var(--th-card-bg)),
    linear-gradient(135deg, #2563EB, #06B6D4, #6366F1, #FBBF24);
  background-origin: border-box;
  background-clip: padding-box, border-box;
}

@keyframes levelup-burst {
  0%   { transform: scale(1);    box-shadow: 0 0 0  0px rgba(251,191,36,0); }
  30%  { transform: scale(1.15); box-shadow: 0 0 0 14px rgba(251,191,36,0.35); }
  70%  { transform: scale(1.05); box-shadow: 0 0 0 22px rgba(251,191,36,0.15); }
  100% { transform: scale(1);    box-shadow: 0 0 0  0px rgba(251,191,36,0); }
}
.soul-avatar.leveling-up {
  animation: levelup-burst 0.8s ease-out;
}


/* ─── 11. 채용 모달 ──────────────────────────────────────────── */

.soul-hire-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.55);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease;
}
.soul-hire-modal {
  background: var(--th-card-bg);
  border: 1px solid var(--th-card-border);
  border-radius: 20px;
  padding: 32px;
  max-width: 380px;
  width: 92%;
  position: relative;
}
.soul-hire-modal h2 {
  font-family: "Space Grotesk", sans-serif;
  font-size: 18px;
  font-weight: 700;
  color: var(--th-text-heading);
  margin-bottom: 20px;
  text-align: center;
}
.soul-modal-greeting {
  font-family: "Pretendard", sans-serif;
  font-size: 13px;
  font-style: italic;
  color: var(--th-text-muted);
  text-align: center;
  margin-top: 8px;
}
.soul-modal-info {
  border-top: 1px solid var(--th-card-border);
  margin-top: 20px;
  padding-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-family: "Space Grotesk", sans-serif;
  font-size: 13px;
  color: var(--th-text-muted);
}
.soul-modal-actions {
  display: flex;
  gap: 10px;
  margin-top: 24px;
}
.soul-modal-cancel {
  flex: 1;
  padding: 11px 0;
  background: transparent;
  border: 1px solid var(--th-card-border);
  border-radius: 12px;
  color: var(--th-text-muted);
  font-family: "Space Grotesk", sans-serif;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}
.soul-modal-confirm {
  flex: 2;
  padding: 11px 0;
  background: linear-gradient(135deg, #2563EB, #06B6D4);
  color: white;
  border: none;
  border-radius: 12px;
  font-family: "Space Grotesk", sans-serif;
  font-weight: 700;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 16px rgba(6,182,212,0.25);
}
.soul-modal-confirm:hover {
  box-shadow: 0 6px 24px rgba(6,182,212,0.4);
  transform: translateY(-1px);
}


/* ─── 12. 입사 환영 — 파티클 애니메이션 ─────────────────────── */

.soul-welcome-screen {
  text-align: center;
  padding: 40px 24px;
  position: relative;
  overflow: hidden;
}
.soul-welcome-title {
  font-family: "Space Grotesk", sans-serif;
  font-size: 22px;
  font-weight: 700;
  color: var(--th-text-heading);
  margin-bottom: 8px;
}
.soul-welcome-quote {
  font-family: "Pretendard", sans-serif;
  font-size: 14px;
  font-style: italic;
  color: #06B6D4;
}
.soul-enter-character {
  animation: soul-slide-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  opacity: 0;
}
@keyframes soul-slide-in {
  from { transform: translateX(-40px); opacity: 0; }
  to   { transform: translateX(0);     opacity: 1; }
}

/* soul-spark 파티클 */
@keyframes soul-burst {
  0%   { transform: scale(0) rotate(0deg) translateY(0);   opacity: 1; }
  100% { transform: scale(1.5) rotate(180deg) translateY(-36px); opacity: 0; }
}
.hire-spark {
  position: absolute;
  width: 8px; height: 8px;
  background: #FBBF24;
  border-radius: 2px;
  pointer-events: none;
  animation: soul-burst 0.7s ease-out forwards;
}
.hire-spark:nth-child(2) { animation-delay: 0.05s; background: #06B6D4; }
.hire-spark:nth-child(3) { animation-delay: 0.10s; background: #2563EB; }
.hire-spark:nth-child(4) { animation-delay: 0.12s; background: #FBBF24; left: 20%; }
.hire-spark:nth-child(5) { animation-delay: 0.18s; background: #06B6D4; left: 80%; }
.hire-spark:nth-child(6) { animation-delay: 0.22s; background: #6366F1; left: 50%; }


/* ─── 13. 업무 온보딩 ────────────────────────────────────────── */

.soul-onboarding-screen {
  max-width: 480px;
  margin: 0 auto;
  padding: 32px 24px;
}
.soul-onboarding-title {
  font-family: "Space Grotesk", sans-serif;
  font-size: 18px;
  font-weight: 700;
  color: var(--th-text-heading);
  margin-bottom: 6px;
}
.soul-onboarding-sub {
  font-size: 13px;
  color: var(--th-text-muted);
  margin-bottom: 24px;
}
.soul-task-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-bottom: 20px;
}
.soul-task-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border: 1px solid var(--th-card-border);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
  font-family: "Pretendard", sans-serif;
  font-size: 13px;
  color: var(--th-text-body);
}
.soul-task-item:hover {
  border-color: rgba(6,182,212,0.4);
  background: rgba(6,182,212,0.05);
}
.soul-task-item.selected {
  border-color: #06B6D4;
  background: rgba(6,182,212,0.08);
  color: #06B6D4;
}
.soul-task-check {
  width: 16px; height: 16px;
  border-radius: 4px;
  border: 1.5px solid var(--th-card-border);
  flex-shrink: 0;
  transition: all 0.2s;
}
.soul-task-item.selected .soul-task-check {
  background: #06B6D4;
  border-color: #06B6D4;
}
.soul-custom-desc {
  width: 100%;
  padding: 10px 14px;
  border-radius: 10px;
  border: 1px solid var(--th-card-border);
  background: var(--th-card-bg);
  color: var(--th-text-body);
  font-family: "Pretendard", sans-serif;
  font-size: 13px;
  resize: none;
  min-height: 80px;
  outline: none;
  transition: border-color 0.2s;
  margin-bottom: 16px;
}
.soul-custom-desc:focus { border-color: rgba(6,182,212,0.5); }

.soul-role-radio {
  display: flex;
  gap: 10px;
  margin-bottom: 24px;
}
.role-option {
  flex: 1;
  padding: 10px 16px;
  border: 1px solid var(--th-card-border);
  border-radius: 10px;
  text-align: center;
  cursor: pointer;
  font-family: "Space Grotesk", sans-serif;
  font-size: 13px;
  color: var(--th-text-muted);
  transition: all 0.2s;
}
.role-option.selected {
  border-color: #2563EB;
  color: #2563EB;
  background: rgba(37,99,235,0.08);
}


/* ─── 유틸 ─────────────────────────────────────────────────── */
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

```

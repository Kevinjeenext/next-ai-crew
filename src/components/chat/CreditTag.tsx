/**
 * CreditTag — 채팅 응답 하단에 표시되는 크레딧 사용량 태그
 * "🏠 1.5 크레딧 (로컬)" or "☁️ 3 크레딧"
 */

interface CreditInfo {
  used: number;
  remaining: number;
  isLocal: boolean;
}

interface Props {
  credits?: CreditInfo;
  language?: string;
}

export default function CreditTag({ credits, language = "ko" }: Props) {
  if (!credits) return null;

  const isKo = language === "ko";
  const icon = credits.isLocal ? "🏠" : "☁️";
  const label = credits.isLocal
    ? (isKo ? "로컬" : "local")
    : (isKo ? "클라우드" : "cloud");
  const low = credits.remaining < 500;

  return (
    <span style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 4,
      fontSize: 11,
      color: credits.isLocal ? "#059669" : "#6366F1",
      background: credits.isLocal ? "#ECFDF5" : "#EEF2FF",
      padding: "2px 8px",
      borderRadius: 6,
      marginTop: 4,
    }}>
      {icon} {credits.used} {isKo ? "크레딧" : "cr"} ({label})
      {low && (
        <span style={{ color: "#EF4444", marginLeft: 4 }}>
          ⚠️ {credits.remaining.toLocaleString()} {isKo ? "남음" : "left"}
        </span>
      )}
    </span>
  );
}

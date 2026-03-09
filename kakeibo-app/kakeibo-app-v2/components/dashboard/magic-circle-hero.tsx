export function MagicCircleHero() {
  return (
    <div className="magic-circle-hero">
      <svg className="rune-svg" viewBox="0 0 200 200">
        <defs>
          <path id="rc" d="M 100,8 A 92,92 0 1,1 99.99,8" fill="none" />
          <path id="ri" d="M 100,30 A 70,70 0 1,1 99.99,30" fill="none" />
        </defs>
        <text fontSize="6.5" fill="rgba(230,81,0,0.35)" letterSpacing="2">
          <textPath href="#rc">ᚱ ᛟ ᛞ ᚾ ᛏ ᚢ ᛗ ᚨ ᛚ ᛖ ᛊ ᛇ ᚹ ᛈ ᛃ ᛉ ᚦ ᛒ ᛜ ᛝ ᛠ ᚱ ᛟ ᛞ ᚾ ᛏ ᚢ ᛗ ᚨ ᛚ ᛖ</textPath>
        </text>
        <text fontSize="5.5" fill="rgba(255,179,0,0.28)" letterSpacing="3">
          <textPath href="#ri">解 ・ 告 ・ 確 ・ 否 ・ 解 ・ 告 ・ 確 ・ 否 ・ 解 ・ 告 ・ 確 ・ 否</textPath>
        </text>
      </svg>
      <div className="mc-outer" />
      <div className="mc-inner" />
      <div className="mc-hex-1" />
      <div className="mc-hex-2" />
      <div className="mc-rays" />
      <div className="mc-core" />
    </div>
  );
}

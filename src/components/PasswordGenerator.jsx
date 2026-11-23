import { useState, useCallback } from 'react';
import { generateSecurePassword, evaluatePasswordStrength } from '../utils/crypto';

export default function PasswordGenerator({ onSendToChecker }) {
  const [length, setLength] = useState(16);
  const [uppercase, setUppercase] = useState(true);
  const [lowercase, setLowercase] = useState(true);
  const [numbers, setNumbers] = useState(true);
  const [symbols, setSymbols] = useState(true);
  const [excludeAmbiguous, setExcludeAmbiguous] = useState(false);

  const [generatedPassword, setGeneratedPassword] = useState(() =>
    generateSecurePassword({
      length: 16,
      uppercase: true,
      lowercase: true,
      numbers: true,
      symbols: true,
      excludeAmbiguous: false,
    })
  );
  const [copied, setCopied] = useState(false);

  // 비밀번호 생성 함수
  const handleGenerate = useCallback(() => {
    const pwd = generateSecurePassword({
      length,
      uppercase,
      lowercase,
      numbers,
      symbols,
      excludeAmbiguous,
    });
    setGeneratedPassword(pwd);
    setCopied(false);
  }, [length, uppercase, lowercase, numbers, symbols, excludeAmbiguous]);

  // 클립보드 복사
  const handleCopy = async () => {
    if (!generatedPassword) return;
    try {
      await navigator.clipboard.writeText(generatedPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // 복사 권한 오류 대체
      const textArea = document.createElement('textarea');
      textArea.value = generatedPassword;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  // 프리셋 설정
  const applyPreset = (preset) => {
    if (preset === 'balanced') {
      setLength(16);
      setUppercase(true);
      setLowercase(true);
      setNumbers(true);
      setSymbols(true);
      setExcludeAmbiguous(false);
    } else if (preset === 'paranoid') {
      setLength(24);
      setUppercase(true);
      setLowercase(true);
      setNumbers(true);
      setSymbols(true);
      setExcludeAmbiguous(false);
    } else if (preset === 'readable') {
      setLength(16);
      setUppercase(true);
      setLowercase(true);
      setNumbers(true);
      setSymbols(false);
      setExcludeAmbiguous(true);
    } else if (preset === 'pin') {
      setLength(8);
      setUppercase(false);
      setLowercase(false);
      setNumbers(true);
      setSymbols(false);
      setExcludeAmbiguous(false);
    }
  };

  const strength = evaluatePasswordStrength(generatedPassword);

  return (
    <div className="card-container">
      <div className="security-card">
        <div className="card-header">
          <h2>⚡ 암호학적 안전한 난수(CSPRNG) 생성기</h2>
          <span className="card-tag">window.crypto.getRandomValues</span>
        </div>
        <p className="card-description">
          자바스크립트 표준 <code>Math.random()</code>은 난수 패턴이 예측 가능하여 암호학적으로 부적합합니다.
          본 생성기는 운영체제의 엔트로피 풀을 사용하는 <strong>Web Crypto API</strong>만을 사용하여 생성합니다.
        </p>

        {/* 생성된 비밀번호 표시창 */}
        <div className="generator-result-box">
          <div className="generated-password-text" title="생성된 비밀번호">
            {generatedPassword}
          </div>
          <div className="generator-actions">
            <button
              type="button"
              className={`copy-btn ${copied ? 'copied' : ''}`}
              onClick={handleCopy}
            >
              {copied ? '✓ 복사 완료!' : '📋 클립보드 복사'}
            </button>
            <button
              type="button"
              className="refresh-btn"
              onClick={handleGenerate}
              title="새로 생성"
            >
              🔄 새 비밀번호
            </button>
            {onSendToChecker && (
              <button
                type="button"
                className="secondary-btn"
                onClick={() => onSendToChecker(generatedPassword)}
              >
                🛡️ 검사기로 전송
              </button>
            )}
          </div>
        </div>

        {/* 간이 강도 상태 */}
        <div className="generator-strength-bar">
          <span style={{ color: strength.color }}>
            강도: <strong>{strength.label}</strong> (엔트로피 {strength.entropy} bits)
          </span>
          <div className="mini-progress-bg">
            <div
              className="mini-progress-fill"
              style={{
                width: `${(strength.score / 4) * 100}%`,
                backgroundColor: strength.color,
              }}
            ></div>
          </div>
        </div>

        {/* 프리셋 버튼 */}
        <div className="preset-group">
          <span className="preset-label">빠른 프리셋:</span>
          <button type="button" className="preset-btn" onClick={() => applyPreset('balanced')}>
            권장 표준 (16자)
          </button>
          <button type="button" className="preset-btn" onClick={() => applyPreset('paranoid')}>
            최고 보안 (24자)
          </button>
          <button type="button" className="preset-btn" onClick={() => applyPreset('readable')}>
            가독성 우선 (혼동문자 제외)
          </button>
          <button type="button" className="preset-btn" onClick={() => applyPreset('pin')}>
            숫자 PIN (8자)
          </button>
        </div>

        {/* 길이 슬라이더 */}
        <div className="slider-section">
          <div className="slider-header">
            <label htmlFor="length-slider">비밀번호 길이</label>
            <span className="slider-value">{length} 자</span>
          </div>
          <input
            id="length-slider"
            type="range"
            min="6"
            max="48"
            value={length}
            onChange={(e) => setLength(Number(e.target.value))}
            className="styled-slider"
          />
        </div>

        {/* 문자 집합 토글 옵션 */}
        <div className="options-grid">
          <label className="checkbox-tile">
            <input
              type="checkbox"
              checked={uppercase}
              onChange={(e) => setUppercase(e.target.checked)}
            />
            <div className="tile-content">
              <strong>대문자 포함 (A-Z)</strong>
              <span>ABCDEFGHIJKLMNOPQRSTUVWXYZ</span>
            </div>
          </label>

          <label className="checkbox-tile">
            <input
              type="checkbox"
              checked={lowercase}
              onChange={(e) => setLowercase(e.target.checked)}
            />
            <div className="tile-content">
              <strong>소문자 포함 (a-z)</strong>
              <span>abcdefghijklmnopqrstuvwxyz</span>
            </div>
          </label>

          <label className="checkbox-tile">
            <input
              type="checkbox"
              checked={numbers}
              onChange={(e) => setNumbers(e.target.checked)}
            />
            <div className="tile-content">
              <strong>숫자 포함 (0-9)</strong>
              <span>0123456789</span>
            </div>
          </label>

          <label className="checkbox-tile">
            <input
              type="checkbox"
              checked={symbols}
              onChange={(e) => setSymbols(e.target.checked)}
            />
            <div className="tile-content">
              <strong>특수문자 포함</strong>
              <span>!@#$%^&*()_+-=[]{}|;:,</span>
            </div>
          </label>

          <label className="checkbox-tile full-width-tile">
            <input
              type="checkbox"
              checked={excludeAmbiguous}
              onChange={(e) => setExcludeAmbiguous(e.target.checked)}
            />
            <div className="tile-content">
              <strong>혼동하기 쉬운 문자 제외</strong>
              <span>구분이 어려운 문자 <code>l, 1, I, O, 0, o</code> 제외</span>
            </div>
          </label>
        </div>
      </div>
    </div>
  );
}

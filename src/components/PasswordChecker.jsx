import { useState, useMemo } from 'react';
import { evaluatePasswordStrength, checkPwnedPassword, calculateSha1 } from '../utils/crypto';

export default function PasswordChecker({ sharedPassword }) {
  const [password, setPassword] = useState(sharedPassword || '');
  const [fullHashPreview, setFullHashPreview] = useState('');
  const [prevShared, setPrevShared] = useState(sharedPassword);

  if (sharedPassword !== prevShared) {
    setPrevShared(sharedPassword);
    setPassword(sharedPassword);
    if (sharedPassword) {
      calculateSha1(sharedPassword).then((hash) => setFullHashPreview(hash));
    } else {
      setFullHashPreview('');
    }
  }

  const [showPassword, setShowPassword] = useState(false);
  const [usePadding, setUsePadding] = useState(true);

  // 유출 확인 상태
  const [isCheckingPwned, setIsCheckingPwned] = useState(false);
  const [pwnedResult, setPwnedResult] = useState(null);
  const [pwnedError, setPwnedError] = useState(null);

  // 강도 평가 (실시간 브라우저 내 연산)
  const strength = useMemo(() => evaluatePasswordStrength(password), [password]);

  // 비밀번호 변경 핸들러
  const handlePasswordChange = (e) => {
    const val = e.target.value;
    setPassword(val);
    setPwnedResult(null);
    setPwnedError(null);
    if (val) {
      calculateSha1(val).then((hash) => setFullHashPreview(hash));
    } else {
      setFullHashPreview('');
    }
  };

  // k-익명성 유출 확인 호출
  const handleCheckPwned = async () => {
    if (!password) {
      setPwnedError('비밀번호를 먼저 입력해 주세요.');
      return;
    }

    setIsCheckingPwned(true);
    setPwnedError(null);
    setPwnedResult(null);

    try {
      const result = await checkPwnedPassword(password, usePadding);
      setPwnedResult(result);
    } catch (err) {
      setPwnedError(err.message || '유출 확인 요청 중 오류가 발생했습니다.');
    } finally {
      setIsCheckingPwned(false);
    }
  };

  return (
    <div className="card-container">
      {/* 1. 입력 및 강도 검사 섹션 */}
      <div className="security-card">
        <div className="card-header">
          <h2>🛡️ 비밀번호 실시간 강도 검사</h2>
          <span className="card-tag">클라이언트 100% 로컬 연산</span>
        </div>
        <p className="card-description">
          입력된 비밀번호는 브라우저 내부에서만 평가되며, 서버로 전혀 전송되지 않습니다.
        </p>

        <div className="input-group">
          <label htmlFor="pwd-input" className="input-label">검사할 비밀번호 입력</label>
          <div className="password-input-wrapper">
            <input
              id="pwd-input"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={handlePasswordChange}
              placeholder="테스트할 비밀번호를 입력하세요 (예: password, Qwerty1234!)"
              className="styled-input"
              autoComplete="off"
              spellCheck="false"
            />
            <button
              type="button"
              className="toggle-visibility-btn"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
            >
              {showPassword ? '🙈 숨기기' : '👁️ 보기'}
            </button>
          </div>
        </div>

        {/* 강도 게이지 바 */}
        <div className="strength-meter-section">
          <div className="strength-header">
            <span>비밀번호 안전도: <strong style={{ color: strength.color }}>{strength.label}</strong></span>
            <span>엔트로피: <strong>{strength.entropy} bits</strong></span>
          </div>
          <div className="progress-bar-bg">
            <div
              className="progress-bar-fill"
              style={{
                width: `${(strength.score / 4) * 100}%`,
                backgroundColor: strength.color,
              }}
            ></div>
          </div>
          <div className="crack-time-box">
            <span>💻 고성능 GPU 무차별 대입(Brute-force) 예상 크래킹 시간: </span>
            <strong className="crack-time-val" style={{ color: strength.color }}>{strength.crackTime}</strong>
          </div>
        </div>

        {/* 세부 보안 체크리스트 */}
        <div className="checklist-grid">
          <div className={`check-chip ${strength.checklist.length ? 'valid' : 'invalid'}`}>
            {strength.checklist.length ? '✓' : '✗'} 12자 이상 권장 ({password.length}자)
          </div>
          <div className={`check-chip ${strength.checklist.hasUpper ? 'valid' : 'invalid'}`}>
            {strength.checklist.hasUpper ? '✓' : '✗'} 대문자 (A-Z)
          </div>
          <div className={`check-chip ${strength.checklist.hasLower ? 'valid' : 'invalid'}`}>
            {strength.checklist.hasLower ? '✓' : '✗'} 소문자 (a-z)
          </div>
          <div className={`check-chip ${strength.checklist.hasNumber ? 'valid' : 'invalid'}`}>
            {strength.checklist.hasNumber ? '✓' : '✗'} 숫자 (0-9)
          </div>
          <div className={`check-chip ${strength.checklist.hasSymbol ? 'valid' : 'invalid'}`}>
            {strength.checklist.hasSymbol ? '✓' : '✗'} 특수문자 (!@#$)
          </div>
          <div className={`check-chip ${strength.checklist.noRepetition ? 'valid' : 'invalid'}`}>
            {strength.checklist.noRepetition ? '✓' : '✗'} 반복 문자 없음
          </div>
          <div className={`check-chip ${strength.checklist.noSequence ? 'valid' : 'invalid'}`}>
            {strength.checklist.noSequence ? '✓' : '✗'} 연속 패턴 없음
          </div>
        </div>

        {/* 경고 및 개선 팁 */}
        {strength.warnings.length > 0 && (
          <div className="alert-box alert-warning">
            <div className="alert-title">⚠️ 취약 패턴 감지</div>
            <ul>
              {strength.warnings.map((w, idx) => (
                <li key={idx}>{w}</li>
              ))}
            </ul>
          </div>
        )}

        {strength.suggestions.length > 0 && (
          <div className="alert-box alert-info">
            <div className="alert-title">💡 보안 강화 팁</div>
            <ul>
              {strength.suggestions.map((s, idx) => (
                <li key={idx}>{s}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* 2. k-익명성 유출 확인 섹션 */}
      <div className="security-card pwned-card">
        <div className="card-header">
          <h2>🔍 k-익명성 비밀번호 유출 확인</h2>
          <span className="card-tag api-tag">Have I Been Pwned Range API</span>
        </div>
        <p className="card-description">
          비밀번호를 통째로 보내지 않고, <strong>SHA-1 해시의 앞 5글자만</strong> 보내어 유출 여부를 조회합니다.
        </p>

        <div className="pwned-controls">
          <label className="checkbox-label" title="가짜 유출 항목을 섞어 패킷 크기 기반 추측 방어">
            <input
              type="checkbox"
              checked={usePadding}
              onChange={(e) => setUsePadding(e.target.checked)}
            />
            <span><code>Add-Padding: true</code> 헤더 사용 (응답 크기 사이드채널 방어)</span>
          </label>

          <button
            type="button"
            className="primary-btn"
            onClick={handleCheckPwned}
            disabled={isCheckingPwned || !password}
          >
            {isCheckingPwned ? '조회 중...' : '🌐 유출 여부 확인하기'}
          </button>
        </div>

        {/* 유출 확인 결과 알림 */}
        {pwnedResult && (
          <div className={`alert-box ${pwnedResult.isPwned ? 'alert-danger' : 'alert-success'}`}>
            <div className="alert-title">
              {pwnedResult.isPwned ? '🚨 보안 경고: 해킹 사고로 유출된 비밀번호입니다!' : '✅ 안전: 유출 기록이 발견되지 않았습니다.'}
            </div>
            {pwnedResult.isPwned ? (
              <p>
                이 비밀번호는 알려진 침해 사고 데이터베이스에서 <strong>{pwnedResult.breachCount.toLocaleString()}회</strong> 유출된 이력이 있습니다. 즉시 다른 강력한 비밀번호로 변경하세요!
              </p>
            ) : (
              <p>
                Have I Been Pwned 데이터베이스(수억 개 유출 목록)에 등록되지 않은 안전한 비밀번호입니다.
              </p>
            )}
            <div className="check-timestamp">확인 시각: {pwnedResult.checkedAt}</div>
          </div>
        )}

        {pwnedError && (
          <div className="alert-box alert-danger">
            <div className="alert-title">❌ 조회 실패</div>
            <p>{pwnedError}</p>
          </div>
        )}

        {/* 네트워크 전송 투명성 인스펙터 (F12 검증 지원) */}
        <div className="network-inspector">
          <div className="inspector-header">
            <h3>📡 네트워크 전송 데이터 투명성 인스펙터 (Network Monitor)</h3>
            <span className="badge badge-success">최소 전송 원칙 준수</span>
          </div>
          <p className="inspector-desc">
            개발자 도구(F12)의 <strong>Network</strong> 탭에서 실제로 외부로 전송되는 패킷을 아래 데이터와 비교해 보세요.
          </p>

          <div className="inspector-table">
            <div className="inspector-row">
              <span className="row-key">1. 원문 비밀번호</span>
              <span className="row-val safe-val">🚫 외부 전송 절대 안 됨 (브라우저 메모리 내부 0 bytes)</span>
            </div>
            <div className="inspector-row">
              <span className="row-key">2. SHA-1 전체 해시</span>
              <span className="row-val code-val">
                {fullHashPreview ? (
                  <>
                    <span className="hash-prefix">{fullHashPreview.substring(0, 5)}</span>
                    <span className="hash-suffix">{fullHashPreview.substring(5)}</span>
                    <span className="hash-note"> (앞 5자리만 전송, 뒤 35자리는 로컬 보관)</span>
                  </>
                ) : (
                  '비밀번호를 입력하면 해시가 계산됩니다'
                )}
              </span>
            </div>
            <div className="inspector-row">
              <span className="row-key">3. 실제 GET 요청 URL</span>
              <span className="row-val code-val">
                {fullHashPreview ? (
                  <code>https://api.pwnedpasswords.com/range/{fullHashPreview.substring(0, 5)}</code>
                ) : (
                  'https://api.pwnedpasswords.com/range/XXXXX'
                )}
              </span>
            </div>
            <div className="inspector-row">
              <span className="row-key">4. 외부로 전송된 크기</span>
              <span className="row-val highlight-val">단 5글자 (5 bytes Hex Prefix)</span>
            </div>
            <div className="inspector-row">
              <span className="row-key">5. 서버가 알 수 없는 정보</span>
              <span className="row-val safe-val">내 비밀번호 원문, 전체 해시, 수백 개 후보 중 내가 어떤 걸 찾는지</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { encryptVault, decryptVault } from '../utils/crypto';

export default function CryptoVault() {
  const [mode, setMode] = useState('encrypt'); // 'encrypt' | 'decrypt'
  const [masterPassword, setMasterPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // 암호화 폼 상태
  const [plainText, setPlainText] = useState('');
  const [encryptedResult, setEncryptedResult] = useState('');
  const [encryptError, setEncryptError] = useState('');

  // 복호화 폼 상태
  const [cipherInput, setCipherInput] = useState('');
  const [decryptedResult, setDecryptedResult] = useState('');
  const [decryptError, setDecryptError] = useState('');

  const [isLoading, setIsLoading] = useState(false);

  const handleEncrypt = async () => {
    setEncryptError('');
    setEncryptedResult('');
    if (!masterPassword) {
      setEncryptError('마스터 비밀번호를 입력해 주세요.');
      return;
    }
    if (!plainText) {
      setEncryptError('암호화할 비밀 메모나 텍스트를 입력해 주세요.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await encryptVault(masterPassword, plainText);
      setEncryptedResult(result);
    } catch (err) {
      setEncryptError(err.message || '암호화 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDecrypt = async () => {
    setDecryptError('');
    setDecryptedResult('');
    if (!masterPassword) {
      setDecryptError('마스터 비밀번호를 입력해 주세요.');
      return;
    }
    if (!cipherInput) {
      setDecryptError('복호화할 암호화 JSON 데이터를 입력해 주세요.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await decryptVault(masterPassword, cipherInput);
      setDecryptedResult(result);
    } catch (err) {
      setDecryptError(err.message || '복호화 실패: 비밀번호가 일치하지 않습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('복사되었습니다.');
  };

  return (
    <div className="card-container">
      <div className="security-card">
        <div className="card-header">
          <h2>🔐 영지식(Zero-Knowledge) AES-256-GCM 암호화 금고</h2>
          <span className="card-tag vault-tag">PBKDF2 (10만 회) + AES-GCM</span>
        </div>
        <p className="card-description">
          마스터 비밀번호로 <strong>PBKDF2</strong>를 통해 암호화 키를 파생하고, 메모를 <strong>AES-256-GCM</strong>으로 암호화합니다.
          서버나 제3자가 복구할 수 없는 <em>클라이언트 측 종단간 암호화(E2EE)</em>를 체험해 보세요.
        </p>

        {/* 마스터 비밀번호 입력 */}
        <div className="input-group">
          <label className="input-label" htmlFor="vault-pwd">금고 마스터 비밀번호</label>
          <div className="password-input-wrapper">
            <input
              id="vault-pwd"
              type={showPassword ? 'text' : 'password'}
              value={masterPassword}
              onChange={(e) => setMasterPassword(e.target.value)}
              placeholder="금고를 잠그거나 열 마스터 비밀번호"
              className="styled-input"
              autoComplete="off"
            />
            <button
              type="button"
              className="toggle-visibility-btn"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? '🙈' : '👁️'}
            </button>
          </div>
        </div>

        {/* 서브 탭 */}
        <div className="sub-tab-group">
          <button
            type="button"
            className={`sub-tab-btn ${mode === 'encrypt' ? 'active' : ''}`}
            onClick={() => setMode('encrypt')}
          >
            🔒 메모 암호화하기 (Encrypt)
          </button>
          <button
            type="button"
            className={`sub-tab-btn ${mode === 'decrypt' ? 'active' : ''}`}
            onClick={() => setMode('decrypt')}
          >
            🔓 금고 복호화하기 (Decrypt)
          </button>
        </div>

        {/* 1. 암호화 모드 */}
        {mode === 'encrypt' && (
          <div className="vault-panel">
            <div className="input-group">
              <label className="input-label" htmlFor="plain-memo">암호화할 평문 메모 / 계정 정보</label>
              <textarea
                id="plain-memo"
                rows={4}
                value={plainText}
                onChange={(e) => setPlainText(e.target.value)}
                placeholder="예: 은행 계좌번호, 복구 단어, 비밀 메모 등 안전하게 보관할 내용"
                className="styled-textarea"
              />
            </div>

            <button
              type="button"
              className="primary-btn"
              onClick={handleEncrypt}
              disabled={isLoading}
            >
              {isLoading ? '암호화 처리 중 (PBKDF2 10만 회)...' : '🔒 안전하게 암호화하기'}
            </button>

            {encryptError && (
              <div className="alert-box alert-danger">
                <strong>오류:</strong> {encryptError}
              </div>
            )}

            {encryptedResult && (
              <div className="vault-output-box">
                <div className="vault-output-header">
                  <span>암호화된 JSON 패키지 (Salt + IV + Ciphertext)</span>
                  <button
                    type="button"
                    className="small-btn"
                    onClick={() => copyToClipboard(encryptedResult)}
                  >
                    JSON 복사
                  </button>
                </div>
                <pre className="code-block">{encryptedResult}</pre>
                <p className="vault-hint">
                  💡 이 암호문은 마스터 비밀번호를 모르면 전 세계 슈퍼컴퓨터를 동원해도 풀 수 없습니다.
                </p>
              </div>
            )}
          </div>
        )}

        {/* 2. 복호화 모드 */}
        {mode === 'decrypt' && (
          <div className="vault-panel">
            <div className="input-group">
              <label className="input-label" htmlFor="cipher-input">암호화된 JSON 데이터 붙여넣기</label>
              <textarea
                id="cipher-input"
                rows={4}
                value={cipherInput}
                onChange={(e) => setCipherInput(e.target.value)}
                placeholder="위에서 암호화했던 JSON 결과값을 그대로 붙여넣으세요"
                className="styled-textarea"
              />
            </div>

            <button
              type="button"
              className="primary-btn"
              onClick={handleDecrypt}
              disabled={isLoading}
            >
              {isLoading ? '복호화 검증 중...' : '🔓 마스터 비밀번호로 잠금 해제'}
            </button>

            {decryptError && (
              <div className="alert-box alert-danger">
                <strong>오류:</strong> {decryptError}
              </div>
            )}

            {decryptedResult && (
              <div className="vault-output-box decrypted-box">
                <div className="vault-output-header">
                  <span>복호화 성공! 복원된 원문</span>
                  <span className="badge badge-success">인증 태그(GCM) 일치</span>
                </div>
                <div className="decrypted-text">{decryptedResult}</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

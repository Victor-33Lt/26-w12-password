export default function Header({ activeTab, setActiveTab }) {
  const tabs = [
    { id: 'checker', label: '🛡️ 비밀번호 보안 검사', desc: '강도 & k-익명성 유출 조회' },
    { id: 'generator', label: '⚡ CSPRNG 생성기', desc: '암호학적 난수 비밀번호' },
    { id: 'vault', label: '🔐 AES-256 암호화 금고', desc: 'PBKDF2 + AES-GCM' },
    { id: 'education', label: '📚 사이버보안 가이드', desc: 'k-익명성 및 암호학 원리' },
  ];

  return (
    <header className="app-header">
      <div className="header-top">
        <div className="brand">
          <div className="shield-icon">🛡️</div>
          <div>
            <h1>비밀번호 보안 실드 <span className="version-pill">v1.0</span></h1>
            <p className="brand-subtitle">Cybersecurity Password Suite · k-Anonymity · Web Crypto API</p>
          </div>
        </div>

        <div className="security-badges">
          <div className="badge badge-success" title="window.crypto.getRandomValues 사용">
            <span className="dot"></span> CSPRNG 난수
          </div>
          <div className="badge badge-info" title="SHA-1 앞 5글자만 외부 전송">
            <span className="dot"></span> 최소 전송 (5글자)
          </div>
          <div className="badge badge-warning" title="비밀번호는 브라우저를 벗어나거나 저장되지 않음">
            <span className="dot"></span> 제로 스토리지
          </div>
        </div>
      </div>

      <nav className="tab-navigation">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="tab-label">{tab.label}</span>
            <span className="tab-desc">{tab.desc}</span>
          </button>
        ))}
      </nav>
    </header>
  );
}

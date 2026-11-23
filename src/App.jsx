import { useState } from 'react';
import Header from './components/Header';
import PasswordChecker from './components/PasswordChecker';
import PasswordGenerator from './components/PasswordGenerator';
import CryptoVault from './components/CryptoVault';
import SecurityEducation from './components/SecurityEducation';
import './App.css';

export default function App() {
  const [activeTab, setActiveTab] = useState('checker');
  const [sharedPassword, setSharedPassword] = useState('');

  // 생성기에서 검사기로 바로 이동
  const handleSendToChecker = (pwd) => {
    setSharedPassword(pwd);
    setActiveTab('checker');
  };

  return (
    <div className="app-layout">
      <div className="background-glow"></div>
      
      <div className="main-wrapper">
        <Header activeTab={activeTab} setActiveTab={setActiveTab} />

        <main className="content-area">
          {activeTab === 'checker' && (
            <PasswordChecker
              sharedPassword={sharedPassword}
            />
          )}

          {activeTab === 'generator' && (
            <PasswordGenerator onSendToChecker={handleSendToChecker} />
          )}

          {activeTab === 'vault' && (
            <CryptoVault />
          )}

          {activeTab === 'education' && (
            <SecurityEducation />
          )}
        </main>

        <footer className="app-footer">
          <div className="footer-content">
            <p className="footer-title">
              🛡️ 한국폴리텍대학 강서캠퍼스 사이버보안과 12주차 실습 · <strong>비밀번호 보안 도구</strong>
            </p>
            <p className="footer-meta">
              최소 전송 원칙(k-Anonymity) · CSPRNG (Web Crypto API) · 무저장 원칙(Zero-Storage)
            </p>
            <div className="footer-links">
              <span>Have I Been Pwned Pwned-Passwords API 연동</span>
              <span>·</span>
              <span>React 19 + Vite</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

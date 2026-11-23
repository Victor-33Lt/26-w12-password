export default function SecurityEducation() {
  return (
    <div className="card-container">
      <div className="security-card">
        <div className="card-header">
          <h2>📚 사이버보안 원리 및 아키텍처 해설</h2>
          <span className="card-tag">사이버보안과 핵심 이론</span>
        </div>
        <p className="card-description">
          11주차(무전송 원칙)와 12주차(최소 전송 원칙, k-익명성), 그리고 난수 생성기의 보안 차이점을 시각적으로 학습합니다.
        </p>

        {/* 1. k-익명성 vs 도서관 비유 */}
        <div className="edu-section">
          <h3>🔍 1. k-익명성(k-Anonymity)이란?</h3>
          <div className="edu-diagram-box">
            <div className="diagram-step">
              <span className="step-num">Step 1</span>
              <strong>로컬 해시 계산</strong>
              <code>"password" ➔ 5BAA61E4C9B93F3F0682250B6CF8331B7EE68FD8</code>
              <span>Web Crypto API (SHA-1)로 브라우저 내에서만 40자리 해시 생성</span>
            </div>
            <div className="diagram-arrow">➔ 앞 5글자만 분리 (5BAA6) ➔</div>
            <div className="diagram-step">
              <span className="step-num">Step 2</span>
              <strong>최소 정보 외부 전송</strong>
              <code>GET api.pwnedpasswords.com/range/5BAA6</code>
              <span>5BAA6으로 시작하는 수백~수천 개 유출 해시 목록 요청</span>
            </div>
            <div className="diagram-arrow">➔ 서버가 수백 개 목록 반환 ➔</div>
            <div className="diagram-step">
              <span className="step-num">Step 3</span>
              <strong>브라우저 내부 대조</strong>
              <code>1E4C9...:52256179 ➔ 발견! (대문자 대조)</code>
              <span>내 비밀번호 해시의 뒤 35글자가 목록에 있는지 브라우저가 직접 검사</span>
            </div>
          </div>

          <div className="callout-box">
            <h4>📖 도서관 사서 비유</h4>
            <p>
              사서에게 <em>"내가 찾는 책 제목이 '비밀일기'인가요?"</em>라고 물어보면 사서는 내가 어떤 책을 찾는지 알게 됩니다.<br />
              하지만 <em>"'ㅂ'으로 시작하는 책 목록 전부 주세요"</em>라고 요청한 뒤, 건네받은 수백 권 목록에서 내 책을 <strong>직접 찾는 방식</strong>이 바로 k-익명성입니다. 사서는 내가 그 목록 중 어느 책을 보았는지 전혀 알 수 없습니다.
            </p>
          </div>
        </div>

        {/* 2. k-익명성의 한계 */}
        <div className="edu-section">
          <h3>⚠️ 2. k-익명성은 완전한 익명일까요? (한계와 공격 표면)</h3>
          <div className="table-responsive">
            <table className="edu-table">
              <thead>
                <tr>
                  <th>구분</th>
                  <th>서버가 알 수 있는 정보</th>
                  <th>서버가 절대 알 수 없는 정보</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>보안 상태</td>
                  <td>
                    <ul>
                      <li>클라이언트의 <strong>IP 주소</strong></li>
                      <li>요청이 발생한 <strong>정확한 시각</strong></li>
                      <li>해시의 <strong>앞 5자리 접두사</strong> (5BAA6)</li>
                      <li>(Add-Padding 미사용 시) 응답 데이터 크기로 대략의 유출 규모 유추</li>
                    </ul>
                  </td>
                  <td>
                    <ul>
                      <li>입력된 <strong>비밀번호 원문</strong></li>
                      <li>해시의 <strong>뒤 35자리 접미사</strong></li>
                      <li>응답받은 수백 개 해시 목록 중 <strong>내가 찾으려는 대상</strong></li>
                      <li>해당 비밀번호의 실제 유출 여부 최종 판정 결과</li>
                    </ul>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 3. Math.random() vs crypto.getRandomValues() */}
        <div className="edu-section">
          <h3>🎲 3. 왜 Math.random()을 쓰면 안 될까요?</h3>
          <div className="comparison-cards">
            <div className="comp-card danger-card">
              <h4>❌ Math.random() (PRNG)</h4>
              <ul>
                <li><strong>알고리즘:</strong> xorshift128+ 등 유사 난수 생성기</li>
                <li><strong>시드(Seed):</strong> 시간 또는 단순 내부 카운터 기반</li>
                <li><strong>취약점:</strong> 앞서 생성된 몇 개의 난수 값만 수집하면 내부 상태를 역추적하여 <strong>다음에 나올 비밀번호를 100% 예측</strong> 가능</li>
                <li><strong>용도:</strong> 단순 애니메이션, 게임 그래픽, 무작위 셔플</li>
              </ul>
            </div>
            <div className="comp-card success-card">
              <h4>✅ crypto.getRandomValues() (CSPRNG)</h4>
              <ul>
                <li><strong>알고리즘:</strong> ChaCha20, AES-CTR-DRBG 등 암호학적 검증 난수</li>
                <li><strong>엔트로피 풀:</strong> 운영체제 커널의 하드웨어 인터럽트, 키보드/마우스 타이밍 노이즈 수집</li>
                <li><strong>보안성:</strong> 이전 난수를 모두 알아도 다음 난수를 수학적으로 예측 불가능 (다음 비트 예측 불가능성)</li>
                <li><strong>용도:</strong> 비밀번호, 세션 토큰, 암호화 키, Salt, IV</li>
              </ul>
            </div>
          </div>
        </div>

        {/* 4. 11주차 vs 12주차 패러다임 비교 */}
        <div className="edu-section">
          <h3>🔁 4. 11주차와 12주차 통신 원칙의 진화</h3>
          <div className="table-responsive">
            <table className="edu-table">
              <thead>
                <tr>
                  <th>항목</th>
                  <th>11주차 (모바일 OTP 앱)</th>
                  <th>12주차 (비밀번호 보안 도구)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>통신 원칙</td>
                  <td><strong>무전송 원칙 (Zero-Transmission)</strong></td>
                  <td><strong>최소 전송 원칙 (k-익명성, Minimum-Transmission)</strong></td>
                </tr>
                <tr>
                  <td>외부 네트워크</td>
                  <td>완전 차단 (오프라인 로컬 생성)</td>
                  <td>필수적인 5글자 Prefix만 통신</td>
                </tr>
                <tr>
                  <td>Web Crypto API</td>
                  <td>HMAC-SHA1, getRandomValues</td>
                  <td>SHA-1 Digest, getRandomValues, AES-GCM</td>
                </tr>
                <tr>
                  <td>데이터 검증</td>
                  <td>비밀키와 현재 시각으로 코드 계산</td>
                  <td>외부 유출 데이터베이스와 프라이버시 보존형 대조</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

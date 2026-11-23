/**
 * 비밀번호 보안 및 암호화 유틸리티
 * 
 * [보안 원칙 준수]
 * 1. Math.random() 대신 window.crypto.getRandomValues() CSPRNG 사용
 * 2. SHA-1 해시 계산(Web Crypto API) 후 앞 5글자만 외부(HIBP)로 전송
 * 3. 원문 비밀번호나 전체 해시 외부 전송 금지
 * 4. 비밀번호 console.log 출력 및 localStorage 저장 금지
 * 5. 서버 응답 해시와의 대조는 브라우저 내부에서 대문자 기준으로 수행
 */

const CHAR_SETS = {
  uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  lowercase: 'abcdefghijklmnopqrstuvwxyz',
  numbers: '0123456789',
  symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?',
};

const AMBIGUOUS_CHARS = new Set(['l', '1', 'I', 'O', '0', 'o']);

/**
 * 편향 없는(Unbiased) CSPRNG 정수 난수 생성 [0, max)
 */
export function getSecureRandomInt(max) {
  if (max <= 0) return 0;
  const uint32Max = 0xffffffff;
  const limit = uint32Max - (uint32Max % max);
  const buffer = new Uint32Array(1);
  let randomVal;
  do {
    window.crypto.getRandomValues(buffer);
    randomVal = buffer[0];
  } while (randomVal >= limit);
  return randomVal % max;
}

/**
 * CSPRNG 기반 안전한 비밀번호 생성
 */
export function generateSecurePassword(options = {}) {
  const {
    length = 16,
    uppercase = true,
    lowercase = true,
    numbers = true,
    symbols = true,
    excludeAmbiguous = false,
  } = options;

  let pool = '';
  const requiredChars = [];

  const addPool = (charset) => {
    let filtered = charset;
    if (excludeAmbiguous) {
      filtered = charset.split('').filter(c => !AMBIGUOUS_CHARS.has(c)).join('');
    }
    if (filtered.length > 0) {
      pool += filtered;
      // 각 선택 집합에서 최소 1글자 보장
      const pick = filtered[getSecureRandomInt(filtered.length)];
      requiredChars.push(pick);
    }
  };

  if (uppercase) addPool(CHAR_SETS.uppercase);
  if (lowercase) addPool(CHAR_SETS.lowercase);
  if (numbers) addPool(CHAR_SETS.numbers);
  if (symbols) addPool(CHAR_SETS.symbols);

  if (pool.length === 0) {
    // 모든 옵션이 꺼진 경우 소문자 기본값
    addPool(CHAR_SETS.lowercase);
  }

  const result = [...requiredChars];
  while (result.length < length) {
    const char = pool[getSecureRandomInt(pool.length)];
    result.push(char);
  }

  // Fisher-Yates 셔플 (crypto.getRandomValues 기반)
  for (let i = result.length - 1; i > 0; i--) {
    const j = getSecureRandomInt(i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result.slice(0, length).join('');
}

/**
 * Web Crypto API를 이용한 SHA-1 해시 계산 (40자리 대문자 16진수 반환)
 */
export async function calculateSha1(text) {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await window.crypto.subtle.digest('SHA-1', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
}

/**
 * k-익명성 기반 Have I Been Pwned API 유출 확인
 * - 비밀번호의 SHA-1 해시 앞 5글자만 API로 전송
 * - 뒤 35글자 대조는 브라우저 내부에서 대문자 기준으로 수행
 */
export async function checkPwnedPassword(password, usePadding = true) {
  if (!password) {
    throw new Error('비밀번호를 입력해 주세요.');
  }

  const fullHash = await calculateSha1(password);
  const prefix = fullHash.substring(0, 5); // 5글자 전송
  const suffix = fullHash.substring(5);    // 35글자는 로컬에서만 유지

  const requestUrl = `https://api.pwnedpasswords.com/range/${prefix}`;
  const headers = {};
  if (usePadding) {
    // Add-Padding: 가짜 항목(count=0)을 포함시켜 응답 크기 기반 추측 방어
    headers['Add-Padding'] = 'true';
  }

  const response = await fetch(requestUrl, {
    method: 'GET',
    headers,
  });

  if (!response.ok) {
    throw new Error(`API 응답 실패 (HTTP 상태 코드: ${response.status})`);
  }

  const responseText = await response.text();
  const lines = responseText.split('\n');

  let breachCount = 0;
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const [lineSuffix, countStr] = trimmed.split(':');
    if (!lineSuffix || !countStr) continue;

    // 대문자 기준으로 대조 (서버 응답은 대문자 해시)
    if (lineSuffix.toUpperCase() === suffix) {
      const parsed = parseInt(countStr, 10);
      if (!isNaN(parsed) && parsed > 0) {
        breachCount = parsed;
        break;
      }
    }
  }

  return {
    prefix,
    requestUrl,
    isPwned: breachCount > 0,
    breachCount,
    checkedAt: new Date().toLocaleTimeString(),
  };
}

/**
 * 비밀번호 강도, 엔트로피 및 패턴 분석
 */
export function evaluatePasswordStrength(password) {
  if (!password) {
    return {
      score: 0,
      label: '입력 대기',
      color: '#6b7280',
      entropy: 0,
      crackTime: '0초',
      checklist: {
        length: false,
        hasUpper: false,
        hasLower: false,
        hasNumber: false,
        hasSymbol: false,
        noRepetition: true,
        noSequence: true,
      },
      warnings: [],
      suggestions: ['비밀번호를 입력하여 강도를 검사하세요.'],
    };
  }

  const len = password.length;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSymbol = /[^A-Za-z0-9]/.test(password);

  // 문자 집합 풀 크기 계산
  let poolSize = 0;
  if (hasUpper) poolSize += 26;
  if (hasLower) poolSize += 26;
  if (hasNumber) poolSize += 10;
  if (hasSymbol) poolSize += 32;

  // 정보 엔트로피(Bits): E = L * log2(poolSize)
  const entropy = poolSize > 0 ? Math.round(len * Math.log2(poolSize)) : 0;

  // 패턴 감지
  const warnings = [];
  const suggestions = [];

  // 1. 반복 문자 검사 (aaa, 111 등 3회 이상 연속)
  const repetitionRegex = /(.)\1{2,}/i;
  const hasRepetition = repetitionRegex.test(password);
  if (hasRepetition) {
    warnings.push('동일한 문자가 3회 이상 연속 반복됩니다.');
  }

  // 2. 키보드 또는 순차 패턴 검사
  const sequences = [
    '0123456789',
    '9876543210',
    'abcdefghijklmnopqrstuvwxyz',
    'zyxwvutsrqponmlkjihgfedcba',
    'qwertyuiop',
    'asdfghjkl',
    'zxcvbnm',
  ];
  const lowerPwd = password.toLowerCase();
  let hasSequence = false;
  for (const seq of sequences) {
    for (let i = 0; i <= seq.length - 3; i++) {
      const sub = seq.substring(i, i + 3);
      if (lowerPwd.includes(sub)) {
        hasSequence = true;
        warnings.push(`연속된 키보드/알파벳 패턴("${sub}")이 포함되어 있습니다.`);
        break;
      }
    }
    if (hasSequence) break;
  }

  // 3. 흔한 취약 단어 검사
  const commonWords = ['password', 'admin', 'welcome', 'qwerty', 'login', 'pass', 'test', 'kopo'];
  for (const word of commonWords) {
    if (lowerPwd.includes(word)) {
      warnings.push(`흔히 쓰이는 취약 단어("${word}")가 포함되어 있습니다.`);
      break;
    }
  }

  // 기본 점수 계산 (0 ~ 4)
  let score = 0;
  if (len >= 8) score += 1;
  if (len >= 12) score += 1;
  if (len >= 16) score += 1;

  const charTypeCount = [hasUpper, hasLower, hasNumber, hasSymbol].filter(Boolean).length;
  if (charTypeCount >= 3) score += 1;
  if (charTypeCount === 4 && len >= 12) score += 1;

  // 패턴 감지 시 감점
  if (hasRepetition) score = Math.max(0, score - 1);
  if (hasSequence) score = Math.max(0, score - 1);
  if (warnings.length > 0 && score > 2) score = 2;

  score = Math.min(4, score);

  // 조언 생성
  if (len < 8) {
    suggestions.push('최소 8자 이상(권장 12자 이상)으로 길이를 늘리세요.');
  } else if (len < 12) {
    suggestions.push('12자 이상 사용하면 브루트포스 공격에 훨씬 안전합니다.');
  }
  if (!hasUpper) suggestions.push('대문자(A-Z)를 1개 이상 추가하세요.');
  if (!hasLower) suggestions.push('소문자(a-z)를 1개 이상 추가하세요.');
  if (!hasNumber) suggestions.push('숫자(0-9)를 1개 이상 추가하세요.');
  if (!hasSymbol) suggestions.push('특수문자(!@#$ 등)를 1개 이상 추가하세요.');
  if (hasRepetition || hasSequence) suggestions.push('규칙적이거나 반복되는 문자 배열을 무작위 문자로 교체하세요.');

  const labels = [
    { label: '매우 취약 (Very Weak)', color: '#ef4444' },
    { label: '취약 (Weak)', color: '#f97316' },
    { label: '보통 (Moderate)', color: '#eab308' },
    { label: '안전 (Strong)', color: '#22c55e' },
    { label: '매우 안전 (Very Strong)', color: '#06b6d4' },
  ];

  // 크래킹 시간 추정 (초당 1,000억 회 시도 가능한 고성능 GPU 클러스터 기준)
  // 총 조합수: poolSize^len
  let crackTime = '순식간 (즉시 돌파)';
  if (entropy > 0) {
    if (entropy < 28) {
      crackTime = '순식간 (수 밀리초 이내)';
    } else if (entropy < 36) {
      crackTime = '수 초 ~ 수 분';
    } else if (entropy < 48) {
      crackTime = '수 시간 ~ 수 일';
    } else if (entropy < 60) {
      crackTime = '수 개월 ~ 수 년';
    } else if (entropy < 80) {
      crackTime = '수백 년 ~ 수만 년';
    } else {
      crackTime = '우주 나이 이상 (해독 불가 수준)';
    }
  }

  return {
    score,
    label: labels[score].label,
    color: labels[score].color,
    entropy,
    crackTime,
    checklist: {
      length: len >= 12,
      hasUpper,
      hasLower,
      hasNumber,
      hasSymbol,
      noRepetition: !hasRepetition,
      noSequence: !hasSequence,
    },
    warnings,
    suggestions: suggestions.length > 0 ? suggestions : ['훌륭합니다! 매우 안전한 조합입니다.'],
  };
}

/**
 * PBKDF2 + AES-GCM (256-bit) 암호화 금고 기능 (확장 기능)
 */
async function deriveVaultKey(masterPassword, salt) {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(masterPassword),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encryptVault(masterPassword, plaintext) {
  if (!masterPassword || !plaintext) {
    throw new Error('마스터 비밀번호와 암호화할 내용을 모두 입력하세요.');
  }

  const salt = new Uint8Array(16);
  window.crypto.getRandomValues(salt);
  const iv = new Uint8Array(12);
  window.crypto.getRandomValues(iv);

  const key = await deriveVaultKey(masterPassword, salt);
  const encodedData = new TextEncoder().encode(plaintext);

  const encryptedBuffer = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encodedData
  );

  const toHex = (buf) => Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');

  return JSON.stringify({
    cipher: toHex(encryptedBuffer),
    iv: toHex(iv),
    salt: toHex(salt),
    algorithm: 'AES-256-GCM / PBKDF2 (100,000 iters)',
    createdAt: new Date().toISOString(),
  }, null, 2);
}

export async function decryptVault(masterPassword, encryptedJson) {
  if (!masterPassword || !encryptedJson) {
    throw new Error('마스터 비밀번호와 암호화된 JSON 데이터를 입력하세요.');
  }

  let parsed;
  try {
    parsed = JSON.parse(encryptedJson);
  } catch {
    throw new Error('올바른 암호화 JSON 형식이 아닙니다.');
  }

  const fromHex = (hex) => new Uint8Array(hex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));

  try {
    const salt = fromHex(parsed.salt);
    const iv = fromHex(parsed.iv);
    const cipherData = fromHex(parsed.cipher);

    const key = await deriveVaultKey(masterPassword, salt);
    const decryptedBuffer = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      cipherData
    );

    return new TextDecoder().decode(decryptedBuffer);
  } catch {
    throw new Error('복호화 실패: 마스터 비밀번호가 틀렸거나 데이터가 위변조되었습니다.');
  }
}

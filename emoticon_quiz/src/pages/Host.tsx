import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useRoom, getQuestionTitle, PRACTICE_QUESTIONS } from '../hooks/useRoom';
import type { Question } from '../hooks/useRoom';
import { Users, Play, ArrowRight, Award, Trash, Upload, RefreshCw, Volume2, Trophy, HelpCircle } from 'lucide-react';

const isTextQuestion = (str: string | undefined): boolean => {
  if (!str) return false;
  return /[가-힣a-zA-Z]/.test(str);
};

// 객관식 보기 무작위 셔플 헬퍼 함수
function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export default function Host() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const pin = searchParams.get('pin') || '';
  const initialMode = (searchParams.get('mode') as 'individual' | 'team') || 'individual';
  const initialStyle = (searchParams.get('style') as 'host_controlled' | 'self_paced') || 'host_controlled';

  const {
    roomState,
    loading,
    error,
    createRoom,
    loadQuestions,
    startQuiz,
    updateTimeLimit,
    updateQuestionDuration,
    startOrientation,
    startPracticeQuestion,
    endOrientation,
    nextQuestion,
    revealAnswer,
    endQuiz,
    deleteRoom,
    isDemo
  } = useRoom(pin, true);

  const [csvError, setCsvError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [hostQuestionTimeLeft, setHostQuestionTimeLeft] = useState<number | null>(null);
  const [showMonitorQr, setShowMonitorQr] = useState(false);
  const [mockViewType, setMockViewType] = useState<'short_answer' | 'multiple_choice'>('short_answer');

  useEffect(() => {
    if (roomState?.status === 'playing' && roomState.playStyle === 'self_paced' && !roomState.isOrientation && roomState.endAt) {
      const calcTime = () => {
        const remaining = Math.max(0, Math.round((roomState.endAt! - Date.now()) / 1000));
        setTimeLeft(remaining);
      };
      
      calcTime();
      const interval = setInterval(calcTime, 1000);
      return () => clearInterval(interval);
    }
  }, [roomState?.status, roomState?.playStyle, roomState?.isOrientation, roomState?.endAt]);

  // 진행자 통제형 개별 문제 타이머 작동
  useEffect(() => {
    if (
      roomState?.status === 'playing' &&
      roomState.playStyle === 'host_controlled' &&
      roomState.questionEndAt &&
      !roomState.showAnswer
    ) {
      const calcTime = () => {
        const remaining = Math.max(0, Math.round((roomState.questionEndAt! - Date.now()) / 1000));
        setHostQuestionTimeLeft(remaining);
      };
      
      calcTime();
      const interval = setInterval(calcTime, 1000);
      return () => clearInterval(interval);
    } else {
      setHostQuestionTimeLeft(null);
    }
  }, [roomState?.status, roomState?.playStyle, roomState?.questionEndAt, roomState?.showAnswer]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 방 자동 생성 및 복구
  useEffect(() => {
    if (pin && !loading && !roomState) {
      createRoom(initialMode, 'host_user', initialStyle);
    }
  }, [pin, loading, roomState, initialMode, initialStyle]);

  // 기본 성경/일반 이모지 퀴즈 문제 세트
  const loadDefaultQuestions = async () => {
    try {
      const response = await fetch('/bible_emoticon_quiz.csv');
      if (!response.ok) throw new Error('기본 문제 파일을 불러올 수 없습니다.');
      const text = await response.text();
      
      const lines = text.split(/\r?\n/);
      const questions: Question[] = [];
      let idCounter = 1;

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // 표준 RFC 4180 CSV 라인 파서 구현
        const parts: string[] = [];
        let current = '';
        let inQuotes = false;
        
        for (let j = 0; j < line.length; j++) {
          const char = line[j];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            parts.push(current);
            current = '';
          } else {
            current += char;
          }
        }
        parts.push(current);

        // 값 정제 및 큰따옴표 이스케이프 처리
        const cleanParts = parts.map(part => part.trim().replace(/^"|"$/g, '').replace(/""/g, '"').trim());

        if (cleanParts.length >= 2) {
          const emojis = cleanParts[0];
          const answer = cleanParts[1];
          const typeVal = cleanParts[2] || 'short_answer';
          const optionsStr = cleanParts[3] || '';
          const book = cleanParts[4] || '';
          const category = cleanParts[5] || '';
          const scoreVal = cleanParts[6] ? parseInt(cleanParts[6], 10) : 10;

          const type = typeVal === 'multiple_choice' ? 'multiple_choice' : 'short_answer';

          const q: Question = {
            id: idCounter++,
            emojis,
            answer,
            type
          };
          if (optionsStr) q.options = shuffleArray(optionsStr.split(';').map(opt => opt.trim()));
          if (book) q.book = book;
          if (category) q.category = category;
          q.score = isNaN(scoreVal) ? 10 : scoreVal;

          questions.push(q);
        }
      }

      if (questions.length === 0) {
        throw new Error('유효한 퀴즈 행을 찾을 수 없습니다.');
      }

      await loadQuestions(questions);
      setCsvError('');
    } catch (err) {
      console.error(err);
      // Fallback to basic set if fetch fails
      const defaultSet: Question[] = [
        { id: 1, emojis: '⛵️🌊🦁🦒🐐', answer: '노아의 방주, 노아', type: 'short_answer', book: '창세기', category: '사건,기적,치유' },
        { id: 2, emojis: '🍞🍞🍞🍞🍞🐟🐟', answer: '오병이어', type: 'short_answer', book: '마태복음', category: '사건,기적,치유' },
        { id: 3, emojis: '👑🦁🕳🙏', answer: '다니엘, 사자굴', type: 'short_answer', book: '다니엘', category: '인물' },
        { id: 4, emojis: '🧱🎺🎺🎷💥', answer: '여리고성, 여리고', type: 'short_answer', book: '여호수아', category: '장소' },
        { id: 5, emojis: '👶🧺🌾🌊', answer: '모세', type: 'short_answer', book: '출애굽기', category: '인물' },
        { id: 6, emojis: '🐋🌊🧔🙏', answer: '요나', type: 'short_answer', book: '요나', category: '인물' },
        { id: 7, emojis: '🐑🪵🔥⚔️🧔👦', answer: '이삭, 아브라함', type: 'multiple_choice', options: ['이삭', '요셉', '야곱', '에서'], book: '창세기', category: '인물' },
        { id: 8, emojis: '🩸🐸🦟🐂🩹⛈🦗🌑💀', answer: '십재앙, 열가지 재앙', type: 'multiple_choice', options: ['십재앙', '오병이어', '바벨탑', '홍해'], book: '출애굽기', category: '사건,기적,치유' }
      ];
      await loadQuestions(defaultSet);
    }
  };

  // CSV 문제 업로드 처리
  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      try {
        const lines = text.split(/\r?\n/);
        const questions: Question[] = [];
        let idCounter = 1;

        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;

          // 표준 RFC 4180 CSV 라인 파서 구현
          const parts: string[] = [];
          let current = '';
          let inQuotes = false;
          
          for (let j = 0; j < line.length; j++) {
            const char = line[j];
            if (char === '"') {
              inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
              parts.push(current);
              current = '';
            } else {
              current += char;
            }
          }
          parts.push(current);

          // 값 정제 및 큰따옴표 이스케이프 처리
          const cleanParts = parts.map(part => part.trim().replace(/^"|"$/g, '').replace(/""/g, '"').trim());

          if (cleanParts.length >= 2) {
            const emojis = cleanParts[0];
            const answer = cleanParts[1];
            const typeVal = cleanParts[2] || 'short_answer';
            const optionsStr = cleanParts[3] || '';
            const book = cleanParts[4] || '';
            const category = cleanParts[5] || '';
            const scoreVal = cleanParts[6] ? parseInt(cleanParts[6], 10) : 10;

            const type = typeVal === 'multiple_choice' ? 'multiple_choice' : 'short_answer';

            const q: Question = {
              id: idCounter++,
              emojis,
              answer,
              type
            };
            if (optionsStr) q.options = shuffleArray(optionsStr.split(';').map(opt => opt.trim()));
            if (book) q.book = book;
            if (category) q.category = category;
            q.score = isNaN(scoreVal) ? 10 : scoreVal;

            questions.push(q);
          }
        }

        if (questions.length === 0) {
          throw new Error('유효한 퀴즈 행을 찾을 수 없습니다.');
        }

        loadQuestions(questions);
        setCsvError('');
      } catch (err) {
        console.error(err);
        setCsvError('CSV 파일 형식이 올바르지 않습니다. (헤더: emojis,answer,type,options,book,category)');
      }
    };
    reader.readAsText(file, 'utf-8');
  };

  const handleExit = async () => {
    if (window.confirm('정말 방을 폭파하고 나가시겠습니까? 모든 랭킹 데이터가 삭제됩니다.')) {
      setIsDeleting(true);
      await deleteRoom();
      navigate('/');
    }
  };



  if (loading) {
    return (
      <div className="mobile-container" style={{ justifyContent: 'center' }}>
        <div className="text-center">
          <RefreshCw className="status-waiting" size={48} style={{ animation: 'bounce 1s infinite' }} />
          <p className="mt-4">실시간 방 정보를 구성하는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mobile-container" style={{ justifyContent: 'center' }}>
        <div className="card text-center">
          <h2 style={{ color: 'var(--accent-pink)', marginBottom: '15px' }}>오류가 발생했습니다</h2>
          <p style={{ marginBottom: '25px' }}>{error}</p>
          <button onClick={() => navigate('/')} className="btn btn-primary">홈으로 돌아가기</button>
        </div>
      </div>
    );
  }

  if (!roomState) return null;

  const playersList = Object.values(roomState.players || {});
  const totalPlayers = playersList.length;
  const submittedCount = playersList.filter(p => p.lastAnswer !== null && p.lastAnswer !== undefined && p.lastAnswer !== '').length;

  const currentQuestion = roomState.isOrientation ? PRACTICE_QUESTIONS[0] : roomState.questions[roomState.currentQuestionIndex];
  const isLastQuestion = roomState.currentQuestionIndex === roomState.questions.length - 1;

  // 1. 대기실 화면 (LOBBY)
  if (roomState.status === 'lobby') {
    return (
      <div className="container" style={{ maxWidth: '1000px', padding: '40px 20px' }}>
        <div className="host-header">
          <div>
            <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--primary)', letterSpacing: '1px', textTransform: 'uppercase' }}>
              JIGUCHON QUIZ SYSTEM
            </span>
            <h1 style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--text-dark)' }}>
              지구촌 퀴즈 대기실 <span style={{ fontSize: '1.2rem', color: '#7f8c8d' }}>({roomState.gameMode === 'team' ? '팀전' : '개인전'})</span>
            </h1>
          </div>
          <div className="flex-row">
            <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#7f8c8d' }}>입장 코드</span>
            <div className="pin-badge">{roomState.pin}</div>
          </div>
        </div>

        {/* 모바일 리모컨 접속 안내 바 */}
        <div style={{ 
          backgroundColor: 'rgba(108, 92, 231, 0.05)', 
          border: '1px solid rgba(108, 92, 231, 0.1)', 
          padding: '12px 20px', 
          borderRadius: '12px', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '25px', 
          fontSize: '0.9rem' 
        }}>
          <div>
            <span style={{ color: 'var(--primary)', fontWeight: 'bold', marginRight: '8px' }}>📱 스마트폰 리모컨 주소:</span>
            <span style={{ fontFamily: 'monospace', fontWeight: 'bold', color: '#2d3436', userSelect: 'all' }}>
              {window.location.origin}/#/monitor?pin={roomState.pin}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => setShowMonitorQr(true)}
              className="btn btn-outline"
              style={{ padding: '6px 14px', fontSize: '0.8rem', margin: 0, minWidth: '90px', height: 'auto', border: '1px solid var(--primary)', color: 'var(--primary)' }}
            >
              📱 리모컨 QR 보기
            </button>
            <button
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/#/monitor?pin=${roomState.pin}`);
                alert('모바일 모니터 리모컨 URL이 클립보드에 복사되었습니다! 핸드폰(나에게 보내는 카톡 등)으로 전송해 접속해 보세요.');
              }}
              className="btn btn-outline"
              style={{ padding: '6px 14px', fontSize: '0.8rem', margin: 0, minWidth: '80px', height: 'auto', border: '1px solid var(--primary)', color: 'var(--primary)' }}
            >
              링크 복사
            </button>
          </div>
        </div>

        {/* 진행자 모바일 리모컨 QR 팝업 모달 */}
        {showMonitorQr && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }} onClick={() => setShowMonitorQr(false)}>
            <div style={{
              backgroundColor: 'white',
              padding: '30px',
              borderRadius: '20px',
              maxWidth: '400px',
              width: '90%',
              textAlign: 'center',
              boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
            }} onClick={(e) => e.stopPropagation()}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 900, marginBottom: '10px', color: 'var(--primary)' }}>
                📱 진행자 무선 리모컨 QR
              </h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--accent-pink)', fontWeight: 'bold', marginBottom: '20px' }}>
                ⚠️ 주의: 학생들에게 노출되지 않도록 진행자 폰으로만 스캔하세요!
              </p>
              <div style={{
                backgroundColor: 'white',
                padding: '15px',
                borderRadius: '16px',
                display: 'inline-block',
                border: '1px solid #dfe6e9',
                marginBottom: '20px'
              }}>
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(window.location.origin + '/#/monitor?pin=' + roomState.pin)}`} 
                  alt="Monitor Remote QR" 
                  style={{ width: '200px', height: '200px', display: 'block' }}
                />
              </div>
              <p style={{ fontSize: '0.8rem', color: '#7f8c8d', marginBottom: '20px', wordBreak: 'break-all', fontFamily: 'monospace' }}>
                {window.location.origin}/#/monitor?pin={roomState.pin}
              </p>
              <button 
                onClick={() => setShowMonitorQr(false)} 
                className="btn btn-primary" 
                style={{ width: '100%', margin: 0 }}
              >
                닫기
              </button>
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '30px' }}>
          {/* 좌측: 접속 학생 현황 */}
          <div className="card" style={{ minHeight: '400px' }}>
            <div className="flex-row justify-between mb-4" style={{ borderBottom: '2px solid var(--bg-light)', paddingBottom: '15px' }}>
              <h2 style={{ fontSize: '1.3rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Users size={22} color="var(--primary)" /> 참가 중인 학생 ({totalPlayers}명)
              </h2>
              {isDemo && (
                <span style={{ fontSize: '0.8rem', backgroundColor: 'var(--accent-yellow)', padding: '4px 10px', borderRadius: '15px', fontWeight: 'bold' }}>
                  💡 브라우저 새 창에서 PIN {roomState.pin}으로 접속해 테스트해 보세요!
                </span>
              )}
            </div>

            {totalPlayers === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
                <div style={{ display: 'flex', gap: '30px', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <div className="text-center" style={{ maxWidth: '300px' }}>
                    <HelpCircle size={48} style={{ marginBottom: '15px', opacity: 0.5, color: 'var(--primary)', animation: 'bounce 2s infinite' }} />
                    <p style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--text-dark)' }}>학생들이 접속하기를 기다리고 있습니다...</p>
                    <p style={{ fontSize: '0.9rem', marginTop: '10px', color: '#7f8c8d', lineHeight: '1.4' }}>
                      학생 스마트폰으로 아래 **QR 코드**를 스캔하거나, 주소 입력 후 핀 번호 <strong style={{ color: 'var(--primary)', fontSize: '1.2rem' }}>{roomState.pin}</strong>을 입력해 주세요.
                    </p>
                  </div>
                  <div style={{
                    backgroundColor: 'white',
                    padding: '15px',
                    borderRadius: '16px',
                    boxShadow: 'var(--shadow-md)',
                    border: '1px solid #dfe6e9',
                    textAlign: 'center'
                  }}>
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(window.location.origin + '/#/student?pin=' + roomState.pin)}`} 
                      alt="Student Join QR" 
                      style={{ width: '180px', height: '180px', display: 'block', marginBottom: '8px' }}
                    />
                    <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--primary)' }}>📱 스캔하여 바로 입장</span>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 180px', gap: '20px' }}>
                {/* 학생 리스트 */}
                <div className="lobby-players-grid">
                  {playersList.map((player) => (
                    <div key={player.id} className="lobby-player-card" style={{ animation: 'popIn 0.3s ease-out' }}>
                      <div style={{ fontSize: '1.8rem', marginBottom: '5px' }}>⚡️</div>
                      <div style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{player.name}</div>
                      {roomState.gameMode === 'team' && player.team && (
                        <span className="lobby-player-team">{player.team}</span>
                      )}
                    </div>
                  ))}
                </div>
                {/* 우측 사이드 QR 코드 */}
                <div style={{
                  borderLeft: '1px solid var(--bg-light)',
                  paddingLeft: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <div style={{
                    backgroundColor: 'white',
                    padding: '10px',
                    borderRadius: '12px',
                    boxShadow: 'var(--shadow-sm)',
                    border: '1px solid #dfe6e9',
                    textAlign: 'center'
                  }}>
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(window.location.origin + '/#/student?pin=' + roomState.pin)}`} 
                      alt="Student Join QR" 
                      style={{ width: '120px', height: '120px', display: 'block', marginBottom: '6px' }}
                    />
                    <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--primary)' }}>QR 입장 스캔</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 우측: 문제 로드 및 제어 영역 */}
          <div>
            <div className="card">
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '15px' }}>1단계: 문제 세트 준비</h3>
              
              {roomState.questions.length > 0 ? (
                <div style={{ backgroundColor: 'rgba(46, 204, 113, 0.1)', border: '1px solid rgba(46, 204, 113, 0.3)', padding: '15px', borderRadius: 'var(--border-radius-md)', marginBottom: '20px', textAlign: 'center' }}>
                  <p style={{ color: '#27ae60', fontWeight: 'bold' }}>✅ {roomState.questions.length}개의 문제가 업로드됨</p>
                </div>
              ) : (
                <p style={{ fontSize: '0.9rem', color: '#7f8c8d', marginBottom: '20px' }}>아직 로드된 문제가 없습니다. 아래 방식 중 선택해 활성화하세요.</p>
              )}

              {/* 기본 문제 로드 */}
              <button onClick={loadDefaultQuestions} className="btn btn-outline" style={{ width: '100%', marginBottom: '15px' }}>
                <Volume2 size={16} /> 성경 퀴즈 (기본 세트) 로드
              </button>

              <div style={{ position: 'relative', textAlign: 'center', margin: '20px 0' }}>
                <span style={{ position: 'relative', zIndex: 2, background: 'white', padding: '0 10px', fontSize: '0.85rem', color: '#7f8c8d', fontWeight: 'bold' }}>또는 직접 만든 문제 업로드</span>
                <hr style={{ position: 'absolute', top: '50%', left: 0, right: 0, border: 0, borderTop: '1px solid #dfe6e9', zIndex: 1 }} />
              </div>

              {/* CSV 업로드 버튼 */}
              <label className="upload-box" style={{ display: 'block', padding: '20px 10px' }}>
                <Upload size={24} style={{ color: 'var(--primary)', marginBottom: '10px' }} />
                <span style={{ fontSize: '0.85rem', fontWeight: 'bold', display: 'block' }}>엑셀(CSV) 파일 업로드</span>
                <span style={{ fontSize: '0.75rem', color: '#95a5a6', marginTop: '4px', display: 'block' }}>형식: 이모지, 정답(쉼표구분)</span>
                <input type="file" accept=".csv" onChange={handleCsvUpload} style={{ display: 'none' }} />
              </label>
              {csvError && <p style={{ color: 'var(--accent-pink)', fontSize: '0.8rem', marginTop: '10px', textAlign: 'center' }}>{csvError}</p>}
            </div>

            <div className="card" style={{ backgroundColor: 'rgba(108, 92, 231, 0.05)', border: '1px solid rgba(108, 92, 231, 0.1)' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '15px' }}>2단계: 게임 시작</h3>
              
              {/* 자율 풀이 모드인 경우 시간 제한 설정 UI */}
              {roomState.playStyle === 'self_paced' && (
                <div style={{ marginBottom: '20px', backgroundColor: 'white', padding: '15px', borderRadius: 'var(--border-radius-md)', border: '1px solid #dfe6e9' }}>
                  <label className="form-label" style={{ fontSize: '0.85rem', color: '#2d3436', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>
                    ⏰ 자율 풀이 시간 제한 설정
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                    {[180, 300, 600, 900, 1200, 1800].map((seconds) => {
                      const mins = seconds / 60;
                      const isSelected = roomState.timeLimit === seconds;
                      return (
                        <button
                          key={seconds}
                          type="button"
                          onClick={() => updateTimeLimit(seconds)}
                          style={{
                            border: isSelected ? '2px solid var(--primary)' : '1px solid #bdc3c7',
                            backgroundColor: isSelected ? 'rgba(108, 92, 231, 0.1)' : 'white',
                            color: isSelected ? 'var(--primary)' : '#2d3436',
                            padding: '8px 0',
                            borderRadius: '6px',
                            fontSize: '0.8rem',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            transition: 'all 0.1s'
                          }}
                        >
                          {mins}분
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 진행자 통제형인 경우 문제당 시간 제한 설정 UI */}
              {roomState.playStyle === 'host_controlled' && (
                <div style={{ marginBottom: '20px', backgroundColor: 'white', padding: '15px', borderRadius: 'var(--border-radius-md)', border: '1px solid #dfe6e9' }}>
                  <label className="form-label" style={{ fontSize: '0.85rem', color: '#2d3436', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>
                    ⏰ 문제당 시간 제한 설정
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                    {[0, 10, 15, 20, 30, 45, 60, 90].map((seconds) => {
                      const isSelected = (roomState.questionDuration ?? 0) === seconds;
                      return (
                        <button
                          key={seconds}
                          type="button"
                          onClick={() => updateQuestionDuration(seconds)}
                          style={{
                            border: isSelected ? '2px solid var(--primary)' : '1px solid #bdc3c7',
                            backgroundColor: isSelected ? 'rgba(108, 92, 231, 0.1)' : 'white',
                            color: isSelected ? 'var(--primary)' : '#2d3436',
                            padding: '8px 0',
                            borderRadius: '6px',
                            fontSize: '0.8rem',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            transition: 'all 0.1s'
                          }}
                        >
                          {seconds === 0 ? '무제한' : `${seconds}초`}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <button
                onClick={startOrientation}
                className="btn btn-outline"
                style={{ width: '100%', padding: '14px', fontSize: '1rem', marginBottom: '12px', border: '2px solid var(--primary)', color: 'var(--primary)', backgroundColor: 'transparent', fontWeight: 'bold' }}
              >
                📢 게임 오리엔테이션 시작
              </button>

              <button
                onClick={startQuiz}
                disabled={roomState.questions.length === 0}
                className="btn btn-primary"
                style={{ width: '100%', padding: '16px', fontSize: '1.1rem', opacity: roomState.questions.length === 0 ? 0.6 : 1 }}
              >
                <Play size={18} fill="white" /> 퀴즈 게임 시작하기
              </button>
              {roomState.questions.length === 0 && (
                <p style={{ fontSize: '0.75rem', color: '#7f8c8d', marginTop: '8px', textAlign: 'center' }}>⚠️ 먼저 퀴즈 문제를 업로드해 주십시오.</p>
              )}
            </div>

            <button onClick={handleExit} disabled={isDeleting} className="btn btn-pink" style={{ width: '100%', background: 'transparent', border: '1px solid var(--accent-pink)', color: 'var(--accent-pink)', boxShadow: 'none' }}>
              <Trash size={16} /> 대기실 파괴 및 취소
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. 퀴즈 진행 화면 (PLAYING)
  if (roomState.status === 'playing') {
    // 오리엔테이션 첫 단계(설명) 화면 렌더링
    if (roomState.isOrientation && roomState.orientationStep === 'explain') {
      return (
        <div className="container" style={{ maxWidth: '1200px', padding: '30px 20px', textAlign: 'center' }}>
          <div className="text-center mb-4">
            <span style={{ fontSize: '1rem', fontWeight: 'bold', color: 'var(--primary)', textTransform: 'uppercase', padding: '6px 16px', backgroundColor: 'rgba(108, 92, 231, 0.1)', borderRadius: '20px' }}>
              📢 실시간 게임 오리엔테이션
            </span>
            <h1 className="title-main" style={{ fontSize: '2.8rem', marginTop: '15px' }}>어떻게 참여하나요?</h1>
            <p className="title-sub" style={{ fontSize: '1.15rem' }}>전광판 설명을 잘 듣고 스마트폰으로 문제를 직접 풀어봅시다! 🧩</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.1fr 1fr', gap: '25px', textAlign: 'left', marginBottom: '30px', marginTop: '20px' }}>
            {/* 1. 설명 카드 */}
            <div className="card" style={{ padding: '25px', display: 'flex', flexDirection: 'column', gap: '20px', justifyContent: 'center' }}>
              <div style={{ display: 'flex', gap: '15px', alignItems: 'flex-start' }}>
                <div style={{ backgroundColor: 'rgba(108, 92, 231, 0.1)', color: 'var(--primary)', width: '38px', height: '38px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '1.2rem', minWidth: '38px' }}>1</div>
                <div>
                  <strong style={{ fontSize: '1.1rem', display: 'block', marginBottom: '4px', color: 'var(--text-dark)' }}>화면의 이모지 퀴즈 확인</strong>
                  <span style={{ fontSize: '0.9rem', color: '#7f8c8d', lineHeight: '1.5', display: 'block' }}>
                    전면에 있는 대형 스크린에 출제된 여러 개의 이모지를 보고 성경과 관련된 올바른 단어(인물/사건/지명 등)를 연상해 보세요!
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '15px', alignItems: 'flex-start' }}>
                <div style={{ backgroundColor: 'rgba(108, 92, 231, 0.1)', color: 'var(--primary)', width: '38px', height: '38px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '1.2rem', minWidth: '38px' }}>2</div>
                <div>
                  <strong style={{ fontSize: '1.1rem', display: 'block', marginBottom: '4px', color: 'var(--text-dark)' }}>내 스마트폰에 정답 입력 및 제출</strong>
                  <span style={{ fontSize: '0.9rem', color: '#7f8c8d', lineHeight: '1.5', display: 'block' }}>
                    접속한 스마트폰 브라우저 화면에서 정답 단어를 적거나(주관식) 정답 보기를 선택(객관식)하고 <strong>[제출]</strong> 버튼을 누르세요.
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '15px', alignItems: 'flex-start' }}>
                <div style={{ backgroundColor: 'rgba(108, 92, 231, 0.1)', color: 'var(--primary)', width: '38px', height: '38px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '1.2rem', minWidth: '38px' }}>3</div>
                <div>
                  <strong style={{ fontSize: '1.1rem', display: 'block', marginBottom: '4px', color: 'var(--text-dark)' }}>채점 및 추가 득점</strong>
                  <span style={{ fontSize: '0.9rem', color: '#7f8c8d', lineHeight: '1.5', display: 'block' }}>
                    진행자가 정답을 공개하면 오답/정답이 자동으로 채점됩니다. 문제를 빨리 풀거나 정답을 맞추면 보너스 점수도 획득할 수 있어요!
                  </span>
                </div>
              </div>
            </div>

            {/* 2. 모바일 화면 미리보기 (모의 스마트폰) */}
            <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', width: '100%', justifyContent: 'center' }}>
                <button
                  type="button"
                  onClick={() => setMockViewType('short_answer')}
                  style={{
                    flex: 1,
                    padding: '6px 0',
                    borderRadius: '20px',
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                    border: 'none',
                    cursor: 'pointer',
                    backgroundColor: mockViewType === 'short_answer' ? 'var(--primary)' : '#dfe6e9',
                    color: mockViewType === 'short_answer' ? 'white' : '#2d3436',
                    boxShadow: mockViewType === 'short_answer' ? 'var(--shadow-sm)' : 'none',
                    transition: 'all 0.2s'
                  }}
                >
                  ✏️ 주관식 예시
                </button>
                <button
                  type="button"
                  onClick={() => setMockViewType('multiple_choice')}
                  style={{
                    flex: 1,
                    padding: '6px 0',
                    borderRadius: '20px',
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                    border: 'none',
                    cursor: 'pointer',
                    backgroundColor: mockViewType === 'multiple_choice' ? 'var(--primary)' : '#dfe6e9',
                    color: mockViewType === 'multiple_choice' ? 'white' : '#2d3436',
                    boxShadow: mockViewType === 'multiple_choice' ? 'var(--shadow-sm)' : 'none',
                    transition: 'all 0.2s'
                  }}
                >
                  👆 객관식 예시
                </button>
              </div>

              {/* 스마트폰 목업 테두리 */}
              <div style={{
                border: '10px solid #2d3436',
                borderRadius: '32px',
                padding: '10px',
                width: '265px',
                height: '420px',
                backgroundColor: 'var(--bg-light)',
                boxShadow: 'var(--shadow-lg)',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                boxSizing: 'border-box'
              }}>
                {/* 상단 노치 */}
                <div style={{
                  width: '70px',
                  height: '12px',
                  backgroundColor: '#2d3436',
                  borderBottomLeftRadius: '8px',
                  borderBottomRightRadius: '8px',
                  position: 'absolute',
                  top: 0,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  zIndex: 2
                }}></div>

                {/* 스마트폰 화면 내부 컨텐츠 */}
                <div style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  paddingTop: '8px',
                  fontSize: '0.7rem',
                  color: '#2d3436',
                  overflow: 'hidden'
                }}>
                  {/* 상단 바 */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #dfe6e9', paddingBottom: '4px', marginBottom: '6px', fontWeight: 'bold' }}>
                    <span style={{ color: 'var(--primary)' }}>ROOM {roomState.pin}</span>
                    <span style={{ color: '#7f8c8d' }}>닉네임: 예닮이</span>
                    <span style={{ color: 'var(--primary)' }}>0점</span>
                  </div>

                  {/* 이모지 및 정보 */}
                  <div style={{ textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '4px', marginBottom: '4px' }}>
                      <span style={{ backgroundColor: 'var(--accent-yellow)', color: '#2d3436', padding: '1px 6px', borderRadius: '10px', fontSize: '0.6rem', fontWeight: 'bold' }}>연습문제</span>
                      <span style={{ backgroundColor: 'var(--primary)', color: 'white', padding: '1px 6px', borderRadius: '10px', fontSize: '0.6rem', fontWeight: 'bold' }}>연습</span>
                    </div>

                    <div style={{ fontSize: '0.65rem', color: '#7f8c8d', marginBottom: '4px' }}>
                      {mockViewType === 'short_answer' ? "이모티콘을 보고 답을 쓰세요!" : "보기를 터치해서 선택해 주세요"}
                    </div>

                    {mockViewType === 'short_answer' ? (
                      <div style={{ fontSize: '2rem', margin: '4px 0' }}>🍎🍊🍌</div>
                    ) : (
                      <div style={{ fontSize: '2rem', margin: '4px 0' }}>🦁🐯🦒🐻</div>
                    )}

                    {/* 카드 내용 */}
                    <div style={{
                      backgroundColor: 'white',
                      border: '1px solid #dfe6e9',
                      borderRadius: '8px',
                      padding: '8px',
                      marginTop: '4px',
                      boxShadow: 'var(--shadow-sm)'
                    }}>
                      {mockViewType === 'short_answer' ? (
                        <div>
                          <div style={{ textAlign: 'left', fontWeight: 'bold', color: '#7f8c8d', marginBottom: '4px', fontSize: '0.6rem' }}>정답 입력</div>
                          <div style={{
                            border: '2px solid var(--primary)',
                            borderRadius: '6px',
                            padding: '4px',
                            fontWeight: 'bold',
                            fontSize: '0.9rem',
                            textAlign: 'center',
                            color: 'var(--primary)',
                            backgroundColor: 'rgba(108, 92, 231, 0.05)',
                            position: 'relative'
                          }}>
                            과일
                            <span style={{
                              display: 'inline-block',
                              width: '2px',
                              height: '12px',
                              backgroundColor: 'var(--primary)',
                              marginLeft: '2px',
                              verticalAlign: 'middle',
                              animation: 'pulse 1s infinite'
                            }}></span>
                          </div>
                        </div>
                      ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
                          <div style={{ backgroundColor: 'var(--primary)', color: 'white', padding: '4px 2px', borderRadius: '6px', fontWeight: 'bold', border: '1.5px solid #2d3436', textAlign: 'center', fontSize: '0.65rem' }}>
                            1. 동물 ✅
                          </div>
                          <div style={{ backgroundColor: '#95a5a6', color: 'white', padding: '4px 2px', borderRadius: '6px', fontWeight: 'bold', textAlign: 'center', fontSize: '0.65rem', opacity: 0.6 }}>
                            2. 식물
                          </div>
                          <div style={{ backgroundColor: '#3498db', color: 'white', padding: '4px 2px', borderRadius: '6px', fontWeight: 'bold', textAlign: 'center', fontSize: '0.65rem', opacity: 0.6 }}>
                            3. 바다
                          </div>
                          <div style={{ backgroundColor: '#9b59b6', color: 'white', padding: '4px 2px', borderRadius: '6px', fontWeight: 'bold', textAlign: 'center', fontSize: '0.65rem', opacity: 0.6 }}>
                            4. 하늘
                          </div>
                        </div>
                      )}

                      <button type="button" style={{
                        width: '100%',
                        backgroundColor: 'var(--primary)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '6px',
                        fontSize: '0.7rem',
                        fontWeight: 'bold',
                        marginTop: '6px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
                        position: 'relative'
                      }}>
                        전송하기
                        <div style={{
                          position: 'absolute',
                          bottom: '-12px',
                          right: '15px',
                          fontSize: '1rem',
                          animation: 'bounce 1s infinite'
                        }}>
                          👆
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* 하단 바 */}
                  <div style={{ fontSize: '0.55rem', color: '#95a5a6', textAlign: 'center', marginTop: '4px', borderTop: '1px solid #dfe6e9', paddingTop: '2px' }}>
                    ⚠️ 제출 후 마감 전까지 수정 가능
                  </div>
                </div>
              </div>
            </div>

            {/* 3. QR 입장 카드 */}
            <div className="card text-center" style={{ padding: '25px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', border: '2px dashed var(--primary)' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--primary)', display: 'block', marginBottom: '12px', fontWeight: 'bold' }}>
                📱 실시간 학생 입장용 QR 코드
              </span>
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(window.location.origin + '/#/student?pin=' + roomState.pin)}`}
                alt="Student Join QR"
                style={{ width: '180px', height: '180px', border: '1px solid #dfe6e9', padding: '6px', borderRadius: '12px', backgroundColor: 'white', boxShadow: 'var(--shadow-sm)' }}
              />
              <div style={{ marginTop: '15px' }}>
                <span style={{ fontSize: '0.75rem', color: '#7f8c8d', display: 'block' }}>방 PIN 번호</span>
                <strong style={{ fontSize: '2rem', color: 'var(--primary)', letterSpacing: '2px' }}>{roomState.pin}</strong>
              </div>
              <div style={{ marginTop: '15px', padding: '6px 16px', backgroundColor: 'rgba(46, 204, 113, 0.1)', color: 'var(--accent-green)', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold' }}>
                현재 {totalPlayers}명 입장 완료
              </div>
            </div>
          </div>

          {/* 제어 패널 */}
          <div className="card flex-row justify-between" style={{ padding: '25px 30px', backgroundColor: 'rgba(108, 92, 231, 0.05)', border: '1px solid rgba(108, 92, 231, 0.1)' }}>
            <button 
              onClick={endOrientation} 
              className="btn btn-outline" 
              style={{ border: '2px solid var(--accent-pink)', color: 'var(--accent-pink)', padding: '10px 20px', fontSize: '0.9rem' }}
            >
              🚪 오리엔테이션 종료
            </button>
            <button 
              onClick={startPracticeQuestion} 
              className="btn btn-primary" 
              style={{ padding: '14px 40px', fontSize: '1.1rem', boxShadow: 'var(--shadow-md)' }}
            >
              🚀 연습문제 풀기 시작하기
            </button>
          </div>
        </div>
      );
    }

    // 자율 풀이 모드인 경우 전용 진행 현황판 렌더링 (오리엔테이션 중이 아닐 때만)
    if (roomState.playStyle === 'self_paced' && !roomState.isOrientation) {
      const sortedPlayers = [...playersList].sort((a, b) => b.score - a.score || (b.currentQuestionIndex || 0) - (a.currentQuestionIndex || 0));
      return (
        <div className="container" style={{ maxWidth: '1000px', padding: '20px' }}>
          {/* 헤더 */}
          <div className="host-header" style={{ padding: '15px 30px', marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--primary)', textTransform: 'uppercase' }}>
                ⚡ 실시간 참여자 자율 풀이 모드 중! ({roomState.gameMode === 'team' ? '팀전' : '개인전'})
              </span>
              <h1 style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--text-dark)', marginTop: '5px' }}>
                실시간 진행 현황판
              </h1>
            </div>

            {/* 타이머 계기판 */}
            {timeLeft !== null && (
              <div style={{
                backgroundColor: timeLeft <= 30 ? 'rgba(255, 118, 117, 0.1)' : 'rgba(46, 204, 113, 0.1)',
                border: `2px solid ${timeLeft <= 30 ? 'var(--accent-pink)' : 'var(--accent-green)'}`,
                padding: '10px 24px',
                borderRadius: 'var(--border-radius-md)',
                textAlign: 'center',
                animation: timeLeft <= 30 ? 'bounce 1s infinite' : 'none'
              }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#7f8c8d', display: 'block' }}>⌛ 남은 시간</span>
                <span style={{ fontSize: '2rem', fontWeight: '900', color: timeLeft <= 30 ? 'var(--accent-pink)' : 'var(--accent-green)' }}>
                  {formatTime(timeLeft)}
                </span>
              </div>
            )}

            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '0.85rem', color: '#7f8c8d', fontWeight: 'bold', display: 'block' }}>참가 인원</span>
              <span style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--primary)' }}>
                {totalPlayers}명 접속 중
              </span>
            </div>
          </div>

          {/* 실시간 진행 현황 보드 */}
          <div className="card" style={{ padding: '30px', minHeight: '400px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '2px solid var(--bg-light)', paddingBottom: '12px' }}>
              <Award size={22} color="var(--primary)" /> 📊 실시간 순위 및 문제 풀이 진척도
            </h3>

            {sortedPlayers.length === 0 ? (
              <div style={{ padding: '80px 0', textAlign: 'center', color: '#95a5a6' }}>
                <RefreshCw className="status-waiting" size={32} style={{ animation: 'bounce 2s infinite', marginBottom: '15px' }} />
                <p style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>참가한 친구들이 아직 없습니다.</p>
                <p style={{ fontSize: '0.85rem', marginTop: '5px' }}>학생들이 스마트폰을 통해 입장하면 여기에 실시간 진척도가 보입니다.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {sortedPlayers.map((player, index) => {
                  const solvedCount = player.currentQuestionIndex || 0;
                  const totalQCount = roomState.questions.length || 1;
                  const progressPercent = Math.min(100, Math.round((solvedCount / totalQCount) * 100));
                  const isUserFinished = solvedCount >= totalQCount;

                  return (
                    <div key={player.id} className="flex-row justify-between" style={{
                      padding: '14px 20px',
                      backgroundColor: isUserFinished ? 'rgba(46, 204, 113, 0.05)' : 'white',
                      border: `1px solid ${isUserFinished ? 'var(--accent-green)' : '#dfe6e9'}`,
                      borderRadius: 'var(--border-radius-md)',
                      boxShadow: 'var(--shadow-sm)',
                      animation: 'popIn 0.3s ease-out'
                    }}>
                      {/* 순위 및 이름 */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '15px', minWidth: '180px' }}>
                        <span className="rank-badge" style={{
                          backgroundColor: index === 0 ? '#f1c40f' : index === 1 ? '#95a5a6' : index === 2 ? '#e67e22' : 'var(--primary)',
                          fontSize: '0.9rem',
                          width: '28px',
                          height: '28px',
                          minWidth: '28px'
                        }}>{index + 1}</span>
                        <div>
                          <span style={{ fontWeight: '900', fontSize: '1.1rem', color: 'var(--text-dark)' }}>{player.name}</span>
                          {roomState.gameMode === 'team' && player.team && (
                            <span style={{ marginLeft: '6px', fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 'bold' }}>[{player.team}]</span>
                          )}
                        </div>
                      </div>

                      {/* 진척도 그래프 */}
                      <div style={{ flex: 1, margin: '0 30px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ flex: 1, backgroundColor: '#dfe6e9', height: '12px', borderRadius: '10px', overflow: 'hidden', position: 'relative' }}>
                          <div style={{
                            width: `${progressPercent}%`,
                            height: '100%',
                            backgroundColor: isUserFinished ? 'var(--accent-green)' : 'var(--primary)',
                            transition: 'width 0.3s ease'
                          }} />
                        </div>
                        <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: isUserFinished ? 'var(--accent-green)' : '#7f8c8d', minWidth: '70px', textAlign: 'right' }}>
                          {solvedCount} / {totalQCount} 문항
                        </span>
                      </div>

                      {/* 현재 점수 */}
                      <div style={{ textAlign: 'right', minWidth: '80px' }}>
                        <span style={{ fontSize: '1.2rem', fontWeight: '900', color: 'var(--primary)' }}>{player.score}점</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 제어 바 */}
          <div className="card flex-row justify-between" style={{ padding: '20px', marginTop: '25px' }}>
            <button onClick={handleExit} className="btn btn-outline" style={{ border: '2px solid #bdc3c7', color: '#7f8c8d' }}>
              <Trash size={16} /> 게임 취소 및 폭파
            </button>

            <button onClick={endQuiz} className="btn btn-primary" style={{ padding: '14px 40px', fontSize: '1.1rem', backgroundColor: 'var(--accent-green)' }}>
              🏁 전체 게임 종료 및 최종 결과 보기 <ArrowRight size={18} />
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="container" style={{ maxWidth: roomState.isOrientation ? '1200px' : '900px', padding: '20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: roomState.isOrientation ? '1fr 280px' : '1fr', gap: '30px' }}>
          <div>
            {/* 헤더 */}
            <div className="host-header" style={{ padding: '15px 30px' }}>
          <div>
            <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--primary)' }}>
              지구촌 퀴즈 게임 중! ({roomState.gameMode === 'team' ? '팀전' : '개인전'})
            </span>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginTop: '5px' }}>
              <span style={{ color: 'var(--primary)', marginRight: '5px' }}>Q{roomState.currentQuestionIndex + 1}</span>
              {currentQuestion?.category && (
                <span style={{
                  backgroundColor: 'var(--accent-yellow)',
                  color: '#2d3436',
                  fontSize: '0.9rem',
                  padding: '5px 14px',
                  borderRadius: '30px',
                  fontWeight: '800',
                  boxShadow: 'var(--shadow-sm)',
                  display: 'inline-block'
                }}>
                  📂 {currentQuestion.category}
                </span>
              )}
              {currentQuestion?.book && (
                <span style={{
                  backgroundColor: 'var(--primary)',
                  color: 'white',
                  fontSize: '0.9rem',
                  padding: '5px 14px',
                  borderRadius: '30px',
                  fontWeight: '800',
                  boxShadow: 'var(--shadow-sm)',
                  display: 'inline-block'
                }}>
                  📖 {currentQuestion.book}
                </span>
              )}
            </h2>
          </div>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            {hostQuestionTimeLeft !== null && (
              <div style={{
                backgroundColor: hostQuestionTimeLeft <= 5 ? 'rgba(255, 118, 117, 0.15)' : 'rgba(108, 92, 231, 0.05)',
                border: `2px solid ${hostQuestionTimeLeft <= 5 ? 'var(--accent-pink)' : 'var(--primary)'}`,
                padding: '5px 18px',
                borderRadius: '12px',
                textAlign: 'center',
                animation: hostQuestionTimeLeft <= 5 ? 'bounce 0.5s infinite' : 'none'
              }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#7f8c8d', display: 'block' }}>⌛ 남은 시간</span>
                <span style={{ fontSize: '1.4rem', fontWeight: '900', color: hostQuestionTimeLeft <= 5 ? 'var(--accent-pink)' : 'var(--primary)' }}>
                  {hostQuestionTimeLeft}초
                </span>
              </div>
            )}
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '0.85rem', color: '#7f8c8d', fontWeight: 'bold', display: 'block' }}>제출 현황</span>
              <span style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--primary)' }}>{submittedCount} <span style={{ fontSize: '1rem', color: '#7f8c8d' }}>/ {totalPlayers}명 제출</span></span>
            </div>
          </div>
        </div>

        {/* 퀴즈 박스 */}
        <div className="card text-center" style={{ padding: '50px 30px', position: 'relative' }}>
          <div style={{ position: 'absolute', top: '15px', left: '20px', fontSize: '1rem', color: '#7f8c8d', fontWeight: 'bold' }}>
            {getQuestionTitle(currentQuestion, roomState.currentQuestionIndex, roomState.questions)} / {roomState.questions.length}
          </div>

          {currentQuestion?.isPractice && (
            <div style={{
              backgroundColor: 'rgba(108, 92, 231, 0.1)',
              border: '2px solid var(--primary)',
              color: 'var(--primary)',
              padding: '8px 16px',
              borderRadius: 'var(--border-radius-md)',
              fontWeight: 'bold',
              fontSize: '0.95rem',
              marginBottom: '20px',
              display: 'inline-block'
            }}>
              💡 연습문제 (이 문제는 점수에 반영되지 않습니다)
            </div>
          )}

          {/* 메인 빔프로젝터 스크린용 대형 카테고리 및 단원 배지 노출 */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
            {currentQuestion?.category && (
              <span style={{
                backgroundColor: 'var(--accent-yellow)',
                color: '#2d3436',
                padding: '8px 20px',
                borderRadius: '30px',
                fontSize: '1.2rem',
                fontWeight: '900',
                boxShadow: 'var(--shadow-md)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                📂 {currentQuestion.category}
              </span>
            )}
            {currentQuestion?.book && (
              <span style={{
                backgroundColor: 'var(--primary)',
                color: 'white',
                padding: '8px 20px',
                borderRadius: '30px',
                fontSize: '1.2rem',
                fontWeight: '900',
                boxShadow: 'var(--shadow-md)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                📖 {currentQuestion.book}
              </span>
            )}
          </div>
          
          {isTextQuestion(currentQuestion?.emojis) ? (
            <div style={{
              fontSize: '2.2rem',
              fontWeight: 800,
              color: 'var(--text-dark)',
              lineHeight: '1.4',
              margin: '30px auto',
              maxWidth: '800px',
              padding: '25px 20px',
              backgroundColor: 'var(--bg-light)',
              borderRadius: 'var(--border-radius-md)',
              borderLeft: '6px solid var(--primary)',
              wordBreak: 'keep-all',
              textAlign: 'center',
              boxShadow: 'var(--shadow-sm)'
            }}>
              {currentQuestion?.emojis}
            </div>
          ) : (
            <div className="emoji-display" style={{ marginTop: '10px' }}>
              {currentQuestion?.emojis}
            </div>
          )}

          {/* 객관식일 경우 대형 화면에 보기 표시 */}
          {!roomState.showAnswer && currentQuestion?.type === 'multiple_choice' && (
            <div className="options-grid" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '15px',
              maxWidth: '600px',
              margin: '20px auto 0 auto'
            }}>
              {currentQuestion.options?.map((option, idx) => (
                <div
                  key={idx}
                  className={`option-card option-${idx}`}
                  style={{
                    padding: '15px',
                    fontSize: '1.2rem',
                    fontWeight: 'bold',
                    borderRadius: 'var(--border-radius-md)',
                    color: idx === 2 || idx === 3 ? '#2d3436' : 'white'
                  }}
                >
                  {idx + 1}. {option}
                </div>
              ))}
            </div>
          )}

          {roomState.showAnswer ? (
            <div style={{
              marginTop: '30px',
              animation: 'popIn 0.3s ease-out'
            }}>
              <span style={{ fontSize: '1.1rem', color: '#7f8c8d', display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>정답 공개!</span>
              <h2 style={{ fontSize: '3rem', fontWeight: 900, color: 'var(--accent-green)', letterSpacing: '-1px' }}>
                {currentQuestion?.answer.split(',')[0]}
              </h2>
              {currentQuestion?.answer.split(',').length > 1 && (
                <span style={{ fontSize: '1rem', color: '#95a5a6', display: 'block', marginTop: '5px' }}>
                  (인정 답안: {currentQuestion.answer})
                </span>
              )}
            </div>
          ) : (
            <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div className="status-indicator status-waiting" style={{
                fontSize: '1rem',
                padding: '10px 24px',
                backgroundColor: hostQuestionTimeLeft === 0 ? 'var(--accent-pink)' : 'var(--accent-yellow)',
                color: hostQuestionTimeLeft === 0 ? 'white' : '#2d3436'
              }}>
                {hostQuestionTimeLeft === 0 ? "⏰ 시간 종료! 정답을 공개해 주세요." : "⏳ 학생들이 정답을 제출하고 있습니다!"}
              </div>
              <div style={{ width: '80%', background: '#dfe6e9', height: '8px', borderRadius: '10px', overflow: 'hidden', marginTop: '10px' }}>
                <div style={{
                  width: `${totalPlayers > 0 ? (submittedCount / totalPlayers) * 100 : 0}%`,
                  height: '100%',
                  backgroundColor: 'var(--primary)',
                  transition: 'width 0.3s ease'
                }} />
              </div>
            </div>
          )}
        </div>

        {/* 제어 바 */}
        {roomState.isOrientation ? (
          <div className="card flex-row justify-between" style={{ padding: '20px' }}>
            <button 
              onClick={endOrientation} 
              className="btn btn-outline" 
              style={{ border: '2px solid var(--accent-pink)', color: 'var(--accent-pink)', padding: '10px 20px', fontSize: '0.9rem' }}
            >
              🚪 오리엔테이션 강제 종료
            </button>
            <div className="flex-row">
              {roomState.orientationStep === 'explain' && (
                <button 
                  onClick={startPracticeQuestion} 
                  className="btn btn-primary" 
                  style={{ padding: '14px 30px', fontSize: '1.1rem' }}
                >
                  🚀 연습문제 풀기 시작
                </button>
              )}
              {roomState.orientationStep === 'practice' && (
                <button 
                  onClick={revealAnswer} 
                  className="btn btn-yellow" 
                  style={{ padding: '14px 30px', fontSize: '1.1rem' }}
                >
                  🔔 정답 확인 및 채점하기
                </button>
              )}
              {roomState.orientationStep === 'reveal' && (
                <button 
                  onClick={endOrientation} 
                  className="btn btn-primary" 
                  style={{ padding: '14px 30px', fontSize: '1.1rem', backgroundColor: 'var(--accent-green)' }}
                >
                  🏁 오리엔테이션 완료 및 대기실로 가기
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="card flex-row justify-between" style={{ padding: '20px' }}>
            <button onClick={async () => {
              if (window.confirm('정말 게임을 조기에 종료하고 지금까지의 최종 랭킹을 확인하시겠습니까?')) {
                await endQuiz();
              }
            }} className="btn btn-outline" style={{ border: '2px solid #bdc3c7', color: '#7f8c8d' }}>
              <Award size={16} /> 게임 조기 종료 및 랭킹 보기
            </button>

            <div className="flex-row">
              {!roomState.showAnswer ? (
                <button onClick={revealAnswer} className="btn btn-yellow" style={{ padding: '14px 30px', fontSize: '1.1rem' }}>
                  🔔 정답 확인 및 채점하기
                </button>
              ) : (
                isLastQuestion ? (
                  <button onClick={endQuiz} className="btn btn-primary" style={{ padding: '14px 30px', fontSize: '1.1rem', backgroundColor: 'var(--accent-green)' }}>
                    🏆 최종 점수 보러가기 <Trophy size={18} fill="white" />
                  </button>
                ) : (
                  <button onClick={nextQuestion} className="btn btn-primary" style={{ padding: '14px 30px', fontSize: '1.1rem' }}>
                    다음 문제 출제 <ArrowRight size={18} />
                  </button>
                )
              )}
            </div>
          </div>
        )}

        {/* 정답 공개 후 맞춘 사람 / 틀린 사람 실시간 리스트 대신 정답률 분석 패널 표시 */}
        {roomState.showAnswer && (() => {
          const correctCount = playersList.filter(p => p.isCorrect).length;
          const incorrectCount = totalPlayers - correctCount;
          const correctRate = totalPlayers > 0 ? Math.round((correctCount / totalPlayers) * 100) : 0;

          return (
            <div className="card text-center" style={{ padding: '30px 20px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '20px', color: '#2d3436', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                📊 이번 문제 정답률 분석
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', margin: '20px 0' }}>
                {/* 대형 백분율 텍스트 */}
                <div style={{ fontSize: '4.5rem', fontWeight: 900, color: correctRate >= 60 ? 'var(--accent-green)' : 'var(--accent-pink)', letterSpacing: '-2px', lineHeight: 1 }}>
                  {correctRate}%
                </div>
                <p style={{ fontSize: '0.95rem', color: '#7f8c8d', marginTop: '10px', fontWeight: 'bold' }}>
                  전체 {totalPlayers}명 중 {correctCount}명이 맞췄습니다!
                </p>
              </div>

              {/* 정답률 가로 바 차트 */}
              <div style={{
                width: '100%',
                maxWidth: '600px',
                margin: '20px auto 0 auto',
                backgroundColor: 'rgba(255, 118, 117, 0.1)',
                height: '24px',
                borderRadius: '12px',
                overflow: 'hidden',
                display: 'flex',
                boxShadow: 'var(--shadow-sm)'
              }}>
                {/* 정답 맞춘 부분 (초록색) */}
                <div style={{
                  width: `${correctRate}%`,
                  height: '100%',
                  backgroundColor: 'var(--accent-green)',
                  transition: 'width 0.5s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '0.8rem',
                  fontWeight: '900'
                }}>
                  {correctRate > 10 && `${correctRate}%`}
                </div>
                
                {/* 정답 못 맞춘 부분 (빨간색) */}
                <div style={{
                  width: `${100 - correctRate}%`,
                  height: '100%',
                  backgroundColor: 'var(--accent-pink)',
                  transition: 'width 0.5s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '0.8rem',
                  fontWeight: '900'
                }}>
                  {100 - correctRate > 10 && `${100 - correctRate}%`}
                </div>
              </div>

              {/* 범례 및 요약 */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '30px', marginTop: '20px', fontSize: '0.9rem', fontWeight: 'bold' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-green)' }}>
                  <span style={{ width: '12px', height: '12px', backgroundColor: 'var(--accent-green)', borderRadius: '50%', display: 'inline-block' }}></span>
                  정답자: {correctCount}명
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-pink)' }}>
                  <span style={{ width: '12px', height: '12px', backgroundColor: 'var(--accent-pink)', borderRadius: '50%', display: 'inline-block' }}></span>
                  아쉬운 사람: {incorrectCount}명
                </span>
              </div>
            </div>
          );
        })()}
          </div>

          {/* 우측: 오리엔테이션 상시 QR 코드 입장 영역 */}
          {roomState.isOrientation && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="card text-center" style={{ padding: '20px', border: '2px solid var(--primary)', position: 'sticky', top: '20px', backgroundColor: 'white' }}>
                <span style={{ fontSize: '0.85rem', color: '#7f8c8d', display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                  📢 실시간 오리엔테이션 중
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--primary)', display: 'block', marginBottom: '12px', fontWeight: 'bold' }}>
                  📱 지금 바로 스캔하여 참가!
                </span>
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(window.location.origin + '/#/student?pin=' + roomState.pin)}`}
                  alt="Student Join QR"
                  style={{ width: '160px', height: '160px', border: '1px solid #dfe6e9', padding: '5px', borderRadius: '8px', display: 'inline-block', backgroundColor: 'white' }}
                />
                <div style={{ marginTop: '15px' }}>
                  <span style={{ fontSize: '0.75rem', color: '#7f8c8d', display: 'block' }}>방 PIN 번호</span>
                  <strong style={{ fontSize: '1.8rem', color: 'var(--primary)', letterSpacing: '1px' }}>{roomState.pin}</strong>
                </div>
                <div style={{ marginTop: '15px', padding: '6px 12px', backgroundColor: 'rgba(46, 204, 113, 0.1)', color: 'var(--accent-green)', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                  참가 학생: {totalPlayers}명
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 3. 최종 점수 집계 전광판 (LEADERBOARD)
  if (roomState.status === 'leaderboard') {
    // 많이 틀린 문제 순 정렬 계산
    const questionMissedStats = (roomState.questions || []).map((q, qIndex) => {
      let wrongCount = 0;
      playersList.forEach((player) => {
        const answerInfo = player.answers?.[qIndex];
        if (!answerInfo || !answerInfo.isCorrect) {
          wrongCount++;
        }
      });
      return {
        question: q,
        qIndex,
        wrongCount
      };
    }).sort((a, b) => b.wrongCount - a.wrongCount);

    // 랭킹 정렬 및 동점자 공동 순위 부여 로직
    let displayRankList: { name: string; score: number; team?: string | null; isTeamOnly?: boolean }[] = [];

    if (roomState.gameMode === 'team') {
      // 1) 팀전 정렬 (팀 점수 기준)
      const teamScores = roomState.teams || {};
      displayRankList = Object.entries(teamScores).map(([tName, tData]) => ({
        name: tName,
        score: tData.score,
        isTeamOnly: true
      })).sort((a, b) => b.score - a.score);
    } else {
      // 2) 개인전 정렬 (개인 점수 기준)
      displayRankList = playersList.map(p => ({
        name: p.name,
        score: p.score,
        team: p.team,
        isTeamOnly: false
      })).sort((a, b) => b.score - a.score);
    }

    // 공동 순위 적용
    let currentRank = 1;
    const rankedList = displayRankList.map((item, index) => {
      if (index > 0 && item.score < displayRankList[index - 1].score) {
        currentRank = index + 1;
      }
      return { ...item, rank: currentRank };
    });

    const firstPlace = rankedList[0];
    const secondPlace = rankedList[1];
    const thirdPlace = rankedList[2];

    return (
      <div className="container" style={{ maxWidth: '1000px', padding: '30px 20px' }}>
        <div className="text-center mb-4">
          <Trophy size={48} className="status-waiting" style={{ padding: '8px', borderRadius: '50%', color: 'var(--accent-yellow)', display: 'inline-block' }} />
          <h1 className="title-main" style={{ fontSize: '2.8rem' }}>최종 점수 집계</h1>
          <p className="title-sub">오늘의 명예로운 지구촌 퀴즈 챔피언은 누구인가요? 🏆</p>
        </div>

        {/* 🏆 시상대 Podium (Top 3 가 있을 때만 렌더링) */}
        {rankedList.length > 0 && (
          <div className="podium-container">
            {/* 2위 단상 (2등 또는 1등의 동점 공동 순위 매칭) */}
            {secondPlace && (() => {
              const r = secondPlace.rank;
              const avatar = r === 1 ? '👑' : '🥈';
              const medal = r === 1 ? '🥇 1st' : '🥈 2nd';
              const stepClass = r === 1 ? 'podium-1' : 'podium-2';
              return (
                <div className="podium-col">
                  <div className="podium-name">{secondPlace.name}</div>
                  <div style={{ fontSize: '0.85rem', color: r === 1 ? '#d35400' : '#7f8c8d', fontWeight: r === 1 ? 'bold' : 'normal', marginBottom: '8px' }}>
                    {medal} ({secondPlace.score}점)
                  </div>
                  <div className={`podium-step ${stepClass}`}>
                    <div className="podium-avatar">{avatar}</div>
                    <div className="podium-rank">{r}</div>
                  </div>
                </div>
              );
            })()}

            {/* 1위 단상 (가운데 가장 크게) */}
            {firstPlace && (
              <div className="podium-col">
                <div className="podium-name" style={{ fontSize: '1.4rem', color: 'var(--primary-hover)', fontWeight: '900' }}>
                  {firstPlace.name}
                </div>
                <div style={{ fontSize: '0.95rem', color: '#d35400', fontWeight: 'bold', marginBottom: '8px' }}>🥇 1st ({firstPlace.score}점)</div>
                <div className="podium-step podium-1">
                  <div className="podium-avatar">👑</div>
                  <div className="podium-rank">1</div>
                </div>
              </div>
            )}

            {/* 3위 단상 */}
            {thirdPlace && (() => {
              const r = thirdPlace.rank;
              const avatar = r === 1 ? '👑' : r === 2 ? '🥈' : '🥉';
              const medal = r === 1 ? '🥇 1st' : r === 2 ? '🥈 2nd' : '🥉 3rd';
              const stepClass = r === 1 ? 'podium-1' : r === 2 ? 'podium-2' : 'podium-3';
              return (
                <div className="podium-col">
                  <div className="podium-name">{thirdPlace.name}</div>
                  <div style={{ fontSize: '0.85rem', color: r === 1 ? '#d35400' : '#7f8c8d', fontWeight: r === 1 ? 'bold' : 'normal', marginBottom: '8px' }}>
                    {medal} ({thirdPlace.score}점)
                  </div>
                  <div className={`podium-step ${stepClass}`}>
                    <div className="podium-avatar">{avatar}</div>
                    <div className="podium-rank">{r}</div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '30px', marginTop: '40px' }}>
          {/* 전체 순위표 */}
          <div className="card">
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '20px', borderBottom: '2px solid var(--bg-light)', paddingBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Award size={22} color="var(--primary)" /> 전체 순위표 ({roomState.gameMode === 'team' ? '팀 순위' : '개인 순위'})
            </h2>

            {rankedList.length === 0 ? (
              <p className="text-center" style={{ color: '#7f8c8d', padding: '40px 0' }}>참가 데이터가 없습니다.</p>
            ) : (
              <div className="rank-list">
                {rankedList.map((rank, index) => (
                  <div key={index} className="rank-item" style={{
                    borderLeft: rank.rank <= 3 ? `5px solid ${rank.rank === 1 ? '#f1c40f' : rank.rank === 2 ? '#bdc3c7' : '#e67e22'}` : 'none'
                  }}>
                    <span className="rank-badge" style={{
                      backgroundColor: rank.rank === 1 ? '#f1c40f' : rank.rank === 2 ? '#95a5a6' : rank.rank === 3 ? '#e67e22' : 'var(--primary)'
                    }}>{rank.rank}</span>
                    <div className="rank-name-group">
                      <span style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{rank.name}</span>
                      {rank.team && <span className="rank-team">{rank.team}</span>}
                    </div>
                    <span className="rank-score">{rank.score}점</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 실시간 점수 현황 패널 (버튼 없음) */}
          <div className="card">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '15px', color: '#2d3436' }}>
              🎯 참가자 상세 점수
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#7f8c8d', marginBottom: '20px' }}>
              참가 학생들의 개인별 상세 점수 현황입니다. 보너스 점수 부여 및 게임 종료 조작은 진행자 리모컨을 이용해 주십시오.
            </p>

            <div style={{ maxHeight: '450px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {playersList.length === 0 ? (
                <p style={{ color: '#95a5a6', fontSize: '0.9rem', textAlign: 'center', padding: '20px' }}>학생 정보가 없습니다.</p>
              ) : (
                playersList.sort((a,b) => b.score - a.score).map((player) => (
                  <div key={player.id} className="flex-row justify-between" style={{ padding: '8px 12px', border: '1px solid #dfe6e9', borderRadius: 'var(--border-radius-sm)', backgroundColor: 'var(--bg-light)' }}>
                    <div style={{ minWidth: '100px' }}>
                      <span style={{ fontWeight: 'bold', fontSize: '0.9rem', display: 'block' }}>{player.name}</span>
                      {roomState.gameMode === 'team' && <span style={{ fontSize: '0.75rem', color: '#7f8c8d' }}>{player.team}</span>}
                    </div>
                    <div className="flex-row">
                      <span style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>{player.score}점</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* 🚨 가장 많이 틀린 문제 리뷰 섹션 */}
        <div className="card" style={{ marginTop: '30px' }}>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '15px', borderBottom: '2px solid var(--bg-light)', paddingBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            🚨 많이 틀린 문제 순위 & 정답 리뷰
          </h2>
          <p style={{ fontSize: '0.85rem', color: '#7f8c8d', marginBottom: '20px' }}>
            학생들이 가장 많이 틀린 순서대로 문제를 정렬했습니다. 정답을 보며 피드백을 진행해 보세요.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '15px' }}>
            {questionMissedStats.map((item) => {
              const { question: q, qIndex, wrongCount } = item;
              const wrongPercentage = totalPlayers > 0 ? Math.round((wrongCount / totalPlayers) * 100) : 0;
              
              // 많이 틀린 정도에 따라 경고 색상 다르게 지정
              let badgeColor = '#2d3436';
              let badgeBg = 'rgba(0, 0, 0, 0.05)';
              if (wrongPercentage >= 70) {
                badgeColor = 'white';
                badgeBg = 'var(--accent-pink)';
              } else if (wrongPercentage >= 40) {
                badgeColor = '#d35400';
                badgeBg = 'rgba(230, 126, 34, 0.15)';
              }

              return (
                <div key={q.id} style={{
                  padding: '15px',
                  borderRadius: 'var(--border-radius-md)',
                  border: '1px solid #dfe6e9',
                  backgroundColor: 'white',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  boxShadow: 'var(--shadow-sm)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--primary)' }}>
                      {getQuestionTitle(q, qIndex, roomState.questions)} {q.category ? `[${q.category}]` : ''}
                    </span>
                    <span style={{
                      fontSize: '0.75rem',
                      fontWeight: 'bold',
                      padding: '3px 8px',
                      borderRadius: '12px',
                      backgroundColor: badgeBg,
                      color: badgeColor
                    }}>
                      오답률: {wrongPercentage}% ({wrongCount}명 / {totalPlayers}명)
                    </span>
                  </div>

                  <div style={{ fontSize: '1.8rem', textAlign: 'center', margin: '10px 0', letterSpacing: '4px' }}>
                    {q.emojis}
                  </div>

                  <div style={{ fontSize: '0.85rem', color: '#2d3436', borderTop: '1px dashed #dfe6e9', paddingTop: '8px' }}>
                    <strong>정답:</strong> <span style={{ color: 'var(--accent-green)', fontWeight: 'bold' }}>{q.answer}</span>
                  </div>

                  {q.book && (
                    <div style={{ fontSize: '0.75rem', color: '#7f8c8d' }}>
                      <strong>출처:</strong> {q.book}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return null;
}

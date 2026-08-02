import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useRoom, getQuestionTitle, PRACTICE_QUESTIONS } from '../hooks/useRoom';
import { Smile, Send, CheckCircle, XCircle, Trophy, RefreshCw, LogOut, Award, User, Layers } from 'lucide-react';

const playBeep = (frequency = 800, duration = 0.1) => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (e) {
    console.error('Audio play failed', e);
  }
};

const isTextQuestion = (str: string | undefined): boolean => {
  if (!str) return false;
  return /[가-힣a-zA-Z]/.test(str);
};

export default function Student() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const pin = searchParams.get('pin') || '';

  const {
    roomState,
    loading,
    error,
    joinRoom,
    submitAnswer
  } = useRoom(pin, false);

  const [name, setName] = useState('');
  const [grade, setGrade] = useState('1');
  const [pasture, setPasture] = useState('1');
  const [inputAnswer, setInputAnswer] = useState('');
  const [registerError, setRegisterError] = useState('');
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [forceEdit, setForceEdit] = useState(false);
  const isSelfPaced = !!(roomState && roomState.playStyle === 'self_paced' && !roomState.isOrientation);

  // 실시간 타이머 작동 (자율 풀이 및 진행자 통제형 개별 타이머 통합)
  useEffect(() => {
    if (roomState?.status !== 'playing') {
      setTimeLeft(null);
      return;
    }

    if (isSelfPaced && roomState.endAt) {
      const calcTime = () => {
        const remaining = Math.max(0, Math.round((roomState.endAt! - Date.now()) / 1000));
        setTimeLeft(remaining);
      };
      calcTime();
      const interval = setInterval(calcTime, 1000);
      return () => clearInterval(interval);
    } 
    
    const isHostControlledFlow = roomState.playStyle === 'host_controlled' || !!roomState.isOrientation;
    if (isHostControlledFlow && roomState.questionEndAt) {
      const calcTime = () => {
        const remaining = Math.max(0, Math.round((roomState.questionEndAt! - Date.now()) / 1000));
        setTimeLeft(remaining);
      };
      calcTime();
      const interval = setInterval(calcTime, 1000);
      return () => clearInterval(interval);
    }

    setTimeLeft(null);
  }, [roomState?.status, roomState?.playStyle, roomState?.isOrientation, roomState?.endAt, roomState?.questionEndAt, isSelfPaced]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const currentPlayer = (playerId && roomState?.players) ? roomState.players[playerId] : null;
  const hasAnswered = !!(currentPlayer && currentPlayer.lastAnswer !== null && currentPlayer.lastAnswer !== undefined && currentPlayer.lastAnswer !== '');

  const selfPacedIndex = currentPlayer?.currentQuestionIndex || 0;
  const currentQuestionIndex = isSelfPaced ? selfPacedIndex : (roomState?.currentQuestionIndex || 0);

  // 새 문제가 출제되거나 이미 제출한 정답이 있을 때 입력칸 동기화
  useEffect(() => {
    if (currentPlayer) {
      setInputAnswer(currentPlayer.lastAnswer || '');
    } else {
      setInputAnswer('');
    }
  }, [currentQuestionIndex, currentPlayer?.lastAnswer]);

  // 문제가 바뀌면 수정 강제 활성화 상태 초기화
  useEffect(() => {
    setForceEdit(false);
  }, [currentQuestionIndex]);

  // 타이머 종료 또는 진행자가 정답 공개 시 미제출 입력 내용 자동 제출
  useEffect(() => {
    const isHostControlledFlow = roomState?.playStyle === 'host_controlled' || !!roomState?.isOrientation;
    if (!roomState || roomState.status !== 'playing' || !isHostControlledFlow) {
      return;
    }

    const isTimeExpired = timeLeft === 0;
    const isAnswerRevealed = roomState.showAnswer;

    if ((isTimeExpired || isAnswerRevealed) && playerId) {
      const trimmedInput = inputAnswer.trim();
      const lastSubmitted = currentPlayer?.lastAnswer || '';
      
      if (trimmedInput && trimmedInput !== lastSubmitted) {
        submitAnswer(playerId, trimmedInput);
        setForceEdit(false);
      }
    }
  }, [timeLeft, roomState?.showAnswer, playerId, inputAnswer, currentPlayer?.lastAnswer]);

  // 남은 시간이 0초가 되면 강제 수정 모드를 비활성화하여 수정 불가 처리
  useEffect(() => {
    const isHostControlledFlow = roomState?.playStyle === 'host_controlled' || !!roomState?.isOrientation;
    if (isHostControlledFlow && timeLeft === 0) {
      setForceEdit(false);
    }
  }, [timeLeft, roomState?.playStyle, roomState?.isOrientation]);

  // 5초 이하 경고 피드백 (진동, 사운드)
  useEffect(() => {
    const isHostControlledFlow = roomState?.playStyle === 'host_controlled' || !!roomState?.isOrientation;
    if (!roomState || roomState.status !== 'playing' || !isHostControlledFlow) {
      return;
    }
    
    if (hasAnswered) {
      return;
    }

    if (timeLeft !== null) {
      if (timeLeft <= 5 && timeLeft > 0) {
        // 경고음 비프음 (A5 note)
        playBeep(880, 0.1);
        if ('vibrate' in navigator) {
          navigator.vibrate(80);
        }
      } else if (timeLeft === 0) {
        // 시간 초과 종료음 (A4 note)
        playBeep(440, 0.4);
        if ('vibrate' in navigator) {
          navigator.vibrate([150, 100, 150]);
        }
      }
    }
  }, [timeLeft, hasAnswered, roomState?.status, roomState?.playStyle, roomState?.isOrientation]);

  // 로컬에 이미 가입된 플레이어 ID가 있는지 확인하여 세션 복구
  useEffect(() => {
    if (pin) {
      const savedId = localStorage.getItem(`student_player_id_${pin}`);
      if (savedId) {
        setPlayerId(savedId);
      } else {
        // 고유 ID 생성 후 할당
        const newId = 'student_' + Math.random().toString(36).substring(2, 11);
        setPlayerId(newId);
      }
    }
  }, [pin]);

  // 방 입장 프로필 등록 처리
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setRegisterError('닉네임을 입력해 주세요.');
      return;
    }
    
    let finalTeam = '';
    if (roomState?.gameMode === 'team') {
      if (!grade || !pasture) {
        setRegisterError('학년과 목장을 선택해 주세요.');
        return;
      }
      finalTeam = `${grade}학년 ${pasture}목장`;
    }
    
    setRegisterError('');

    if (playerId && pin) {
      localStorage.setItem(`student_player_id_${pin}`, playerId);
      // 로컬 스토리지에 플레이어 이름과 팀 임시 저장 (복구용)
      localStorage.setItem(`student_player_name_${pin}`, name.trim());
      if (finalTeam) {
        localStorage.setItem(`student_player_team_${pin}`, finalTeam);
      }
      await joinRoom(playerId, name.trim(), finalTeam || null);
    }
  };

  // 자동 복구 세션 처리
  useEffect(() => {
    if (roomState && playerId && !roomState.players[playerId]) {
      // 서버 데이터베이스에는 없는데 로컬 세션 정보는 있다면 자동으로 재등록 시도
      const savedName = localStorage.getItem(`student_player_name_${pin}`);
      const savedTeam = localStorage.getItem(`student_player_team_${pin}`);
      if (savedName) {
        joinRoom(playerId, savedName, savedTeam);
      }
    }
  }, [roomState, playerId, pin]);

  // 답변 제출 처리
  const handleAnswerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputAnswer.trim() || !playerId) return;
    submitAnswer(playerId, inputAnswer.trim());
    setForceEdit(false); // 수정 후 다시 제출 시 대기 화면으로 돌려보냄
  };

  const handleLeave = () => {
    if (window.confirm('정말 방에서 나가시겠습니까?')) {
      localStorage.removeItem(`student_player_id_${pin}`);
      localStorage.removeItem(`student_player_name_${pin}`);
      localStorage.removeItem(`student_player_team_${pin}`);
      navigate('/');
    }
  };

  if (loading) {
    return (
      <div className="mobile-container" style={{ justifyContent: 'center' }}>
        <div className="text-center">
          <RefreshCw className="status-waiting" size={40} style={{ animation: 'bounce 1s infinite' }} />
          <p className="mt-4" style={{ fontWeight: 'bold' }}>퀴즈 서버 연결 중...</p>
        </div>
      </div>
    );
  }

  // 존재하지 않는 방 오류
  if (error || !roomState) {
    return (
      <div className="mobile-container" style={{ justifyContent: 'center' }}>
        <div className="card text-center">
          <XCircle size={48} style={{ color: 'var(--accent-pink)', marginBottom: '15px', display: 'inline-block' }} />
          <h2 style={{ color: 'var(--text-dark)', marginBottom: '10px', fontSize: '1.4rem', fontWeight: 900 }}>입장할 수 없습니다</h2>
          <p style={{ marginBottom: '25px', color: '#7f8c8d', fontSize: '0.95rem' }}>
            {error || 'PIN 번호가 올바르지 않거나 닫힌 방입니다.'}
          </p>
          <button onClick={() => navigate('/')} className="btn btn-primary" style={{ width: '100%' }}>홈으로 가기</button>
        </div>
      </div>
    );
  }

  const isRegistered = !!currentPlayer;

  // 1. 프로필 등록 화면 (REGISTER)
  if (!isRegistered) {
    return (
      <div className="mobile-container" style={{ justifyContent: 'center' }}>
        <div className="text-center mb-4">
          <div className="status-indicator status-playing" style={{ display: 'inline-block', fontSize: '0.85rem' }}>
            🎮 ROOM PIN : {roomState.pin}
          </div>
          <h1 className="title-main" style={{ fontSize: '2rem' }}>프로필 설정</h1>
          <p style={{ color: '#7f8c8d', fontSize: '0.9rem' }}>
            퀴즈에 참여하기 위해 이름을 작성해 주세요.
          </p>
        </div>

        <div className="card">
          <form onSubmit={handleRegister}>
            <div className="form-group">
              <label className="form-label">
                <User size={16} style={{ verticalAlign: 'middle', marginRight: '4px' }} /> 내 이름 (닉네임)
              </label>
              <input
                type="text"
                placeholder="예: 홍길동, 박예닮"
                className="form-input"
                value={name}
                onChange={(e) => setName(e.target.value.slice(0, 10))}
                required
              />
            </div>

            {roomState.gameMode === 'team' && (
              <div className="form-group">
                <label className="form-label" style={{ marginBottom: '12px' }}>
                  <Layers size={16} style={{ verticalAlign: 'middle', marginRight: '4px' }} /> 소속 학년 및 목장 선택
                </label>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  {/* 학년 선택 */}
                  <div>
                    <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#7f8c8d', display: 'block', marginBottom: '8px' }}>학년</span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {['1', '2', '3'].map((g) => (
                        <button
                          key={g}
                          type="button"
                          onClick={() => setGrade(g)}
                          style={{
                            flex: 1,
                            padding: '10px 0',
                            borderRadius: '8px',
                            border: `2px solid ${grade === g ? 'var(--primary)' : '#dfe6e9'}`,
                            backgroundColor: grade === g ? 'rgba(108, 92, 231, 0.08)' : 'white',
                            color: grade === g ? 'var(--primary)' : '#2d3436',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            fontSize: '0.85rem'
                          }}
                        >
                          {g}학년
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 목장 선택 */}
                  <div>
                    <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#7f8c8d', display: 'block', marginBottom: '8px' }}>목장</span>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                      {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setPasture(p)}
                          style={{
                            padding: '10px 0',
                            borderRadius: '8px',
                            border: `2px solid ${pasture === p ? 'var(--primary)' : '#dfe6e9'}`,
                            backgroundColor: pasture === p ? 'rgba(108, 92, 231, 0.08)' : 'white',
                            color: pasture === p ? 'var(--primary)' : '#2d3436',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            fontSize: '0.85rem'
                          }}
                        >
                          {p}목장
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {registerError && (
              <p style={{ color: 'var(--accent-pink)', fontSize: '0.85rem', marginBottom: '15px', fontWeight: 'bold', textAlign: 'center' }}>
                {registerError}
              </p>
            )}

            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '14px', fontSize: '1.1rem' }}>
              <Smile size={18} fill="white" /> 퀴즈 방 진입하기
            </button>
          </form>
        </div>

        <button onClick={() => navigate('/')} className="btn" style={{ background: 'transparent', color: '#7f8c8d', boxShadow: 'none' }}>
          뒤로 가기
        </button>
      </div>
    );
  }

  // 2. 대기실 대기 화면 (LOBBY WAIT)
  if (roomState.status === 'lobby') {
    return (
      <div className="mobile-container" style={{ justifyContent: 'space-between', padding: '40px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
          <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--primary)' }}>ROOM {roomState.pin}</span>
          <button onClick={handleLeave} style={{ background: 'none', border: 'none', color: 'var(--accent-pink)', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}>
            <LogOut size={14} /> 퇴장
          </button>
        </div>

        <div className="text-center" style={{ margin: 'auto 0' }}>
          <div style={{ fontSize: '4rem', marginBottom: '20px', animation: 'bounce 2s infinite ease-in-out' }}>🥳</div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--primary)', marginBottom: '10px' }}>대기실 입장 완료!</h2>
          <p style={{ color: '#7f8c8d', fontSize: '0.95rem', marginBottom: '30px' }}>
            진행자가 퀴즈를 시작할 때까지 잠시 대기해 주세요.
          </p>

          <div className="card" style={{ padding: '20px', backgroundColor: 'var(--bg-light)', border: '1px solid #dfe6e9' }}>
            <span style={{ fontSize: '0.85rem', color: '#7f8c8d', display: 'block', marginBottom: '5px' }}>등록 프로필 정보</span>
            <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{currentPlayer?.name}</div>
            {roomState.gameMode === 'team' && (
              <span className="status-indicator status-playing" style={{ display: 'inline-block', fontSize: '0.8rem', marginTop: '10px', padding: '4px 12px' }}>
                소속 : {currentPlayer?.team}
              </span>
            )}
          </div>
        </div>

        <div className="text-center" style={{ fontSize: '0.8rem', color: '#95a5a6' }}>
          💡 메인 스크린에 내 닉네임이 나왔는지 확인해 보세요!
        </div>
      </div>
    );
  }

  // 3. 퀴즈 진행 풀이 화면 (PLAYING)
  if (roomState.status === 'playing') {
    // 오리엔테이션 첫 단계(설명) 화면 렌더링
    if (roomState.isOrientation && roomState.orientationStep === 'explain') {
      return (
        <div className="mobile-container" style={{ justifyContent: 'center', padding: '30px 20px' }}>
          <div className="card text-center" style={{ padding: '40px 20px', border: '2px solid var(--primary)', borderRadius: 'var(--border-radius-lg)', boxShadow: 'var(--shadow-md)', backgroundColor: 'white' }}>
            <Smile size={48} className="status-waiting" style={{ margin: '0 auto 15px', color: 'var(--primary)', display: 'block' }} />
            <h2 style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--primary-hover)', marginBottom: '10px' }}>📢 오리엔테이션 진행 중</h2>
            <p style={{ color: '#2d3436', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '20px' }}>
              전면에 있는 대형 전광판 화면을 보고<br />
              진행자의 안내 설명을 들으세요!
            </p>
            <div style={{ padding: '12px', backgroundColor: 'var(--bg-light)', borderRadius: '6px', fontSize: '0.85rem', color: '#7f8c8d', fontWeight: 'bold' }}>
              곧 연습문제가 여기에 출제됩니다. ⏳
            </div>
          </div>
          <div className="text-center" style={{ marginTop: '20px' }}>
            <span style={{ fontSize: '0.8rem', color: '#95a5a6' }}>
              PIN: {roomState.pin} | 닉네임: {currentPlayer?.name}
            </span>
          </div>
        </div>
      );
    }

    const selfPacedIndex = currentPlayer?.currentQuestionIndex || 0;
    const isSelfPacedTimeOver = isSelfPaced && timeLeft === 0;
    const isFinished = (isSelfPaced && selfPacedIndex >= roomState.questions.length) || isSelfPacedTimeOver;

    // 만약 자율 풀이 모드에서 모든 문제를 다 풀었거나 시간이 초과되었을 때
    if (isFinished) {
      return (
        <div className="mobile-container" style={{ justifyContent: 'center' }}>
          <div className="card text-center" style={{ padding: '40px 20px', animation: 'popIn 0.3s ease-out' }}>
            <div style={{ fontSize: '4rem', marginBottom: '15px' }}>{isSelfPacedTimeOver ? '⏰' : '🎉'}</div>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 900, color: isSelfPacedTimeOver ? 'var(--accent-pink)' : 'var(--primary)', marginBottom: '10px' }}>
              {isSelfPacedTimeOver ? '제한 시간 종료!' : '모든 문제 풀이 완료!'}
            </h2>
            <p style={{ color: '#7f8c8d', fontSize: '0.95rem', marginBottom: '25px', lineHeight: '1.4' }}>
              {isSelfPacedTimeOver 
                ? '아쉽게도 설정된 제한 시간이 모두 완료되었습니다.\n진행자가 최종 점수를 발표할 때까지 잠시 대기해 주세요.' 
                : '축하합니다! 신약 성경 퀴즈를 모두 완료하셨습니다.\n진행자가 게임을 최종 종료할 때까지 잠시 대기해 주세요.'}
            </p>
            <div style={{ padding: '15px', backgroundColor: 'var(--bg-light)', borderRadius: 'var(--border-radius-md)', fontSize: '1.1rem', fontWeight: 'bold' }}>
              💰 최종 누적 점수 : <span style={{ color: 'var(--primary)', fontSize: '1.3rem', fontWeight: '900' }}>{currentPlayer?.score}점</span>
            </div>
          </div>
          <div className="text-center">
            <RefreshCw className="status-waiting" size={24} style={{ animation: 'bounce 2s infinite' }} />
            <p style={{ fontSize: '0.8rem', color: '#7f8c8d', marginTop: '10px' }}>다른 친구들이 아직 풀이 중입니다...</p>
          </div>
        </div>
      );
    }

    const currentQuestionIndex = isSelfPaced ? selfPacedIndex : roomState.currentQuestionIndex;
    const currentQuestion = roomState.isOrientation 
      ? PRACTICE_QUESTIONS[0] 
      : roomState.questions[currentQuestionIndex];

    // 정답이 공개된 경우 (SHOW ANSWER RESULT) - 기존 진행자 제어 속도 모드 전용
    if (roomState.showAnswer && !isSelfPaced) {
      const isCorrect = currentPlayer?.isCorrect;
      return (
        <div className="mobile-container" style={{ justifyContent: 'center' }}>
          <div className="card text-center" style={{ padding: '40px 20px', backgroundColor: isCorrect ? '#eafaf1' : '#fdf2f2', border: `2px solid ${isCorrect ? 'var(--accent-green)' : 'var(--accent-pink)'}` }}>
            <div style={{ fontSize: '4rem', marginBottom: '15px' }}>
              {isCorrect ? '🎯' : '😢'}
            </div>
            <h2 style={{ fontSize: '2rem', fontWeight: 900, color: isCorrect ? 'var(--accent-green)' : 'var(--accent-pink)', marginBottom: '10px' }}>
              {isCorrect ? '정답입니다!' : '아쉬워요!'}
            </h2>
            
            <p style={{ fontSize: '0.9rem', color: '#7f8c8d', marginBottom: '20px' }}>
              {isCorrect ? '훌륭합니다! 점수를 획득했습니다.' : '다음 기회에 꼭 맞춰봐요!'}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', margin: '20px 0', padding: '15px', backgroundColor: 'white', borderRadius: 'var(--border-radius-md)' }}>
              <div>
                <span style={{ fontSize: '0.8rem', color: '#7f8c8d', display: 'block' }}>진짜 정답</span>
                <span style={{ fontWeight: '900', fontSize: '1.2rem', color: 'var(--accent-green)' }}>{currentQuestion?.answer.split(',')[0]}</span>
              </div>
              <hr style={{ border: 0, borderTop: '1px solid #dfe6e9' }} />
              <div>
                <span style={{ fontSize: '0.8rem', color: '#7f8c8d', display: 'block' }}>내가 낸 답</span>
                <span style={{ fontWeight: 'bold', fontSize: '1.1rem', color: isCorrect ? 'var(--accent-green)' : 'var(--accent-pink)' }}>{currentPlayer?.lastAnswer || '(제출 안 함)'}</span>
              </div>
            </div>

            <div style={{ fontSize: '1rem', fontWeight: 'bold' }}>
              💰 내 현재 점수 : <span style={{ color: 'var(--primary)', fontSize: '1.2rem', fontWeight: '900' }}>{currentPlayer?.score}점</span>
            </div>
            {roomState.gameMode === 'team' && currentPlayer?.team && (
              <div style={{ fontSize: '0.95rem', fontWeight: 'bold', color: '#7f8c8d', marginTop: '8px', borderTop: '1px dashed #dfe6e9', paddingTop: '8px' }}>
                👥 우리 팀 ({currentPlayer.team.split(' ')[1] || currentPlayer.team}) 점수 : <span style={{ color: 'var(--accent-green)', fontSize: '1.1rem', fontWeight: '900' }}>{roomState.teams?.[currentPlayer.team]?.score || 0}점</span>
              </div>
            )}
          </div>

          <div className="text-center" style={{ color: '#7f8c8d', fontSize: '0.85rem' }}>
            ⏳ 진행자가 다음 문제를 출제할 때까지 기다려 주세요.
          </div>
        </div>
      );
    }

    // 정답을 이미 제출하고 결과를 기다리는 화면 (진행자 제어 속도 모드 전용)
    const isTimerRunning = timeLeft !== null && timeLeft > 0;
    const isTimeOver = (roomState.playStyle === 'host_controlled' || !!roomState.isOrientation) && timeLeft === 0;

    if (hasAnswered && !isSelfPaced && !isTimerRunning && !forceEdit) {
      return (
        <div className="mobile-container" style={{ justifyContent: 'center' }}>
          <div className="card text-center" style={{ padding: '40px 20px' }}>
            <CheckCircle size={48} color="var(--accent-green)" style={{ margin: '0 auto 15px', display: 'block' }} />
            <h2 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '10px' }}>답변 제출 완료!</h2>
            <p style={{ color: '#7f8c8d', fontSize: '0.9rem', marginBottom: '20px' }}>
              메인 전광판에서 정답이 공개될 때까지 대기해 주세요.
            </p>
            <div style={{ padding: '12px', backgroundColor: 'var(--bg-light)', borderRadius: 'var(--border-radius-md)', fontSize: '0.95rem', fontWeight: 'bold', marginBottom: '20px' }}>
              내가 제출한 답 : <span style={{ color: 'var(--primary)' }}>{currentPlayer?.lastAnswer}</span>
              {roomState.gameMode === 'team' && currentPlayer?.team && (
                <div style={{ fontSize: '0.85rem', color: '#7f8c8d', marginTop: '6px', borderTop: '1px dashed #bdc3c7', paddingTop: '6px' }}>
                  👥 우리 팀 ({currentPlayer.team.split(' ')[1] || currentPlayer.team}) 점수 : <strong style={{ color: 'var(--primary)' }}>{roomState.teams?.[currentPlayer.team]?.score || 0}점</strong>
                </div>
              )}
            </div>
            
            {/* 정답 수정 버튼 추가 (남은 시간이 0초가 아닐 때만 노출) */}
            {!isTimeOver && (
              <button 
                onClick={() => setForceEdit(true)} 
                className="btn btn-outline" 
                style={{ width: '100%', border: '2px solid var(--primary)' }}
              >
                정답 수정하기
              </button>
            )}
          </div>
          <div className="text-center">
            <RefreshCw className="status-waiting" size={24} style={{ animation: 'bounce 2s infinite' }} />
            <p style={{ fontSize: '0.8rem', color: '#7f8c8d', marginTop: '10px' }}>다른 친구들이 답안을 수합하는 중...</p>
          </div>
        </div>
      );
    }

    // 시간 초과되었을 때 화면 (진행자 제어 모드 전용)
    const isHostControlledTimeOver = (!isSelfPaced || !!roomState.isOrientation) && timeLeft === 0;
    if (isHostControlledTimeOver && !hasAnswered) {
      return (
        <div className="mobile-container" style={{ justifyContent: 'center' }}>
          <div className="card text-center" style={{ padding: '40px 20px', border: '2px solid var(--accent-pink)' }}>
            <XCircle size={48} color="var(--accent-pink)" style={{ margin: '0 auto 15px', display: 'block' }} />
            <h2 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '10px', color: 'var(--accent-pink)' }}>시간 초과!</h2>
            <p style={{ color: '#7f8c8d', fontSize: '0.95rem', marginBottom: '20px' }}>
              아쉽게도 제한 시간이 마감되었습니다. 다음 문제를 기대해 주세요!
            </p>
          </div>
          <div className="text-center">
            <RefreshCw className="status-waiting" size={24} style={{ animation: 'bounce 2s infinite' }} />
            <p style={{ fontSize: '0.8rem', color: '#7f8c8d', marginTop: '10px' }}>진행자가 정답을 공개할 때까지 기다려 주세요...</p>
          </div>
        </div>
      );
    }

    // 문제 풀이 주관식 폼 화면
    const isUrgent = timeLeft !== null && timeLeft <= 5 && timeLeft > 0 && (roomState.playStyle === 'host_controlled' || !!roomState.isOrientation);
    return (
      <div className={`mobile-container ${isUrgent ? 'warning-vignette' : ''}`} style={{ justifyContent: 'space-between', padding: '30px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', marginBottom: '15px' }}>
          <span className="status-indicator status-playing" style={{ fontSize: '0.85rem', margin: 0, fontWeight: '800' }}>
            {getQuestionTitle(currentQuestion, currentQuestionIndex, roomState.questions)} / {roomState.questions.length}
          </span>

          {/* 모바일 화면 상단 실시간 타이머 */}
          {timeLeft !== null && (() => {
            const isSelfPacedTimer = isSelfPaced;
            const warningThreshold = isSelfPacedTimer ? 30 : 5;
            const isWarning = timeLeft <= warningThreshold;
            
            return (
              <span 
                className={isWarning && !isSelfPaced ? 'timer-urgent' : ''}
                style={{
                  fontSize: '1rem',
                  fontWeight: '900',
                  color: isWarning ? 'var(--accent-pink)' : 'var(--accent-green)',
                  backgroundColor: isWarning ? 'rgba(255, 118, 117, 0.1)' : 'rgba(46, 204, 113, 0.1)',
                  padding: '4px 12px',
                  borderRadius: '15px',
                  border: `1px solid ${isWarning ? 'var(--accent-pink)' : 'var(--accent-green)'}`,
                  animation: isWarning && isSelfPaced ? 'bounce 1s infinite' : 'none',
                  display: 'inline-block'
                }}
              >
                ⏱️ {isSelfPacedTimer ? formatTime(timeLeft) : `${timeLeft}초`}
              </span>
            );
          })()}

          {roomState.gameMode === 'team' && currentPlayer?.team ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', fontSize: '0.8rem', fontWeight: 'bold', lineHeight: '1.3' }}>
              <span style={{ color: 'var(--primary)' }}>👥 팀 ({currentPlayer.team.split(' ')[1] || currentPlayer.team}) : {roomState.teams?.[currentPlayer.team]?.score || 0}점</span>
              <span style={{ color: '#7f8c8d', fontSize: '0.7rem' }}>🙋 내 기여 : {currentPlayer.score}점</span>
            </div>
          ) : (
            <span style={{ fontSize: '0.95rem', fontWeight: '900', color: 'var(--primary)' }}>내 누적 : {currentPlayer?.score}점</span>
          )}
        </div>

        {/* 제출 완료 상태 표시 배너 */}
        {hasAnswered && (
          <div style={{
            backgroundColor: 'rgba(46, 204, 113, 0.1)',
            color: 'var(--accent-green)',
            border: '1px solid var(--accent-green)',
            padding: '10px',
            borderRadius: 'var(--border-radius-md)',
            fontSize: '0.9rem',
            fontWeight: 'bold',
            margin: '10px auto',
            maxWidth: '320px',
            textAlign: 'center'
          }}>
            ✓ 정답 제출 완료 (시간 마감 전까지 수정 가능)
          </div>
        )}

        <div className="text-center" style={{ margin: 'auto 0' }}>
          {currentQuestion?.isPractice && (
            <div style={{
              backgroundColor: 'rgba(108, 92, 231, 0.1)',
              border: '2px solid var(--primary)',
              color: 'var(--primary)',
              padding: '8px 16px',
              borderRadius: '8px',
              fontWeight: 'bold',
              fontSize: '0.85rem',
              marginBottom: '15px',
              display: 'inline-block'
            }}>
              💡 연습문제 (점수가 반영되지 않습니다)
            </div>
          )}
          {/* 모바일 카테고리 및 성경 단원명 배지 가독성 개선 */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '15px', flexWrap: 'wrap' }}>
            {currentQuestion?.category && (
              <span style={{
                backgroundColor: 'var(--accent-yellow)',
                color: '#2d3436',
                padding: '5px 12px',
                borderRadius: '20px',
                fontSize: '0.85rem',
                fontWeight: '800',
                boxShadow: 'var(--shadow-sm)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                📂 {currentQuestion.category}
              </span>
            )}
            {currentQuestion?.book && (
              <span style={{
                backgroundColor: 'var(--primary)',
                color: 'white',
                padding: '5px 12px',
                borderRadius: '20px',
                fontSize: '0.85rem',
                fontWeight: '800',
                boxShadow: 'var(--shadow-sm)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                📖 {currentQuestion.book}
              </span>
            )}
          </div>

          <span style={{ fontSize: '0.85rem', color: '#7f8c8d', fontWeight: 'bold', display: 'block', marginBottom: '10px' }}>
            {isTextQuestion(currentQuestion?.emojis) ? "아래 질문을 읽고 정답을 제출해 주세요!" : "메인 스크린의 이모티콘을 보고 답을 쓰세요!"}
          </span>
          
          {/* 모바일 화면에도 힌트로 이모티콘/질문을 보여줌 */}
          {isTextQuestion(currentQuestion?.emojis) ? (
            <div style={{
              fontSize: '1.3rem',
              fontWeight: 800,
              color: 'var(--text-dark)',
              lineHeight: '1.4',
              margin: '20px auto',
              padding: '20px 15px',
              backgroundColor: 'var(--bg-light)',
              borderRadius: 'var(--border-radius-md)',
              borderLeft: '5px solid var(--primary)',
              wordBreak: 'keep-all',
              textAlign: 'left',
              boxShadow: 'var(--shadow-sm)'
            }}>
              {currentQuestion?.emojis}
            </div>
          ) : (
            <div className="emoji-display" style={{ fontSize: '4rem', margin: '15px 0' }}>
              {currentQuestion?.emojis}
            </div>
          )}

          <div className="card">
            {currentQuestion?.type === 'multiple_choice' ? (
              <div>
                <span className="form-label" style={{ textAlign: 'center', marginBottom: '15px', display: 'block' }}>보기를 터치해서 선택해 주세요</span>
                <div className="options-grid">
                  {currentQuestion.options?.map((option, idx) => {
                    const isSelected = inputAnswer === option;
                    return (
                      <div
                        key={idx}
                        className={`option-card option-${idx} ${isSelected ? 'option-selected' : ''}`}
                        onClick={() => setInputAnswer(option)}
                        style={{
                          opacity: inputAnswer && !isSelected ? 0.6 : 1,
                          transform: isSelected ? 'scale(1.05)' : 'none',
                          border: isSelected ? '3px solid #2d3436' : '3px solid transparent',
                          transition: 'all 0.2s ease',
                          padding: '18px',
                          fontSize: '1.1rem',
                          fontWeight: 'bold',
                          color: idx === 2 || idx === 3 ? '#2d3436' : 'white'
                        }}
                      >
                        {idx + 1}. {option}
                      </div>
                    );
                  })}
                </div>
                
                <button
                  type="button"
                  onClick={() => {
                    if (inputAnswer && playerId) {
                      submitAnswer(playerId, inputAnswer);
                      setForceEdit(false); // 수정 후 다시 제출 시 대기 화면으로 돌려보냄
                    }
                  }}
                  disabled={!inputAnswer || inputAnswer === (currentPlayer?.lastAnswer || '')}
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '14px', fontSize: '1.1rem', marginTop: '20px' }}
                >
                  <Send size={16} /> {hasAnswered ? '정답 수정하기' : '정답 전송하기'}
                </button>
              </div>
            ) : (
              <form onSubmit={handleAnswerSubmit}>
                <div className="form-group">
                  <label className="form-label" style={{ textAlign: 'left' }}>정답 입력</label>
                  <input
                    type="text"
                    placeholder="정답을 띄어쓰기 없이 정확히 기입"
                    className="form-input"
                    value={inputAnswer}
                    onChange={(e) => setInputAnswer(e.target.value.replace(/\s+/g, ''))} // 띄어쓰기 입력 원천 차단으로 가이드
                    required
                    style={{ textAlign: 'center', fontSize: '1.2rem', fontWeight: 'bold' }}
                  />
                </div>
                <button 
                  type="submit" 
                  disabled={!inputAnswer.trim() || inputAnswer.trim() === (currentPlayer?.lastAnswer || '')}
                  className="btn btn-primary" 
                  style={{ width: '100%', padding: '14px', fontSize: '1.1rem' }}
                >
                  <Send size={16} /> {hasAnswered ? '정답 수정하기' : '정답 전송하기'}
                </button>
              </form>
            )}
          </div>
        </div>

        <div className="text-center" style={{ fontSize: '0.75rem', color: '#95a5a6' }}>
          ⚠️ 시간 마감 전까지는 언제든 정답을 수정하고 다시 제출할 수 있습니다.
        </div>
      </div>
    );
  }

  // 4. 최종 결과 집계 종료 화면 (LEADERBOARD)
  if (roomState.status === 'leaderboard') {
    // 본인의 석차 구하기 (공동 순위 대응)
    const sortedPlayers = Object.values(roomState.players || {})
      .sort((a, b) => b.score - a.score);
    
    let currentRank = 1;
    const rankedPlayers = sortedPlayers.map((p, index) => {
      if (index > 0 && p.score < sortedPlayers[index - 1].score) {
        currentRank = index + 1;
      }
      return { ...p, rank: currentRank };
    });

    const myRankData = rankedPlayers.find(p => p.id === playerId);
    const myRank = myRankData ? myRankData.rank : 0;
    const totalPlayersCount = sortedPlayers.length;

    // 자율 풀이 상세 결과 계산
    const totalQuestions = roomState.questions?.length || 0;
    const myAnswers = currentPlayer?.answers || {};
    let correctCount = 0;
    
    if (roomState.questions) {
      roomState.questions.forEach((_, qIndex) => {
        if (myAnswers[qIndex]?.isCorrect) {
          correctCount++;
        }
      });
    }

    // 팀 랭킹 순위 계산 (동점 공동 순위 지원)
    let myTeamRank = 0;
    let totalTeamsCount = 0;
    let myTeamScore = 0;
    if (roomState.gameMode === 'team' && currentPlayer?.team) {
      const teamScores = roomState.teams || {};
      const sortedTeams = Object.entries(teamScores)
        .map(([tName, tData]) => ({ name: tName, score: tData.score }))
        .sort((a, b) => b.score - a.score);
      
      let currentTeamRank = 1;
      const rankedTeams = sortedTeams.map((t, index) => {
        if (index > 0 && t.score < sortedTeams[index - 1].score) {
          currentTeamRank = index + 1;
        }
        return { ...t, rank: currentTeamRank };
      });

      const myTeamData = rankedTeams.find(t => t.name === currentPlayer.team);
      myTeamRank = myTeamData ? myTeamData.rank : 0;
      totalTeamsCount = rankedTeams.length;
      myTeamScore = myTeamData ? myTeamData.score : 0;
    }

    return (
      <div className="mobile-container" style={{ justifyContent: 'center' }}>
        <div className="card text-center" style={{ padding: '40px 20px', border: '3px solid var(--accent-yellow)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '-10px', right: '-10px', width: '60px', height: '60px', backgroundColor: 'var(--accent-yellow)', transform: 'rotate(45deg)' }} />
          
          <Trophy size={48} color="var(--accent-yellow)" style={{ margin: '0 auto 15px', display: 'block' }} />
          
          <span style={{ fontSize: '0.85rem', color: '#7f8c8d', display: 'block', fontWeight: 'bold' }}>🏁 퀴즈 게임 종료</span>
          <h1 className="title-main" style={{ fontSize: '2.2rem', color: 'var(--primary-hover)', marginTop: '5px' }}>수고하셨습니다!</h1>
          
          {roomState.gameMode === 'team' && currentPlayer?.team ? (
            // 팀전: 팀 성적을 대표 카드로 노출
            <div style={{ margin: '25px 0', padding: '20px', backgroundColor: 'rgba(108, 92, 231, 0.05)', borderRadius: 'var(--border-radius-lg)', border: '1px solid rgba(108, 92, 231, 0.15)' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--primary)', display: 'block', fontWeight: 'bold', marginBottom: '8px' }}>
                👥 우리 팀 성적 ({currentPlayer.team})
              </span>
              <div style={{ fontSize: '2.4rem', fontWeight: '900', color: 'var(--primary)' }}>
                {myTeamRank} <span style={{ fontSize: '1.2rem', color: '#2d3436', fontWeight: 'bold' }}>/ {totalTeamsCount}위</span>
              </div>
              <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#2d3436', marginTop: '6px' }}>
                팀 총점 : <span style={{ color: 'var(--accent-green)', fontSize: '1.3rem', fontWeight: '900' }}>{myTeamScore}점</span>
              </div>
              <hr style={{ border: 0, borderTop: '1px dashed #bdc3c7', margin: '15px 0' }} />
              <span style={{ fontSize: '0.8rem', color: '#7f8c8d', display: 'block', marginBottom: '4px' }}>내 개인 성적</span>
              <div style={{ fontSize: '0.95rem', fontWeight: 'bold', color: '#2d3436' }}>
                개인 획득 점수 : <span style={{ color: 'var(--primary)' }}>{currentPlayer.score}점</span> (개인 {myRank}위)
              </div>
            </div>
          ) : (
            // 개인전: 개인 성적 카드 노출
            <div style={{ margin: '30px 0', padding: '20px', backgroundColor: 'var(--bg-light)', borderRadius: 'var(--border-radius-lg)' }}>
              <span style={{ fontSize: '0.85rem', color: '#7f8c8d', display: 'block', marginBottom: '5px' }}>내 랭킹 결과</span>
              <div style={{ fontSize: '2.5rem', fontWeight: '900', color: 'var(--primary)' }}>
                {myRank} <span style={{ fontSize: '1.2rem', color: '#2d3436', fontWeight: 'bold' }}>/ {totalPlayersCount}위</span>
              </div>
              <span style={{ fontSize: '0.8rem', color: '#7f8c8d', display: 'block', marginTop: '5px' }}>
                총 참여 {totalPlayersCount}명 중 {myRank}등 달성!
              </span>
            </div>
          )}

          {!currentPlayer?.team && (
            <div style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '10px' }}>
              나의 최종 획득 점수 : <span style={{ color: 'var(--accent-green)', fontSize: '1.3rem', fontWeight: '900' }}>{currentPlayer?.score}점</span>
            </div>
          )}
        </div>

        {isSelfPaced && (
          <div className="card" style={{ padding: '25px 20px', border: '1px solid #dfe6e9', marginTop: '20px', textAlign: 'left', backgroundColor: 'white' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '15px', color: 'var(--text-dark)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              📊 나의 상세 풀이 결과
            </h3>
            
            <div style={{ padding: '15px', backgroundColor: 'var(--bg-light)', borderRadius: 'var(--border-radius-md)', marginBottom: '20px', textAlign: 'center' }}>
              <div style={{ fontSize: '1rem', fontWeight: 'bold', color: '#2d3436' }}>
                맞춘 문제 : <span style={{ color: 'var(--primary)', fontSize: '1.5rem', fontWeight: '900' }}>{correctCount}</span> / {totalQuestions}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#7f8c8d', marginTop: '4px' }}>
                (정답률: {totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0}%)
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '350px', overflowY: 'auto', paddingRight: '4px' }}>
              {(roomState.questions || []).map((q, qIndex) => {
                const answerInfo = myAnswers[qIndex];
                const hasAnswered = !!answerInfo;
                const isCorrect = hasAnswered && answerInfo.isCorrect;
                
                let statusBg = 'rgba(255, 118, 117, 0.05)';
                let statusBorder = '1px solid rgba(255, 118, 117, 0.2)';
                if (!hasAnswered) {
                  statusBg = '#f8f9fa';
                  statusBorder = '1px solid #e9ecef';
                } else if (isCorrect) {
                  statusBg = 'rgba(46, 204, 113, 0.05)';
                  statusBorder = '1px solid rgba(46, 204, 113, 0.2)';
                }

                return (
                  <div key={q.id} style={{
                    padding: '12px 15px',
                    borderRadius: 'var(--border-radius-sm)',
                    backgroundColor: statusBg,
                    border: statusBorder,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#7f8c8d' }}>
                        {getQuestionTitle(q, qIndex, roomState.questions)}
                      </span>
                      {hasAnswered ? (
                        isCorrect ? (
                          <span style={{ color: '#2ecc71', fontWeight: 'bold', fontSize: '0.85rem' }}>✅ 정답!</span>
                        ) : (
                          <span style={{ color: '#e74c3c', fontWeight: 'bold', fontSize: '0.85rem' }}>❌ 오답</span>
                        )
                      ) : (
                        <span style={{ color: '#95a5a6', fontWeight: 'bold', fontSize: '0.85rem' }}>⏳ 미제출 (시간 초과)</span>
                      )}
                    </div>
                    
                    <div style={{ fontSize: '1.4rem', margin: '4px 0', letterSpacing: '2px' }}>
                      {q.emojis}
                    </div>

                    <div style={{ fontSize: '0.85rem', color: '#2d3436' }}>
                      <strong>내가 제출한 답:</strong> {hasAnswered ? (answerInfo.submitted || '(공백)') : '-'}
                    </div>

                    {(!isCorrect || !hasAnswered) && (
                      <div style={{ fontSize: '0.85rem', color: '#e74c3c', marginTop: '2px' }}>
                        <strong>실제 정답:</strong> {q.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <button
          onClick={() => {
            localStorage.removeItem(`student_player_id_${pin}`);
            localStorage.removeItem(`student_player_name_${pin}`);
            localStorage.removeItem(`student_player_team_${pin}`);
            navigate('/');
          }}
          className="btn btn-outline"
          style={{ width: '100%', border: '2px solid var(--primary)' }}
        >
          <Award size={16} /> 대기실 퇴장 및 처음으로
        </button>
      </div>
    );
  }

  return null;
}

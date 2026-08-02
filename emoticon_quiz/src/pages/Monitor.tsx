import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useRoom, getQuestionTitle } from '../hooks/useRoom';
import { 
  Users, Play, Plus, Minus, ArrowRight, Trophy, 
  RefreshCw, XCircle, ShieldAlert
} from 'lucide-react';

const isTextQuestion = (str: string | undefined): boolean => {
  if (!str) return false;
  return /[가-힣a-zA-Z]/.test(str);
};

const assignRanks = <T extends { score: number }>(list: T[]): (T & { rank: number })[] => {
  let currentRank = 1;
  return list.map((item, index) => {
    if (index > 0 && item.score < list[index - 1].score) {
      currentRank = index + 1;
    }
    return { ...item, rank: currentRank };
  });
};

export default function Monitor() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const pin = searchParams.get('pin') || '';

  const {
    roomState,
    loading,
    error,
    startQuiz,
    startOrientation,
    startPracticeQuestion,
    endOrientation,
    nextQuestion,
    revealAnswer,
    endQuiz,
    adjustPlayerScore,
    deleteRoom
  } = useRoom(pin, true);

  const [hostQuestionTimeLeft, setHostQuestionTimeLeft] = useState<number | null>(null);
  const [showRankings, setShowRankings] = useState(false);

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

  const handleExit = async () => {
    const isOri = !!roomState?.isOrientation;
    const confirmMsg = isOri 
      ? '정말 오리엔테이션을 종료하고 모니터 페이지를 나가시겠습니까?\n진행자 화면도 함께 대기 화면으로 복구됩니다.' 
      : '정말 모니터 페이지를 나가시겠습니까? 진행 중인 퀴즈 방은 폭파되지 않고 계속 유지됩니다.';

    if (window.confirm(confirmMsg)) {
      if (isOri) {
        await endOrientation();
      }
      navigate('/');
    }
  };

  // 실시간 자동 보너스 계산 및 부여 함수 (리모콘용)
  const applyAutoBonus = (type: 'most_players' | 'fewest_players' | 'most_balanced' | 'fastest_average') => {
    if (!roomState || !roomState.players) return;
    
    const players = Object.values(roomState.players);
    if (players.length === 0) {
      alert('참가한 학생이 없습니다.');
      return;
    }

    // 목장(팀)별로 학생 그룹화
    const teamGroups: Record<string, typeof players> = {};
    players.forEach(p => {
      if (p.team) {
        if (!teamGroups[p.team]) teamGroups[p.team] = [];
        teamGroups[p.team].push(p);
      }
    });

    const teamNames = Object.keys(teamGroups);
    if (teamNames.length === 0) {
      alert('등록된 목장(팀)이 없습니다.');
      return;
    }

    let winningTeams: string[] = [];
    let reason = '';

    if (type === 'most_players') {
      // 1. 최다 접속 목장 (다다익선)
      let maxCount = -1;
      teamNames.forEach(tName => {
        const count = teamGroups[tName].length;
        if (count > maxCount) {
          maxCount = count;
          winningTeams = [tName];
        } else if (count === maxCount) {
          winningTeams.push(tName);
        }
      });
      reason = `최다 접속 목장 (${maxCount}명)`;
    } else if (type === 'fewest_players') {
      // 2. 최소 접속 목장 (소수정예)
      let minCount = Infinity;
      teamNames.forEach(tName => {
        const count = teamGroups[tName].length;
        if (count < minCount && count > 0) {
          minCount = count;
          winningTeams = [tName];
        } else if (count === minCount) {
          winningTeams.push(tName);
        }
      });
      reason = `최소 접속 목장 (${minCount}명)`;
    } else if (type === 'most_balanced') {
      // 3. 동반성장 (학생 점수의 표준편차가 가장 작은 팀, 단 2명 이상 접속팀 기준)
      let minStdDev = Infinity;
      
      teamNames.forEach(tName => {
        const teamPlayers = teamGroups[tName];
        if (teamPlayers.length < 2) return; // 1명이면 편차가 0이라 최소 2명 이상인 팀만 대상

        const scores = teamPlayers.map(p => p.score || 0);
        const sum = scores.reduce((s, v) => s + v, 0);
        const mean = sum / scores.length;
        const variance = scores.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / scores.length;
        const stdDev = Math.sqrt(variance);

        if (stdDev < minStdDev) {
          minStdDev = stdDev;
          winningTeams = [tName];
        } else if (stdDev === minStdDev) {
          winningTeams.push(tName);
        }
      });
      
      if (winningTeams.length === 0) {
        alert('동반성장 보너스는 2명 이상 참가한 목장이 있어야 계산 가능합니다.');
        return;
      }
      reason = `동반성장 목장 (점수 표준편차: ${minStdDev.toFixed(1)})`;
    } else if (type === 'fastest_average') {
      // 4. 평균 답변 제출 최속 목장 (제출 기록이 1회 이상 있는 팀 기준)
      let minAverageDuration = Infinity;

      teamNames.forEach(tName => {
        const teamPlayers = teamGroups[tName];
        let totalDuration = 0;
        let totalCount = 0;

        teamPlayers.forEach(p => {
          totalDuration += p.totalSubmitDuration || 0;
          totalCount += p.submitCount || 0;
        });

        if (totalCount > 0) {
          const avgDuration = totalDuration / totalCount;
          if (avgDuration < minAverageDuration) {
            minAverageDuration = avgDuration;
            winningTeams = [tName];
          } else if (avgDuration === minAverageDuration) {
            winningTeams.push(tName);
          }
        }
      });

      if (winningTeams.length === 0) {
        alert('답변 제출 기록이 있는 목장이 없습니다.');
        return;
      }
      reason = `평균 제출속도 최속 목장 (평균 ${(minAverageDuration / 1000).toFixed(2)}초)`;
    }

    if (winningTeams.length === 0) return;

    const winningTeamsStr = winningTeams.join(', ');
    const confirmMessage = `[자동 보너스 대상 산출 완료]\n\n대상 목장: ${winningTeamsStr}\n선정 사유: ${reason}\n\n이 목장(들)에 각각 +15점의 보너스 점수를 부여하시겠습니까?\n(팀 점수 반영을 위해 각 팀 소속 에이스들의 개인 점수를 조정합니다.)`;
    
    if (window.confirm(confirmMessage)) {
      winningTeams.forEach(tName => {
        const teamPlayers = [...teamGroups[tName]];
        // 점수 내림차순 정렬 (상위 3명에게 나눠서 점수 부여)
        teamPlayers.sort((a, b) => b.score - a.score);

        const n = teamPlayers.length;
        if (n >= 3) {
          // 상위 3명에게 각 +5점씩 부여 (총 15점)
          adjustPlayerScore(teamPlayers[0].id, 5);
          adjustPlayerScore(teamPlayers[1].id, 5);
          adjustPlayerScore(teamPlayers[2].id, 5);
        } else if (n === 2) {
          // 2명인 경우 1등 +8, 2등 +7 (총 15점)
          adjustPlayerScore(teamPlayers[0].id, 8);
          adjustPlayerScore(teamPlayers[1].id, 7);
        } else if (n === 1) {
          // 1명인 경우 혼자 +15점
          adjustPlayerScore(teamPlayers[0].id, 15);
        }
      });
      alert(`성공적으로 ${winningTeamsStr} 목장에 보너스 점수 +15점을 부여했습니다!`);
    }
  };

  if (loading) {
    return (
      <div className="mobile-container" style={{ justifyContent: 'center' }}>
        <div className="text-center">
          <RefreshCw className="status-waiting" size={40} style={{ animation: 'bounce 1s infinite' }} />
          <p className="mt-4" style={{ fontWeight: 'bold' }}>모니터 서버 연결 중...</p>
        </div>
      </div>
    );
  }

  if (error || !roomState) {
    return (
      <div className="mobile-container" style={{ justifyContent: 'center' }}>
        <div className="card text-center">
          <XCircle size={48} style={{ color: 'var(--accent-pink)', marginBottom: '15px', display: 'inline-block' }} />
          <h2 style={{ color: 'var(--text-dark)', marginBottom: '10px', fontSize: '1.4rem', fontWeight: 900 }}>방을 찾을 수 없습니다</h2>
          <p style={{ marginBottom: '25px', color: '#7f8c8d', fontSize: '0.95rem' }}>
            {error || 'PIN 번호가 올바르지 않거나 닫힌 방입니다.'}
          </p>
          <button onClick={() => navigate('/')} className="btn btn-primary" style={{ width: '100%' }}>홈으로 가기</button>
        </div>
      </div>
    );
  }

  const playersList = Object.values(roomState.players || {});
  const totalPlayers = playersList.length;
  const submittedCount = playersList.filter(p => p.lastAnswer !== null && p.lastAnswer !== undefined && p.lastAnswer !== '').length;

  const currentQuestion = roomState.questions[roomState.currentQuestionIndex];
  const isLastQuestion = roomState.currentQuestionIndex === roomState.questions.length - 1;

  // 1. 대기실 화면 (LOBBY)
  if (roomState.status === 'lobby') {
    return (
      <div className="mobile-container" style={{ justifyContent: 'space-between', padding: '20px' }}>
        <div>
          <div className="flex-row justify-between" style={{ borderBottom: '1px solid #dfe6e9', paddingBottom: '10px', marginBottom: '15px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--primary)' }}>ROOM PIN: {roomState.pin}</span>
            <span style={{ fontSize: '0.85rem', color: '#7f8c8d', fontWeight: 'bold' }}>모바일 리모컨</span>
          </div>

          <h1 style={{ fontSize: '1.4rem', fontWeight: 900, marginBottom: '5px' }}>대기실 모니터링</h1>
          <p style={{ fontSize: '0.85rem', color: '#7f8c8d', marginBottom: '15px' }}>
            학생들이 스크린을 보고 접속 중입니다.
          </p>

          <div className="card" style={{ padding: '15px', backgroundColor: 'var(--bg-light)', marginBottom: '15px' }}>
            <div style={{ fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '8px' }}>
              참가자 현황 ({totalPlayers}명)
            </div>
            {playersList.length === 0 ? (
              <p style={{ fontSize: '0.85rem', color: '#95a5a6', textAlign: 'center', padding: '20px 0' }}>아직 접속한 학생이 없습니다.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '250px', overflowY: 'auto' }}>
                {playersList.map((player) => (
                  <div key={player.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', backgroundColor: 'white', borderRadius: '6px', border: '1px solid #dfe6e9', fontSize: '0.85rem', alignItems: 'center' }}>
                    <span style={{ fontWeight: 'bold' }}>{player.name}</span>
                    {player.team && <span style={{ backgroundColor: 'var(--primary)', color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold' }}>{player.team}</span>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {roomState.questions.length === 0 && (
            <div className="card text-center" style={{ border: '1px solid var(--accent-pink)', backgroundColor: 'rgba(255,118,117,0.05)', padding: '15px' }}>
              <ShieldAlert size={24} style={{ color: 'var(--accent-pink)', marginBottom: '8px', display: 'inline-block' }} />
              <p style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--accent-pink)' }}>문제가 로드되지 않았습니다.</p>
              <p style={{ fontSize: '0.75rem', color: '#7f8c8d', marginTop: '4px' }}>메인 PC의 진행자 화면에서 기본 세트 또는 CSV 파일을 먼저 로드해 주십시오.</p>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', marginTop: '20px' }}>
          <button
            onClick={startOrientation}
            className="btn btn-outline"
            style={{ width: '100%', padding: '12px', fontSize: '0.95rem', border: '2px solid var(--primary)', color: 'var(--primary)', fontWeight: 'bold', backgroundColor: 'transparent' }}
          >
            📢 설명 및 오리엔테이션 시작
          </button>

          <button
            onClick={startQuiz}
            disabled={roomState.questions.length === 0}
            className="btn btn-primary"
            style={{ width: '100%', padding: '14px', fontSize: '1rem', opacity: roomState.questions.length === 0 ? 0.6 : 1 }}
          >
            <Play size={16} fill="white" /> 폰으로 퀴즈 시작하기
          </button>
          
          <button onClick={handleExit} className="btn" style={{ background: 'transparent', color: '#7f8c8d', border: '1px solid #bdc3c7', boxShadow: 'none' }}>
            모니터 나가기
          </button>
        </div>
      </div>
    );
  }

  // 2. 퀴즈 진행 화면 (PLAYING)
  if (roomState.status === 'playing') {
    // 오리엔테이션 모드 리모컨 화면 렌더링
    if (roomState.isOrientation) {
      return (
        <div className="mobile-container" style={{ padding: '20px', justifyContent: 'space-between' }}>
          <div style={{ width: '100%' }}>
            <div className="text-center" style={{ borderBottom: '1px solid #dfe6e9', paddingBottom: '12px', marginBottom: '20px' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--primary)', textTransform: 'uppercase', padding: '4px 12px', backgroundColor: 'rgba(108, 92, 231, 0.1)', borderRadius: '15px' }}>
                📢 오리엔테이션 리모컨
              </span>
              <h2 style={{ fontSize: '1.4rem', fontWeight: '900', marginTop: '10px' }}>
                {roomState.orientationStep === 'explain' && "게임 방법 설명 중"}
                {roomState.orientationStep === 'practice' && "연습문제 풀이 진행 중"}
                {roomState.orientationStep === 'reveal' && "연습문제 정답 공개 중"}
              </h2>
            </div>

            {roomState.orientationStep === 'explain' && (
              <div className="card" style={{ padding: '15px', backgroundColor: 'var(--bg-light)', marginBottom: '15px', fontSize: '0.9rem', color: '#2d3436', lineHeight: '1.5' }}>
                <p>🙋 <strong>진행 안내:</strong></p>
                <p style={{ marginTop: '5px' }}>메인 PC 스크린에 띄워진 게임 오리엔테이션 슬라이드를 친구들에게 설명해 주세요.</p>
                <p style={{ marginTop: '5px' }}>아직 입장하지 못한 친구들은 화면에 표시된 <strong>QR 코드</strong>나 PIN 번호를 통해 들어올 수 있습니다.</p>
              </div>
            )}

            {roomState.orientationStep === 'practice' && (
              <div>
                <div className="card" style={{ padding: '15px', backgroundColor: 'var(--bg-light)', marginBottom: '15px', fontSize: '0.9rem', color: '#2d3436' }}>
                  <span style={{ fontSize: '0.8rem', color: '#7f8c8d', display: 'block', marginBottom: '4px' }}>연습문제 이모지</span>
                  <span style={{ fontSize: '1.8rem', display: 'block', textAlign: 'center', margin: '8px 0' }}>🍎🍊🍌</span>
                  <span style={{ fontSize: '0.85rem', color: '#7f8c8d', display: 'block' }}>정답: 과일</span>
                </div>
                
                <div className="card text-center" style={{ padding: '15px', border: '1px solid var(--primary)', backgroundColor: 'rgba(108, 92, 231, 0.03)' }}>
                  <span style={{ fontSize: '0.85rem', color: '#7f8c8d' }}>현재 제출 현황</span>
                  <div style={{ fontSize: '1.6rem', fontWeight: '900', color: 'var(--primary)', margin: '5px 0' }}>
                    {submittedCount} / {totalPlayers}명 제출
                  </div>
                </div>
              </div>
            )}

            {roomState.orientationStep === 'reveal' && (
              <div className="card" style={{ padding: '15px', backgroundColor: 'var(--bg-light)', marginBottom: '15px', fontSize: '0.9rem', color: '#2d3436' }}>
                <span style={{ fontSize: '0.8rem', color: '#7f8c8d', display: 'block', marginBottom: '4px' }}>연습문제 결과</span>
                <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--accent-green)', display: 'block', textAlign: 'center', margin: '8px 0' }}>
                  정답: 과일 🍎🍊🍌
                </span>
                <p style={{ fontSize: '0.85rem', color: '#7f8c8d', textAlign: 'center' }}>
                  아이들이 본인의 스마트폰 화면으로 정오답 결과를 확인하고 있습니다.
                </p>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', marginTop: '20px' }}>
            {roomState.orientationStep === 'explain' && (
              <button 
                onClick={startPracticeQuestion} 
                className="btn btn-primary" 
                style={{ width: '100%', padding: '14px', fontSize: '1rem' }}
              >
                🚀 연습문제 시작하기
              </button>
            )}

            {roomState.orientationStep === 'practice' && (
              <button 
                onClick={revealAnswer} 
                className="btn btn-yellow" 
                style={{ width: '100%', padding: '14px', fontSize: '1rem' }}
              >
                🔔 정답 공개 및 채점하기
              </button>
            )}

            {roomState.orientationStep === 'reveal' && (
              <button 
                onClick={endOrientation} 
                className="btn btn-primary" 
                style={{ width: '100%', padding: '14px', fontSize: '1rem', backgroundColor: 'var(--accent-green)' }}
              >
                🏁 오리엔테이션 완료 (대기실 복귀)
              </button>
            )}

            <button 
              onClick={endOrientation} 
              className="btn btn-outline" 
              style={{ width: '100%', padding: '10px', border: '1px solid var(--accent-pink)', color: 'var(--accent-pink)', background: 'transparent' }}
            >
              🚪 오리엔테이션 중단
            </button>
          </div>
        </div>
      );
    }

    // 자율 풀이 모드 모니터 화면
    if (roomState.playStyle === 'self_paced' && !roomState.isOrientation) {
      const sortedPlayers = [...playersList].sort((a, b) => b.score - a.score || (b.currentQuestionIndex || 0) - (a.currentQuestionIndex || 0));
      const rankedPlayers = assignRanks(sortedPlayers);
      return (
        <div className="mobile-container" style={{ justifyContent: 'space-between', padding: '20px' }}>
          <div style={{ width: '100%' }}>
            <div className="flex-row justify-between" style={{ borderBottom: '1px solid #dfe6e9', paddingBottom: '10px', marginBottom: '15px' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--primary)' }}>ROOM PIN: {roomState.pin}</span>
              <span style={{ fontSize: '0.85rem', color: 'var(--accent-green)', fontWeight: 'bold' }}>자율 풀이 진행 중</span>
            </div>

            <h1 style={{ fontSize: '1.3rem', fontWeight: 900, marginBottom: '15px' }}>실시간 참가자 현황</h1>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '420px', overflowY: 'auto' }}>
              {rankedPlayers.map((player) => {
                const solvedCount = player.currentQuestionIndex || 0;
                const totalQCount = roomState.questions.length || 1;
                return (
                  <div key={player.id} style={{ padding: '10px 14px', backgroundColor: 'white', border: '1px solid #dfe6e9', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#7f8c8d' }}>{player.rank}위</span>
                      <div>
                        <span style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{player.name}</span>
                        {player.team && <span style={{ fontSize: '0.75rem', color: 'var(--primary)', marginLeft: '4px' }}>[{player.team}]</span>}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', fontSize: '0.85rem' }}>
                      <span style={{ fontWeight: 'bold', color: 'var(--primary)', marginRight: '8px' }}>{player.score}점</span>
                      <span style={{ fontSize: '0.75rem', color: '#7f8c8d' }}>{solvedCount}/{totalQCount}문항</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ width: '100%', marginTop: '20px' }}>
            <button onClick={endQuiz} className="btn btn-primary" style={{ width: '100%', backgroundColor: 'var(--accent-green)', padding: '14px' }}>
              🏁 폰으로 최종 결과 보기
            </button>
            <button onClick={handleExit} className="btn" style={{ background: 'transparent', color: '#7f8c8d', border: 'none', boxShadow: 'none', width: '100%', marginTop: '10px' }}>
              모니터 나가기
            </button>
          </div>
        </div>
      );
    }

    // 진행자 통제형 모드 모니터 화면
    return (
      <div className="mobile-container" style={{ padding: '15px', justifyContent: 'space-between' }}>
        <div style={{ width: '100%' }}>
          {/* 상단 간략 정보 바 */}
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #dfe6e9', paddingBottom: '8px', marginBottom: '10px', fontSize: '0.8rem', alignItems: 'center' }}>
            <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>{getQuestionTitle(currentQuestion, roomState.currentQuestionIndex, roomState.questions)} / {roomState.questions.length}</span>
            {hostQuestionTimeLeft !== null && (
              <span style={{ fontWeight: '900', color: hostQuestionTimeLeft <= 5 ? 'var(--accent-pink)' : 'var(--primary)', backgroundColor: hostQuestionTimeLeft <= 5 ? 'rgba(255,118,117,0.1)' : 'rgba(108,92,231,0.05)', padding: '2px 8px', borderRadius: '10px' }}>
                ⌛ {hostQuestionTimeLeft}초 남음
              </span>
            )}
            <span style={{ color: '#7f8c8d', fontWeight: 'bold' }}>제출: {submittedCount} / {totalPlayers}명</span>
          </div>

          {/* 문제 디테일 정보 */}
          <div className="card" style={{ padding: '12px', marginBottom: '15px', borderLeft: '4px solid var(--primary)' }}>
            {currentQuestion?.isPractice && (
              <div style={{
                backgroundColor: 'rgba(108, 92, 231, 0.1)',
                border: '1px solid var(--primary)',
                color: 'var(--primary)',
                padding: '6px 12px',
                borderRadius: '6px',
                fontWeight: 'bold',
                fontSize: '0.85rem',
                marginBottom: '10px',
                textAlign: 'center'
              }}>
                💡 연습문제 (점수가 반영되지 않습니다)
              </div>
            )}
            <div style={{ display: 'flex', gap: '6px', marginBottom: '6px', flexWrap: 'wrap' }}>
              {currentQuestion?.category && <span style={{ fontSize: '0.75rem', backgroundColor: 'var(--accent-yellow)', color: '#2d3436', padding: '2px 8px', borderRadius: '10px', fontWeight: 'bold' }}>📂 {currentQuestion.category}</span>}
              {currentQuestion?.book && <span style={{ fontSize: '0.75rem', backgroundColor: 'var(--primary)', color: 'white', padding: '2px 8px', borderRadius: '10px', fontWeight: 'bold' }}>📖 {currentQuestion.book}</span>}
            </div>
            {isTextQuestion(currentQuestion?.emojis) ? (
              <div style={{
                fontSize: '1.1rem',
                fontWeight: 800,
                color: 'var(--text-dark)',
                lineHeight: '1.4',
                margin: '10px 0',
                padding: '10px 12px',
                backgroundColor: 'var(--bg-light)',
                borderRadius: 'var(--border-radius-sm)',
                borderLeft: '4px solid var(--primary)',
                wordBreak: 'keep-all',
                textAlign: 'left'
              }}>
                {currentQuestion?.emojis}
              </div>
            ) : (
              <div className="emoji-display" style={{ fontSize: '3rem', margin: '5px 0', textAlign: 'center' }}>
                {currentQuestion?.emojis}
              </div>
            )}
            <div style={{ backgroundColor: 'var(--bg-light)', padding: '8px 12px', borderRadius: '6px', marginTop: '5px' }}>
              <span style={{ fontSize: '0.75rem', color: '#7f8c8d', display: 'block', fontWeight: 'bold' }}>인정 정답 목록</span>
              <span style={{ fontSize: '0.95rem', fontWeight: '900', color: 'var(--accent-green)' }}>
                {currentQuestion?.answer}
              </span>
            </div>
          </div>

          {/* 실시간 참여자 답안 목록 */}
          <h2 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Users size={16} /> 실시간 제출 현황
          </h2>

          <div style={{ maxHeight: '230px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px', paddingRight: '4px' }}>
            {playersList.length === 0 ? (
              <p style={{ color: '#95a5a6', fontSize: '0.85rem', textAlign: 'center', padding: '20px 0' }}>대기방에 학생이 없습니다.</p>
            ) : (
              playersList.map((player) => {
                const answered = player.lastAnswer !== null && player.lastAnswer !== undefined && player.lastAnswer !== '';
                return (
                  <div key={player.id} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 12px',
                    backgroundColor: answered ? 'rgba(46, 204, 113, 0.05)' : 'white',
                    border: `1px solid ${answered ? 'rgba(46, 204, 113, 0.2)' : '#dfe6e9'}`,
                    borderRadius: '8px',
                    fontSize: '0.85rem'
                  }}>
                    <div>
                      <span style={{ fontWeight: 'bold' }}>{player.name}</span>
                      {player.team && <span style={{ fontSize: '0.75rem', color: '#7f8c8d', marginLeft: '4px' }}>({player.team})</span>}
                    </div>

                    <div>
                      {roomState.showAnswer ? (
                        <span style={{
                          fontWeight: 'bold',
                          color: player.isCorrect ? 'var(--accent-green)' : 'var(--accent-pink)',
                          fontSize: '0.8rem'
                        }}>
                          {player.isCorrect ? '⭕ 정답' : `❌ 오답 (${player.lastAnswer || '미제출'})`}
                        </span>
                      ) : (
                        answered ? (
                          <span style={{
                            fontWeight: 'bold',
                            color: 'var(--primary)',
                            backgroundColor: 'rgba(108, 92, 231, 0.08)',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '0.8rem'
                          }}>
                            ✏️ {player.lastAnswer}
                          </span>
                        ) : (
                          <span style={{
                            color: '#95a5a6',
                            fontSize: '0.75rem',
                            fontStyle: 'italic',
                            animation: 'pulse 1.5s infinite'
                          }}>
                            ⏳ 고민 중...
                          </span>
                        )
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* 실시간 등수 확인 아코디언 */}
        <div style={{ width: '100%', marginTop: '10px', border: '1px solid #dfe6e9', borderRadius: '12px', overflow: 'hidden', backgroundColor: 'white', boxShadow: 'var(--shadow-sm)' }}>
          <button 
            onClick={() => setShowRankings(!showRankings)} 
            style={{
              width: '100%',
              padding: '10px 15px',
              backgroundColor: 'rgba(108, 92, 231, 0.05)',
              border: 'none',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '0.85rem',
              color: 'var(--primary)'
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Trophy size={14} color="#f1c40f" /> 🏆 실시간 현재 등수 확인
            </span>
            <span style={{ fontSize: '0.75rem' }}>{showRankings ? '▲ 접기' : '▼ 펼치기'}</span>
          </button>
          
          {showRankings && (
            <div style={{ padding: '8px', maxHeight: '150px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '5px', borderTop: '1px solid #dfe6e9' }}>
              {playersList.length === 0 ? (
                <div style={{ padding: '10px', textAlign: 'center', color: '#95a5a6', fontSize: '0.75rem' }}>접속한 플레이어가 없습니다.</div>
              ) : (
                assignRanks([...playersList].sort((a, b) => b.score - a.score))
                  .map((player) => (
                    <div key={player.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', backgroundColor: 'var(--bg-light)', borderRadius: '6px', fontSize: '0.8rem' }}>
                      <div>
                        <span style={{ fontWeight: 'bold', color: '#7f8c8d', marginRight: '6px' }}>{player.rank}위</span>
                        <span style={{ fontWeight: 'bold' }}>{player.name}</span>
                        {player.team && <span style={{ fontSize: '0.7rem', color: 'var(--primary)', marginLeft: '4px' }}>[{player.team}]</span>}
                      </div>
                      <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>{player.score}점</span>
                    </div>
                  ))
              )}
            </div>
          )}
        </div>

        {/* 하단 리모컨 버튼 */}
        <div style={{ width: '100%', marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {!roomState.showAnswer ? (
            <button onClick={revealAnswer} className="btn btn-yellow" style={{ width: '100%', padding: '14px', fontSize: '1.05rem', fontWeight: 'bold' }}>
              🔔 정답 공개 및 채점하기
            </button>
          ) : (
            isLastQuestion ? (
              <button onClick={endQuiz} className="btn btn-primary" style={{ width: '100%', backgroundColor: 'var(--accent-green)', padding: '14px', fontSize: '1.05rem', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                🏆 최종 결과 순위 보러가기 <Trophy size={16} fill="white" />
              </button>
            ) : (
              <button onClick={nextQuestion} className="btn btn-primary" style={{ width: '100%', padding: '14px', fontSize: '1.05rem', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                다음 문제 출제 <ArrowRight size={16} />
              </button>
            )
          )}

          <button onClick={handleExit} className="btn" style={{ background: 'transparent', color: '#7f8c8d', border: 'none', boxShadow: 'none', padding: '5px' }}>
            모니터 나가기
          </button>
        </div>
      </div>
    );
  }

  // 3. 최종 결과 화면 (LEADERBOARD)
  if (roomState.status === 'leaderboard') {
    const sortedPlayers = [...playersList].sort((a, b) => b.score - a.score);
    return (
      <div className="mobile-container" style={{ padding: '15px', justifyContent: 'space-between' }}>
        <div style={{ width: '100%' }}>
          <div className="text-center mb-3">
            <Trophy size={36} color="#f1c40f" style={{ display: 'inline-block', marginBottom: '5px' }} />
            <h1 style={{ fontSize: '1.4rem', fontWeight: 900 }}>최종 모바일 집계표</h1>
            <p style={{ fontSize: '0.8rem', color: '#7f8c8d', marginBottom: '15px' }}>최종 점수를 보며 점수를 수동으로 조절할 수 있습니다.</p>
          </div>

          {roomState.gameMode === 'team' && (
            <div style={{ marginBottom: '20px', padding: '12px', border: '1px solid #dfe6e9', borderRadius: '12px', backgroundColor: '#f8f9fa' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--primary)', display: 'block', marginBottom: '10px', textAlign: 'center' }}>
                🤖 실시간 자동 보너스 정산 (각 +15점)
              </span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <button 
                  onClick={() => applyAutoBonus('most_players')}
                  className="btn btn-outline"
                  style={{ fontSize: '0.75rem', padding: '8px 6px', justifyContent: 'center', backgroundColor: 'white' }}
                >
                  👥 최다 접속
                </button>
                <button 
                  onClick={() => applyAutoBonus('fewest_players')}
                  className="btn btn-outline"
                  style={{ fontSize: '0.75rem', padding: '8px 6px', justifyContent: 'center', backgroundColor: 'white' }}
                >
                  🔍 최소 접속
                </button>
                <button 
                  onClick={() => applyAutoBonus('most_balanced')}
                  className="btn btn-outline"
                  style={{ fontSize: '0.75rem', padding: '8px 6px', justifyContent: 'center', backgroundColor: 'white' }}
                >
                  ⚖️ 동반성장
                </button>
                <button 
                  onClick={() => applyAutoBonus('fastest_average')}
                  className="btn btn-outline"
                  style={{ fontSize: '0.75rem', padding: '8px 6px', justifyContent: 'center', backgroundColor: 'white' }}
                >
                  ⚡ 평균 최속 제출
                </button>
              </div>
            </div>
          )}

          <div style={{ maxHeight: '350px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: '4px' }}>
            {assignRanks(sortedPlayers).map((player) => (
              <div key={player.id} className="flex-row justify-between" style={{ padding: '8px 12px', border: '1px solid #dfe6e9', borderRadius: '8px', backgroundColor: 'white', alignItems: 'center' }}>
                <div>
                  <span style={{ fontWeight: 'bold', color: '#7f8c8d', marginRight: '6px' }}>{player.rank}위</span>
                  <span style={{ fontWeight: 'bold' }}>{player.name}</span>
                  {player.team && <span style={{ fontSize: '0.75rem', color: 'var(--primary)', marginLeft: '4px' }}>[{player.team}]</span>}
                </div>

                <div className="flex-row" style={{ gap: '6px', alignItems: 'center' }}>
                  <span style={{ fontWeight: '900', color: 'var(--primary)', fontSize: '0.95rem', marginRight: '4px' }}>{player.score}점</span>
                  <button
                    onClick={() => adjustPlayerScore(player.id, -5)}
                    className="btn btn-outline"
                    style={{ padding: '4px', borderRadius: '50%', color: 'var(--accent-pink)', borderColor: 'var(--accent-pink)', minWidth: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Minus size={12} />
                  </button>
                  <button
                    onClick={() => adjustPlayerScore(player.id, 5)}
                    className="btn btn-outline"
                    style={{ padding: '4px', borderRadius: '50%', color: 'var(--accent-green)', borderColor: 'var(--accent-green)', minWidth: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Plus size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ width: '100%', marginTop: '20px' }}>
          <button onClick={() => {
            if (window.confirm('정말 새 게임을 설정하러 돌아가시겠습니까? 모든 룸 상태가 초기화됩니다.')) {
              deleteRoom().then(() => navigate('/'));
            }
          }} className="btn btn-primary" style={{ width: '100%', padding: '14px', backgroundColor: 'var(--accent-green)' }}>
            최종 확인 및 홈으로 가기
          </button>
        </div>
      </div>
    );
  }

  return null;
}
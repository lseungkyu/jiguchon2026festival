import { useState, useEffect, useRef } from 'react';
import { ref, set, onValue } from 'firebase/database';
import { db, isConfigured } from '../firebase';

export interface Question {
  id: number;
  emojis: string;
  answer: string;
  type: 'short_answer' | 'multiple_choice';
  options?: string[];
  book?: string;
  category?: string;
  score?: number;
  isPractice?: boolean;
}

export const PRACTICE_QUESTIONS: Question[] = [
  {
    id: -1,
    emojis: '🍎🍊🍌',
    answer: '과일',
    type: 'short_answer',
    category: '연습문제',
    book: '연습',
    score: 0,
    isPractice: true
  },
  {
    id: -2,
    emojis: '🦁🐯🦒🐻',
    answer: '동물',
    type: 'multiple_choice',
    options: ['동물', '식물', '바다', '하늘'],
    category: '연습문제',
    book: '연습',
    score: 0,
    isPractice: true
  }
];

export const getQuestionTitle = (q: Question | undefined, index: number, questions: Question[]) => {
  if (!q) return '';
  if (q.isPractice) {
    let practiceIndex = 0;
    for (let i = 0; i <= index; i++) {
      if (questions[i]?.isPractice) {
        practiceIndex++;
      }
    }
    return `연습문제 ${practiceIndex}`;
  }
  
  let realIndex = 0;
  for (let i = 0; i <= index; i++) {
    if (!questions[i]?.isPractice) {
      realIndex++;
    }
  }
  return `문제 ${realIndex}`;
};

export interface Player {
  id: string;
  name: string;
  team?: string | null;
  score: number;
  lastAnswer?: string | null;
  isCorrect?: boolean;
  currentQuestionIndex?: number;
  lastSubmitDuration?: number | null; // 이번 문제의 제출 소요 시간 (ms)
  totalSubmitDuration?: number | null; // 누적 제출 소요 시간 (ms)
  submitCount?: number | null;        // 정답을 제출한 횟수 누적
  answers?: Record<string, { submitted: string; isCorrect: boolean }>;
}

export interface Team {
  score: number;
}

export interface RoomState {
  pin: string;
  status: 'lobby' | 'playing' | 'leaderboard';
  gameMode: 'individual' | 'team';
  playStyle?: 'host_controlled' | 'self_paced';
  timeLimit?: number;
  endAt?: number | null;
  currentQuestionIndex: number;
  showAnswer: boolean;
  questions: Question[];
  teams: Record<string, Team>;
  players: Record<string, Player>;
  hostId: string;
  questionDuration?: number; // 문제당 제한 시간 (초 단위, 0 = 무제한)
  questionEndAt?: number | null;     // 현재 문제 종료 시간 타임스탬프 (ms)
  questionStartedAt?: number | null;  // 현재 문제가 시작된 시간 타임스탬프 (ms)
  includePractice?: boolean;          // 연습문제 포함 여부
  isOrientation?: boolean;            // 오리엔테이션 진행 여부
  orientationStep?: 'explain' | 'practice' | 'reveal' | null; // 오리엔테이션 단계
}

// 로컬 테스트용 브로드캐스트 채널 풀
const broadcastChannels: Record<string, BroadcastChannel> = {};

function getBroadcastChannel(pin: string): BroadcastChannel {
  if (!broadcastChannels[pin]) {
    broadcastChannels[pin] = new BroadcastChannel(`emoticon_quiz_room_${pin}`);
  }
  return broadcastChannels[pin];
}

// 두 텍스트의 유사성 비교 (공백 제거, 소문자화)
export function checkAnswerCorrectness(submitted: string, correct: string): boolean {
  if (!submitted || !correct) return false;
  const cleanSubmitted = submitted.replace(/\s+/g, '').toLowerCase();
  const cleanCorrect = correct.replace(/\s+/g, '').toLowerCase();
  
  // 쉼표로 구분된 여러 정답 처리 (예: "애플, 아이폰" 등 가능하도록)
  const correctAnswers = cleanCorrect.split(',').map(ans => ans.trim());
  return correctAnswers.includes(cleanSubmitted);
}

// 각 팀별 상위 3명의 점수를 합산하여 팀 점수를 구하는 헬퍼 함수
export function calculateTeamScores(players: Record<string, Player>): Record<string, Team> {
  const teams: Record<string, Team> = {};
  const playersByTeam: Record<string, number[]> = {};
  
  Object.values(players).forEach(player => {
    if (player.team) {
      if (!playersByTeam[player.team]) {
        playersByTeam[player.team] = [];
      }
      playersByTeam[player.team].push(player.score || 0);
    }
  });
  
  Object.entries(playersByTeam).forEach(([teamName, scores]) => {
    // 점수 내림차순 정렬
    scores.sort((a, b) => b - a);
    // 상위 3개 점수 합산
    const top3Sum = scores.slice(0, 3).reduce((sum, val) => sum + val, 0);
    teams[teamName] = { score: top3Sum };
  });
  
  return teams;
}

// undefined 값을 null로 변환하거나 제거하여 Firebase 오류를 방지하는 헬퍼 함수
function cleanUndefined(obj: any): any {
  if (obj === undefined) return null;
  if (obj === null) return null;
  if (Array.isArray(obj)) {
    return obj.map(cleanUndefined);
  }
  if (typeof obj === 'object') {
    const clean: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const val = obj[key];
        if (val !== undefined) {
          clean[key] = cleanUndefined(val);
        }
      }
    }
    return clean;
  }
  return obj;
}

export function useRoom(pin: string | undefined, isHost: boolean = false) {
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const stateRef = useRef<RoomState | null>(null);

  useEffect(() => {
    stateRef.current = roomState;
  }, [roomState]);

  useEffect(() => {
    if (!pin) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    if (isConfigured && db) {
      // 1. Firebase 실시간 연동
      const roomRef = ref(db, `rooms/${pin}`);
      
      const timeoutId = setTimeout(() => {
        setError(
          'Firebase 실시간 데이터베이스 연결이 지연되고 있습니다. 다음 사항을 확인해 주세요:\n\n' +
          '1. Firebase 콘솔에서 "Realtime Database"를 생성하셨는지 확인해 주세요.\n' +
          '2. .env 파일의 VITE_FIREBASE_DATABASE_URL 주소가 생성된 데이터베이스 주소와 일치하는지 확인해 주세요.\n' +
          '3. 데이터베이스 생성 지역이 싱가포르(asia-southeast1)인 경우, .env 파일의 URL을 싱가포르 전용 주소로 수정해 주세요.\n' +
          '4. Realtime Database의 "규칙(Rules)" 탭에서 .read와 .write가 true로 게시되었는지 확인해 주세요.'
        );
        setLoading(false);
      }, 5000);

      const unsubscribe = onValue(roomRef, (snapshot) => {
        clearTimeout(timeoutId);
        const data = snapshot.val();
        if (data) {
          // 데이터 유실 방지 기본값 세팅
          const formattedData: RoomState = {
            pin: data.pin || pin,
            status: data.status || 'lobby',
            gameMode: data.gameMode || 'individual',
            playStyle: data.playStyle || 'host_controlled',
            timeLimit: data.timeLimit || 300,
            endAt: data.endAt || null,
            currentQuestionIndex: data.currentQuestionIndex ?? 0,
            showAnswer: !!data.showAnswer,
            questions: data.questions || [],
            teams: data.teams || {},
            players: data.players || {},
            hostId: data.hostId || '',
            questionDuration: data.questionDuration ?? 0,
            questionEndAt: data.questionEndAt || null,
            questionStartedAt: data.questionStartedAt || null,
            includePractice: data.includePractice ?? true,
            isOrientation: !!data.isOrientation,
            orientationStep: data.orientationStep || null,
          };
          setRoomState(formattedData);
        } else {
          setRoomState(null);
          if (!isHost) {
            setError('존재하지 않거나 만료된 방입니다.');
          }
        }
        setLoading(false);
      }, (err) => {
        clearTimeout(timeoutId);
        console.error('Firebase DB Error:', err);
        setError('방 정보를 가져오는 중에 오류가 발생했습니다.');
        setLoading(false);
      });

      return () => {
        clearTimeout(timeoutId);
        unsubscribe();
      };
    } else {
      // 2. 데모 모드 (BroadcastChannel 및 LocalStorage 연동)
      const channel = getBroadcastChannel(pin);
      
      const loadLocalState = () => {
        const saved = localStorage.getItem(`room_${pin}`);
        if (saved) {
          try {
            setRoomState(JSON.parse(saved));
          } catch (e) {
            console.error('Parse LocalState Error:', e);
          }
        } else {
          setRoomState(null);
          if (!isHost) {
            setError('존재하지 않거나 만료된 방입니다.');
          }
        }
        setLoading(false);
      };

      loadLocalState();

      const handleMessage = (event: MessageEvent) => {
        if (event.data && event.data.type === 'STATE_UPDATE') {
          setRoomState(event.data.state);
        }
      };

      channel.addEventListener('message', handleMessage);

      // LocalStorage 변동 감지 (다른 탭에서 직접 쓸 때 보완)
      const handleStorageChange = (e: StorageEvent) => {
        if (e.key === `room_${pin}`) {
          loadLocalState();
        }
      };
      window.addEventListener('storage', handleStorageChange);

      return () => {
        channel.removeEventListener('message', handleMessage);
        window.removeEventListener('storage', handleStorageChange);
      };
    }
  }, [pin, isHost]);

  // 공통 상태 갱신 함수
  const updateRoomState = async (updater: (prev: RoomState) => RoomState) => {
    if (!pin) return;
    const currentState = stateRef.current;
    if (!currentState) return;

    const nextState = updater(currentState);
    const cleanedState = cleanUndefined(nextState);

    if (isConfigured && db) {
      await set(ref(db, `rooms/${pin}`), cleanedState);
    } else {
      localStorage.setItem(`room_${pin}`, JSON.stringify(cleanedState));
      const channel = getBroadcastChannel(pin);
      channel.postMessage({ type: 'STATE_UPDATE', state: cleanedState });
      setRoomState(cleanedState);
    }
  };

  // 1. 방 생성 (진행자 전용)
  const createRoom = async (gameMode: 'individual' | 'team', hostId: string, playStyle: 'host_controlled' | 'self_paced' = 'host_controlled') => {
    if (!pin) return;
    const initialRoom: RoomState = {
      pin,
      status: 'lobby',
      gameMode,
      playStyle,
      timeLimit: 300, // 기본값 5분 (300초)
      questionDuration: 0, // 기본값 0 (시간 제한 없음)
      includePractice: true, // 연습문제 포함 여부 (기본값 true)
      currentQuestionIndex: 0,
      showAnswer: false,
      questions: [],
      teams: {},
      players: {},
      hostId
    };

    if (isConfigured && db) {
      await set(ref(db, `rooms/${pin}`), initialRoom);
    } else {
      localStorage.setItem(`room_${pin}`, JSON.stringify(initialRoom));
      const channel = getBroadcastChannel(pin);
      channel.postMessage({ type: 'STATE_UPDATE', state: initialRoom });
      setRoomState(initialRoom);
    }
  };

  // 2. 문제 목록 저장 (진행자 전용)
  const loadQuestions = async (questions: Question[]) => {
    await updateRoomState((prev) => ({
      ...prev,
      questions
    }));
  };

  // 3. 학생 방 참가
  const joinRoom = async (playerId: string, name: string, team?: string | null) => {
    await updateRoomState((prev) => {
      const players = { ...prev.players };
      players[playerId] = {
        id: playerId,
        name,
        team: prev.gameMode === 'team' ? (team || '기타') : null,
        score: players[playerId]?.score || 0, // 이미 있는 플레이어면 점수 보존
        lastAnswer: null,
        isCorrect: false
      };

      return {
        ...prev,
        players,
        teams: prev.gameMode === 'team' ? calculateTeamScores(players) : prev.teams
      };
    });
  };

  // 4. 게임 시작
  const startQuiz = async () => {
    await updateRoomState((prev) => {
      const endAt = prev.playStyle === 'self_paced' 
        ? Date.now() + (prev.timeLimit || 300) * 1000 
        : null;

      const questionEndAt = (prev.playStyle === 'host_controlled' && prev.questionDuration && prev.questionDuration > 0)
        ? Date.now() + prev.questionDuration * 1000
        : null;

      // 게임 시작 시 연습문제는 강제로 필터링하여 순수 등록된 문제만 진행
      const finalQuestions = (prev.questions || []).filter(q => !q.isPractice);

      return {
        ...prev,
        questions: finalQuestions,
        status: 'playing',
        isOrientation: false,
        orientationStep: null,
        currentQuestionIndex: 0,
        showAnswer: false,
        endAt,
        questionEndAt,
        questionStartedAt: Date.now()
      };
    });
  };

  // 4.5. 자율 풀이 시간 제한 업데이트
  const updateTimeLimit = async (seconds: number) => {
    await updateRoomState((prev) => ({
      ...prev,
      timeLimit: seconds
    }));
  };

  // 4.6. 진행자 통제형 문제당 시간 제한 업데이트
  const updateQuestionDuration = async (seconds: number) => {
    await updateRoomState((prev) => ({
      ...prev,
      questionDuration: seconds
    }));
  };

  // 4.7. 연습문제 포함 여부 업데이트
  const updateIncludePractice = async (enabled: boolean) => {
    await updateRoomState((prev) => ({
      ...prev,
      includePractice: enabled
    }));
  };

  // 4.8. 오리엔테이션 시작
  const startOrientation = async () => {
    await updateRoomState((prev) => ({
      ...prev,
      isOrientation: true,
      orientationStep: 'explain',
      status: 'playing',
      showAnswer: false,
      questionStartedAt: Date.now()
    }));
  };

  // 4.9. 연습문제 풀이 시작
  const startPracticeQuestion = async () => {
    await updateRoomState((prev) => {
      const players = { ...prev.players };
      Object.keys(players).forEach(id => {
        players[id] = {
          ...players[id],
          lastAnswer: null,
          isCorrect: false
        };
      });

      return {
        ...prev,
        orientationStep: 'practice',
        showAnswer: false,
        players,
        questionStartedAt: Date.now()
      };
    });
  };

  // 4.10. 오리엔테이션 종료 및 대기실 복귀
  const endOrientation = async () => {
    await updateRoomState((prev) => {
      const players = { ...prev.players };
      Object.keys(players).forEach(id => {
        players[id] = {
          ...players[id],
          score: 0,
          lastAnswer: null,
          isCorrect: false,
          currentQuestionIndex: 0,
          answers: {}
        };
      });

      return {
        ...prev,
        isOrientation: false,
        orientationStep: null,
        status: 'lobby',
        showAnswer: false,
        players,
        teams: {}
      };
    });
  };

  // 5. 다음 문제 이동
  const nextQuestion = async () => {
    await updateRoomState((prev) => {
      const nextIndex = prev.currentQuestionIndex + 1;
      const hasNextQuestion = nextIndex < prev.questions.length;
      
      // 다음 문제로 넘어가면 모든 플레이어의 정답 제출 상태 리셋
      const players = { ...prev.players };
      Object.keys(players).forEach(id => {
        players[id] = {
          ...players[id],
          lastAnswer: null,
          isCorrect: false,
          lastSubmitDuration: null
        };
      });

      const questionEndAt = (hasNextQuestion && prev.playStyle === 'host_controlled' && prev.questionDuration && prev.questionDuration > 0)
        ? Date.now() + prev.questionDuration * 1000
        : null;

      return {
        ...prev,
        currentQuestionIndex: hasNextQuestion ? nextIndex : prev.currentQuestionIndex,
        showAnswer: false,
        players,
        questionEndAt,
        questionStartedAt: hasNextQuestion ? Date.now() : null
      };
    });
  };

  // 6. 정답 공개 및 자동 채점
  const revealAnswer = async () => {
    await updateRoomState((prev) => {
      const currentQuestion = prev.isOrientation 
        ? PRACTICE_QUESTIONS[0] 
        : prev.questions[prev.currentQuestionIndex];
      if (!currentQuestion) return prev;

      const players = { ...prev.players };

      Object.keys(players).forEach((id) => {
        const player = players[id];
        const isCorrect = checkAnswerCorrectness(player.lastAnswer || '', currentQuestion.answer);
        
        // 오리엔테이션 중에는 연습문제이므로 점수 증가하지 않음
        const scoreIncrement = (isCorrect && !prev.isOrientation) ? (currentQuestion.score || 10) : 0;
        
        // 제출 소요 시간 누적 연산
        const lastDuration = player.lastSubmitDuration || 0;
        const newTotalDuration = (player.totalSubmitDuration || 0) + lastDuration;
        const newSubmitCount = (player.submitCount || 0) + (player.lastAnswer ? 1 : 0);

        const playerAnswers = player.answers ? { ...player.answers } : {};
        if (!prev.isOrientation) {
          playerAnswers[prev.currentQuestionIndex] = {
            submitted: player.lastAnswer || '',
            isCorrect: isCorrect
          };
        }

        players[id] = {
          ...player,
          isCorrect,
          score: player.score + scoreIncrement,
          totalSubmitDuration: newTotalDuration,
          submitCount: newSubmitCount,
          lastSubmitDuration: 0, // 다음 문제를 위해 리셋
          answers: playerAnswers
        };
      });

      return {
        ...prev,
        showAnswer: true,
        orientationStep: prev.isOrientation ? 'reveal' : null,
        players,
        teams: prev.gameMode === 'team' ? calculateTeamScores(players) : prev.teams,
        questionEndAt: null // 정답 공개 시 타이머 중지
      };
    });
  };

  // 7. 정답 제출 (학생 전용)
  const submitAnswer = async (playerId: string, answer: string) => {
    await updateRoomState((prev) => {
      const players = { ...prev.players };
      
      if (!players[playerId]) return prev;

      if (prev.playStyle === 'self_paced' && !prev.isOrientation) {
        const player = players[playerId];
        const playerQIndex = player.currentQuestionIndex || 0;
        const currentQuestion = prev.questions[playerQIndex];

        if (currentQuestion) {
          const isCorrect = checkAnswerCorrectness(answer, currentQuestion.answer);
          const scoreIncrement = isCorrect ? (currentQuestion.score || 10) : 0;
          
          const playerAnswers = player.answers ? { ...player.answers } : {};
          playerAnswers[playerQIndex] = {
            submitted: answer,
            isCorrect: isCorrect
          };

          players[playerId] = {
            ...player,
            lastAnswer: null, // 다음 문제를 바로 풀 수 있도록 null로 리셋
            isCorrect: false, // 다음 문제 상태를 위해 초기화
            score: player.score + scoreIncrement,
            currentQuestionIndex: playerQIndex + 1,
            answers: playerAnswers
          };
        }
      } else {
        // 기존 진행자 속도 조절 모드
        const elapsed = prev.questionStartedAt ? (Date.now() - prev.questionStartedAt) : 0;
        players[playerId] = {
          ...players[playerId],
          lastAnswer: answer,
          lastSubmitDuration: elapsed
        };
      }

      return {
        ...prev,
        players,
        teams: prev.gameMode === 'team' ? calculateTeamScores(players) : prev.teams
      };
    });
  };

  // 8. 퀴즈 종료 (최종 집계 화면 전환)
  const endQuiz = async () => {
    await updateRoomState((prev) => ({
      ...prev,
      status: 'leaderboard'
    }));
  };

  // 9. 점수 수동 조정 (진행자 가감점 조율)
  const adjustPlayerScore = async (playerId: string, amount: number) => {
    await updateRoomState((prev) => {
      const players = { ...prev.players };
      
      if (players[playerId]) {
        const player = players[playerId];
        const oldScore = player.score;
        const newScore = Math.max(0, oldScore + amount);
        players[playerId] = {
          ...player,
          score: newScore
        };
      }

      return {
        ...prev,
        players,
        teams: prev.gameMode === 'team' ? calculateTeamScores(players) : prev.teams
      };
    });
  };

  // 10. 방 삭제 또는 폭파
  const deleteRoom = async () => {
    if (!pin) return;
    if (isConfigured && db) {
      await set(ref(db, `rooms/${pin}`), null);
    } else {
      localStorage.removeItem(`room_${pin}`);
      const channel = getBroadcastChannel(pin);
      channel.postMessage({ type: 'STATE_UPDATE', state: null });
      setRoomState(null);
    }
  };

  return {
    roomState,
    loading,
    error,
    createRoom,
    loadQuestions,
    joinRoom,
    startQuiz,
    updateTimeLimit,
    updateQuestionDuration,
    updateIncludePractice,
    startOrientation,
    startPracticeQuestion,
    endOrientation,
    nextQuestion,
    revealAnswer,
    submitAnswer,
    endQuiz,
    adjustPlayerScore,
    deleteRoom,
    isDemo: !isConfigured
  };
}

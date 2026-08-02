import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Users, Smile, Tv, Sparkles, Key } from 'lucide-react';
import { isConfigured } from '../firebase';

export default function Home() {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [playStyle, setPlayStyle] = useState<'host_controlled' | 'self_paced'>('host_controlled');
  const navigate = useNavigate();

  // 학생 방 참가 처리
  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin.trim()) {
      setError('PIN 번호를 입력해 주세요.');
      return;
    }
    setError('');
    // 학생 화면으로 PIN 번호와 함께 이동
    navigate(`/student?pin=${pin.trim()}`);
  };

  // 진행자 리모컨 접속 처리
  const handleMonitorJoin = () => {
    if (!pin.trim()) {
      setError('PIN 번호를 입력해 주세요.');
      return;
    }
    setError('');
    // 리모컨 화면으로 PIN 번호와 함께 이동
    navigate(`/monitor?pin=${pin.trim()}`);
  };

  // 진행자 방 개설 처리
  const handleCreateRoom = (gameMode: 'individual' | 'team') => {
    // 4자리 고유 PIN 생성
    const generatedPin = Math.floor(1000 + Math.random() * 9000).toString();
    navigate(`/host?pin=${generatedPin}&mode=${gameMode}&style=${playStyle}`);
  };

  return (
    <div className="mobile-container" style={{ justifyContent: 'center', minHeight: '100vh' }}>
      <div className="text-center mb-4">
        <div style={{ display: 'inline-flex', gap: '5px', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', marginBottom: '10px' }}>
          <Smile size={36} className="status-waiting" style={{ padding: '4px', borderRadius: '50%' }} />
          <Sparkles size={24} style={{ color: 'var(--accent-yellow)' }} />
        </div>
        <h1 className="title-main" style={{ fontSize: '2.8rem', letterSpacing: '-1px' }}>지구촌 퀴즈</h1>
        <p className="title-sub" style={{ marginBottom: '15px' }}>지구촌교회 중등부 실시간 레크리에이션 퀴즈</p>
        
        {!isConfigured && (
          <div style={{
            fontSize: '0.8rem',
            backgroundColor: 'var(--accent-yellow)',
            color: '#2d3436',
            padding: '6px 12px',
            borderRadius: '20px',
            display: 'inline-block',
            fontWeight: 'bold',
            marginBottom: '20px'
          }}>
            🔌 현재 데모 모드 (동일 브라우저 탭 간 실시간 테스트 가능)
          </div>
        )}
      </div>

      {/* 퀴즈 참가 및 리모컨 접속 카드 */}
      <div className="card">
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '15px', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Key size={20} /> 퀴즈 참여 및 리모컨 접속
        </h2>
        <form onSubmit={handleJoin}>
          <div className="form-group">
            <input
              type="text"
              placeholder="PIN 번호 4자리 입력 (예: 1234)"
              className="form-input"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, '').slice(0, 4))}
              style={{ fontSize: '1.2rem', textAlign: 'center', fontWeight: 'bold', letterSpacing: '4px' }}
            />
          </div>
          {error && <p style={{ color: 'var(--accent-pink)', fontSize: '0.9rem', marginBottom: '15px', fontWeight: 'bold', textAlign: 'center' }}>{error}</p>}
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '14px', fontSize: '1.1rem' }}>
              <Play size={18} fill="white" /> 학생으로 입장하기
            </button>
            <button 
              type="button" 
              onClick={handleMonitorJoin} 
              className="btn btn-outline" 
              style={{ 
                width: '100%', 
                padding: '12px', 
                fontSize: '0.95rem',
                border: '1px solid var(--primary)',
                color: 'var(--primary)',
                backgroundColor: 'transparent'
              }}
            >
              <Tv size={16} style={{ marginRight: '6px', verticalAlign: 'middle' }} /> 진행자 리모컨으로 입장하기
            </button>
          </div>
        </form>
      </div>

      {/* 진행자 방 개설 카드 */}
      <div className="card" style={{ border: '2px solid rgba(108, 92, 231, 0.2)', backgroundColor: 'rgba(108, 92, 231, 0.02)' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '12px', color: '#2d3436', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Tv size={18} /> 진행자 전용 (메인 스크린 개설)
        </h2>
        <p style={{ fontSize: '0.9rem', color: '#7f8c8d', marginBottom: '20px' }}>
          대형 화면이나 빔 프로젝터에 띄울 실시간 퀴즈 대방을 생성합니다.
        </p>

        {/* 신규: 플레이 스타일 선택 */}
        <div style={{ marginBottom: '20px' }}>
          <label className="form-label" style={{ fontSize: '0.85rem', color: '#7f8c8d', marginBottom: '8px', display: 'block', fontWeight: 'bold' }}>🎮 플레이 방식 선택</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', backgroundColor: 'var(--bg-light)', padding: '4px', borderRadius: '10px' }}>
            <button
              type="button"
              onClick={() => setPlayStyle('host_controlled')}
              style={{
                border: 'none',
                padding: '10px',
                borderRadius: '8px',
                fontSize: '0.85rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                backgroundColor: playStyle === 'host_controlled' ? 'white' : 'transparent',
                color: playStyle === 'host_controlled' ? 'var(--primary)' : '#7f8c8d',
                boxShadow: playStyle === 'host_controlled' ? 'var(--shadow-sm)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              ⏱️ 진행자 속도 조절
            </button>
            <button
              type="button"
              onClick={() => setPlayStyle('self_paced')}
              style={{
                border: 'none',
                padding: '10px',
                borderRadius: '8px',
                fontSize: '0.85rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                backgroundColor: playStyle === 'self_paced' ? 'white' : 'transparent',
                color: playStyle === 'self_paced' ? 'var(--primary)' : '#7f8c8d',
                boxShadow: playStyle === 'self_paced' ? 'var(--shadow-sm)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              ⚡ 참여자 자율 풀이
            </button>
          </div>
          <p style={{ fontSize: '0.75rem', color: '#95a5a6', marginTop: '6px', textAlign: 'center', lineHeight: '1.3' }}>
            {playStyle === 'host_controlled' 
              ? '진행자가 정답을 확인하고 다음 문제를 출제하는 정통 방식입니다.' 
              : '참여자가 직접 각자의 속도로 문제를 끝까지 풀어나갑니다.'}
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <button
            onClick={() => handleCreateRoom('individual')}
            className="btn btn-outline"
            style={{ fontSize: '0.95rem', padding: '12px 10px' }}
          >
            <Smile size={16} /> 개인전 개설
          </button>
          <button
            onClick={() => handleCreateRoom('team')}
            className="btn btn-secondary"
            style={{ fontSize: '0.95rem', padding: '12px 10px' }}
          >
            <Users size={16} /> 팀전 개설
          </button>
        </div>
      </div>

      <div className="text-center" style={{ marginTop: '20px', fontSize: '0.8rem', color: '#7f8c8d' }}>
        © {new Date().getFullYear()} 지구촌교회 중등부 사역 개발팀
      </div>
    </div>
  );
}

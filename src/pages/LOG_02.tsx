import { FormEvent, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import logo from '@/assets/logo.png';

export default function LOG_02() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // TODO: 백엔드 인증 로직 연동 시 이 부분을 API 호출로 대체하세요.
    console.log('로그인 시도', { username, password, rememberMe });

    // 임시로 로그인 처리 (실제로는 백엔드 API 응답을 받아야 함)
    login({
      id: 1,
      name: username || 'user',
      email: `${username}@example.com`,
    });

    // 로그인 후 원래 가려던 페이지로 이동 (없으면 게시판으로)
    const from = (location.state as any)?.from?.pathname || '/boards';
    navigate(from, { replace: true });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-12">
      <div className="flex w-full max-w-xl flex-col items-center gap-10 rounded-3xl bg-white p-12 shadow-lg">
        <img src={logo} alt="로고" className="h-28 w-28" />

        <form onSubmit={handleSubmit} className="flex w-full flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label htmlFor="username" className="text-sm font-medium text-slate-800">
              아이디
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="아이디를 입력하세요"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              autoComplete="username"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="password" className="text-sm font-medium text-slate-800">
              비밀번호
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="비밀번호를 입력하세요"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            className="mt-2 w-full rounded-xl bg-blue-600 py-3 text-base font-semibold text-white transition-opacity hover:opacity-90"
          >
            로그인
          </button>

          <div className="flex items-center justify-between text-sm text-slate-700">
            <label htmlFor="rememberMe" className="flex items-center gap-2">
              <input
                id="rememberMe"
                type="checkbox"
                checked={rememberMe}
                onChange={(event) => setRememberMe(event.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              로그인 유지
            </label>

            <nav className="flex gap-4">
              <button
                type="button"
                onClick={() => navigate('/find')}
                className="transition-colors hover:text-blue-600 hover:underline"
              >
                ID/PW 찾기
              </button>
              <button
                type="button"
                onClick={() => navigate('/register')}
                className="transition-colors hover:text-blue-600 hover:underline"
              >
                회원가입
              </button>
            </nav>
          </div>
        </form>
      </div>
    </div>
  );
}

import { FormEvent, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { isEmail } from '@/utils/validation';
import { login as loginApi } from '@/services/authService';
import logo from '@/assets/logo.png';

export default function LOG_02() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState({ username: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  const validateUsername = (value: string) => {
    if (!value.trim()) {
      return '이메일을 입력해주세요.';
    }
    // 이메일 형식이면 이메일 검증
    if (value.includes('@') && !isEmail(value)) {
      return '올바른 이메일 형식이 아닙니다.';
    }
    return '';
  };

  const validatePassword = (value: string) => {
    if (!value) {
      return '비밀번호를 입력해주세요.';
    }
    if (value.length < 6) {
      return '비밀번호는 최소 6자 이상이어야 합니다.';
    }
    return '';
  };

  const handleUsernameChange = (value: string) => {
    setUsername(value);
    setErrors(prev => ({ ...prev, username: validateUsername(value) }));
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    setErrors(prev => ({ ...prev, password: validatePassword(value) }));
  };

  const isFormValid = () => {
    const usernameError = validateUsername(username);
    const passwordError = validatePassword(password);
    return !usernameError && !passwordError;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    // 최종 유효성 검증
    const usernameError = validateUsername(username);
    const passwordError = validatePassword(password);

    if (usernameError || passwordError) {
      setErrors({ username: usernameError, password: passwordError });
      return;
    }

    setIsLoading(true);
    setLoginError('');

    try {
      // 백엔드 API 호출
      const response = await loginApi({
        email: username,
        password: password,
      });

      // Access Token을 AuthContext에 저장
      login(response.accessToken);

      // 로그인 후 원래 가려던 페이지로 이동 (없으면 게시판으로)
      const from = (location.state as any)?.from?.pathname || '/boards';
      navigate(from, { replace: true });
    } catch (error: any) {
      console.error('로그인 실패:', error);

      // 서버에서 반환한 에러 메시지 추출
      const serverMessage = error.response?.data?.message || error.response?.data?.error?.message;

      // 에러 처리 - 서버 메시지 우선, 없으면 기본 메시지 사용
      if (error.code === 'ERR_NETWORK') {
        setLoginError('서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.');
      } else if (error.response?.status === 400) {
        setLoginError(serverMessage || '잘못된 요청입니다. 입력 정보를 확인해주세요.');
      } else if (error.response?.status === 401) {
        setLoginError(serverMessage || '이메일 또는 비밀번호가 올바르지 않습니다.');
      } else if (error.response?.status === 404) {
        setLoginError(serverMessage || '존재하지 않는 사용자입니다.');
      } else if (error.response?.status === 500) {
        setLoginError(serverMessage || '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
      } else if (error.response?.status) {
        // 기타 HTTP 에러
        setLoginError(serverMessage || `로그인 실패: ${error.response.status} 오류`);
      } else {
        // 알 수 없는 에러
        setLoginError(serverMessage || '로그인 중 오류가 발생했습니다. 다시 시도해주세요.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-12">
      <div className="flex w-full max-w-xl flex-col items-center gap-10 rounded-3xl bg-white p-12 shadow-lg">
        <button
          onClick={() => navigate('/boards')}
          className="hover:opacity-80 transition-opacity"
          aria-label="메인 페이지로 이동"
        >
          <img src={logo} alt="ReadOur 로고" className="h-12 w-auto" loading="lazy" />
        </button>

        <form onSubmit={handleSubmit} className="flex w-full flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label htmlFor="username" className="text-sm font-medium text-slate-800">
              이메일
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(event) => handleUsernameChange(event.target.value)}
              placeholder="이메일을 입력하세요"
              className={`w-full rounded-xl border ${errors.username ? 'border-red-500' : 'border-slate-200'} bg-white px-4 py-3 text-base text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200`}
              autoComplete="username"
            />
            {errors.username && (
              <p className="text-sm text-red-600">{errors.username}</p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="password" className="text-sm font-medium text-slate-800">
              비밀번호
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => handlePasswordChange(event.target.value)}
              placeholder="비밀번호를 입력하세요"
              className={`w-full rounded-xl border ${errors.password ? 'border-red-500' : 'border-slate-200'} bg-white px-4 py-3 text-base text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200`}
              autoComplete="current-password"
            />
            {errors.password && (
              <p className="text-sm text-red-600">{errors.password}</p>
            )}
          </div>

          {loginError && (
            <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
              {loginError}
            </div>
          )}

          <button
            type="submit"
            disabled={!isFormValid() || isLoading}
            className="mt-2 w-full rounded-xl bg-blue-600 py-3 text-base font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? '로그인 중...' : '로그인'}
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

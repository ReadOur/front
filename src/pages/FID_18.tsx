import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '@/assets/logo.png';

type TabType = 'id' | 'password';

export default function FID_18() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('id');
  const [email, setEmail] = useState('');
  const [userId, setUserId] = useState('');
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFindId = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    setResultMessage(null);

    // TODO: 백엔드 API 연동 필요
    if (!email.trim()) {
      setErrorMessage('이메일을 입력해주세요.');
      return;
    }

    // 임시 처리
    console.log('아이디 찾기:', { email });
    setResultMessage('입력하신 이메일로 아이디 정보를 전송했습니다.');
  };

  const handleFindPassword = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    setResultMessage(null);

    // TODO: 백엔드 API 연동 필요
    if (!email.trim() || !userId.trim()) {
      setErrorMessage('이메일과 아이디를 모두 입력해주세요.');
      return;
    }

    // 임시 처리
    console.log('비밀번호 찾기:', { email, userId });
    setResultMessage('입력하신 이메일로 임시 비밀번호를 전송했습니다.');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-12">
      <div className="flex w-full max-w-xl flex-col items-center gap-8 rounded-3xl bg-white p-12 shadow-lg">
        <img src={logo} alt="로고" className="h-28 w-28" />

        <div className="w-full">
          <h1 className="text-2xl font-semibold text-slate-900 text-center mb-6">
            아이디/비밀번호 찾기
          </h1>

          {/* 탭 메뉴 */}
          <div className="flex border-b border-slate-200 mb-6">
            <button
              onClick={() => {
                setActiveTab('id');
                setResultMessage(null);
                setErrorMessage(null);
              }}
              className={`flex-1 py-3 text-base font-medium transition-colors ${
                activeTab === 'id'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              아이디 찾기
            </button>
            <button
              onClick={() => {
                setActiveTab('password');
                setResultMessage(null);
                setErrorMessage(null);
              }}
              className={`flex-1 py-3 text-base font-medium transition-colors ${
                activeTab === 'password'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              비밀번호 찾기
            </button>
          </div>

          {/* 아이디 찾기 폼 */}
          {activeTab === 'id' && (
            <form onSubmit={handleFindId} className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <label htmlFor="email-id" className="text-sm font-medium text-slate-800">
                  이메일
                </label>
                <input
                  id="email-id"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="가입 시 사용한 이메일을 입력하세요"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  autoComplete="email"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-blue-600 py-3 text-base font-semibold text-white transition-opacity hover:opacity-90"
              >
                아이디 찾기
              </button>
            </form>
          )}

          {/* 비밀번호 찾기 폼 */}
          {activeTab === 'password' && (
            <form onSubmit={handleFindPassword} className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <label htmlFor="userId-pw" className="text-sm font-medium text-slate-800">
                  아이디
                </label>
                <input
                  id="userId-pw"
                  type="text"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  placeholder="아이디를 입력하세요"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  autoComplete="username"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="email-pw" className="text-sm font-medium text-slate-800">
                  이메일
                </label>
                <input
                  id="email-pw"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="가입 시 사용한 이메일을 입력하세요"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  autoComplete="email"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-blue-600 py-3 text-base font-semibold text-white transition-opacity hover:opacity-90"
              >
                비밀번호 찾기
              </button>
            </form>
          )}

          {/* 결과 메시지 */}
          {resultMessage && (
            <div className="mt-4 rounded-xl border border-green-100 bg-green-50 px-4 py-3 text-sm text-green-600">
              {resultMessage}
            </div>
          )}

          {/* 에러 메시지 */}
          {errorMessage && (
            <div className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
              {errorMessage}
            </div>
          )}

          {/* 하단 링크 */}
          <div className="mt-6 flex justify-center gap-4 text-sm text-slate-700">
            <button
              onClick={() => navigate('/login')}
              className="transition-colors hover:text-blue-600 hover:underline"
            >
              로그인
            </button>
            <span className="text-slate-300">|</span>
            <button
              onClick={() => navigate('/register')}
              className="transition-colors hover:text-blue-600 hover:underline"
            >
              회원가입
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { isAxiosError } from 'axios';
import { findId, resetPassword } from '@/services/authService';
import logo from '@/assets/logo.png';

type TabType = 'findId' | 'resetPassword';

export default function FIND() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('findId');

  // 아이디 찾기 상태
  const [findIdForm, setFindIdForm] = useState({
    nickname: '',
    birthDate: '',
  });
  const [findIdResult, setFindIdResult] = useState<string | null>(null);
  const [findIdError, setFindIdError] = useState<string | null>(null);
  const [isFindIdLoading, setIsFindIdLoading] = useState(false);

  // 비밀번호 찾기 상태
  const [resetPasswordForm, setResetPasswordForm] = useState({
    email: '',
    nickname: '',
    birthDate: '',
  });
  const [resetPasswordSuccess, setResetPasswordSuccess] = useState(false);
  const [resetPasswordError, setResetPasswordError] = useState<string | null>(null);
  const [isResetPasswordLoading, setIsResetPasswordLoading] = useState(false);

  // 아이디 찾기 제출
  const handleFindIdSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFindIdError(null);
    setFindIdResult(null);
    setIsFindIdLoading(true);

    try {
      const response = await findId({
        nickname: findIdForm.nickname,
        birthDate: findIdForm.birthDate,
      });

      setFindIdResult(response.email);
    } catch (error) {
      if (isAxiosError(error)) {
        if (error.response?.status === 404) {
          setFindIdError('일치하는 회원 정보를 찾을 수 없습니다.');
        } else if (error.code === 'ERR_NETWORK') {
          setFindIdError('서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.');
        } else {
          const message = error.response?.data?.message || error.message;
          setFindIdError(message || '아이디 찾기 중 오류가 발생했습니다.');
        }
      } else {
        setFindIdError('알 수 없는 오류가 발생했습니다.');
      }
    } finally {
      setIsFindIdLoading(false);
    }
  };

  // 비밀번호 찾기 제출
  const handleResetPasswordSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setResetPasswordError(null);
    setResetPasswordSuccess(false);
    setIsResetPasswordLoading(true);

    try {
      await resetPassword({
        email: resetPasswordForm.email,
        nickname: resetPasswordForm.nickname,
        birthDate: resetPasswordForm.birthDate,
      });

      setResetPasswordSuccess(true);
      setResetPasswordForm({ email: '', nickname: '', birthDate: '' });
    } catch (error) {
      if (isAxiosError(error)) {
        if (error.response?.status === 404) {
          setResetPasswordError('일치하는 회원 정보를 찾을 수 없습니다.');
        } else if (error.code === 'ERR_NETWORK') {
          setResetPasswordError('서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.');
        } else {
          const message = error.response?.data?.message || error.message;
          setResetPasswordError(message || '비밀번호 재설정 중 오류가 발생했습니다.');
        }
      } else {
        setResetPasswordError('알 수 없는 오류가 발생했습니다.');
      }
    } finally {
      setIsResetPasswordLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-12">
      <div className="w-full max-w-xl rounded-3xl bg-white p-12 shadow-lg">
        {/* 로고 */}
        <button
          onClick={() => navigate('/boards')}
          className="mx-auto mb-8 block hover:opacity-80 transition-opacity"
          aria-label="메인 페이지로 이동"
        >
          <img src={logo} alt="ReadOur 로고" className="h-12 w-auto" loading="lazy" />
        </button>

        {/* 탭 헤더 */}
        <div className="mb-8 flex gap-2 border-b border-slate-200">
          <button
            onClick={() => setActiveTab('findId')}
            className={`flex-1 py-3 text-base font-semibold transition-colors ${
              activeTab === 'findId'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            아이디 찾기
          </button>
          <button
            onClick={() => setActiveTab('resetPassword')}
            className={`flex-1 py-3 text-base font-semibold transition-colors ${
              activeTab === 'resetPassword'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            비밀번호 찾기
          </button>
        </div>

        {/* 아이디 찾기 */}
        {activeTab === 'findId' && (
          <form onSubmit={handleFindIdSubmit} className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <label htmlFor="findId-nickname" className="text-sm font-medium text-slate-800">
                닉네임
              </label>
              <input
                id="findId-nickname"
                type="text"
                value={findIdForm.nickname}
                onChange={(e) => setFindIdForm({ ...findIdForm, nickname: e.target.value })}
                placeholder="닉네임을 입력하세요"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="findId-birthDate" className="text-sm font-medium text-slate-800">
                생년월일
              </label>
              <input
                id="findId-birthDate"
                type="date"
                value={findIdForm.birthDate}
                onChange={(e) => setFindIdForm({ ...findIdForm, birthDate: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                required
              />
            </div>

            {findIdError && (
              <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
                {findIdError}
              </div>
            )}

            {findIdResult && (
              <div className="rounded-xl bg-green-50 px-4 py-3 text-sm text-green-600">
                <p className="font-semibold mb-1">이메일을 찾았습니다!</p>
                <p className="text-base font-mono">{findIdResult}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isFindIdLoading || !findIdForm.nickname || !findIdForm.birthDate}
              className="w-full rounded-xl bg-blue-600 py-3 text-base font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isFindIdLoading ? '찾는 중...' : '아이디 찾기'}
            </button>
          </form>
        )}

        {/* 비밀번호 찾기 */}
        {activeTab === 'resetPassword' && (
          <form onSubmit={handleResetPasswordSubmit} className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <label htmlFor="reset-email" className="text-sm font-medium text-slate-800">
                이메일
              </label>
              <input
                id="reset-email"
                type="email"
                value={resetPasswordForm.email}
                onChange={(e) =>
                  setResetPasswordForm({ ...resetPasswordForm, email: e.target.value })
                }
                placeholder="이메일을 입력하세요"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="reset-nickname" className="text-sm font-medium text-slate-800">
                닉네임
              </label>
              <input
                id="reset-nickname"
                type="text"
                value={resetPasswordForm.nickname}
                onChange={(e) =>
                  setResetPasswordForm({ ...resetPasswordForm, nickname: e.target.value })
                }
                placeholder="닉네임을 입력하세요"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="reset-birthDate" className="text-sm font-medium text-slate-800">
                생년월일
              </label>
              <input
                id="reset-birthDate"
                type="date"
                value={resetPasswordForm.birthDate}
                onChange={(e) =>
                  setResetPasswordForm({ ...resetPasswordForm, birthDate: e.target.value })
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                required
              />
            </div>

            {resetPasswordError && (
              <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
                {resetPasswordError}
              </div>
            )}

            {resetPasswordSuccess && (
              <div className="rounded-xl bg-green-50 px-4 py-3 text-sm text-green-600">
                <p className="font-semibold mb-1">임시 비밀번호가 발송되었습니다!</p>
                <p>이메일을 확인해주세요.</p>
              </div>
            )}

            <button
              type="submit"
              disabled={
                isResetPasswordLoading ||
                !resetPasswordForm.email ||
                !resetPasswordForm.nickname ||
                !resetPasswordForm.birthDate
              }
              className="w-full rounded-xl bg-blue-600 py-3 text-base font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isResetPasswordLoading ? '발송 중...' : '임시 비밀번호 발급'}
            </button>
          </form>
        )}

        {/* 로그인 페이지로 돌아가기 */}
        <div className="mt-6 text-center text-sm text-slate-700">
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="text-blue-600 transition-colors hover:text-blue-700 hover:underline font-medium"
          >
            로그인 페이지로 돌아가기
          </button>
        </div>
      </div>
    </div>
  );
}

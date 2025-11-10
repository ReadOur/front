import { ChangeEvent, FormEvent, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { isAxiosError } from 'axios';

import { signup } from '@/services/authService';

interface RegisterFormState {
  email: string;
  userId: string;
  nickname: string;
  password: string;
  passwordConfirm: string;
}

const defaultFormState: RegisterFormState = {
  email: '',
  userId: '',
  nickname: '',
  password: '',
  passwordConfirm: '',
};

export default function REG_03() {
  const navigate = useNavigate();
  const [formState, setFormState] = useState<RegisterFormState>(defaultFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const isFormValid = useMemo(() => {
    return (
      formState.email.trim() !== '' &&
      formState.nickname.trim() !== '' &&
      formState.password.length >= 8 &&
      formState.password === formState.passwordConfirm
    );
  }, [formState]);

  const handleChange = (field: keyof RegisterFormState) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      setFormState((prev) => ({ ...prev, [field]: event.target.value }));
    };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isSubmitting) return;

    setErrorMessage(null);
    setSuccessMessage(null);

    if (formState.password !== formState.passwordConfirm) {
      setErrorMessage('비밀번호와 비밀번호 확인이 일치하지 않습니다.');
      return;
    }

    if (formState.password.length < 8) {
      setErrorMessage('비밀번호는 최소 8자 이상이어야 합니다.');
      return;
    }

    setIsSubmitting(true);

    try {
      await signup({
        email: formState.email,
        password: formState.password,
        nickname: formState.nickname,
        userId: formState.userId.trim() ? formState.userId.trim() : undefined,
      });

      setSuccessMessage('회원가입이 완료되었습니다. 로그인 페이지에서 로그인해 주세요.');
      setFormState(defaultFormState);
    } catch (error) {
      if (isAxiosError(error)) {
        const apiMessage =
          (typeof error.response?.data === 'object' && error.response?.data?.message) ||
          error.response?.data?.error ||
          error.message;
        setErrorMessage(apiMessage ?? '회원가입 중 오류가 발생했습니다. 다시 시도해 주세요.');
      } else {
        setErrorMessage('회원가입 중 알 수 없는 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-16">
      <div className="w-full max-w-2xl rounded-3xl bg-white p-12 shadow-lg">
        <header className="mb-10 text-center">
          <h1 className="text-3xl font-semibold text-slate-900">회원가입</h1>
          <p className="mt-3 text-sm text-slate-600">
            아래 정보를 입력해 회원가입을 완료해 주세요.
          </p>
        </header>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6" noValidate>
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <label htmlFor="email" className="text-sm font-medium text-slate-800">
                이메일
              </label>
              <input
                id="email"
                type="email"
                value={formState.email}
                onChange={handleChange('email')}
                placeholder="example@email.com"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                autoComplete="email"
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="userId" className="text-sm font-medium text-slate-800">
                아이디 (선택)
              </label>
              <input
                id="userId"
                type="text"
                value={formState.userId}
                onChange={handleChange('userId')}
                placeholder="로그인에 사용할 ID"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                autoComplete="username"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="nickname" className="text-sm font-medium text-slate-800">
                닉네임
              </label>
              <input
                id="nickname"
                type="text"
                value={formState.nickname}
                onChange={handleChange('nickname')}
                placeholder="표시할 닉네임"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                autoComplete="nickname"
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="password" className="text-sm font-medium text-slate-800">
                비밀번호
              </label>
              <input
                id="password"
                type="password"
                value={formState.password}
                onChange={handleChange('password')}
                placeholder="비밀번호를 입력하세요"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                autoComplete="new-password"
                minLength={8}
                required
              />
            </div>

            <div className="flex flex-col gap-2 sm:col-span-2">
              <label htmlFor="passwordConfirm" className="text-sm font-medium text-slate-800">
                비밀번호 확인
              </label>
              <input
                id="passwordConfirm"
                type="password"
                value={formState.passwordConfirm}
                onChange={handleChange('passwordConfirm')}
                placeholder="비밀번호를 다시 입력하세요"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                autoComplete="new-password"
                minLength={8}
                required
              />
            </div>
          </div>

          {errorMessage && (
            <p className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
              {errorMessage}
            </p>
          )}

          {successMessage && (
            <p className="rounded-xl border border-green-100 bg-green-50 px-4 py-3 text-sm text-green-600">
              {successMessage}
            </p>
          )}

          <button
            type="submit"
            className="mt-4 w-full rounded-xl bg-blue-600 py-3 text-base font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSubmitting || !isFormValid}
          >
            {isSubmitting ? '가입 중...' : '회원가입하기'}
          </button>

          <div className="mt-4 text-center text-sm text-slate-700">
            이미 계정이 있으신가요?{' '}
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="text-blue-600 transition-colors hover:text-blue-700 hover:underline font-medium"
            >
              로그인
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

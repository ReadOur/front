import { ChangeEvent, FormEvent, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { isAxiosError } from 'axios';
import { isEmail, isStrongPassword } from '@/utils/validation';

import { signup } from '@/services/authService';

interface RegisterFormState {
  email: string;
  nickname: string;
  password: string;
  passwordConfirm: string;
  gender: 'MALE' | 'FEMALE' | '';
  birthDate: string;
}

const defaultFormState: RegisterFormState = {
  email: '',
  nickname: '',
  password: '',
  passwordConfirm: '',
  gender: '',
  birthDate: '',
};

export default function REG_03() {
  const navigate = useNavigate();
  const [formState, setFormState] = useState<RegisterFormState>(defaultFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState({
    email: '',
    nickname: '',
    password: '',
    passwordConfirm: '',
    gender: '',
    birthDate: '',
  });

  const validateEmail = (email: string) => {
    if (!email.trim()) return '이메일을 입력해주세요.';
    if (!isEmail(email)) return '올바른 이메일 형식이 아닙니다.';
    return '';
  };

  const validateNickname = (nickname: string) => {
    if (!nickname.trim()) return '닉네임을 입력해주세요.';
    if (nickname.length < 2) return '닉네임은 최소 2자 이상이어야 합니다.';
    if (nickname.length > 20) return '닉네임은 최대 20자까지 가능합니다.';
    return '';
  };

  const validatePassword = (password: string) => {
    if (!password) return '비밀번호를 입력해주세요.';
    if (password.length < 8) return '비밀번호는 최소 8자 이상이어야 합니다.';
    if (!isStrongPassword(password)) {
      return '비밀번호는 대문자, 소문자, 숫자, 특수문자를 모두 포함해야 합니다.';
    }
    return '';
  };

  const validatePasswordConfirm = (password: string, passwordConfirm: string) => {
    if (!passwordConfirm) return '비밀번호 확인을 입력해주세요.';
    if (password !== passwordConfirm) return '비밀번호가 일치하지 않습니다.';
    return '';
  };

  const validateGender = (gender: string) => {
    if (!gender) return '성별을 선택해주세요.';
    return '';
  };

  const validateBirthDate = (birthDate: string) => {
    if (!birthDate) return '생년월일을 입력해주세요.';
    const date = new Date(birthDate);
    const today = new Date();
    if (date > today) return '생년월일은 오늘 이전이어야 합니다.';
    const age = today.getFullYear() - date.getFullYear();
    if (age < 14) return '만 14세 이상만 가입 가능합니다.';
    if (age > 120) return '올바른 생년월일을 입력해주세요.';
    return '';
  };

  const isFormValid = useMemo(() => {
    const emailError = validateEmail(formState.email);
    const nicknameError = validateNickname(formState.nickname);
    const passwordError = validatePassword(formState.password);
    const passwordConfirmError = validatePasswordConfirm(formState.password, formState.passwordConfirm);
    const genderError = validateGender(formState.gender);
    const birthDateError = validateBirthDate(formState.birthDate);

    return !emailError && !nicknameError && !passwordError && !passwordConfirmError && !genderError && !birthDateError;
  }, [formState]);

  const handleChange = (field: keyof RegisterFormState) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      setFormState((prev) => ({ ...prev, [field]: value }));

      // 실시간 유효성 검증
      let error = '';
      switch (field) {
        case 'email':
          error = validateEmail(value);
          break;
        case 'nickname':
          error = validateNickname(value);
          break;
        case 'password':
          error = validatePassword(value);
          // 비밀번호 변경 시 비밀번호 확인도 재검증
          if (formState.passwordConfirm) {
            setFieldErrors(prev => ({
              ...prev,
              passwordConfirm: validatePasswordConfirm(value, formState.passwordConfirm)
            }));
          }
          break;
        case 'passwordConfirm':
          error = validatePasswordConfirm(formState.password, value);
          break;
        case 'gender':
          error = validateGender(value);
          break;
        case 'birthDate':
          error = validateBirthDate(value);
          break;
      }
      setFieldErrors(prev => ({ ...prev, [field]: error }));
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
        gender: formState.gender as 'MALE' | 'FEMALE',
        birthDate: formState.birthDate,
      });

      setSuccessMessage('회원가입이 완료되었습니다. 메인 페이지로 이동합니다.');
      setFormState(defaultFormState);

      // 1초 후 메인 페이지로 리다이렉션
      setTimeout(() => {
        navigate('/');
      }, 1000);
    } catch (error) {
      if (isAxiosError(error)) {
        // 409 에러: 중복 (이메일 또는 닉네임)
        if (error.response?.status === 409) {
          const message = error.response?.data?.message || '이미 존재하는 정보입니다.';
          setErrorMessage(message);
        }
        // 400 에러: 잘못된 요청
        else if (error.response?.status === 400) {
          const message = error.response?.data?.message || '입력 정보를 확인해주세요.';
          setErrorMessage(message);
        }
        // 네트워크 에러
        else if (error.code === 'ERR_NETWORK') {
          setErrorMessage('서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.');
        }
        // 기타 에러
        else {
          const apiMessage = error.response?.data?.message || error.message;
          setErrorMessage(apiMessage || '회원가입 중 오류가 발생했습니다. 다시 시도해 주세요.');
        }
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
                className={`w-full rounded-xl border ${fieldErrors.email ? 'border-red-500' : 'border-slate-200'} bg-white px-4 py-3 text-base text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200`}
                autoComplete="email"
                required
              />
              {fieldErrors.email && (
                <p className="text-sm text-red-600">{fieldErrors.email}</p>
              )}
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
                className={`w-full rounded-xl border ${fieldErrors.nickname ? 'border-red-500' : 'border-slate-200'} bg-white px-4 py-3 text-base text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200`}
                autoComplete="nickname"
                required
              />
              {fieldErrors.nickname && (
                <p className="text-sm text-red-600">{fieldErrors.nickname}</p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="gender" className="text-sm font-medium text-slate-800">
                성별
              </label>
              <select
                id="gender"
                value={formState.gender}
                onChange={(e) => {
                  setFormState(prev => ({ ...prev, gender: e.target.value as 'MALE' | 'FEMALE' | '' }));
                  setFieldErrors(prev => ({ ...prev, gender: validateGender(e.target.value) }));
                }}
                className={`w-full rounded-xl border ${fieldErrors.gender ? 'border-red-500' : 'border-slate-200'} bg-white px-4 py-3 text-base text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200`}
                required
              >
                <option value="">선택해주세요</option>
                <option value="MALE">남성</option>
                <option value="FEMALE">여성</option>
              </select>
              {fieldErrors.gender && (
                <p className="text-sm text-red-600">{fieldErrors.gender}</p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="birthDate" className="text-sm font-medium text-slate-800">
                생년월일
              </label>
              <input
                id="birthDate"
                type="date"
                value={formState.birthDate}
                onChange={handleChange('birthDate')}
                className={`w-full rounded-xl border ${fieldErrors.birthDate ? 'border-red-500' : 'border-slate-200'} bg-white px-4 py-3 text-base text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200`}
                required
              />
              {fieldErrors.birthDate && (
                <p className="text-sm text-red-600">{fieldErrors.birthDate}</p>
              )}
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
                className={`w-full rounded-xl border ${fieldErrors.password ? 'border-red-500' : 'border-slate-200'} bg-white px-4 py-3 text-base text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200`}
                autoComplete="new-password"
                minLength={8}
                required
              />
              {fieldErrors.password && (
                <p className="text-sm text-red-600">{fieldErrors.password}</p>
              )}
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
                className={`w-full rounded-xl border ${fieldErrors.passwordConfirm ? 'border-red-500' : 'border-slate-200'} bg-white px-4 py-3 text-base text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200`}
                autoComplete="new-password"
                minLength={8}
                required
              />
              {fieldErrors.passwordConfirm && (
                <p className="text-sm text-red-600">{fieldErrors.passwordConfirm}</p>
              )}
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

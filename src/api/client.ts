/**
 * Axios 기반 API 클라이언트
 * - Base URL, timeout 등 기본 설정
 * - 요청/응답 인터셉터 적용
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import { ApiResponse, ApiError } from "@/types";

// ===== 환경변수 =====
// 개발 환경에서는 Vite 프록시를 사용하므로 "/api"만 사용
// 프로덕션 환경에서는 전체 URL 사용
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";
const API_TIMEOUT = Number(import.meta.env.VITE_API_TIMEOUT) || 10000;

// 디버깅: 현재 API 설정 출력
console.log('🔧 API Client Configuration:', {
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  env: import.meta.env.MODE,
  note: 'Using Vite proxy in development to avoid CORS issues',
});

/**
 * Axios 인스턴스 생성
 */
const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    "Content-Type": "application/json",
  },
});

// ===== 요청 인터셉터 =====
axiosInstance.interceptors.request.use(
  (config) => {
    // 로컬스토리지에서 액세스 토큰 가져오기
    const accessToken = localStorage.getItem("accessToken");

    if (accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    // 디버깅: 실제 요청 URL 출력
    const fullUrl = `${config.baseURL}${config.url}`;
    const params = config.params ? `?${new URLSearchParams(config.params).toString()}` : '';
    console.log('📡 API Request:', {
      method: config.method?.toUpperCase(),
      url: fullUrl + params,
      params: config.params,
    });

    return config;
  },
  (error) => {
    console.error('❌ API Request Error:', error);
    return Promise.reject(error);
  }
);

// ===== 응답 인터셉터 =====
axiosInstance.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    // 성공 응답 로그
    console.log('✅ API Response:', {
      status: response.status,
      url: response.config.url,
      data: response.data,
    });

    // 백엔드가 { status, body, message } 형태로 래핑하는 경우 body 추출
    if (response.data && typeof response.data === 'object' && 'body' in response.data) {
      console.log('🔄 Unwrapping response body:', response.data.body);
      return {
        ...response,
        data: response.data.body, // body를 실제 data로 사용
      };
    }

    return response;
  },
  async (error) => {
    // 에러 상세 로그
    console.error('❌ API Error:', {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      baseURL: error.config?.baseURL,
      data: error.response?.data,
    });

    const originalRequest = error.config;

    // 401 Unauthorized - 토큰 만료
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // 리프레시 토큰으로 액세스 토큰 갱신
        const refreshToken = localStorage.getItem("refreshToken");

        if (!refreshToken) {
          // 리프레시 토큰이 없으면 로그아웃 처리
          handleLogout();
          return Promise.reject(error);
        }

        // 토큰 갱신 요청
        const response = await axios.post(
          `${API_BASE_URL}/auth/refresh`,
          { refreshToken },
          { headers: { "Content-Type": "application/json" } }
        );

        const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data;

        // 새 토큰 저장
        localStorage.setItem("accessToken", newAccessToken);
        localStorage.setItem("refreshToken", newRefreshToken);

        // 원래 요청에 새 토큰 적용
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        // 원래 요청 재시도
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        // 토큰 갱신 실패 시 로그아웃
        handleLogout();
        return Promise.reject(refreshError);
      }
    }

    // 403 Forbidden - 권한 없음
    if (error.response?.status === 403) {
      console.error("접근 권한이 없습니다.");
      // TODO: 권한 없음 페이지로 리다이렉트
    }

    // 500 Internal Server Error
    if (error.response?.status === 500) {
      console.error("서버 에러가 발생했습니다.");
      // TODO: 에러 페이지로 리다이렉트 또는 토스트 표시
    }

    return Promise.reject(error);
  }
);

/**
 * 로그아웃 처리 (토큰 제거 및 로그인 페이지로 리다이렉트)
 */
function handleLogout() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("user");

  // TODO: 로그인 페이지로 리다이렉트
  // window.location.href = "/login";
  console.warn("로그아웃 처리됨 - 로그인 페이지로 이동 필요");
}

// ===== API 클라이언트 헬퍼 함수 =====

/**
 * GET 요청
 */
export async function get<T = unknown>(
  url: string,
  config?: AxiosRequestConfig
): Promise<T> {
  const response = await axiosInstance.get<T>(url, config);
  return response.data;
}

/**
 * POST 요청
 */
export async function post<T = unknown, D = unknown>(
  url: string,
  data?: D,
  config?: AxiosRequestConfig
): Promise<T> {
  const response = await axiosInstance.post<T>(url, data, config);
  return response.data;
}

/**
 * PUT 요청
 */
export async function put<T = unknown, D = unknown>(
  url: string,
  data?: D,
  config?: AxiosRequestConfig
): Promise<T> {
  const response = await axiosInstance.put<T>(url, data, config);
  return response.data;
}

/**
 * PATCH 요청
 */
export async function patch<T = unknown, D = unknown>(
  url: string,
  data?: D,
  config?: AxiosRequestConfig
): Promise<T> {
  const response = await axiosInstance.patch<T>(url, data, config);
  return response.data;
}

/**
 * DELETE 요청
 */
export async function del<T = unknown>(
  url: string,
  config?: AxiosRequestConfig
): Promise<T> {
  const response = await axiosInstance.delete<T>(url, config);
  return response.data;
}

/**
 * 파일 업로드 (multipart/form-data)
 */
export async function upload<T = unknown>(
  url: string,
  formData: FormData,
  onUploadProgress?: (progressEvent: { loaded: number; total?: number }) => void
): Promise<T> {
  const response = await axiosInstance.post<T>(url, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
    onUploadProgress,
  });
  return response.data;
}

// ===== Export =====

/**
 * 기본 Axios 인스턴스 (고급 사용을 위해 export)
 */
export { axiosInstance };

/**
 * API 클라이언트 객체
 */
export const apiClient = {
  get,
  post,
  put,
  patch,
  delete: del,
  upload,
};

export default apiClient;

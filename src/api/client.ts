/**
 * Axios 기반 API 클라이언트
 * - Base URL, timeout 등 기본 설정
 * - 요청/응답 인터셉터 적용
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import { ApiResponse } from "@/types";
import { getAccessToken } from "@/utils/auth";

// ===== 환경변수 =====
// 개발 환경에서는 Vite 프록시를 사용하므로 "/api"만 사용
// 프로덕션 환경에서는 전체 URL 사용
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";
const API_TIMEOUT = Number(import.meta.env.VITE_API_TIMEOUT) || 10000;

// 개발 환경에서만 API 설정 출력
if (import.meta.env.DEV) {
  console.log('🔧 API Client Configuration:', {
    baseURL: API_BASE_URL,
    timeout: API_TIMEOUT,
    env: import.meta.env.MODE,
    note: 'Using Vite proxy in development to avoid CORS issues',
  });
}

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
    // getAccessToken() 유틸리티를 사용하여 토큰 가져오기 (JSON.parse 자동 처리)
    const accessToken = getAccessToken();

    if (accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    // 개발 환경에서만 요청 URL 출력
    if (import.meta.env.DEV) {
      const fullUrl = `${config.baseURL}${config.url}`;
      const params = config.params ? `?${new URLSearchParams(config.params).toString()}` : '';
      console.log('📡 API Request:', {
        method: config.method?.toUpperCase(),
        url: fullUrl + params,
        params: config.params,
        headers: {
          Authorization: accessToken ? `Bearer ${accessToken.substring(0, 20)}...` : '❌ NO TOKEN',
        },
      });
    }

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
    // 개발 환경에서만 성공 응답 로그
    if (import.meta.env.DEV) {
      console.log('✅ API Response:', {
        status: response.status,
        url: response.config.url,
        data: response.data,
      });
    }

    // 백엔드가 { status, body, message } 형태로 래핑하는 경우 body 추출
    if (response.data && typeof response.data === 'object' && 'body' in response.data) {
      if (import.meta.env.DEV) {
        console.log('🔄 Unwrapping response body:', response.data.body);
      }
      return {
        ...response,
        data: response.data.body, // body를 실제 data로 사용
      };
    }

    return response;
  },
  async (error) => {
    // 네트워크 연결 오류 처리
    if (error.code === 'ERR_NETWORK' || error.message.includes('Network Error')) {
      console.error('❌ 백엔드 서버 연결 실패:', {
        message: '백엔드 서버가 실행되지 않았거나 연결할 수 없습니다.',
        expectedURL: `${error.config?.baseURL}${error.config?.url}`,
        solution: '백엔드 서버가 http://localhost:8080 에서 실행 중인지 확인하세요.',
      });
    }

    // Connection refused 오류 처리
    if (error.code === 'ECONNREFUSED' || error.message.includes('Connection refused')) {
      console.error('❌ 백엔드 서버 연결 거부:', {
        message: '백엔드 서버에 연결할 수 없습니다.',
        expectedURL: 'http://16.184.24.121:8080',
        solution: '1. 백엔드 서버를 시작하세요.\n2. 백엔드 서버가 다른 포트에서 실행 중이라면 vite.config.ts의 프록시 설정을 업데이트하세요.',
      });
    }

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

    // 401 Unauthorized - 토큰 만료 또는 인증 실패
    // 자동 로그아웃하지 않고 에러만 반환 (컴포넌트에서 처리)
    if (error.response?.status === 401) {
      console.warn('⚠️ 인증 필요 (401):', error.config?.url);
    }

    // 403 Forbidden - 권한 없음
    if (error.response?.status === 403) {
      console.error("❌ 403 Forbidden:", error.response?.data?.message || "접근 권한이 없습니다.");
    }

    // 404 Not Found
    if (error.response?.status === 404) {
      console.error("❌ 404 Not Found:", error.response?.data?.message || "리소스를 찾을 수 없습니다.");
    }

    // 500 Internal Server Error
    if (error.response?.status === 500) {
      console.error("❌ 500 Internal Server Error:", error.response?.data?.message || "서버 오류가 발생했습니다.");
    }

    // 모든 에러는 조용히 반환 (컴포넌트에서 처리)
    return Promise.reject(error);
  }
);

// handleLogout 함수 제거: 더 이상 강제 로그인 페이지 리다이렉트 안 함

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

import React, { Suspense, lazy } from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { ToastProvider } from "@/components/Toast/ToastProvider";
import { ChatProvider } from "@/contexts/ChatContext";
import { Loading } from "@/components/Loading";

import "./index.css";

import App from "./App";
import { queryClient } from "@/lib/queryClient";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";

// 코드 스플리팅: 페이지 컴포넌트들을 lazy loading으로 분리
// ⚠️ 주의: ProtectedRoute와 Suspense 순서는 절대 변경하지 마세요!
// ProtectedRoute > Suspense > Component 순서가 보안과 UX를 보장합니다.

const HOM_01 = lazy(() => import("@/pages/HOM_01"));
const BRD_04 = lazy(() => import("@/pages/BRD_04").then(m => ({ default: m.BRD_List })));
const BRD_05 = lazy(() => import("@/pages/BRD_05"));
const BRD_06 = lazy(() => import("@/pages/BRD_06").then(m => ({ default: m.BRD_06 })));
const CAL_11 = lazy(() => import("@/pages/CAL_11"));
const PRF_10 = lazy(() => import("@/pages/PRF_10"));
const SET_13 = lazy(() => import("@/pages/SET_13"));
const MYB_14 = lazy(() => import("@/pages/MYB_14"));
const MyLibraryWishlist = lazy(() => import("@/pages/MyLibraryWishlist"));
const MyLibraryReviews = lazy(() => import("@/pages/MyLibraryReviews"));
const MyLibraryHighlights = lazy(() => import("@/pages/MyLibraryHighlights"));
const LibrarySearch = lazy(() => import("@/pages/LibrarySearch"));
const BOD_15 = lazy(() => import("@/pages/BOD_15"));
const CHT_17 = lazy(() => import("@/pages/CHT_17"));
const LOG_02 = lazy(() => import("@/pages/LOG_02"));
const REG_03 = lazy(() => import("@/pages/REG_03"));
const FID_18 = lazy(() => import("@/pages/FID_18"));
const GRP_Create = lazy(() => import("@/pages/GRP_Create").then(m => ({ default: m.GRP_Create })));

// Lazy 컴포넌트 preload 함수들 (성능 최적화용)
// ⚠️ 주의: preload는 ProtectedRoute 체크 전에 실행될 수 있지만,
// 실제 렌더링은 ProtectedRoute가 제어하므로 안전합니다.
// 
// React.lazy()의 내부 구조에 접근하여 미리 로드합니다.
// 타입 안전성을 위해 any를 사용하지만, 런타임에서만 접근합니다.
function preloadLazyComponent(component: React.LazyExoticComponent<React.ComponentType<any>>): void {
  try {
    // React.lazy()는 내부적으로 Promise를 가지고 있음
    // 컴포넌트를 한 번 호출하면 자동으로 로드됨
    const payload = (component as any)._payload;
    if (payload?._result) {
      // Promise를 미리 시작 (에러는 무시)
      payload._result.catch(() => {});
    }
  } catch {
    // 실패해도 무시 (나중에 자동으로 로드됨)
  }
}

export const preloadRoutes = {
  boards: () => preloadLazyComponent(BRD_04),
  calendar: () => preloadLazyComponent(CAL_11),
  mypage: () => preloadLazyComponent(PRF_10),
  library: () => preloadLazyComponent(MYB_14),
  chat: () => preloadLazyComponent(CHT_17),
  settings: () => preloadLazyComponent(SET_13),
} as const;

// Suspense Fallback 컴포넌트
const PageLoader = () => <Loading message="페이지를 불러오는 중..." />;

const router = createBrowserRouter([
  // 로그인/회원가입/찾기 페이지 (헤더 없음)
  { path: "/login", element: <Suspense fallback={<PageLoader />}><LOG_02 /></Suspense> },
  { path: "/register", element: <Suspense fallback={<PageLoader />}><REG_03 /></Suspense> },
  { path: "/find", element: <Suspense fallback={<PageLoader />}><FID_18 /></Suspense> },

  // 메인 앱 레이아웃 (헤더 있음)
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <Suspense fallback={<PageLoader />}><HOM_01 /></Suspense> },
      { path: "boards", element: <Suspense fallback={<PageLoader />}><BRD_04 /></Suspense> },
      { path: "boards/write", element: <ProtectedRoute><Suspense fallback={<PageLoader />}><BRD_06 /></Suspense></ProtectedRoute>},
      { path: "boards/group/create", element: <ProtectedRoute><Suspense fallback={<PageLoader />}><GRP_Create /></Suspense></ProtectedRoute>},
      { path: "boards/:postId/edit", element: <ProtectedRoute><Suspense fallback={<PageLoader />}><BRD_06 /></Suspense></ProtectedRoute>},
      { path: "boards/:postId", element: <Suspense fallback={<PageLoader />}><BRD_05 /></Suspense> },
      { path: "calendar", element: <ProtectedRoute><Suspense fallback={<PageLoader />}><CAL_11 /></Suspense></ProtectedRoute> },
      { path: "mypage", element: <ProtectedRoute><Suspense fallback={<PageLoader />}><PRF_10 /></Suspense></ProtectedRoute> },
      { path: "users/:userId", element: <ProtectedRoute><Suspense fallback={<PageLoader />}><PRF_10 /></Suspense></ProtectedRoute> },
      { path: "settings", element: <ProtectedRoute><Suspense fallback={<PageLoader />}><SET_13 /></Suspense></ProtectedRoute> },
      { path: "my-library", element: <ProtectedRoute><Suspense fallback={<PageLoader />}><MYB_14 /></Suspense></ProtectedRoute> },
      { path: "my-library/wishlist", element: <ProtectedRoute><Suspense fallback={<PageLoader />}><MyLibraryWishlist /></Suspense></ProtectedRoute> },
      { path: "my-library/reviews", element: <ProtectedRoute><Suspense fallback={<PageLoader />}><MyLibraryReviews /></Suspense></ProtectedRoute> },
      { path: "my-library/highlights", element: <ProtectedRoute><Suspense fallback={<PageLoader />}><MyLibraryHighlights /></Suspense></ProtectedRoute> },
      { path: "my-library/search", element: <ProtectedRoute><Suspense fallback={<PageLoader />}><LibrarySearch /></Suspense></ProtectedRoute> },
      { path: "books/isbn/:isbn", element: <Suspense fallback={<PageLoader />}><BOD_15 /></Suspense> },
      { path: "books/:bookId", element: <Suspense fallback={<PageLoader />}><BOD_15 /></Suspense> },
      { path: "chat", element: <ProtectedRoute><Suspense fallback={<PageLoader />}><CHT_17 /></Suspense></ProtectedRoute> },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ToastProvider>
          <ChatProvider>
            <RouterProvider router={router} />
          </ChatProvider>
        </ToastProvider>
      </AuthProvider>
    </QueryClientProvider>
  </React.StrictMode>
);

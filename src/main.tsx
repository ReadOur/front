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
const HOM_01 = lazy(() => import("@/pages/HOM_01"));
const BRD_04 = lazy(() => import("@/pages/BRD_04").then(m => ({ default: m.BRD_List })));
const BRD_05 = lazy(() => import("@/pages/BRD_05"));
const BRD_06 = lazy(() => import("@/pages/BRD_06").then(m => ({ default: m.BRD_06 })));
const CAL_11 = lazy(() => import("@/pages/CAL_11"));
const PRF_10 = lazy(() => import("@/pages/PRF_10"));
const SET_13 = lazy(() => import("@/pages/SET_13"));
const MYB_14 = lazy(() => import("@/pages/MYB_14"));
const LibrarySearch = lazy(() => import("@/pages/LibrarySearch"));
const BOD_15 = lazy(() => import("@/pages/BOD_15"));
const CHT_17 = lazy(() => import("@/pages/CHT_17"));
const LOG_02 = lazy(() => import("@/pages/LOG_02"));
const REG_03 = lazy(() => import("@/pages/REG_03"));
const FID_18 = lazy(() => import("@/pages/FID_18"));
const GRP_Create = lazy(() => import("@/pages/GRP_Create").then(m => ({ default: m.GRP_Create })));

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

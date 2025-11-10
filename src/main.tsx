import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { ToastProvider } from "@/components/Toast/ToastProvider";
import { ChatProvider } from "@/contexts/ChatContext";

import "./index.css";

import App from "./App";
import { BRD_List } from "@/pages/BRD_04";
import PostShow from "@/pages/BRD_05";
import { BRD_06 } from '@/pages/BRD_06';
import CAL_11 from "@/pages/CAL_11";
import PRF_10 from "@/pages/PRF_10";
import SET_13 from "@/pages/SET_13";
import MYB_14 from "@/pages/MYB_14";
import LibrarySearch from "@/pages/LibrarySearch";
import BOD_15 from "@/pages/BOD_15";
import CHT_17 from "@/pages/CHT_17";
import LOG_02 from "@/pages/LOG_02";
import REG_03 from "@/pages/REG_03";
import FID_18 from "@/pages/FID_18";
import { queryClient } from "@/lib/queryClient";
import { AuthProvider } from "@/contexts/AuthContext";

const router = createBrowserRouter([
  // 로그인/회원가입/찾기 페이지 (헤더 없음)
  { path: "/login", element: <LOG_02 /> },
  { path: "/register", element: <REG_03 /> },
  { path: "/find", element: <FID_18 /> },

  // 메인 앱 레이아웃 (헤더 있음)
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <BRD_List /> },
      { path: "boards", element: <BRD_List /> },
      { path: "boards/write", element: <BRD_06 />},
      { path: "boards/:postId/edit", element: <BRD_06 />},
      { path: "boards/:postId", element: <PostShow /> },
      { path: "calendar", element: <CAL_11 /> },
      { path: "mypage", element: <PRF_10 /> },
      { path: "settings", element: <SET_13 /> },
      { path: "library", element: <MYB_14 /> },
      { path: "library/search", element: <LibrarySearch /> },
      { path: "books/:bookId", element: <BOD_15 /> },
      { path: "chat", element: <CHT_17 /> },
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

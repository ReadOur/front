import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { ToastProvider } from "@/components/Toast/ToastProvider";

import "./index.css";

import App from "./App";
import { BRD_List } from "@/pages/BRD_04";
import PostShow from "@/pages/BRD_05";
import { BRD_06 } from '@/pages/BRD_06';
import CAL_11 from "@/pages/CAL_11";
import { queryClient } from "@/lib/queryClient";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />, // 전역 레이아웃

    children: [
      { index: true, element: <BRD_List /> },
      { path: "boards", element: <BRD_List /> },
      { path: "boards/write", element: <BRD_06 />},
      { path: "boards/:postId/edit", element: <BRD_06 />},
      { path: "boards/:postId", element: <PostShow /> },
      { path: "calendar", element: <CAL_11 /> },
      // 아직 없는 라우트들도 차후에 추가할 수 있음:
      // { path: "mypage", element: <MyPage /> },
      // { path: "library", element: <Library /> },
      // { path: "settings", element: <Settings /> },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <RouterProvider router={router} />
      </ToastProvider>
    </QueryClientProvider>
  </React.StrictMode>
);

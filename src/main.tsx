import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";

import "./index.css";

import App from "./App";
import HOM_01 from "@/pages/HOM_01";
import Boards from "@/pages/BRD_04";
import PostShow from "@/pages/BRD_05";
import ChatPage from "@/pages/MSG_07";
import CAL_11 from "@/pages/CAL_11";
import { queryClient } from "@/lib/queryClient";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />, // 전역 레이아웃
    children: [
      { index: true, element: <HOM_01 /> },
      { path: "boards", element: <Boards /> },
      { path: "boards/:postId", element: <PostShow /> },
      { path: "chat", element: <ChatPage /> },
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
      <RouterProvider router={router} />
    </QueryClientProvider>
  </React.StrictMode>
);

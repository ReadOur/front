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
import PRF_10 from "@/pages/PRF_10";
import SET_13 from "@/pages/SET_13";
import MYB_14 from "@/pages/MYB_14";
import LibrarySearch from "@/pages/LibrarySearch";
import BOD_15 from "@/pages/BOD_15";
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
      { path: "mypage", element: <PRF_10 /> },
      { path: "settings", element: <SET_13 /> },
      { path: "library", element: <MYB_14 /> },
      { path: "library/search", element: <LibrarySearch /> },
      { path: "books/:bookId", element: <BOD_15 /> },
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

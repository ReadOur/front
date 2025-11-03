import { jsx as _jsx } from "react/jsx-runtime";
import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./index.css";
import App from "./App";
import HOM_01 from "@/pages/HOM_01";
import Boards from "@/pages/BRD_04";
import ChatPage from "@/pages/MSG_07";
import CAL_11 from "@/pages/CAL_11";
const router = createBrowserRouter([
    {
        path: "/",
        element: _jsx(App, {}), // 전역 레이아웃
        children: [
            { index: true, element: _jsx(HOM_01, {}) },
            { path: "boards", element: _jsx(Boards, {}) },
            { path: "chat", element: _jsx(ChatPage, {}) },
            { path: "calendar", element: _jsx(CAL_11, {}) },
            // 아직 없는 라우트들도 차후에 추가할 수 있음:
            // { path: "mypage", element: <MyPage /> },
            // { path: "library", element: <Library /> },
            // { path: "settings", element: <Settings /> },
        ],
    },
]);
ReactDOM.createRoot(document.getElementById("root")).render(_jsx(React.StrictMode, { children: _jsx(RouterProvider, { router: router }) }));

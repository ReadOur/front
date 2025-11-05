// SET_13.tsx - 설정 페이지
import React, { useState } from "react";

// 목업 데이터 (나중에 API로 교체)
const mockUserData = {
  name: "홍길동",
  nickname: "독서왕",
  email: "hong@example.com",
  personalInfo: "개인정보",
  favoriteLibraries: ["구미 도서관", "서울 중앙 도서관"],
};

type TabType = "profile" | "security";

export default function SET_13() {
  const [activeTab, setActiveTab] = useState<TabType>("profile");
  const [userData, setUserData] = useState(mockUserData);

  // 수정 핸들러 (나중에 모달/폼으로 구현)
  const handleEdit = (field: string) => {
    console.log(`수정: ${field}`);
    // TODO: 모달 열기 또는 인라인 편집
  };

  // 도서관 추가 핸들러
  const handleAddLibrary = () => {
    console.log("관심 도서관 추가");
    // TODO: 도서관 선택 모달 열기
  };

  // 도서관 삭제 핸들러
  const handleRemoveLibrary = (library: string) => {
    setUserData({
      ...userData,
      favoriteLibraries: userData.favoriteLibraries.filter((lib) => lib !== library),
    });
  };

  return (
    <div
      className="w-full min-h-screen"
      style={{ background: "#FFF9F2" }}
    >
      <div className="max-w-[1400px] mx-auto px-8 py-12">
        <div className="flex gap-8">
          {/* 좌측 사이드바 */}
          <div
            className="w-[415px] rounded-lg p-8"
            style={{ background: "#E9E5DC" }}
          >
            {/* 사용자 이름 */}
            <div className="mb-16 text-center">
              <h2
                className="text-[32px] font-semibold"
                style={{ color: "black", lineHeight: "44.8px" }}
              >
                {userData.name}
              </h2>
            </div>

            {/* 탭 메뉴 */}
            <div className="space-y-2">
              <button
                onClick={() => setActiveTab("profile")}
                className={`w-full text-left px-6 py-4 rounded transition ${
                  activeTab === "profile" ? "shadow-sm" : ""
                }`}
                style={{
                  background: activeTab === "profile" ? "#FFF9F2" : "transparent",
                  color: "black",
                  fontSize: "32px",
                  fontWeight: 600,
                  lineHeight: "44.8px",
                }}
              >
                프로필
              </button>
              <button
                onClick={() => setActiveTab("security")}
                className={`w-full text-left px-6 py-4 rounded transition ${
                  activeTab === "security" ? "shadow-sm" : ""
                }`}
                style={{
                  background: activeTab === "security" ? "#FFF9F2" : "transparent",
                  color: "black",
                  fontSize: "32px",
                  fontWeight: 600,
                  lineHeight: "44.8px",
                }}
              >
                보안
              </button>
            </div>
          </div>

          {/* 우측 메인 영역 */}
          <div className="flex-1">
            {activeTab === "profile" && (
              <div className="space-y-6">
                {/* 닉네임 */}
                <div
                  className="flex items-center justify-between px-6 py-6 rounded"
                  style={{ background: "#E9E5DC" }}
                >
                  <span
                    className="flex-1"
                    style={{
                      color: "black",
                      fontSize: "36px",
                      opacity: 0.6,
                      lineHeight: "36px",
                    }}
                  >
                    닉네임
                  </span>
                  <button
                    onClick={() => handleEdit("nickname")}
                    className="px-6 py-3 rounded hover:opacity-80 transition"
                    style={{
                      background: "#6B4F3F",
                      opacity: 0.3,
                    }}
                  >
                    <span
                      style={{
                        color: "black",
                        fontSize: "36px",
                        opacity: 0.7,
                        lineHeight: "36px",
                      }}
                    >
                      수정
                    </span>
                  </button>
                </div>

                {/* 이메일 */}
                <div
                  className="flex items-center justify-between px-6 py-6 rounded"
                  style={{ background: "#E9E5DC" }}
                >
                  <span
                    className="flex-1"
                    style={{
                      color: "black",
                      fontSize: "36px",
                      opacity: 0.6,
                      lineHeight: "36px",
                    }}
                  >
                    이메일
                  </span>
                  <button
                    onClick={() => handleEdit("email")}
                    className="px-6 py-3 rounded hover:opacity-80 transition"
                    style={{
                      background: "#6B4F3F",
                      opacity: 0.3,
                    }}
                  >
                    <span
                      style={{
                        color: "black",
                        fontSize: "36px",
                        opacity: 0.7,
                        lineHeight: "36px",
                      }}
                    >
                      수정
                    </span>
                  </button>
                </div>

                {/* 개인정보 수정 */}
                <div
                  className="flex items-center justify-between px-6 py-6 rounded"
                  style={{ background: "#E9E5DC" }}
                >
                  <span
                    className="flex-1"
                    style={{
                      color: "black",
                      fontSize: "36px",
                      opacity: 0.6,
                      lineHeight: "36px",
                    }}
                  >
                    개인정보 수정
                  </span>
                  <button
                    onClick={() => handleEdit("personalInfo")}
                    className="px-6 py-3 rounded hover:opacity-80 transition"
                    style={{
                      background: "#6B4F3F",
                      opacity: 0.3,
                    }}
                  >
                    <span
                      style={{
                        color: "black",
                        fontSize: "36px",
                        opacity: 0.7,
                        lineHeight: "36px",
                      }}
                    >
                      수정
                    </span>
                  </button>
                </div>

                {/* 관심 도서관 */}
                <div
                  className="px-6 py-6 rounded"
                  style={{ background: "#E9E5DC" }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <span
                      className="flex-1"
                      style={{
                        color: "black",
                        fontSize: "36px",
                        opacity: 0.6,
                        lineHeight: "36px",
                      }}
                    >
                      관심 도서관
                    </span>
                    <button
                      onClick={handleAddLibrary}
                      className="px-6 py-3 rounded hover:opacity-80 transition"
                      style={{
                        background: "#6B4F3F",
                        opacity: 0.3,
                      }}
                    >
                      <span
                        style={{
                          color: "black",
                          fontSize: "36px",
                          opacity: 0.7,
                          lineHeight: "36px",
                        }}
                      >
                        추가
                      </span>
                    </button>
                  </div>

                  {/* 도서관 태그들 */}
                  <div className="flex flex-wrap gap-3 mt-4">
                    {userData.favoriteLibraries.map((library, index) => (
                      <div
                        key={index}
                        className="px-6 py-2 rounded-[30px] flex items-center gap-2 group cursor-pointer hover:opacity-80 transition"
                        style={{ background: "#D9D9D9" }}
                      >
                        <span
                          style={{
                            color: "black",
                            fontSize: "16px",
                            lineHeight: "16px",
                          }}
                        >
                          {library}
                        </span>
                        <button
                          onClick={() => handleRemoveLibrary(library)}
                          className="opacity-0 group-hover:opacity-100 transition ml-2"
                          style={{ color: "#6B4F3F" }}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "security" && (
              <div className="space-y-6">
                {/* 보안 설정 항목들 (나중에 추가 가능) */}
                <div
                  className="flex items-center justify-between px-6 py-6 rounded"
                  style={{ background: "#E9E5DC" }}
                >
                  <span
                    className="flex-1"
                    style={{
                      color: "black",
                      fontSize: "36px",
                      opacity: 0.6,
                      lineHeight: "36px",
                    }}
                  >
                    비밀번호 변경
                  </span>
                  <button
                    onClick={() => handleEdit("password")}
                    className="px-6 py-3 rounded hover:opacity-80 transition"
                    style={{
                      background: "#6B4F3F",
                      opacity: 0.3,
                    }}
                  >
                    <span
                      style={{
                        color: "black",
                        fontSize: "36px",
                        opacity: 0.7,
                        lineHeight: "36px",
                      }}
                    >
                      수정
                    </span>
                  </button>
                </div>

                <div
                  className="flex items-center justify-between px-6 py-6 rounded"
                  style={{ background: "#E9E5DC" }}
                >
                  <span
                    className="flex-1"
                    style={{
                      color: "black",
                      fontSize: "36px",
                      opacity: 0.6,
                      lineHeight: "36px",
                    }}
                  >
                    2단계 인증
                  </span>
                  <button
                    onClick={() => handleEdit("2fa")}
                    className="px-6 py-3 rounded hover:opacity-80 transition"
                    style={{
                      background: "#6B4F3F",
                      opacity: 0.3,
                    }}
                  >
                    <span
                      style={{
                        color: "black",
                        fontSize: "36px",
                        opacity: 0.7,
                        lineHeight: "36px",
                      }}
                    >
                      설정
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

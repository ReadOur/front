// SET_13.tsx - 설정 페이지
import React, { useState } from "react";

// TODO: API 연동 시 아래 서비스를 import 하세요
// import { updateUserNickname, updateUserEmail, updateUserPersonalInfo } from "@/services/userService";

// 목업 데이터 (나중에 API로 교체)
const mockUserData = {
  name: "홍길동",
  nickname: "독서왕",
  email: "hong@example.com",
  personalInfo: "개인정보",
  favoriteLibraries: ["구미 도서관", "서울 중앙 도서관"],
};

/**
 * API 연동 가이드:
 *
 * 1. 닉네임 수정 API
 *    - Endpoint: PATCH /api/users/me/nickname
 *    - Request Body: { nickname: string }
 *    - Response: { success: boolean, data: { nickname: string } }
 *
 * 2. 이메일 수정 API
 *    - Endpoint: PATCH /api/users/me/email
 *    - Request Body: { email: string }
 *    - Response: { success: boolean, data: { email: string } }
 *
 * 3. 개인정보 수정 API
 *    - Endpoint: PATCH /api/users/me/personal-info
 *    - Request Body: { personalInfo: string }
 *    - Response: { success: boolean, data: { personalInfo: string } }
 */

type TabType = "profile" | "security";

export default function SET_13() {
  const [activeTab, setActiveTab] = useState<TabType>("profile");
  const [userData, setUserData] = useState(mockUserData);

  // 편집 모드 상태 관리
  const [isEditingNickname, setIsEditingNickname] = useState(false);
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [isEditingPersonalInfo, setIsEditingPersonalInfo] = useState(false);

  // 임시 값 상태
  const [tempNickname, setTempNickname] = useState(userData.nickname);
  const [tempEmail, setTempEmail] = useState(userData.email);
  const [tempPersonalInfo, setTempPersonalInfo] = useState(userData.personalInfo);

  // 닉네임 수정 핸들러
  const handleEditNickname = () => {
    setTempNickname(userData.nickname);
    setIsEditingNickname(true);
  };

  const handleSaveNickname = async () => {
    try {
      // TODO: API 호출 시 아래 주석을 해제하고 사용하세요
      // const response = await updateUserNickname(tempNickname);
      // if (response.success) {
      //   setUserData({ ...userData, nickname: response.data.nickname });
      //   alert('닉네임이 성공적으로 변경되었습니다.');
      // }

      // 임시: 로컬 상태만 업데이트
      setUserData({ ...userData, nickname: tempNickname });
      setIsEditingNickname(false);
      console.log('닉네임 수정:', tempNickname);
    } catch (error) {
      console.error('닉네임 수정 실패:', error);
      // alert('닉네임 수정에 실패했습니다. 다시 시도해주세요.');
    }
  };

  const handleCancelNickname = () => {
    setTempNickname(userData.nickname);
    setIsEditingNickname(false);
  };

  // 이메일 수정 핸들러
  const handleEditEmail = () => {
    setTempEmail(userData.email);
    setIsEditingEmail(true);
  };

  const handleSaveEmail = async () => {
    try {
      // TODO: API 호출 시 아래 주석을 해제하고 사용하세요
      // const response = await updateUserEmail(tempEmail);
      // if (response.success) {
      //   setUserData({ ...userData, email: response.data.email });
      //   alert('이메일이 성공적으로 변경되었습니다.');
      // }

      // 임시: 로컬 상태만 업데이트
      setUserData({ ...userData, email: tempEmail });
      setIsEditingEmail(false);
      console.log('이메일 수정:', tempEmail);
    } catch (error) {
      console.error('이메일 수정 실패:', error);
      // alert('이메일 수정에 실패했습니다. 다시 시도해주세요.');
    }
  };

  const handleCancelEmail = () => {
    setTempEmail(userData.email);
    setIsEditingEmail(false);
  };

  // 개인정보 수정 핸들러
  const handleEditPersonalInfo = () => {
    setTempPersonalInfo(userData.personalInfo);
    setIsEditingPersonalInfo(true);
  };

  const handleSavePersonalInfo = async () => {
    try {
      // TODO: API 호출 시 아래 주석을 해제하고 사용하세요
      // const response = await updateUserPersonalInfo(tempPersonalInfo);
      // if (response.success) {
      //   setUserData({ ...userData, personalInfo: response.data.personalInfo });
      //   alert('개인정보가 성공적으로 변경되었습니다.');
      // }

      // 임시: 로컬 상태만 업데이트
      setUserData({ ...userData, personalInfo: tempPersonalInfo });
      setIsEditingPersonalInfo(false);
      console.log('개인정보 수정:', tempPersonalInfo);
    } catch (error) {
      console.error('개인정보 수정 실패:', error);
      // alert('개인정보 수정에 실패했습니다. 다시 시도해주세요.');
    }
  };

  const handleCancelPersonalInfo = () => {
    setTempPersonalInfo(userData.personalInfo);
    setIsEditingPersonalInfo(false);
  };

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
                  className="flex items-center gap-4 px-6 py-6 rounded"
                  style={{ background: "#E9E5DC" }}
                >
                  <span
                    style={{
                      color: "black",
                      fontSize: "36px",
                      opacity: 0.6,
                      lineHeight: "36px",
                      minWidth: "120px",
                    }}
                  >
                    닉네임
                  </span>
                  {!isEditingNickname ? (
                    <>
                      <span
                        className="flex-1"
                        style={{
                          color: "black",
                          fontSize: "28px",
                          lineHeight: "36px",
                        }}
                      >
                        {userData.nickname}
                      </span>
                      <button
                        onClick={handleEditNickname}
                        className="px-6 py-3 rounded hover:opacity-90 transition"
                        style={{
                          background: "#6B4F3F",
                          color: "white",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "28px",
                            lineHeight: "36px",
                          }}
                        >
                          수정
                        </span>
                      </button>
                    </>
                  ) : (
                    <>
                      <input
                        type="text"
                        value={tempNickname}
                        onChange={(e) => setTempNickname(e.target.value)}
                        className="flex-1 px-4 py-2 rounded"
                        style={{
                          background: "#FFF9F2",
                          color: "black",
                          fontSize: "28px",
                          lineHeight: "36px",
                          border: "2px solid #6B4F3F",
                        }}
                      />
                      <button
                        onClick={handleSaveNickname}
                        className="px-6 py-3 rounded hover:opacity-90 transition"
                        style={{
                          background: "#6B4F3F",
                          color: "white",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "28px",
                            lineHeight: "36px",
                          }}
                        >
                          저장
                        </span>
                      </button>
                      <button
                        onClick={handleCancelNickname}
                        className="px-6 py-3 rounded hover:opacity-90 transition"
                        style={{
                          background: "#D9D9D9",
                          color: "black",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "28px",
                            lineHeight: "36px",
                          }}
                        >
                          취소
                        </span>
                      </button>
                    </>
                  )}
                </div>

                {/* 이메일 */}
                <div
                  className="flex items-center gap-4 px-6 py-6 rounded"
                  style={{ background: "#E9E5DC" }}
                >
                  <span
                    style={{
                      color: "black",
                      fontSize: "36px",
                      opacity: 0.6,
                      lineHeight: "36px",
                      minWidth: "120px",
                    }}
                  >
                    이메일
                  </span>
                  {!isEditingEmail ? (
                    <>
                      <span
                        className="flex-1"
                        style={{
                          color: "black",
                          fontSize: "28px",
                          lineHeight: "36px",
                        }}
                      >
                        {userData.email}
                      </span>
                      <button
                        onClick={handleEditEmail}
                        className="px-6 py-3 rounded hover:opacity-90 transition"
                        style={{
                          background: "#6B4F3F",
                          color: "white",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "28px",
                            lineHeight: "36px",
                          }}
                        >
                          수정
                        </span>
                      </button>
                    </>
                  ) : (
                    <>
                      <input
                        type="email"
                        value={tempEmail}
                        onChange={(e) => setTempEmail(e.target.value)}
                        className="flex-1 px-4 py-2 rounded"
                        style={{
                          background: "#FFF9F2",
                          color: "black",
                          fontSize: "28px",
                          lineHeight: "36px",
                          border: "2px solid #6B4F3F",
                        }}
                      />
                      <button
                        onClick={handleSaveEmail}
                        className="px-6 py-3 rounded hover:opacity-90 transition"
                        style={{
                          background: "#6B4F3F",
                          color: "white",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "28px",
                            lineHeight: "36px",
                          }}
                        >
                          저장
                        </span>
                      </button>
                      <button
                        onClick={handleCancelEmail}
                        className="px-6 py-3 rounded hover:opacity-90 transition"
                        style={{
                          background: "#D9D9D9",
                          color: "black",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "28px",
                            lineHeight: "36px",
                          }}
                        >
                          취소
                        </span>
                      </button>
                    </>
                  )}
                </div>

                {/* 개인정보 수정 */}
                <div
                  className="flex items-center gap-4 px-6 py-6 rounded"
                  style={{ background: "#E9E5DC" }}
                >
                  <span
                    style={{
                      color: "black",
                      fontSize: "36px",
                      opacity: 0.6,
                      lineHeight: "36px",
                      minWidth: "240px",
                    }}
                  >
                    개인정보
                  </span>
                  {!isEditingPersonalInfo ? (
                    <>
                      <span
                        className="flex-1"
                        style={{
                          color: "black",
                          fontSize: "28px",
                          lineHeight: "36px",
                        }}
                      >
                        {userData.personalInfo}
                      </span>
                      <button
                        onClick={handleEditPersonalInfo}
                        className="px-6 py-3 rounded hover:opacity-90 transition"
                        style={{
                          background: "#6B4F3F",
                          color: "white",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "28px",
                            lineHeight: "36px",
                          }}
                        >
                          수정
                        </span>
                      </button>
                    </>
                  ) : (
                    <>
                      <input
                        type="text"
                        value={tempPersonalInfo}
                        onChange={(e) => setTempPersonalInfo(e.target.value)}
                        className="flex-1 px-4 py-2 rounded"
                        style={{
                          background: "#FFF9F2",
                          color: "black",
                          fontSize: "28px",
                          lineHeight: "36px",
                          border: "2px solid #6B4F3F",
                        }}
                      />
                      <button
                        onClick={handleSavePersonalInfo}
                        className="px-6 py-3 rounded hover:opacity-90 transition"
                        style={{
                          background: "#6B4F3F",
                          color: "white",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "28px",
                            lineHeight: "36px",
                          }}
                        >
                          저장
                        </span>
                      </button>
                      <button
                        onClick={handleCancelPersonalInfo}
                        className="px-6 py-3 rounded hover:opacity-90 transition"
                        style={{
                          background: "#D9D9D9",
                          color: "black",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "28px",
                            lineHeight: "36px",
                          }}
                        >
                          취소
                        </span>
                      </button>
                    </>
                  )}
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

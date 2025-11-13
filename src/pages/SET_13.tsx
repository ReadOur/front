// SET_13.tsx - 설정 페이지
import React, { useState } from "react";
import { apiClient } from "@/api/client";
import { LIBRARY_ENDPOINTS } from "@/api/endpoints";
import { changePassword } from "@/services/authService";
import { isAxiosError } from "axios";

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
  const [isAddingLibrary, setIsAddingLibrary] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // 임시 값 상태
  const [tempNickname, setTempNickname] = useState(userData.nickname);
  const [tempEmail, setTempEmail] = useState(userData.email);
  const [tempPersonalInfo, setTempPersonalInfo] = useState(userData.personalInfo);
  const [tempLibraryName, setTempLibraryName] = useState("");

  // 비밀번호 변경 상태
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

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

  // 비밀번호 변경 핸들러
  const handleEditPassword = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setPasswordError(null);
    setPasswordSuccess(false);
    setIsChangingPassword(true);
  };

  const handleSavePassword = async () => {
    setPasswordError(null);
    setPasswordSuccess(false);

    // 유효성 검증
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError("모든 필드를 입력해주세요.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("새 비밀번호가 일치하지 않습니다.");
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError("새 비밀번호는 최소 8자 이상이어야 합니다.");
      return;
    }

    try {
      await changePassword({
        currentPassword,
        newPassword,
      });

      setPasswordSuccess(true);
      setIsChangingPassword(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      // 3초 후 성공 메시지 제거
      setTimeout(() => setPasswordSuccess(false), 3000);
    } catch (error) {
      if (isAxiosError(error)) {
        if (error.response?.status === 401) {
          setPasswordError("현재 비밀번호가 올바르지 않습니다.");
        } else if (error.code === 'ERR_NETWORK') {
          setPasswordError("서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.");
        } else {
          const message = error.response?.data?.message || error.message;
          setPasswordError(message || "비밀번호 변경 중 오류가 발생했습니다.");
        }
      } else {
        setPasswordError("알 수 없는 오류가 발생했습니다.");
      }
    }
  };

  const handleCancelPassword = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setPasswordError(null);
    setPasswordSuccess(false);
    setIsChangingPassword(false);
  };

  // 수정 핸들러 (나중에 모달/폼으로 구현)
  const handleEdit = (field: string) => {
    console.log(`수정: ${field}`);
    // TODO: 모달 열기 또는 인라인 편집
  };

  // 도서관 추가 핸들러
  const handleAddLibrary = () => {
    setTempLibraryName("");
    setIsAddingLibrary(true);
  };

  const handleSaveLibrary = async () => {
    if (!tempLibraryName.trim()) {
      alert("도서관 이름을 입력해주세요.");
      return;
    }

    try {
      // API 호출: 관심 도서관 추가
      await apiClient.post(LIBRARY_ENDPOINTS.ADD_FAVORITE_LIBRARY, {
        libraryName: tempLibraryName.trim(),
      });

      // 로컬 상태 업데이트
      setUserData({
        ...userData,
        favoriteLibraries: [...userData.favoriteLibraries, tempLibraryName.trim()],
      });
      setIsAddingLibrary(false);
      setTempLibraryName("");
      console.log("관심 도서관 추가:", tempLibraryName);
    } catch (error) {
      console.error("관심 도서관 추가 실패:", error);
      alert("관심 도서관 추가에 실패했습니다. 다시 시도해주세요.");
    }
  };

  const handleCancelAddLibrary = () => {
    setTempLibraryName("");
    setIsAddingLibrary(false);
  };

  // 도서관 삭제 핸들러
  const handleRemoveLibrary = async (library: string) => {
    try {
      // API 호출: 관심 도서관 삭제
      await apiClient.delete(LIBRARY_ENDPOINTS.REMOVE_FAVORITE_LIBRARY(library));

      // 로컬 상태 업데이트
      setUserData({
        ...userData,
        favoriteLibraries: userData.favoriteLibraries.filter((lib) => lib !== library),
      });
      console.log("관심 도서관 삭제:", library);
    } catch (error) {
      console.error("관심 도서관 삭제 실패:", error);
      alert("관심 도서관 삭제에 실패했습니다. 다시 시도해주세요.");
    }
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
                  <div className="flex items-center gap-4 mb-4">
                    <span
                      style={{
                        color: "black",
                        fontSize: "36px",
                        opacity: 0.6,
                        lineHeight: "36px",
                        minWidth: "240px",
                      }}
                    >
                      관심 도서관
                    </span>
                    {!isAddingLibrary ? (
                      <button
                        onClick={handleAddLibrary}
                        className="px-6 py-3 rounded hover:opacity-90 transition ml-auto"
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
                          추가
                        </span>
                      </button>
                    ) : (
                      <>
                        <input
                          type="text"
                          value={tempLibraryName}
                          onChange={(e) => setTempLibraryName(e.target.value)}
                          placeholder="도서관 이름을 입력하세요"
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
                          onClick={handleSaveLibrary}
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
                          onClick={handleCancelAddLibrary}
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
                {/* 비밀번호 변경 */}
                <div
                  className="px-6 py-6 rounded"
                  style={{ background: "#E9E5DC" }}
                >
                  {!isChangingPassword ? (
                    <div className="flex items-center justify-between">
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
                        onClick={handleEditPassword}
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
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <span
                          style={{
                            color: "black",
                            fontSize: "24px",
                            opacity: 0.6,
                            lineHeight: "36px",
                            minWidth: "180px",
                          }}
                        >
                          현재 비밀번호
                        </span>
                        <input
                          type="password"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          placeholder="현재 비밀번호"
                          className="flex-1 px-4 py-2 rounded"
                          style={{
                            background: "#FFF9F2",
                            color: "black",
                            fontSize: "20px",
                            lineHeight: "28px",
                            border: "2px solid #6B4F3F",
                          }}
                        />
                      </div>
                      <div className="flex items-center gap-4">
                        <span
                          style={{
                            color: "black",
                            fontSize: "24px",
                            opacity: 0.6,
                            lineHeight: "36px",
                            minWidth: "180px",
                          }}
                        >
                          새 비밀번호
                        </span>
                        <input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="새 비밀번호 (최소 8자)"
                          className="flex-1 px-4 py-2 rounded"
                          style={{
                            background: "#FFF9F2",
                            color: "black",
                            fontSize: "20px",
                            lineHeight: "28px",
                            border: "2px solid #6B4F3F",
                          }}
                        />
                      </div>
                      <div className="flex items-center gap-4">
                        <span
                          style={{
                            color: "black",
                            fontSize: "24px",
                            opacity: 0.6,
                            lineHeight: "36px",
                            minWidth: "180px",
                          }}
                        >
                          새 비밀번호 확인
                        </span>
                        <input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="새 비밀번호 확인"
                          className="flex-1 px-4 py-2 rounded"
                          style={{
                            background: "#FFF9F2",
                            color: "black",
                            fontSize: "20px",
                            lineHeight: "28px",
                            border: "2px solid #6B4F3F",
                          }}
                        />
                      </div>
                      {passwordError && (
                        <div className="px-4 py-2 rounded" style={{ background: "#ffebee" }}>
                          <span style={{ color: "#c62828", fontSize: "18px" }}>
                            {passwordError}
                          </span>
                        </div>
                      )}
                      <div className="flex gap-4 mt-4">
                        <button
                          onClick={handleSavePassword}
                          className="px-6 py-3 rounded hover:opacity-90 transition"
                          style={{
                            background: "#6B4F3F",
                            color: "white",
                          }}
                        >
                          <span
                            style={{
                              fontSize: "24px",
                              lineHeight: "32px",
                            }}
                          >
                            저장
                          </span>
                        </button>
                        <button
                          onClick={handleCancelPassword}
                          className="px-6 py-3 rounded hover:opacity-90 transition"
                          style={{
                            background: "#D9D9D9",
                            color: "black",
                          }}
                        >
                          <span
                            style={{
                              fontSize: "24px",
                              lineHeight: "32px",
                            }}
                          >
                            취소
                          </span>
                        </button>
                      </div>
                    </div>
                  )}
                  {passwordSuccess && !isChangingPassword && (
                    <div className="px-4 py-2 rounded mt-4" style={{ background: "#e8f5e9" }}>
                      <span style={{ color: "#2e7d32", fontSize: "18px" }}>
                        비밀번호가 성공적으로 변경되었습니다.
                      </span>
                    </div>
                  )}
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

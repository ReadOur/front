// SET_13.tsx - 설정 페이지
import React, { useState, useEffect } from "react";
import { apiClient } from "@/api/client";
import { LIBRARY_ENDPOINTS } from "@/api/endpoints";
import { changePassword } from "@/services/authService";
import { updateNickname } from "@/services/userService";
import { isAxiosError } from "axios";
import { LibrarySearchModal } from "@/components/LibrarySearchModal/LibrarySearchModal";
import type { Library } from "@/types/library";
import { useMyPage } from "@/hooks/api";
import { useQueryClient } from "@tanstack/react-query";

/**
 * API 연동 가이드:
 *
 * 1. 닉네임 수정 API
 *    - Endpoint: PATCH /api/users/me/nickname
 *    - Request Body: { nickname: string }
 *    - Response: { success: boolean, data: { nickname: string } }
 */

export default function SET_13() {
  // 실제 사용자 정보 가져오기
  const { data: myPageData, isLoading: isLoadingUserData } = useMyPage();
  const queryClient = useQueryClient();

  // 사용자 데이터 상태 (선호 도서관 포함)
  const [favoriteLibraries, setFavoriteLibraries] = useState<Library[]>([]);

  // 편집 모드 상태 관리
  const [isEditingNickname, setIsEditingNickname] = useState(false);
  const [isLibrarySearchModalOpen, setIsLibrarySearchModalOpen] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // 임시 값 상태
  const [tempNickname, setTempNickname] = useState("");

  // 비밀번호 변경 상태
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // 로딩 상태
  const [isLoadingLibraries, setIsLoadingLibraries] = useState(false);

  // 컴포넌트 마운트 시 선호 도서관 목록 가져오기
  useEffect(() => {
    const fetchFavoriteLibraries = async () => {
      setIsLoadingLibraries(true);
      try {
        const response = await apiClient.get<Library[]>(LIBRARY_ENDPOINTS.FAVORITE_LIBRARIES);
        setFavoriteLibraries(response || []);
      } catch (error) {
        console.error("선호 도서관 목록 조회 실패:", error);
        // 에러 발생 시 빈 배열 유지
      } finally {
        setIsLoadingLibraries(false);
      }
    };

    fetchFavoriteLibraries();
  }, []);

  // 닉네임 수정 핸들러
  const handleEditNickname = () => {
    setTempNickname(myPageData?.nickname || "");
    setIsEditingNickname(true);
  };

  const handleSaveNickname = async () => {
    try {
      await updateNickname(tempNickname);

      // 캐시 무효화 (마이페이지 데이터 다시 로드)
      queryClient.invalidateQueries({ queryKey: ['myPage'] });

      setIsEditingNickname(false);
      alert('닉네임이 성공적으로 변경되었습니다.');
    } catch (error) {
      console.error('닉네임 수정 실패:', error);
      if (isAxiosError(error)) {
        if (error.code === 'ERR_NETWORK') {
          alert('서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.');
        } else {
          const message = error.response?.data?.message || '닉네임 수정에 실패했습니다.';
          alert(message);
        }
      } else {
        alert('닉네임 수정에 실패했습니다. 다시 시도해주세요.');
      }
    }
  };

  const handleCancelNickname = () => {
    setTempNickname(myPageData?.nickname || "");
    setIsEditingNickname(false);
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

  // 도서관 검색 모달 열기
  const handleAddLibrary = () => {
    setIsLibrarySearchModalOpen(true);
  };

  // 도서관 선택 시 (모달에서 선택)
  const handleSelectLibrary = async (library: Library) => {
    try {
      // API 호출: 관심 도서관 추가
      await apiClient.post(LIBRARY_ENDPOINTS.ADD_FAVORITE_LIBRARY, {
        libraryCode: library.libraryCode,
        libraryName: library.libraryName,
      });

      // 로컬 상태 업데이트
      setFavoriteLibraries([...favoriteLibraries, library]);
      console.log("관심 도서관 추가:", library.libraryName);
      setIsLibrarySearchModalOpen(false);
    } catch (error) {
      console.error("관심 도서관 추가 실패:", error);
      alert("관심 도서관 추가에 실패했습니다. 다시 시도해주세요.");
    }
  };

  // 도서관 삭제 핸들러
  const handleRemoveLibrary = async (libraryCode: string) => {
    try {
      // API 호출: 관심 도서관 삭제
      await apiClient.delete(LIBRARY_ENDPOINTS.REMOVE_FAVORITE_LIBRARY(libraryCode));

      // 로컬 상태 업데이트
      setFavoriteLibraries(favoriteLibraries.filter((lib) => lib.libraryCode !== libraryCode));
      console.log("관심 도서관 삭제:", libraryCode);
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
        {/* 페이지 타이틀 */}
        <div className="mb-8 text-center">
          <h1
            className="text-[40px] font-bold"
            style={{ color: "black", lineHeight: "48px" }}
          >
            설정
          </h1>
        </div>

        {/* 메인 설정 영역 */}
        <div className="max-w-[900px] mx-auto">
          {isLoadingUserData ? (
            <div className="text-center py-8 text-xl" style={{ color: "#999" }}>
              로딩 중...
            </div>
          ) : (
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
                        {myPageData?.nickname || "닉네임 없음"}
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
                  </div>

                  {/* 도서관 태그들 */}
                  <div className="flex flex-wrap gap-3 mt-4">
                    {isLoadingLibraries ? (
                      <div className="text-sm" style={{ color: "#6B4F3F" }}>
                        로딩 중...
                      </div>
                    ) : favoriteLibraries.length > 0 ? (
                      favoriteLibraries.map((library) => (
                        <div
                          key={library.libraryCode}
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
                            {library.libraryName}
                          </span>
                          <button
                            onClick={() => handleRemoveLibrary(library.libraryCode)}
                            className="opacity-0 group-hover:opacity-100 transition ml-2"
                            style={{ color: "#6B4F3F" }}
                          >
                            ×
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="text-sm" style={{ color: "#6B4F3F" }}>
                        등록된 관심 도서관이 없습니다.
                      </div>
                    )}
                  </div>
                </div>

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
          </div>
          )}
        </div>
      </div>

      {/* 도서관 검색 모달 */}
      <LibrarySearchModal
        isOpen={isLibrarySearchModalOpen}
        onClose={() => setIsLibrarySearchModalOpen(false)}
        onSelectLibrary={handleSelectLibrary}
      />
    </div>
  );
}

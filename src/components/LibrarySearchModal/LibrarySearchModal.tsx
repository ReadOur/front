import React, { useState, useEffect } from "react";
import { apiClient } from "@/api/client";
import { LIBRARY_ENDPOINTS, REGION_ENDPOINTS } from "@/api/endpoints";
import { Library, Region, LibrarySearchResponse } from "@/types/library";

interface LibrarySearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectLibrary: (library: Library) => void;
}

export function LibrarySearchModal({ isOpen, onClose, onSelectLibrary }: LibrarySearchModalProps) {
  const [provinces, setProvinces] = useState<Region[]>([]);
  const [cities, setCities] = useState<Region[]>([]);
  const [selectedProvince, setSelectedProvince] = useState<number | null>(null);
  const [selectedCity, setSelectedCity] = useState<number | null>(null);
  const [libraries, setLibraries] = useState<Library[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // 광역시/도 목록 로드
  useEffect(() => {
    if (isOpen) {
      loadProvinces();
    }
  }, [isOpen]);

  // 광역시/도 선택 시 시/군/구 목록 로드
  useEffect(() => {
    if (selectedProvince) {
      loadCities(selectedProvince);
      setSelectedCity(null);
      setLibraries([]);
    }
  }, [selectedProvince]);

  // 시/군/구 선택 시 도서관 검색
  useEffect(() => {
    if (selectedProvince && selectedCity) {
      searchLibraries(selectedProvince, selectedCity, 0);
    }
  }, [selectedCity]);

  const loadProvinces = async () => {
    try {
      const data = await apiClient.get<Region[]>(REGION_ENDPOINTS.PROVINCES);
      setProvinces(data || []);
    } catch (error) {
      console.error("광역시/도 목록 로드 실패:", error);
    }
  };

  const loadCities = async (provinceId: number) => {
    try {
      const data = await apiClient.get<Region[]>(REGION_ENDPOINTS.CITIES(provinceId));
      setCities(data || []);
    } catch (error) {
      console.error("시/군/구 목록 로드 실패:", error);
    }
  };

  const searchLibraries = async (provinceId: number, cityId: number, pageNum: number) => {
    setIsLoading(true);
    try {
      const response = await apiClient.get<LibrarySearchResponse>(
        LIBRARY_ENDPOINTS.SEARCH_LIBRARIES,
        {
          params: {
            region: provinceId,
            dtlRegion: cityId,
            page: pageNum,
            size: 10,
          },
        }
      );

      setLibraries(response.content || []);
      setTotalPages(response.totalPages || 1);
      setPage(pageNum);
    } catch (error) {
      console.error("도서관 검색 실패:", error);
      setLibraries([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLibraryClick = (library: Library) => {
    onSelectLibrary(library);
    onClose();
  };

  const handlePageChange = (newPage: number) => {
    if (selectedProvince && selectedCity) {
      searchLibraries(selectedProvince, selectedCity, newPage);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-[color:var(--color-bg-elev-1)] rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 border-b border-[color:var(--color-border-subtle)]">
          <h2 className="text-xl font-bold text-[color:var(--color-fg-primary)]">
            도서관 검색
          </h2>
          <button
            onClick={onClose}
            className="text-[color:var(--color-fg-muted)] hover:text-[color:var(--color-fg-primary)] text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* 검색 필터 */}
        <div className="p-4 border-b border-[color:var(--color-border-subtle)] space-y-3">
          {/* 광역시/도 선택 */}
          <div>
            <label className="block text-sm font-medium text-[color:var(--color-fg-primary)] mb-2">
              광역시/도
            </label>
            <select
              value={selectedProvince || ""}
              onChange={(e) => setSelectedProvince(Number(e.target.value) || null)}
              className="w-full px-3 py-2 rounded-[var(--radius-md)] bg-[color:var(--color-bg-elev-2)] border border-[color:var(--color-border-subtle)] text-[color:var(--color-fg-primary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)]"
            >
              <option value="">선택하세요</option>
              {provinces.map((province) => (
                <option key={province.id} value={province.id}>
                  {province.name}
                </option>
              ))}
            </select>
          </div>

          {/* 시/군/구 선택 */}
          {selectedProvince && (
            <div>
              <label className="block text-sm font-medium text-[color:var(--color-fg-primary)] mb-2">
                시/군/구
              </label>
              <select
                value={selectedCity || ""}
                onChange={(e) => setSelectedCity(Number(e.target.value) || null)}
                className="w-full px-3 py-2 rounded-[var(--radius-md)] bg-[color:var(--color-bg-elev-2)] border border-[color:var(--color-border-subtle)] text-[color:var(--color-fg-primary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)]"
              >
                <option value="">선택하세요</option>
                {cities.map((city) => (
                  <option key={city.id} value={city.id}>
                    {city.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* 검색 결과 */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-[color:var(--color-fg-muted)]">검색 중...</div>
            </div>
          ) : libraries.length > 0 ? (
            <div className="space-y-2">
              {libraries.map((library) => (
                <div
                  key={library.libraryCode}
                  onClick={() => handleLibraryClick(library)}
                  className="p-4 rounded-[var(--radius-md)] bg-[color:var(--color-bg-elev-2)] border border-[color:var(--color-border-subtle)] hover:bg-[color:var(--color-bg-elev-2-hover,var(--color-bg-elev-2))] cursor-pointer transition-colors"
                >
                  <h3 className="font-semibold text-[color:var(--color-fg-primary)] mb-1">
                    {library.libraryName}
                  </h3>
                  <p className="text-sm text-[color:var(--color-fg-muted)] mb-1">
                    {library.address}
                  </p>
                  {library.homepage && (
                    <a
                      href={library.homepage}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-[color:var(--color-accent)] hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {library.homepage}
                    </a>
                  )}
                </div>
              ))}
            </div>
          ) : selectedProvince && selectedCity ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-[color:var(--color-fg-muted)]">
                검색 결과가 없습니다.
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center py-12">
              <div className="text-[color:var(--color-fg-muted)]">
                지역을 선택하여 도서관을 검색하세요.
              </div>
            </div>
          )}
        </div>

        {/* 페이지네이션 */}
        {libraries.length > 0 && totalPages > 1 && (
          <div className="p-4 border-t border-[color:var(--color-border-subtle)] flex justify-center gap-2">
            <button
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 0}
              className="px-3 py-1 rounded bg-[color:var(--color-bg-elev-2)] border border-[color:var(--color-border-subtle)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              이전
            </button>
            <span className="px-3 py-1 text-[color:var(--color-fg-primary)]">
              {page + 1} / {totalPages}
            </span>
            <button
              onClick={() => handlePageChange(page + 1)}
              disabled={page >= totalPages - 1}
              className="px-3 py-1 rounded bg-[color:var(--color-bg-elev-2)] border border-[color:var(--color-border-subtle)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              다음
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

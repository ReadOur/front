// CAL_11.tsx - 캘린더 페이지
import React, { useState, useMemo } from "react";

// 목업 일정 데이터 (날짜별 일정 개수)
const mockEvents: Record<string, number> = {
  "2025-11-05": 2, // 오늘
  "2025-11-10": 1,
  "2025-11-15": 3,
  "2025-11-20": 2,
  "2025-11-25": 1,
};

export default function CAL_11() {
  const [currentDate, setCurrentDate] = useState(new Date());

  // 현재 연도, 월
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-11

  // 해당 월의 첫날과 마지막 날
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  // 해당 월의 총 일수
  const daysInMonth = lastDayOfMonth.getDate();

  // 첫 날이 무슨 요일인지 (0: 일요일, 1: 월요일, ...)
  const firstDayOfWeek = firstDayOfMonth.getDay();

  // 오늘 날짜
  const today = new Date();
  const isToday = (day: number) => {
    return (
      today.getFullYear() === year &&
      today.getMonth() === month &&
      today.getDate() === day
    );
  };

  // 특정 날짜에 일정이 있는지 확인
  const getEventCount = (day: number): number => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return mockEvents[dateStr] || 0;
  };

  // 이전 달로 이동
  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  // 다음 달로 이동
  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // 달력 날짜 배열 생성
  const calendarDays = useMemo(() => {
    const days = [];

    // 빈 칸 추가 (첫 날 전까지)
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(null);
    }

    // 날짜 추가
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }

    return days;
  }, [firstDayOfWeek, daysInMonth]);

  return (
    <div
      className="w-full min-h-screen p-8"
      style={{ background: "#FFF9F2" }}
    >
      <div className="max-w-[1200px] mx-auto">
        {/* 월 네비게이션 */}
        <div
          className="flex items-center justify-center mb-6 py-3 rounded"
          style={{ background: "#E9E5DC", maxWidth: "271px", margin: "0 auto 24px" }}
        >
          <button
            onClick={handlePrevMonth}
            className="px-4 text-2xl hover:opacity-70 transition"
            style={{ color: "black" }}
          >
            ‹
          </button>
          <h2
            className="text-2xl mx-6"
            style={{ color: "black" }}
          >
            {month + 1}월
          </h2>
          <button
            onClick={handleNextMonth}
            className="px-4 text-2xl hover:opacity-70 transition"
            style={{ color: "black" }}
          >
            ›
          </button>
        </div>

        {/* 캘린더 */}
        <div
          className="p-6 rounded-lg"
          style={{ background: "#E9E5DC" }}
        >
          {/* 요일 헤더 */}
          <div className="grid grid-cols-7 gap-2 mb-4">
            {["일", "월", "화", "수", "목", "금", "토"].map((day, index) => (
              <div
                key={day}
                className="text-center py-2"
                style={{
                  color: index === 0 ? "#FF6B6B" : index === 6 ? "#4ECDC4" : "#6B4F3F",
                  fontSize: "18px",
                  fontWeight: 600,
                }}
              >
                {day}
              </div>
            ))}
          </div>

          {/* 날짜 그리드 */}
          <div className="grid grid-cols-7 gap-2">
            {calendarDays.map((day, index) => {
              if (day === null) {
                // 빈 칸
                return <div key={`empty-${index}`} className="aspect-square" />;
              }

              const eventCount = getEventCount(day);
              const isTodayDate = isToday(day);

              return (
                <div
                  key={day}
                  className="relative aspect-square rounded cursor-pointer hover:opacity-80 transition flex flex-col items-center justify-center"
                  style={{
                    background: isTodayDate ? "#90BE6D" : "#E9E5DC",
                    border: "1px solid rgba(0,0,0,0.05)",
                  }}
                >
                  {/* 날짜 숫자 */}
                  <span
                    className="text-center"
                    style={{
                      color: "#6B4F3F",
                      fontSize: "24px",
                      fontWeight: isTodayDate ? 600 : 400,
                    }}
                  >
                    {day}
                  </span>

                  {/* 일정 표시 점들 */}
                  {eventCount > 0 && (
                    <div className="absolute bottom-2 flex gap-1">
                      {Array.from({ length: Math.min(eventCount, 3) }).map((_, i) => (
                        <div
                          key={i}
                          className="rounded-full"
                          style={{
                            width: "8px",
                            height: "8px",
                            background: "#FFD166",
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 일정 범례 */}
        <div className="mt-6 flex items-center justify-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded"
              style={{ background: "#90BE6D" }}
            />
            <span style={{ color: "#6B4F3F" }}>오늘</span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-2 h-2 rounded-full"
              style={{ background: "#FFD166" }}
            />
            <span style={{ color: "#6B4F3F" }}>일정 있음</span>
          </div>
        </div>
      </div>
    </div>
  );
}

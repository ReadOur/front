// CAL_11.tsx - 캘린더 페이지
import React, { useState, useMemo, useEffect } from "react";
import { getEvents, createEvent, CalendarEvent, CreateEventData, ViewType, Scope } from "@/api/calendar";

export default function CAL_11() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isYearMonthSelectorOpen, setIsYearMonthSelectorOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // 조회 설정
  const [viewType, setViewType] = useState<ViewType>('MONTH');
  const [scope, setScope] = useState<Scope>('USER');

  // 새 일정 입력 폼 상태
  const [newEvent, setNewEvent] = useState<CreateEventData>({
    title: "",
    description: "",
    location: "",
    startsAt: "",
    endsAt: "",
    allDay: false,
  });

  // 현재 연도, 월
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-11

  // 일정 데이터 가져오기
  useEffect(() => {
    const fetchEvents = async () => {
      setIsLoading(true);
      try {
        // viewDate 형식: YYYY-MM-DD (해당 월의 1일)
        const viewDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;

        const data = await getEvents({
          viewDate,
          viewType,
          scope,
        });
        setEvents(data);
      } catch (error) {
        console.error("일정을 가져오는데 실패했습니다:", error);
        setEvents([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvents();
  }, [year, month, viewType, scope]);

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

  // 특정 날짜에 일정이 있는지 확인 (API 데이터 기반)
  const getEventCount = (day: number): number => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return events.filter(event => {
      const eventStart = event.startDate.split('T')[0];
      const eventEnd = event.endDate.split('T')[0];
      return dateStr >= eventStart && dateStr <= eventEnd;
    }).length;
  };

  // 이전 달로 이동
  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  // 다음 달로 이동
  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // 년도/월 선택
  const handleYearMonthChange = (newYear: number, newMonth: number) => {
    setCurrentDate(new Date(newYear, newMonth - 1, 1));
    setIsYearMonthSelectorOpen(false);
  };

  // 일정 추가 모달 열기
  const handleOpenAddModal = () => {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}T09:00:00`;

    setNewEvent({
      title: "",
      description: "",
      location: "",
      startsAt: todayStr,
      endsAt: todayStr,
      allDay: false,
    });
    setIsAddModalOpen(true);
  };

  // 일정 추가
  const handleAddEvent = async () => {
    if (!newEvent.title || !newEvent.startsAt || !newEvent.endsAt) {
      alert("제목, 시작 시간, 종료 시간은 필수입니다.");
      return;
    }

    try {
      // datetime-local 값에 초 추가 (백엔드 요구사항)
      const eventData = {
        ...newEvent,
        startsAt: newEvent.startsAt.length === 16 ? `${newEvent.startsAt}:00` : newEvent.startsAt,
        endsAt: newEvent.endsAt.length === 16 ? `${newEvent.endsAt}:00` : newEvent.endsAt,
      };

      await createEvent(eventData);
      alert("일정이 추가되었습니다.");
      setIsAddModalOpen(false);

      // 일정 목록 새로고침
      const viewDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
      const data = await getEvents({
        viewDate,
        viewType,
        scope,
      });
      setEvents(data);
    } catch (error) {
      console.error("일정 추가 실패:", error);
      alert("일정 추가에 실패했습니다.");
    }
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
        {/* 상단 헤더: 일정 추가 버튼 + 월 네비게이션 */}
        <div className="flex items-center justify-between mb-6">
          {/* 일정 추가 버튼 */}
          <button
            onClick={handleOpenAddModal}
            className="px-6 py-2 rounded hover:opacity-80 transition font-semibold"
            style={{ background: "#90BE6D", color: "white" }}
          >
            + 일정 추가
          </button>

          {/* 월 네비게이션 */}
          <div
            className="flex items-center py-3 px-4 rounded"
            style={{ background: "#E9E5DC" }}
          >
            <button
              onClick={handlePrevMonth}
              className="px-4 text-2xl hover:opacity-70 transition"
              style={{ color: "black" }}
            >
              ‹
            </button>
            <button
              onClick={() => setIsYearMonthSelectorOpen(true)}
              className="text-2xl mx-6 hover:opacity-70 transition cursor-pointer"
              style={{ color: "black" }}
            >
              {year}년 {month + 1}월
            </button>
            <button
              onClick={handleNextMonth}
              className="px-4 text-2xl hover:opacity-70 transition"
              style={{ color: "black" }}
            >
              ›
            </button>
          </div>

          {/* 빈 공간 (레이아웃 균형) */}
          <div style={{ width: "120px" }} />
        </div>

        {/* 조회 설정: ViewType & Scope */}
        <div className="flex items-center justify-center gap-4 mb-6">
          {/* ViewType 선택 */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold" style={{ color: "#6B4F3F" }}>
              단위:
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setViewType('WEEK')}
                className="px-4 py-2 rounded hover:opacity-80 transition text-sm font-semibold"
                style={{
                  background: viewType === 'WEEK' ? "#90BE6D" : "#E9E5DC",
                  color: viewType === 'WEEK' ? "white" : "#6B4F3F",
                }}
              >
                주별
              </button>
              <button
                onClick={() => setViewType('MONTH')}
                className="px-4 py-2 rounded hover:opacity-80 transition text-sm font-semibold"
                style={{
                  background: viewType === 'MONTH' ? "#90BE6D" : "#E9E5DC",
                  color: viewType === 'MONTH' ? "white" : "#6B4F3F",
                }}
              >
                월별
              </button>
            </div>
          </div>

          {/* Scope 선택 */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold" style={{ color: "#6B4F3F" }}>
              조회:
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setScope('USER')}
                className="px-4 py-2 rounded hover:opacity-80 transition text-sm font-semibold"
                style={{
                  background: scope === 'USER' ? "#90BE6D" : "#E9E5DC",
                  color: scope === 'USER' ? "white" : "#6B4F3F",
                }}
              >
                개인
              </button>
              <button
                onClick={() => setScope('ROOM')}
                className="px-4 py-2 rounded hover:opacity-80 transition text-sm font-semibold"
                style={{
                  background: scope === 'ROOM' ? "#90BE6D" : "#E9E5DC",
                  color: scope === 'ROOM' ? "white" : "#6B4F3F",
                }}
              >
                방
              </button>
              <button
                onClick={() => setScope('GLOBAL')}
                className="px-4 py-2 rounded hover:opacity-80 transition text-sm font-semibold"
                style={{
                  background: scope === 'GLOBAL' ? "#90BE6D" : "#E9E5DC",
                  color: scope === 'GLOBAL' ? "white" : "#6B4F3F",
                }}
              >
                모임
              </button>
              <button
                onClick={() => setScope('ALL')}
                className="px-4 py-2 rounded hover:opacity-80 transition text-sm font-semibold"
                style={{
                  background: scope === 'ALL' ? "#90BE6D" : "#E9E5DC",
                  color: scope === 'ALL' ? "white" : "#6B4F3F",
                }}
              >
                전체
              </button>
            </div>
          </div>
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

        {/* 일정 추가 모달 */}
        {isAddModalOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setIsAddModalOpen(false)}
          >
            <div
              className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full mx-4"
              onClick={(e) => e.stopPropagation()}
              style={{ background: "#FFF9F2" }}
            >
              <h3 className="text-2xl font-bold mb-6" style={{ color: "#6B4F3F" }}>
                새 일정 추가
              </h3>

              <div className="space-y-4">
                {/* 제목 */}
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: "#6B4F3F" }}>
                    제목 <span style={{ color: "#FF6B6B" }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={newEvent.title}
                    onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                    className="w-full px-4 py-2 rounded border"
                    style={{ background: "white", borderColor: "#E9E5DC" }}
                    placeholder="일정 제목을 입력하세요"
                  />
                </div>

                {/* 설명 */}
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: "#6B4F3F" }}>
                    설명
                  </label>
                  <textarea
                    value={newEvent.description}
                    onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                    className="w-full px-4 py-2 rounded border resize-none"
                    style={{ background: "white", borderColor: "#E9E5DC" }}
                    placeholder="일정 설명을 입력하세요"
                    rows={3}
                  />
                </div>

                {/* 장소 */}
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: "#6B4F3F" }}>
                    장소
                  </label>
                  <input
                    type="text"
                    value={newEvent.location}
                    onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                    className="w-full px-4 py-2 rounded border"
                    style={{ background: "white", borderColor: "#E9E5DC" }}
                    placeholder="예: 집 앞 카페"
                  />
                </div>

                {/* 종일 일정 */}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={newEvent.allDay}
                    onChange={(e) => setNewEvent({ ...newEvent, allDay: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <label className="text-sm font-semibold" style={{ color: "#6B4F3F" }}>
                    종일 일정
                  </label>
                </div>

                {/* 시작 시간 */}
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: "#6B4F3F" }}>
                    시작 시간 <span style={{ color: "#FF6B6B" }}>*</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={newEvent.startsAt}
                    onChange={(e) => setNewEvent({ ...newEvent, startsAt: e.target.value })}
                    className="w-full px-4 py-2 rounded border"
                    style={{ background: "white", borderColor: "#E9E5DC" }}
                    disabled={newEvent.allDay}
                  />
                </div>

                {/* 종료 시간 */}
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: "#6B4F3F" }}>
                    종료 시간 <span style={{ color: "#FF6B6B" }}>*</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={newEvent.endsAt}
                    onChange={(e) => setNewEvent({ ...newEvent, endsAt: e.target.value })}
                    className="w-full px-4 py-2 rounded border"
                    style={{ background: "white", borderColor: "#E9E5DC" }}
                    disabled={newEvent.allDay}
                  />
                </div>
              </div>

              {/* 버튼 */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 px-6 py-3 rounded hover:opacity-80 transition font-semibold"
                  style={{ background: "#E9E5DC", color: "#6B4F3F" }}
                >
                  취소
                </button>
                <button
                  onClick={handleAddEvent}
                  className="flex-1 px-6 py-3 rounded hover:opacity-80 transition font-semibold"
                  style={{ background: "#90BE6D", color: "white" }}
                >
                  추가
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 년도/월 선택 모달 */}
        {isYearMonthSelectorOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setIsYearMonthSelectorOpen(false)}
          >
            <div
              className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full mx-4"
              onClick={(e) => e.stopPropagation()}
              style={{ background: "#FFF9F2" }}
            >
              <h3 className="text-2xl font-bold mb-6" style={{ color: "#6B4F3F" }}>
                년도/월 선택
              </h3>

              <div className="space-y-4">
                {/* 년도 선택 */}
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: "#6B4F3F" }}>
                    년도
                  </label>
                  <select
                    value={year}
                    onChange={(e) => handleYearMonthChange(Number(e.target.value), month + 1)}
                    className="w-full px-4 py-2 rounded border"
                    style={{ background: "white", borderColor: "#E9E5DC" }}
                  >
                    {Array.from({ length: 10 }, (_, i) => year - 5 + i).map((y) => (
                      <option key={y} value={y}>
                        {y}년
                      </option>
                    ))}
                  </select>
                </div>

                {/* 월 선택 */}
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: "#6B4F3F" }}>
                    월
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                      <button
                        key={m}
                        onClick={() => handleYearMonthChange(year, m)}
                        className="px-4 py-3 rounded hover:opacity-80 transition font-semibold"
                        style={{
                          background: m === month + 1 ? "#90BE6D" : "#E9E5DC",
                          color: m === month + 1 ? "white" : "#6B4F3F",
                        }}
                      >
                        {m}월
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setIsYearMonthSelectorOpen(false)}
                  className="w-full px-6 py-3 rounded hover:opacity-80 transition font-semibold"
                  style={{ background: "#E9E5DC", color: "#6B4F3F" }}
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// CAL_11.tsx - 캘린더 페이지
import React, { useState, useMemo, useEffect } from "react";
import { getEvents, createEvent, updateEvent, deleteEvent, CalendarEvent, CreateEventData } from "@/api/calendar";
import { useAuth } from "@/contexts/AuthContext";

export default function CAL_11() {
  const { user, isAuthenticated } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isYearMonthSelectorOpen, setIsYearMonthSelectorOpen] = useState(false);

  // 일정 카테고리 필터 (null: 전체, 'USER': 개인 일정, 'ROOM': 방 일정)
  const [selectedScope, setSelectedScope] = useState<'USER' | 'ROOM' | null>(null);

  // 날짜 클릭 시 일정 목록 표시
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isDateEventsModalOpen, setIsDateEventsModalOpen] = useState(false);
  const [popoverPosition, setPopoverPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // 팝오버 내 인라인 수정
  const [editingEventId, setEditingEventId] = useState<number | null>(null);
  const [inlineEditData, setInlineEditData] = useState<CreateEventData>({
    title: "",
    description: "",
    location: "",
    startsAt: "",
    endsAt: "",
    allDay: false,
  });

  // 일정 상세 모달
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isEventDetailModalOpen, setIsEventDetailModalOpen] = useState(false);

  // 일정 수정 모달
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [editEventData, setEditEventData] = useState<CreateEventData>({
    title: "",
    description: "",
    location: "",
    startsAt: "",
    endsAt: "",
    allDay: false,
  });

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

  useEffect(() => {
    console.debug('[CAL_11] isAddModalOpen 상태 변경:', isAddModalOpen);
  }, [isAddModalOpen]);

  // 일정 데이터 가져오기
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        // viewDate 형식: YYYY-MM-DD (해당 월의 1일)
        const viewDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;

        // selectedScope가 null(전체)이면 scope를 넘기지 않음, 아니면 해당 scope 전달
        const params: any = {
          viewDate,
          viewType: 'MONTH',
        };

        if (selectedScope !== null) {
          params.scope = selectedScope;
        }

        const data = await getEvents(params);
        setEvents(data);
      } catch (error: any) {
        console.error("일정을 가져오는데 실패했습니다:", error);
        if (error.response?.status === 404) {
          // 인증되지 않은 사용자일 때만 로그인 요구
          if (!isAuthenticated) {
            console.warn("로그인이 필요합니다.");
          } else {
            console.warn("권한이 없어 일정을 조회할 수 없습니다.");
          }
        }
        setEvents([]);
      }
    };

    fetchEvents();
  }, [year, month, user, isAuthenticated, selectedScope]);

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
      const eventStart = event.startsAt.split('T')[0];
      const eventEnd = event.endsAt.split('T')[0];
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
    console.debug('[CAL_11] 일정 추가 모달 열림 트리거', { todayStr });
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
      await refreshEvents();
    } catch (error: any) {
      console.error("일정 추가 실패:", error);
      if (error.response?.status === 404) {
        // 인증되지 않은 사용자일 때만 로그인 요구
        if (!isAuthenticated) {
          alert("로그인이 필요합니다. 일정을 추가하려면 로그인하세요.");
        } else {
          alert("권한이 없습니다. 일정을 추가할 수 없습니다.");
        }
      } else {
        alert("일정 추가에 실패했습니다.");
      }
    }
  };

  // 특정 날짜의 일정 가져오기
  const getEventsForDate = (dateStr: string): CalendarEvent[] => {
    return events.filter(event => {
      const eventStart = event.startsAt.split('T')[0];
      const eventEnd = event.endsAt.split('T')[0];
      return dateStr >= eventStart && dateStr <= eventEnd;
    });
  };

  // 날짜 클릭 핸들러 (일정 목록 모달 열기)
  const handleDateClick = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    console.log('📅 날짜 클릭:', dateStr);
    console.log('📋 해당 날짜 일정:', getEventsForDate(dateStr));
    console.log('📊 전체 일정:', events);
    setSelectedDate(dateStr);
    // 팝오버 초기 위치 설정 (화면 우측 중앙)
    setPopoverPosition({ x: window.innerWidth - 420, y: window.innerHeight / 2 - 300 });
    setIsDateEventsModalOpen(true);
  };

  // 팝오버 드래그 시작
  const handlePopoverDragStart = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - popoverPosition.x,
      y: e.clientY - popoverPosition.y,
    });
  };

  // 팝오버 드래그 중
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setPopoverPosition({
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y,
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  // datetime-local 형식 변환 헬퍼
  const formatDateTimeLocal = (dateStr: string) => {
    // ISO 8601 형식 (YYYY-MM-DDTHH:mm:ss)을 datetime-local 형식 (YYYY-MM-DDTHH:mm)으로 변환
    if (dateStr.length >= 16) {
      return dateStr.substring(0, 16);
    }
    return dateStr;
  };

  // 팝오버 내 인라인 수정 시작
  const handleStartInlineEdit = (event: CalendarEvent) => {
    setEditingEventId(event.eventId);
    setInlineEditData({
      title: event.title,
      description: event.description || "",
      location: event.location || "",
      startsAt: formatDateTimeLocal(event.startsAt),
      endsAt: formatDateTimeLocal(event.endsAt),
      allDay: event.allDay,
    });
  };

  // 팝오버 내 인라인 수정 취소
  const handleCancelInlineEdit = () => {
    setEditingEventId(null);
    setInlineEditData({
      title: "",
      description: "",
      location: "",
      startsAt: "",
      endsAt: "",
      allDay: false,
    });
  };

  // 팝오버 내 인라인 수정 저장
  const handleSaveInlineEdit = async () => {
    if (!editingEventId || !inlineEditData.title || !inlineEditData.startsAt || !inlineEditData.endsAt) {
      alert("제목, 시작 시간, 종료 시간은 필수입니다.");
      return;
    }

    try {
      // datetime-local 값에 초 추가 (백엔드 요구사항)
      const eventData = {
        ...inlineEditData,
        startsAt: inlineEditData.startsAt.length === 16 ? `${inlineEditData.startsAt}:00` : inlineEditData.startsAt,
        endsAt: inlineEditData.endsAt.length === 16 ? `${inlineEditData.endsAt}:00` : inlineEditData.endsAt,
      };

      await updateEvent(editingEventId, eventData);
      alert("일정이 수정되었습니다.");
      handleCancelInlineEdit();

      // 일정 목록 새로고침
      await refreshEvents();
    } catch (error: any) {
      console.error("일정 수정 실패:", error);
      if (error.response?.status === 404) {
        // 인증되지 않은 사용자일 때만 로그인 요구
        if (!isAuthenticated) {
          alert("로그인이 필요합니다. 일정을 수정하려면 로그인하세요.");
        } else {
          alert("권한이 없습니다. 일정을 수정할 수 없습니다.");
        }
      } else {
        alert("일정 수정에 실패했습니다.");
      }
    }
  };

  // 일정 수정 모달 열기
  const handleOpenEditModal = (event: CalendarEvent) => {
    setEditingEvent(event);

    setEditEventData({
      title: event.title,
      description: event.description || "",
      location: event.location || "",
      startsAt: formatDateTimeLocal(event.startsAt),
      endsAt: formatDateTimeLocal(event.endsAt),
      allDay: event.allDay,
    });

    setIsEditModalOpen(true);
    setIsEventDetailModalOpen(false); // 상세 모달 닫기
  };

  // 일정 수정
  const handleUpdateEvent = async () => {
    if (!editingEvent || !editEventData.title || !editEventData.startsAt || !editEventData.endsAt) {
      alert("제목, 시작 시간, 종료 시간은 필수입니다.");
      return;
    }

    try {
      // datetime-local 값에 초 추가 (백엔드 요구사항)
      const eventData = {
        ...editEventData,
        startsAt: editEventData.startsAt.length === 16 ? `${editEventData.startsAt}:00` : editEventData.startsAt,
        endsAt: editEventData.endsAt.length === 16 ? `${editEventData.endsAt}:00` : editEventData.endsAt,
      };

      await updateEvent(editingEvent.eventId, eventData);
      alert("일정이 수정되었습니다.");
      setIsEditModalOpen(false);
      setEditingEvent(null);

      // 일정 목록 새로고침
      await refreshEvents();
    } catch (error: any) {
      console.error("일정 수정 실패:", error);
      if (error.response?.status === 404) {
        // 인증되지 않은 사용자일 때만 로그인 요구
        if (!isAuthenticated) {
          alert("로그인이 필요합니다. 일정을 수정하려면 로그인하세요.");
        } else {
          alert("권한이 없습니다. 일정을 수정할 수 없습니다.");
        }
      } else {
        alert("일정 수정에 실패했습니다.");
      }
    }
  };

  // 일정 삭제
  const handleDeleteEvent = async (eventId: number) => {
    if (!confirm("정말 이 일정을 삭제하시겠습니까?")) {
      return;
    }

    try {
      await deleteEvent(eventId);
      alert("일정이 삭제되었습니다.");

      // 모든 모달 닫기
      setIsEventDetailModalOpen(false);
      setIsDateEventsModalOpen(false);
      setSelectedEvent(null);

      // 일정 목록 새로고침
      await refreshEvents();
    } catch (error: any) {
      console.error("일정 삭제 실패:", error);
      if (error.response?.status === 404) {
        // 인증되지 않은 사용자일 때만 로그인 요구
        if (!isAuthenticated) {
          alert("로그인이 필요합니다. 일정을 삭제하려면 로그인하세요.");
        } else {
          alert("권한이 없습니다. 일정을 삭제할 수 없습니다.");
        }
      } else {
        alert("일정 삭제에 실패했습니다.");
      }
    }
  };

  // 일정 목록 새로고침 (재사용을 위한 헬퍼 함수)
  const refreshEvents = async () => {
    try {
      const viewDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;

      // selectedScope가 null(전체)이면 scope를 넘기지 않음, 아니면 해당 scope 전달
      const params: any = {
        viewDate,
        viewType: 'MONTH',
      };

      if (selectedScope !== null) {
        params.scope = selectedScope;
      }

      const data = await getEvents(params);
      setEvents(data);
    } catch (error: any) {
      console.error("일정을 가져오는데 실패했습니다:", error);
      if (error.response?.status === 404) {
        // 인증되지 않은 사용자일 때만 로그인 요구
        if (!isAuthenticated) {
          console.warn("로그인이 필요합니다.");
        } else {
          console.warn("권한이 없어 일정을 조회할 수 없습니다.");
        }
      }
      setEvents([]);
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
        {/* 카테고리 필터 */}
        <div className="flex items-center gap-3 mb-4">
          <span className="text-sm font-semibold" style={{ color: "#6B4F3F" }}>일정 카테고리:</span>
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedScope(null)}
              className="px-4 py-1.5 rounded text-sm font-semibold hover:opacity-80 transition"
              style={{
                background: selectedScope === null ? "#90BE6D" : "#E9E5DC",
                color: selectedScope === null ? "white" : "#6B4F3F",
              }}
            >
              전체
            </button>
            <button
              onClick={() => setSelectedScope('USER')}
              className="px-4 py-1.5 rounded text-sm font-semibold hover:opacity-80 transition"
              style={{
                background: selectedScope === 'USER' ? "#90BE6D" : "#E9E5DC",
                color: selectedScope === 'USER' ? "white" : "#6B4F3F",
              }}
            >
              개인 일정
            </button>
            <button
              onClick={() => setSelectedScope('ROOM')}
              className="px-4 py-1.5 rounded text-sm font-semibold hover:opacity-80 transition"
              style={{
                background: selectedScope === 'ROOM' ? "#90BE6D" : "#E9E5DC",
                color: selectedScope === 'ROOM' ? "white" : "#6B4F3F",
              }}
            >
              방 일정
            </button>
          </div>
        </div>

        {/* 상단 헤더: 일정 추가 버튼 + 월 네비게이션 */}
        <div className="flex items-center justify-between mb-6">
          {/* 일정 추가 버튼 */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              console.log('[CAL_11] 일정 추가 버튼 클릭됨');
              handleOpenAddModal();
            }}
            className="px-6 py-2 rounded hover:opacity-80 transition font-semibold"
            style={{
              background: "#90BE6D",
              color: "white",
              position: "relative",
              zIndex: 10,
              cursor: "pointer"
            }}
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
                  onClick={() => handleDateClick(day)}
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
                    <div className="absolute bottom-[25px] flex gap-1">
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
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-2 h-2 rounded-full"
              style={{ background: "#FFD166" }}
            />
          </div>
        </div>

        {/* 일정 추가 모달 */}
        {isAddModalOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70]"
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

        {/* 날짜별 일정 목록 (작은 팝오버) */}
        {isDateEventsModalOpen && selectedDate && (
          <>
            {/* 반투명 배경 (클릭해도 닫히지 않음) */}
            <div
              className="fixed inset-0 bg-black bg-opacity-20 z-40"
            />

            {/* 일정 카드 */}
            <div
              className="fixed w-96 max-h-[600px] overflow-y-auto rounded-xl shadow-2xl border-2 z-50"
              style={{
                left: `${popoverPosition.x}px`,
                top: `${popoverPosition.y}px`,
                background: "#FFF9F2",
                borderColor: "#6B4F3F",
                cursor: isDragging ? 'grabbing' : 'default'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-5">
                {/* 헤더 (드래그 가능) */}
                <div
                  className="flex items-center justify-between mb-4 pb-3 border-b-2"
                  style={{ borderColor: "#E9E5DC", cursor: 'grab' }}
                  onMouseDown={handlePopoverDragStart}
                >
                  <h3 className="text-xl font-bold select-none" style={{ color: "#6B4F3F" }}>
                    {selectedDate}
                  </h3>
                  <button
                    onClick={() => setIsDateEventsModalOpen(false)}
                    onMouseDown={(e) => e.stopPropagation()}
                    className="p-2 rounded-full hover:bg-black/5 flex items-center justify-center transition"
                    style={{ color: "#6B4F3F", cursor: 'pointer', fontSize: '20px' }}
                  >
                    ✕
                  </button>
                </div>

                {/* 일정 목록 */}
                <div className="space-y-2">
                  {getEventsForDate(selectedDate).length === 0 ? (
                    <p className="text-center py-6 text-sm" style={{ color: "#888" }}>
                      이 날짜에 일정이 없습니다.
                    </p>
                  ) : (
                    getEventsForDate(selectedDate).map((event) => {
                      const isEditing = editingEventId === event.eventId;

                      return (
                        <div
                          key={event.eventId}
                          className="p-3 rounded-lg border transition relative"
                          style={{
                            background: "white",
                            borderColor: isEditing ? "#90BE6D" : "#E9E5DC",
                            borderWidth: isEditing ? "2px" : "1px",
                          }}
                        >
                          {isEditing ? (
                            // 편집 모드
                            <div className="space-y-2">
                              {/* 제목 */}
                              <input
                                type="text"
                                value={inlineEditData.title}
                                onChange={(e) => setInlineEditData({ ...inlineEditData, title: e.target.value })}
                                className="w-full px-2 py-1 rounded border text-sm font-semibold"
                                style={{ background: "white", borderColor: "#E9E5DC", color: "#6B4F3F" }}
                                placeholder="제목"
                              />

                              {/* 설명 */}
                              <textarea
                                value={inlineEditData.description}
                                onChange={(e) => setInlineEditData({ ...inlineEditData, description: e.target.value })}
                                className="w-full px-2 py-1 rounded border text-xs resize-none"
                                style={{ background: "white", borderColor: "#E9E5DC", color: "#888" }}
                                placeholder="설명"
                                rows={2}
                              />

                              {/* 시작 시간 */}
                              <div>
                                <label className="text-xs font-semibold block mb-1" style={{ color: "#6B4F3F" }}>
                                  시작
                                </label>
                                <input
                                  type="datetime-local"
                                  value={inlineEditData.startsAt}
                                  onChange={(e) => setInlineEditData({ ...inlineEditData, startsAt: e.target.value })}
                                  className="w-full px-2 py-1 rounded border text-xs"
                                  style={{ background: "white", borderColor: "#E9E5DC" }}
                                />
                              </div>

                              {/* 종료 시간 */}
                              <div>
                                <label className="text-xs font-semibold block mb-1" style={{ color: "#6B4F3F" }}>
                                  종료
                                </label>
                                <input
                                  type="datetime-local"
                                  value={inlineEditData.endsAt}
                                  onChange={(e) => setInlineEditData({ ...inlineEditData, endsAt: e.target.value })}
                                  className="w-full px-2 py-1 rounded border text-xs"
                                  style={{ background: "white", borderColor: "#E9E5DC" }}
                                />
                              </div>

                              {/* 저장/취소 버튼 */}
                              <div className="flex gap-2 mt-3">
                                <button
                                  onClick={handleCancelInlineEdit}
                                  className="flex-1 px-3 py-1.5 rounded text-xs font-semibold hover:opacity-80 transition"
                                  style={{ background: "#E9E5DC", color: "#6B4F3F" }}
                                >
                                  취소
                                </button>
                                <button
                                  onClick={handleSaveInlineEdit}
                                  className="flex-1 px-3 py-1.5 rounded text-xs font-semibold hover:opacity-80 transition"
                                  style={{ background: "#90BE6D", color: "white" }}
                                >
                                  저장
                                </button>
                              </div>
                            </div>
                          ) : (
                            // 일반 모드
                            <>
                              {/* 수정/삭제 버튼 */}
                              <div className="absolute top-2 right-2 flex gap-1">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleStartInlineEdit(event);
                                  }}
                                  className="w-7 h-7 rounded-md hover:bg-[#90BE6D] hover:text-white flex items-center justify-center transition"
                                  style={{ background: "#E9E5DC", color: "#6B4F3F" }}
                                  title="수정"
                                >
                                  ✏️
                                </button>
                                <button
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    if (confirm(`"${event.title}" 일정을 삭제하시겠습니까?`)) {
                                      await handleDeleteEvent(event.eventId);
                                    }
                                  }}
                                  className="w-7 h-7 rounded-md hover:bg-[#FF6B6B] hover:text-white flex items-center justify-center transition"
                                  style={{ background: "#E9E5DC", color: "#6B4F3F" }}
                                  title="삭제"
                                >
                                  🗑️
                                </button>
                              </div>

                              <h4 className="font-bold mb-1 pr-16" style={{ color: "#6B4F3F", fontSize: "15px" }}>
                                {event.title}
                              </h4>

                              {event.description && (
                                <p className="text-xs mb-2 line-clamp-2" style={{ color: "#888" }}>
                                  {event.description}
                                </p>
                              )}

                              <div className="text-xs space-y-0.5" style={{ color: "#999" }}>
                                <div>🕐 {event.startsAt.replace('T', ' ')}</div>
                                <div>🕐 {event.endsAt.replace('T', ' ')}</div>
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {/* 일정 상세 모달 */}
        {isEventDetailModalOpen && selectedEvent && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setIsEventDetailModalOpen(false)}
          >
            <div
              className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full mx-4"
              onClick={(e) => e.stopPropagation()}
              style={{ background: "#FFF9F2" }}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold" style={{ color: "#6B4F3F" }}>
                  일정 상세
                </h3>
                <button
                  onClick={() => setIsEventDetailModalOpen(false)}
                  className="text-2xl hover:opacity-70 transition"
                  style={{ color: "#6B4F3F" }}
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4 mb-6">
                {/* 제목 */}
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: "#888" }}>
                    제목
                  </label>
                  <p className="text-lg font-bold" style={{ color: "#6B4F3F" }}>
                    {selectedEvent.title}
                  </p>
                </div>

                {/* 설명 */}
                {selectedEvent.description && (
                  <div>
                    <label className="block text-sm font-semibold mb-2" style={{ color: "#888" }}>
                      설명
                    </label>
                    <p style={{ color: "#6B4F3F" }}>
                      {selectedEvent.description}
                    </p>
                  </div>
                )}

                {/* 장소 */}
                {selectedEvent.location && (
                  <div>
                    <label className="block text-sm font-semibold mb-2" style={{ color: "#888" }}>
                      장소
                    </label>
                    <p style={{ color: "#6B4F3F" }}>
                      {selectedEvent.location}
                    </p>
                  </div>
                )}

                {/* 시작 시간 */}
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: "#888" }}>
                    시작 시간
                  </label>
                  <p style={{ color: "#6B4F3F" }}>
                    {selectedEvent.startsAt}
                  </p>
                </div>

                {/* 종료 시간 */}
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: "#888" }}>
                    종료 시간
                  </label>
                  <p style={{ color: "#6B4F3F" }}>
                    {selectedEvent.endsAt}
                  </p>
                </div>
              </div>

              {/* 수정/삭제 버튼 */}
              <div className="flex gap-3">
                <button
                  onClick={() => handleOpenEditModal(selectedEvent)}
                  className="flex-1 px-6 py-3 rounded hover:opacity-80 transition font-semibold"
                  style={{ background: "#90BE6D", color: "white" }}
                >
                  수정
                </button>
                <button
                  onClick={() => handleDeleteEvent(selectedEvent.eventId)}
                  className="flex-1 px-6 py-3 rounded hover:opacity-80 transition font-semibold"
                  style={{ background: "#FF6B6B", color: "white" }}
                >
                  삭제
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 일정 수정 모달 */}
        {isEditModalOpen && editingEvent && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]"
            onClick={() => setIsEditModalOpen(false)}
          >
            <div
              className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full mx-4"
              onClick={(e) => e.stopPropagation()}
              style={{ background: "#FFF9F2" }}
            >
              <h3 className="text-2xl font-bold mb-6" style={{ color: "#6B4F3F" }}>
                일정 수정
              </h3>

              <div className="space-y-4">
                {/* 제목 */}
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: "#6B4F3F" }}>
                    제목 <span style={{ color: "#FF6B6B" }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={editEventData.title}
                    onChange={(e) => setEditEventData({ ...editEventData, title: e.target.value })}
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
                    value={editEventData.description}
                    onChange={(e) => setEditEventData({ ...editEventData, description: e.target.value })}
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
                    value={editEventData.location}
                    onChange={(e) => setEditEventData({ ...editEventData, location: e.target.value })}
                    className="w-full px-4 py-2 rounded border"
                    style={{ background: "white", borderColor: "#E9E5DC" }}
                    placeholder="예: 집 앞 카페"
                  />
                </div>

                {/* 종일 일정 */}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editEventData.allDay}
                    onChange={(e) => setEditEventData({ ...editEventData, allDay: e.target.checked })}
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
                    value={editEventData.startsAt}
                    onChange={(e) => setEditEventData({ ...editEventData, startsAt: e.target.value })}
                    className="w-full px-4 py-2 rounded border"
                    style={{ background: "white", borderColor: "#E9E5DC" }}
                    disabled={editEventData.allDay}
                  />
                </div>

                {/* 종료 시간 */}
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: "#6B4F3F" }}>
                    종료 시간 <span style={{ color: "#FF6B6B" }}>*</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={editEventData.endsAt}
                    onChange={(e) => setEditEventData({ ...editEventData, endsAt: e.target.value })}
                    className="w-full px-4 py-2 rounded border"
                    style={{ background: "white", borderColor: "#E9E5DC" }}
                    disabled={editEventData.allDay}
                  />
                </div>
              </div>

              {/* 버튼 */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 px-6 py-3 rounded hover:opacity-80 transition font-semibold"
                  style={{ background: "#E9E5DC", color: "#6B4F3F" }}
                >
                  취소
                </button>
                <button
                  onClick={handleUpdateEvent}
                  className="flex-1 px-6 py-3 rounded hover:opacity-80 transition font-semibold"
                  style={{ background: "#90BE6D", color: "white" }}
                >
                  수정
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

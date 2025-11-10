/**
 * 캘린더 API
 * - 일정 목록, 상세, 작성, 수정, 삭제 등
 */

import { apiClient } from './client';
import { CALENDAR_ENDPOINTS } from './endpoints';

/**
 * 캘린더 이벤트 타입
 */
export interface CalendarEvent {
  eventId: number;
  title: string;
  description?: string;
  startDate: string; // ISO 8601 format
  endDate: string;   // ISO 8601 format
  category?: string;
  userId: number;
  createdAt: string;
  updatedAt?: string;
}

/**
 * 일정 목록 조회 파라미터
 */
export interface GetEventsParams {
  year?: number;
  month?: number; // 1-12
  startDate?: string; // YYYY-MM-DD
  endDate?: string;   // YYYY-MM-DD
}

/**
 * 일정 작성 데이터
 */
export interface CreateEventData {
  title: string;
  description?: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  category?: string;
}

/**
 * 일정 목록 조회
 *
 * @example
 * const events = await getEvents({ year: 2025, month: 11 });
 */
export async function getEvents(params: GetEventsParams = {}): Promise<CalendarEvent[]> {
  return apiClient.get<CalendarEvent[]>(CALENDAR_ENDPOINTS.EVENTS, {
    params,
  });
}

/**
 * 일정 상세 조회
 *
 * @example
 * const event = await getEvent(123);
 */
export async function getEvent(eventId: string | number): Promise<CalendarEvent> {
  return apiClient.get<CalendarEvent>(CALENDAR_ENDPOINTS.EVENT_DETAIL(String(eventId)));
}

/**
 * 일정 작성
 *
 * @example
 * const newEvent = await createEvent({
 *   title: '독서 모임',
 *   description: '도서관에서 독서 모임',
 *   startDate: '2025-11-15',
 *   endDate: '2025-11-15',
 * });
 */
export async function createEvent(data: CreateEventData): Promise<CalendarEvent> {
  return apiClient.post<CalendarEvent>(CALENDAR_ENDPOINTS.CREATE, data);
}

/**
 * 일정 수정
 *
 * @example
 * const updated = await updateEvent(123, {
 *   title: '수정된 제목',
 * });
 */
export async function updateEvent(
  eventId: string | number,
  data: Partial<CreateEventData>
): Promise<CalendarEvent> {
  return apiClient.put<CalendarEvent>(CALENDAR_ENDPOINTS.UPDATE(String(eventId)), data);
}

/**
 * 일정 삭제
 *
 * @example
 * await deleteEvent(123);
 */
export async function deleteEvent(eventId: string | number): Promise<void> {
  return apiClient.delete(CALENDAR_ENDPOINTS.DELETE(String(eventId)));
}

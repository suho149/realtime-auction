// src/utils/dateUtils.ts

/**
 * JavaScript Date 객체를 'YYYY-MM-DDTHH:mm:ss' 형식의 로컬 시간 문자열로 변환합니다.
 * 백엔드의 LocalDateTime 타입과 호환됩니다.
 * @param date 변환할 Date 객체
 * @returns 'YYYY-MM-DDTHH:mm:ss' 형식의 문자열
 */
export const toLocalISOString = (date: Date): string => {
    const pad = (num: number) => num.toString().padStart(2, '0');

    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1); // getMonth()는 0부터 시작
    const day = pad(date.getDate());
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    const seconds = pad(date.getSeconds());

    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
};
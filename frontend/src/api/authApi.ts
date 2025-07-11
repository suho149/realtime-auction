// src/api/authApi.ts
import axiosInstance from './axiosInstance';
import { deleteCookie } from '../utils/cookie';

interface UserInfo {
    name: string;
    email: string;
    picture: string;
}

// 내 정보 조회 API
export const fetchMyInfo = async (): Promise<UserInfo> => {
    const { data } = await axiosInstance.get('/api/v1/users/me');
    return data;
};

// 로그아웃 API
export const logout = async () => {
    try {
        await axiosInstance.post('/api/v1/auth/logout');
    } catch (error) {
        console.error("로그아웃 API 호출 실패:", error);
    } finally {
        // API 호출 성공 여부와 관계없이 쿠키는 삭제
        deleteCookie('access_token');
        deleteCookie('refresh_token');
    }
};
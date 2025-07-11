// src/hooks/useAuth.ts
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchMyInfo, logout as logoutApi } from '../api/authApi';

export const useAuth = () => {
    const queryClient = useQueryClient();

    // 'me'라는 쿼리 키로 사용자 정보를 관리합니다.
    const { data: userInfo, isLoading, isError } = useQuery({
        queryKey: ['me'],
        queryFn: fetchMyInfo,
        staleTime: Infinity, // 한 번 로그인하면 정보가 거의 바뀌지 않으므로 staleTime을 길게 설정
        retry: false, // 인증 에러 시 불필요한 재시도를 막음
    });

    const logout = async () => {
        await logoutApi();
        // 로그아웃 성공 시 'me' 쿼리 캐시를 삭제하여 로그인 상태를 갱신합니다.
        queryClient.removeQueries({ queryKey: ['me'] });
    };

    return {
        userInfo,
        isLoggedIn: !!userInfo && !isError,
        isLoading,
        logout,
    };
};
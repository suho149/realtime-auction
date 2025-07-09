import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const axiosInstance = axios.create({
    baseURL: 'http://localhost:8080',
    withCredentials: true,
});

// isRefreshing: 토큰 재발급 중인지 여부 (중복 재발급 방지)
let isRefreshing = false;
// failedQueue: 재발급 중 실패한 요청들을 저장하는 배열
let failedQueue: { resolve: (value?: any) => void, reject: (reason?: any) => void }[] = [];

const processQueue = (error: AxiosError | null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve();
        }
    });
    failedQueue = [];
};

axiosInstance.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig;

        // 401 에러이고, 재발급 시도가 아니라면
        if (error.response?.status === 401 && !(originalRequest as any)._retry) {
            if (isRefreshing) {
                // 재발급 중이라면, 요청을 큐에 추가
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then(() => {
                    return axiosInstance(originalRequest);
                });
            }

            (originalRequest as any)._retry = true;
            isRefreshing = true;

            try {
                // Access Token 재발급 요청
                await axiosInstance.post('/api/v1/auth/reissue');

                // 재발급 성공 후, 실패했던 원래 요청을 다시 시도
                processQueue(null);
                return axiosInstance(originalRequest);
            } catch (reissueError) {
                // 재발급 실패 시 (Refresh Token 만료 등)
                processQueue(reissueError as AxiosError);
                console.error("Token refresh failed:", reissueError);
                // 로그아웃 처리 또는 로그인 페이지로 리디렉션
                window.location.href = '/login';
                return Promise.reject(reissueError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

export default axiosInstance;
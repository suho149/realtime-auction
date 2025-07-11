// src/App.tsx

import React from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import ProductCreatePage from './pages/ProductCreatePage';
import ProductDetailPage from './pages/ProductDetailPage';

// QueryClient 인스턴스 생성
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            // staleTime: 1000 * 60 * 5, // 5분
            refetchOnWindowFocus: false, // 창 포커스 시 자동 재요청 비활성화 (선택)
            retry: 1, // 실패 시 재시도 횟수
        },
    },
});

function App() {
    return (
        // QueryClientProvider로 앱 전체를 감싸줍니다.
        <QueryClientProvider client={queryClient}>
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/products/new" element={<ProductCreatePage />} />
                    <Route path="/products/:productId" element={<ProductDetailPage />} />
                    {/* 다른 라우트들 */}
                </Routes>
            </BrowserRouter>
            {/* 개발 환경에서만 Devtools가 보이도록 설정 */}
            <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
    );
}

export default App;
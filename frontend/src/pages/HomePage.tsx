// src/pages/HomePage.tsx

import React, { useRef, useCallback } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth'; // 인증 관련 로직을 담은 커스텀 훅
import { fetchProducts } from '../api/productApi'; // API 호출 함수
import Header from '../components/Header';
import ProductCard from '../components/ProductCard';
import { Search } from 'lucide-react';

// Product 타입을 인터페이스로 정의
interface Product {
    id: number;
    title: string;
    startingPrice: number;
    auctionEndTime: string;
    sellerName: string;
    thumbnailUrl?: string;
}

const HomePage = () => {
    // 1. useAuth 훅을 사용하여 사용자 정보와 로그아웃 함수를 가져옵니다.
    const { userInfo, logout } = useAuth();

    // 2. useInfiniteQuery 훅으로 상품 목록 데이터를 관리합니다.
    const {
        data,
        error,
        fetchNextPage,
        hasNextPage,
        isFetching,
        isFetchingNextPage,
    } = useInfiniteQuery({
        queryKey: ['products'],
        queryFn: fetchProducts,
        // ▼▼▼ 에러 해결을 위해 이 부분을 추가합니다 ▼▼▼
        initialPageParam: 0, // 첫 페이지는 0번 페이지부터 시작
        // ▲▲▲ 여기까지 추가 ▲▲▲
        getNextPageParam: (lastPage, allPages) => {
            if (lastPage.last) {
                return undefined;
            }
            return allPages.length;
        },
    });

    // 3. Intersection Observer 로직
    const observer = useRef<IntersectionObserver>();
    const lastProductElementRef = useCallback((node: HTMLDivElement | null) => {
        if (isFetchingNextPage) return;
        if (observer.current) observer.current.disconnect();

        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasNextPage) {
                fetchNextPage();
            }
        });

        if (node) observer.current.observe(node);
    }, [isFetchingNextPage, hasNextPage, fetchNextPage]);

    // 4. 데이터를 단일 배열로 펼치는 로직
    const products: Product[] = data?.pages.flatMap(page => page.content) ?? [];

    // 에러 처리
    if (error) {
        return <div>상품 목록을 불러오는 중 에러가 발생했습니다.</div>
    }

    return (
        <div className="bg-gray-50 min-h-screen">
            <Header userInfo={userInfo ?? null} onLogout={logout} />

            <main className="container mx-auto px-4 py-8">
                {/* 메인 배너 및 검색창 UI */}
                <section className="text-center bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-24 px-6 rounded-2xl shadow-2xl mb-16 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full bg-black bg-opacity-20"></div>
                    <div className="relative z-10">
                        <h1 className="text-5xl font-extrabold mb-4 tracking-tight">세상의 모든 것을 경매하다</h1>
                        <p className="text-xl mb-8 max-w-2xl mx-auto">지금 바로 참여하여 특별한 상품을 획득하세요!</p>
                        <div className="relative w-full max-w-2xl mx-auto">
                            <input
                                type="text"
                                placeholder="어떤 상품을 찾고 계신가요?"
                                className="w-full p-4 pl-12 rounded-full text-gray-800 focus:outline-none focus:ring-4 focus:ring-yellow-400 transition-shadow duration-300"
                            />
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={20} strokeWidth={2.5} />
                        </div>
                    </div>
                </section>

                {/* 상품 목록 렌더링 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {products.map((product, index) => {
                        if (products.length === index + 1) {
                            return <div ref={lastProductElementRef} key={product.id}><ProductCard product={product} /></div>;
                        } else {
                            return <ProductCard key={product.id} product={product} />;
                        }
                    })}
                </div>

                {/* 로딩 상태 UI */}
                {(isFetching || isFetchingNextPage) && (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                        <p className="mt-4 text-gray-600">상품을 불러오는 중...</p>
                    </div>
                )}

                {/* 더 이상 불러올 페이지가 없을 때의 UI */}
                {!hasNextPage && products.length > 0 && !isFetching && (
                    <p className="text-center text-gray-500 py-12">모든 상품을 불러왔습니다.</p>
                )}
            </main>
        </div>
    );
};

export default HomePage;
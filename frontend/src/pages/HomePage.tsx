// src/pages/HomePage.tsx

import React, {useRef, useCallback, useState} from 'react';
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

const CATEGORIES = [
    { key: "", desc: "전체" }, // 필터링 없음을 의미하는 '전체' 카테고리
    { key: "DIGITAL_DEVICE", desc: "디지털 기기" },
    { key: "HOME_APPLIANCES", desc: "생활가전" },
    { key: "FURNITURE_INTERIOR", desc: "가구/인테리어" },
    { key: "LIFE_KITCHEN", desc: "생활/주방" },
    { key: "CLOTHING", desc: "의류" },
    { key: "BEAUTY", desc: "뷰티/미용" },
    { key: "SPORTS_LEISURE", desc: "스포츠/레저" },
    { key: "BOOKS_TICKETS_RECORDS", desc: "도서/티켓/음반" },
    { key: "PET_SUPPLIES", desc: "반려동물용품" },
    { key: "ETC", desc: "기타 중고물품" }
];

const HomePage = () => {
    // 1. useAuth 훅을 사용하여 사용자 정보와 로그아웃 함수를 가져옵니다.
    const { userInfo, logout } = useAuth();
    const [category, setCategory] = useState(''); // 카테고리 필터 상태
    const [sort, setSort] = useState('id,desc'); // 정렬 상태

    // 2. useInfiniteQuery 훅으로 상품 목록 데이터를 관리합니다.
    const {
        data, error, fetchNextPage, hasNextPage, isFetching, isFetchingNextPage,
    } = useInfiniteQuery({
        // queryKey에 필터와 정렬 상태를 포함하여, 상태 변경 시 새로운 쿼리로 인식하게 함
        queryKey: ['products', category, sort],
        queryFn: ({ pageParam }) => fetchProducts({ pageParam, category, sort }),
        initialPageParam: 0,
        getNextPageParam: (lastPage, allPages) => lastPage.last ? undefined : allPages.length,
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

                {/* 필터 및 정렬 UI 추가 */}
                <div className="mb-8 p-4 bg-white rounded-lg shadow-sm flex flex-wrap items-center justify-between gap-4">
                    <div className="flex flex-wrap gap-2">
                        {CATEGORIES.map(cat => (
                            <button
                                key={cat.key}
                                onClick={() => setCategory(cat.key)}
                                className={`px-4 py-2 text-sm font-medium rounded-full transition ${category === cat.key ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                            >
                                {cat.desc}
                            </button>
                        ))}
                    </div>
                    <select
                        value={sort}
                        onChange={(e) => setSort(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="id,desc">최신순</option>
                        <option value="auctionEndTime,asc">마감임박순</option>
                        <option value="startingPrice,asc">낮은가격순</option>
                        <option value="startingPrice,desc">높은가격순</option>
                    </select>
                </div>

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
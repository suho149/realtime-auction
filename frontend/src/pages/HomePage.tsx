import React, { useEffect, useState, useRef, useCallback } from 'react';
import axiosInstance from '../api/axiosInstance';
import { getCookieValue, deleteCookie } from '../utils/cookie';
import Header from '../components/Header';
import ProductCard from '../components/ProductCard';
import { Search } from 'lucide-react';

interface Product {
    id: number;
    title: string;
    startingPrice: number;
    auctionEndTime: string;
    sellerName: string;
}

interface Page<T> {
    content: T[];
    last: boolean;
}

interface UserInfo {
    name: string;
    email: string;
    picture: string;
}

const HomePage = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);
    const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

    const observer = useRef<IntersectionObserver>();
    const lastProductElementRef = useCallback((node: HTMLDivElement | null) => {
        if (loading) return;
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                setPage(prevPage => prevPage + 1);
            }
        });
        if (node) observer.current.observe(node);
    }, [loading, hasMore]);

    useEffect(() => {
        const initialize = async () => {
            try {
                const response = await axiosInstance.get<UserInfo>('/api/v1/users/me');
                setUserInfo(response.data);
            } catch (error) {
                console.log("비로그인 상태이거나 토큰이 만료되었습니다.");
                setUserInfo(null);
            }
        };
        initialize();
    }, []);

    useEffect(() => {
        // page가 0일 때는 초기 로드, 그 이후에는 무한 스크롤로 간주
        // 이미 데이터가 있는데 page가 0이면 중복 로드일 수 있으므로 방지
        if (page === 0 && products.length > 0) return;

        const fetchProducts = async () => {
            setLoading(true);
            try {
                const response = await axiosInstance.get<Page<Product>>(`/api/v1/products?page=${page}&size=9&sort=auctionEndTime,asc`);

                setProducts(prev => {
                    const existingIds = new Set(prev.map(p => p.id));
                    const newProducts = response.data.content.filter(p => !existingIds.has(p.id));
                    return [...prev, ...newProducts];
                });

                setHasMore(!response.data.last);
            } catch (error) {
                console.error("상품 목록 조회 실패:", error);
            }
            setLoading(false);
        };
        fetchProducts();
    }, [page]);

    const handleLogout = async () => {
        try {
            await axiosInstance.post('/api/v1/auth/logout');
        } catch (error) {
            console.error("로그아웃 API 호출 실패:", error);
        } finally {
            deleteCookie('access_token');
            deleteCookie('refresh_token');
            setUserInfo(null);
        }
    };

    return (
        <div className="bg-gray-50 min-h-screen">
            <Header userInfo={userInfo} onLogout={handleLogout} />

            <main className="container mx-auto px-4 py-8">
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

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {products.map((product, index) => {
                        if (products.length === index + 1) {
                            return <div ref={lastProductElementRef} key={product.id}><ProductCard product={product} /></div>;
                        } else {
                            return <ProductCard key={product.id} product={product} />;
                        }
                    })}
                </div>

                {loading && (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                        <p className="mt-4 text-gray-600">상품을 불러오는 중...</p>
                    </div>
                )}
                {!hasMore && products.length > 0 && (
                    <p className="text-center text-gray-500 py-12">모든 상품을 불러왔습니다.</p>
                )}
            </main>
        </div>
    );
};

export default HomePage;
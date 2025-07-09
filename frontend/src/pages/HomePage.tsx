import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';

// 상품 데이터 타입 정의
interface Product {
    id: number;
    title: string;
    startingPrice: number;
    auctionEndTime: string;
    sellerName: string;
}

// API 응답의 Page 객체 타입 정의
interface Page<T> {
    content: T[];
    totalPages: number;
    totalElements: number;
    number: number; // 현재 페이지 번호 (0부터 시작)
    size: number; // 페이지 크기
    first: boolean; // 첫 페이지 여부
    last: boolean; // 마지막 페이지 여부
}

const HomePage = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false); // 로딩 상태 추가

    // useRef를 사용하여 중복 호출 방지
    const loadingRef = React.useRef(false);

    const fetchProducts = async (pageNum: number) => {
        // 이미 로딩 중이면 실행하지 않음
        if (loadingRef.current) return;

        setLoading(true);
        loadingRef.current = true;

        try {
            const response = await axiosInstance.get<Page<Product>>(`/api/v1/products?page=${pageNum}&size=10&sort=auctionEndTime,asc`);

            // 중복되지 않은 데이터만 추가 (선택적이지만 좋은 습관)
            setProducts(prev => {
                const existingIds = new Set(prev.map(p => p.id));
                const newProducts = response.data.content.filter(p => !existingIds.has(p.id));
                return [...prev, ...newProducts];
            });

            setHasMore(!response.data.last);
        } catch (error) {
            console.error("상품 목록 조회 실패:", error);
        } finally {
            setLoading(false);
            loadingRef.current = false;
        }
    };

    // 첫 로드 시에만 호출되도록 수정
    useEffect(() => {
        // 컴포넌트 마운트 시 첫 페이지 데이터 로드
        fetchProducts(0);
    }, []); // 의존성 배열을 비워둠

    const loadMore = () => {
        // 다음 페이지 번호를 계산하여 fetchProducts 호출
        setPage(prevPage => {
            const nextPage = prevPage + 1;
            fetchProducts(nextPage);
            return nextPage;
        });
    };

    return (
        <div>
            <h1>실시간 경매 목록</h1>
            <Link to="/products/new"><button>상품 등록하기</button></Link>

            <div style={{ marginTop: '20px' }}>
                {products.map(product => (
                    // key는 여전히 product.id를 사용해도 안전
                    <div key={product.id} style={{ border: '1px solid #ccc', padding: '10px', marginBottom: '10px' }}>
                        <Link to={`/products/${product.id}`}>
                            <h2>{product.title}</h2>
                        </Link>
                        <p>판매자: {product.sellerName}</p>
                        <p>시작 가격: {product.startingPrice.toLocaleString()}원</p>
                        <p>경매 마감: {new Date(product.auctionEndTime).toLocaleString()}</p>
                    </div>
                ))}
            </div>

            {loading && <div>로딩 중...</div>}
            {hasMore && !loading && <button onClick={loadMore}>더 보기</button>}
        </div>
    );
};

export default HomePage;
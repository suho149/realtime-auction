import React, {useEffect, useRef, useState} from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import { getCookieValue, deleteCookie } from '../utils/cookie';

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

// ▼▼▼ 사용자 정보 인터페이스 추가 ▼▼▼
interface UserInfo {
    name: string;
    email: string;
    picture: string;
}

const HomePage = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false); // 로딩 상태 추가
    const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
    const isLoggedIn = !!userInfo; // userInfo가 있으면 로그인 상태로 간주
    const loadingRef = useRef(false);

    useEffect(() => {
        // ▼▼▼ 컴포넌트 마운트 시 인증 상태 확인 및 데이터 로드 ▼▼▼
        const initialize = async () => {
            // 1. 사용자 정보 조회를 시도하여 로그인 상태 확인
            try {
                const response = await axiosInstance.get<UserInfo>('/api/v1/users/me');
                setUserInfo(response.data); // 성공 시 사용자 정보 저장
            } catch (error) {
                console.log("비로그인 상태이거나 토큰이 만료되었습니다.");
                setUserInfo(null); // 실패 시 사용자 정보 null로 설정
            }

            // 2. 상품 목록 불러오기
            fetchProducts(0);
        };

        initialize();
    }, []);

    const fetchProducts = async (pageNum: number) => {
        if (loadingRef.current) return;
        setLoading(true);
        loadingRef.current = true;

        try {
            const response = await axiosInstance.get<Page<Product>>(`/api/v1/products?page=${pageNum}&size=10&sort=auctionEndTime,asc`);
            setProducts(prev => {
                const existingIds = new Set(prev.map(p => p.id));
                const newProducts = response.data.content.filter(p => !existingIds.has(p.id));
                return [...prev, ...newProducts];
            });
            setHasMore(!response.data.last);

            // API 호출이 성공적으로 끝난 후에 로그인 상태를 체크합니다.
            const accessToken = getCookieValue('access_token');

        } catch (error) {
            console.error("상품 목록 조회 실패:", error);
            // API 호출 실패 시(토큰 만료 후 재발급도 실패 등) 로그아웃 상태로 간주합니다.
        } finally {
            setLoading(false);
            loadingRef.current = false;
        }
    };

    const loadMore = () => {
        // 다음 페이지 번호를 계산하여 fetchProducts 호출
        setPage(prevPage => {
            const nextPage = prevPage + 1;
            fetchProducts(nextPage);
            return nextPage;
        });
    };

    // ▼▼▼ 로그아웃 핸들러 추가 ▼▼▼
    const handleLogout = async () => {
        try {
            await axiosInstance.post('/api/v1/auth/logout');
        } catch (error) {
            console.error("로그아웃 API 호출 실패:", error);
        } finally {
            // API 호출 성공 여부와 관계없이 쿠키 삭제 및 상태 업데이트
            deleteCookie('access_token');
            deleteCookie('refresh_token');
            setUserInfo(null);
            // 필요하다면 window.location.reload(); 또는 navigate 사용
        }
    };

    return (
        <div>
            {/* ▼▼▼ 헤더 UI 수정 ▼▼▼ */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1>실시간 경매 목록</h1>
                {isLoggedIn && userInfo ? (
                    <div>
                        <img src={userInfo.picture} alt={userInfo.name} width="30" style={{ borderRadius: '50%', marginRight: '10px' }} />
                        <span>{userInfo.name}님</span>
                        <Link to="/products/new" style={{ marginLeft: '15px' }}>
                            <button>상품 등록하기</button>
                        </Link>
                        <button onClick={handleLogout} style={{ marginLeft: '10px' }}>로그아웃</button>
                    </div>
                ) : (
                    <Link to="/login">
                        <button>로그인 / 회원가입</button>
                    </Link>
                )}
            </div>

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
import React, {useEffect, useRef, useState} from 'react';
import { useParams } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

interface ProductDetail {
    id: number;
    title: string;
    description: string;
    startingPrice: number;
    currentPrice: number;
    highestBidderName: string;
    auctionStartTime: string;
    auctionEndTime: string;
    status: string;
    sellerName: string;
    bidderCount: number;
}

// AuctionStatus 타입 추가
interface AuctionStatus {
    currentHighestBid: number;
    highestBidderName: string;
    bidderCount: number;
}

// 쿠키 값을 가져오는 헬퍼 함수
const getCookieValue = (name: string): string | null => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
        return parts.pop()?.split(';').shift() || null;
    }
    return null;
};

const ProductDetailPage = () => {
    const { productId } = useParams<{ productId: string }>();
    const [product, setProduct] = useState<ProductDetail | null>(null);
    const [loading, setLoading] = useState(true);

    const [auctionStatus, setAuctionStatus] = useState<AuctionStatus | null>(null);
    const [bidAmount, setBidAmount] = useState(0);
    const clientRef = useRef<Client | null>(null);

    const [isAuthenticated, setIsAuthenticated] = useState(false); // 인증 상태 state 추가

    useEffect(() => {
        // 인증 상태를 확인하고, 유효한 토큰을 보장하는 함수
        const checkAuthAndConnect = async () => {
            try {
                // 1. (선택사항이지만 권장) 인증이 필요한 API를 먼저 호출하여 로그인 상태 확인 및 토큰 갱신
                await axiosInstance.get('/api/v1/users/me');
                setIsAuthenticated(true);
                return getCookieValue('access_token'); // 갱신된 최신 토큰 반환
            } catch (error) {
                setIsAuthenticated(false);
                console.error("인증 실패, 비로그인 상태로 WebSocket 연결 시도:", error);
                return null; // 토큰이 없음을 명시
            }
        };

        const connectWebSocket = (accessToken: string | null) => {
            if (productId) {
                const client = new Client({
                    webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
                    // 인증 상태 확인 후 가져온 토큰을 헤더에 추가
                    connectHeaders: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
                    debug: (str) => { console.log(new Date(), str); },
                    reconnectDelay: 5000,
                });

                client.onConnect = () => {
                    console.log('WebSocket 연결 성공!');
                    client.subscribe(`/topic/auctions/${productId}`, (message) => {
                        const status = JSON.parse(message.body) as AuctionStatus;
                        setAuctionStatus(status);
                    });
                };

                client.onStompError = (frame) => { console.error('STOMP 에러:', frame); };
                client.activate();
                clientRef.current = client;
            }
        };

        const initializePage = async () => {
            if (!productId) return;

            setLoading(true);
            // 1. 상품 정보를 먼저 불러옴
            try {
                const response = await axiosInstance.get<ProductDetail>(`/api/v1/products/${productId}`);
                const productData = response.data; // 가독성을 위해 변수에 담기
                setProduct(productData);
                setAuctionStatus({
                    currentHighestBid: productData.currentPrice,
                    highestBidderName: productData.highestBidderName,
                    bidderCount: productData.bidderCount // <-- API 응답값으로 초기화
                });
            } catch (error) {
                console.error("상품 상세 정보 조회 실패:", error);
            }

            // 2. 인증 상태를 확인하고, 그 결과로 받은 토큰으로 웹소켓 연결
            const token = await checkAuthAndConnect();
            connectWebSocket(token);

            setLoading(false);
        };

        initializePage();

        // 컴포넌트 언마운트 시 연결 종료
        return () => {
            if (clientRef.current) {
                clientRef.current.deactivate();
                console.log('WebSocket 연결 종료.');
            }
        };
    }, [productId]);

    // 입찰 제출 핸들러
    const handleBidSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (clientRef.current && clientRef.current.connected && productId) {
            const bidRequest = {
                productId: Number(productId),
                bidAmount: Number(bidAmount),
            };
            // 서버의 /app/auctions/bid 경로로 메시지 발행
            clientRef.current.publish({
                destination: '/app/auctions/bid',
                body: JSON.stringify(bidRequest),
            });
            setBidAmount(0); // 입찰 후 입력 필드 초기화
        }
    };

    if (loading) {
        return <div>로딩 중...</div>;
    }

    if (!product) {
        return <div>상품 정보를 찾을 수 없습니다.</div>;
    }

    // 현재 시간이 경매 종료 시간을 지났는지 또는 상태가 SOLD_OUT인지 확인
    const isAuctionEnded = new Date(product.auctionEndTime) < new Date() || product.status === 'SOLD_OUT';

    // 입찰 폼을 보여줄지 여부를 결정
    const canBid = !isAuctionEnded && isAuthenticated;

    return (
        <div>
            <h1>{product.title}</h1>
            <p><strong>판매자:</strong> {product.sellerName}</p>
            <p><strong>상태:</strong> {product.status}</p>
            <hr />
            <p>{product.description}</p>
            <hr />
            <p><strong>시작 가격:</strong> {product.startingPrice.toLocaleString()}원</p>
            <p><strong>경매 시작:</strong> {new Date(product.auctionStartTime).toLocaleString()}</p>
            <p><strong>경매 마감:</strong> {new Date(product.auctionEndTime).toLocaleString()}</p>

            {/* TODO: 여기에 경매 입찰 UI 추가 */}
            <hr />
            <h2>실시간 경매 현황</h2>
            <p><strong>현재 최고가:</strong> {auctionStatus ? auctionStatus.currentHighestBid.toLocaleString() : product?.startingPrice.toLocaleString()}원</p>
            <p><strong>최고 입찰자:</strong> {auctionStatus ? auctionStatus.highestBidderName : '없음'}</p>
            <p><strong>총 입찰자 수:</strong> {auctionStatus ? auctionStatus.bidderCount : 0}명</p>

            {/* 경매가 진행 중일 때만 입찰 폼을 보여줌 */}
            {canBid ? (
                <form onSubmit={handleBidSubmit} style={{ marginTop: '20px' }}>
                    <input
                        type="number"
                        value={bidAmount}
                        onChange={(e) => setBidAmount(Number(e.target.value))}
                        placeholder="입찰 금액"
                        required
                    />
                    <button type="submit">입찰하기</button>
                </form>
            ) : (
                <div style={{ marginTop: '20px', color: 'gray' }}>
                    {isAuctionEnded ? '이 경매는 종료되었습니다.' : '로그인 후 입찰에 참여할 수 있습니다.'}
                </div>
            )}
        </div>
    );
};

export default ProductDetailPage;
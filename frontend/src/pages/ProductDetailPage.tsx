import React, {useEffect, useRef, useState} from 'react';
import { useParams } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

// ProductResponse와 동일한 타입
interface ProductDetail {
    id: number;
    title: string;
    description: string;
    startingPrice: number;
    winningPrice: number | null;
    auctionStartTime: string;
    auctionEndTime: string;
    status: string;
    sellerName: string;
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

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const response = await axiosInstance.get<ProductDetail>(`/api/v1/products/${productId}`);
                setProduct(response.data);
            } catch (error) {
                console.error("상품 상세 정보 조회 실패:", error);
            } finally {
                setLoading(false);
            }
        };

        if (productId) {
            fetchProduct();
        }

        // --- WebSocket 연결 로직 ---
        const connectWebSocket = () => {
            if (productId) {
                const accessToken = getCookieValue('access_token');

                // WebSocket 클라이언트 생성 시 connectHeaders 추가
                const client = new Client({
                    webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
                    connectHeaders: {
                        // Authorization 헤더에 Bearer 토큰을 담아 전송
                        Authorization: `Bearer ${accessToken}`
                    },
                    debug: (str) => { console.log(new Date(), str); },
                    reconnectDelay: 5000,
                })

                // 연결 성공 시 콜백
                client.onConnect = () => {
                    console.log('WebSocket 연결 성공!');
                    client.subscribe(`/topic/auctions/${productId}`, (message) => {
                        const status = JSON.parse(message.body) as AuctionStatus;
                        setAuctionStatus(status);
                    });
                };

                // 연결 에러 시 콜백
                client.onStompError = (frame) => {
                    console.error('STOMP 에러:', frame);
                };

                client.activate();
                clientRef.current = client;
            }
        };

        if (productId) {
            fetchProduct().then(() => {
                // 상품 정보를 성공적으로 불러온 후에 WebSocket 연결 시도
                connectWebSocket();
            });
        }

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
            {!isAuctionEnded ? (
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
                <div style={{ marginTop: '20px', color: 'red', fontWeight: 'bold' }}>
                    <p>이 경매는 종료되었습니다.</p>
                </div>
            )}
        </div>
    );
};

export default ProductDetailPage;
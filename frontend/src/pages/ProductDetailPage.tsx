import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { getCookieValue, deleteCookie } from '../utils/cookie';
import Header from '../components/Header';
import { Clock, User, Users, Info } from 'lucide-react';
import "react-responsive-carousel/lib/styles/carousel.min.css"; // 캐러셀 CSS
import { Carousel } from 'react-responsive-carousel';

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
    imageUrls: string[];
    category: string;
}

interface AuctionStatus {
    currentHighestBid: number;
    highestBidderName: string;
    bidderCount: number;
}

interface UserInfo {
    name: string;
    email: string;
    picture: string;
}

const ProductDetailPage = () => {
    const { productId } = useParams<{ productId: string }>();
    const [product, setProduct] = useState<ProductDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [auctionStatus, setAuctionStatus] = useState<AuctionStatus | null>(null);
    const [bidAmount, setBidAmount] = useState<number | ''>('');
    const clientRef = useRef<Client | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

    useEffect(() => {
        const initializePage = async () => {
            if (!productId) return;
            setLoading(true);

            try {
                const userResponse = await axiosInstance.get<UserInfo>('/api/v1/users/me');
                setUserInfo(userResponse.data);
                setIsAuthenticated(true);
            } catch (error) {
                setUserInfo(null);
                setIsAuthenticated(false);
            }

            try {
                const productResponse = await axiosInstance.get<ProductDetail>(`/api/v1/products/${productId}`);
                const productData = productResponse.data;
                setProduct(productData);
                setAuctionStatus({
                    currentHighestBid: productData.currentPrice,
                    highestBidderName: productData.highestBidderName,
                    bidderCount: productData.bidderCount,
                });
            } catch (error) {
                console.error("상품 상세 정보 조회 실패:", error);
            }

            connectWebSocket();
            setLoading(false);
        };

        const connectWebSocket = () => {
            const accessToken = getCookieValue('access_token');
            const client = new Client({
                webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
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
        };

        initializePage();

        return () => {
            if (clientRef.current) {
                clientRef.current.deactivate();
            }
        };
    }, [productId]);

    const handleLogout = async () => {
        try { await axiosInstance.post('/api/v1/auth/logout'); }
        catch (error) { console.error("로그아웃 API 호출 실패:", error); }
        finally {
            deleteCookie('access_token');
            deleteCookie('refresh_token');
            setUserInfo(null);
            setIsAuthenticated(false);
        }
    };

    const handleBidSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (clientRef.current?.connected && productId && bidAmount) {
            clientRef.current.publish({
                destination: '/app/auctions/bid',
                body: JSON.stringify({ productId: Number(productId), bidAmount: Number(bidAmount) }),
            });
            setBidAmount('');
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-24 w-24 border-t-4 border-b-4 border-blue-500"></div></div>;
    if (!product) return <div>상품 정보를 찾을 수 없습니다.</div>;

    const isAuctionEnded = new Date(product.auctionEndTime) < new Date() || product.status === 'SOLD_OUT';
    const canBid = !isAuctionEnded && isAuthenticated;

    return (
        <div className="bg-gray-50 min-h-screen">
            <Header userInfo={userInfo} onLogout={handleLogout} />

            <main className="container mx-auto px-4 py-12">
                <div className="bg-white p-8 md:p-12 rounded-2xl shadow-xl max-w-6xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                        {/* 상품 이미지 캐러셀 */}
                        <Carousel showArrows={true} autoPlay={true} infiniteLoop={true}>
                            {product.imageUrls.map((url, index) => (
                                <div key={index}>
                                    <img src={`http://localhost:8080${url}`} alt={`${product.title} ${index + 1}`} />
                                </div>
                            ))}
                        </Carousel>

                        <div className="flex flex-col justify-between">
                            <div>
                                <span className="text-sm font-semibold text-blue-600 bg-blue-100 px-3 py-1 rounded-full">{product.status}</span>
                                <h1 className="text-4xl font-bold text-gray-900 my-4">{product.title}</h1>
                                <p className="text-gray-600 mb-6 leading-relaxed">{product.description}</p>
                                <div className="flex items-center text-gray-500 text-sm mb-6">
                                    <Clock size={16} className="mr-2" />
                                    <span>경매 마감: {new Date(product.auctionEndTime).toLocaleString('ko-KR')}</span>
                                </div>
                            </div>

                            <div className="bg-gray-100 p-6 rounded-lg">
                                <div className="flex justify-between items-center mb-4">
                                    <span className="text-gray-600 text-lg">현재 최고가</span>
                                    <span className="text-3xl font-bold text-blue-600">
                                        {auctionStatus ? auctionStatus.currentHighestBid.toLocaleString() : product.currentPrice.toLocaleString()}원
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm text-gray-500">
                                    <span><User size={14} className="inline mr-1" />{auctionStatus ? auctionStatus.highestBidderName : product.highestBidderName}</span>
                                    <span><Users size={14} className="inline mr-1" />{auctionStatus ? auctionStatus.bidderCount : product.bidderCount}명 참여</span>
                                </div>
                            </div>

                            <div className="mt-6">
                                {canBid ? (
                                    <form onSubmit={handleBidSubmit} className="flex space-x-3">
                                        <input
                                            type="number"
                                            className="w-full p-4 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                                            value={bidAmount}
                                            onChange={(e) => setBidAmount(Number(e.target.value))}
                                            placeholder={`현재가보다 높은 금액`}
                                            required
                                        />
                                        <button type="submit" className="bg-blue-600 text-white font-bold py-4 px-8 rounded-lg hover:bg-blue-700 transition shadow-md">
                                            입찰
                                        </button>
                                    </form>
                                ) : (
                                    <div className="text-center p-4 bg-gray-200 text-gray-600 rounded-lg flex items-center justify-center">
                                        <Info size={18} className="mr-2" />
                                        {isAuctionEnded ? '이 경매는 종료되었습니다.' : '로그인 후 입찰에 참여할 수 있습니다.'}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default ProductDetailPage;
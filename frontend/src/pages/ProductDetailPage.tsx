// src/pages/ProductDetailPage.tsx

import React, {useEffect, useState} from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth';
import { useStomp } from '../hooks/useStomp';
import { fetchProductDetail } from '../api/productApi';
import Header from '../components/Header';
import { ProductDetail } from '../types/product'; // 타입 정의를 외부 파일에서 import
import { Clock, User, Users, Info } from 'lucide-react';
import "react-responsive-carousel/lib/styles/carousel.min.css";
import { Carousel } from 'react-responsive-carousel';
import { useStompContext } from '../context/StompContext';


interface AuctionStatus {
    currentHighestBid: number;
    highestBidderName: string;
    bidderCount: number;
}

const ProductDetailPage = () => {
    const { productId } = useParams<{ productId: string }>();
    const queryClient = useQueryClient();
    const { userInfo, isLoggedIn, logout } = useAuth();
    const [bidAmount, setBidAmount] = useState<number | ''>('');

    const { publish, subscribe, unsubscribe } = useStompContext();

    const { data: product, isLoading, isError } = useQuery({
        queryKey: ['product', productId],
        queryFn: () => fetchProductDetail(productId!),
        enabled: !!productId,
    });

    useStomp({
        topic: `/topic/auctions/${productId}`,
        onMessage: (message) => {
            const newStatus = JSON.parse(message.body) as AuctionStatus;

            queryClient.setQueryData(['product', productId], (oldData: ProductDetail | undefined) => {
                if (!oldData) return;
                return {
                    ...oldData,
                    currentPrice: newStatus.currentHighestBid,
                    highestBidderName: newStatus.highestBidderName,
                    bidderCount: newStatus.bidderCount,
                };
            });
        },
    });

    useStomp({
        topic: `/user/queue/errors`,
        onMessage: (message) => {
            alert(`입찰 실패: ${message.body}`);
        }
    });

    // useEffect를 사용하여 구독 및 구독 해제 로직을 관리
    useEffect(() => {
        if (!productId) return;

        // 경매 상태 구독
        const auctionSubId = subscribe(`/topic/auctions/${productId}`, (message) => {
            const newStatus = JSON.parse(message.body) as AuctionStatus;
            queryClient.setQueryData(['product', productId], (oldData: any) => ({
                ...oldData,
                currentPrice: newStatus.currentHighestBid,
                highestBidderName: newStatus.highestBidderName,
                bidderCount: newStatus.bidderCount,
            }));
        });

        // 에러 메시지 구독
        const errorSubId = subscribe(`/user/queue/errors`, (message) => {
            alert(`입찰 실패: ${message.body}`);
        });

        // 컴포넌트 언마운트 시 구독 해제
        return () => {
            if (auctionSubId) unsubscribe(auctionSubId);
            if (errorSubId) unsubscribe(errorSubId);
        };
    }, [productId, subscribe, unsubscribe, queryClient]);

    const handleBidSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isLoggedIn && productId && bidAmount) {
            publish('/app/auctions/bid', {
                productId: Number(productId),
                bidAmount: Number(bidAmount)
            });
            setBidAmount('');
        }
    };

    if (isLoading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-24 w-24 border-t-4 border-b-4 border-blue-500"></div></div>;
    if (isError || !product) return <div>상품 정보를 찾을 수 없습니다.</div>;

    const isAuctionEnded = new Date(product.auctionEndTime) < new Date() || product.status === 'SOLD_OUT';
    const canBid = !isAuctionEnded && isLoggedIn;

    return (
        <div className="bg-gray-50 min-h-screen">
            <Header userInfo={userInfo ?? null} onLogout={logout} />

            <main className="container mx-auto px-4 py-12">
                <div className="bg-white p-8 md:p-12 rounded-2xl shadow-xl max-w-6xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                        <Carousel showArrows={true} autoPlay={true} infiniteLoop={true}>
                            {/* 이제 product.imageUrls가 string[]으로 정확히 추론되어 url은 string이 됩니다. */}
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
                                        {product.currentPrice.toLocaleString()}원
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm text-gray-500">
                                    <span><User size={14} className="inline mr-1" />{product.highestBidderName}</span>
                                    <span><Users size={14} className="inline mr-1" />{product.bidderCount}명 참여</span>
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
                                            min={product.currentPrice + 1}
                                            required
                                        />
                                        <button type="submit" className="bg-blue-600 text-white font-bold py-4 px-8 rounded-lg hover:bg-blue-700 transition shadow-md whitespace-nowrap">
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
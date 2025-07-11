// src/types/product.ts

export interface ProductDetail {
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
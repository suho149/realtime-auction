// src/api/productApi.ts
import axiosInstance from './axiosInstance';
import { ProductDetail } from '../types/product';

// 페이지네이션을 위한 타입 정의
interface Page<T> {
    content: T[];
    last: boolean;
    // ... 기타 페이징 정보
}

// 상품 목록 조회 API
// useInfiniteQuery와 함께 사용하기 위해 pageParam을 받도록 수정
export const fetchProducts = async ({ pageParam = 0 }) => {
    const { data } = await axiosInstance.get<Page<any>>(`/api/v1/products?page=${pageParam}&size=9&sort=auctionEndTime,asc`);
    return data;
};

// 상품 상세 조회 API
export const fetchProductDetail = async (productId: string): Promise<ProductDetail> => {
    // 3. axios.get<ProductDetail> 로 응답 데이터 타입을 지정
    const { data } = await axiosInstance.get<ProductDetail>(`/api/v1/products/${productId}`);
    return data;
};
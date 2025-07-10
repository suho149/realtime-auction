import React from 'react';
import { Link } from 'react-router-dom';
import { User, CircleDollarSign, Clock } from 'lucide-react';

interface Product {
    id: number;
    title: string;
    startingPrice: number;
    auctionEndTime: string;
    sellerName: string;
}

interface ProductCardProps {
    product: Product;
}

const ProductCard = ({ product }: ProductCardProps) => {
    return (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden transform hover:-translate-y-2 transition-all duration-300 ease-in-out hover:shadow-2xl">
            <Link to={`/products/${product.id}`} className="block">
                <div className="bg-gray-200 h-48 flex items-center justify-center">
                    <span className="text-gray-400">Image Placeholder</span>
                </div>
                <div className="p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-2 truncate">{product.title}</h2>
                    <div className="flex items-center text-sm text-gray-500 mb-4">
                        <User size={16} className="mr-2 text-gray-400" />
                        <span>{product.sellerName}</span>
                    </div>
                    <div className="flex items-center text-gray-800 mb-4">
                        <CircleDollarSign size={16} className="mr-2 text-blue-500" />
                        <span className="font-semibold">시작가: {product.startingPrice.toLocaleString()}원</span>
                    </div>
                    <div className="flex items-center text-red-600 font-medium text-sm">
                        <Clock size={16} className="mr-2" />
                        <span>마감: {new Date(product.auctionEndTime).toLocaleString('ko-KR')}</span>
                    </div>
                </div>
            </Link>
        </div>
    );
};

export default ProductCard;
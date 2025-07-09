import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';

const ProductCreatePage = () => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [startingPrice, setStartingPrice] = useState(1000);
    const [auctionStartTime, setAuctionStartTime] = useState('');
    const [auctionEndTime, setAuctionEndTime] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        try {
            const requestData = {
                title,
                description,
                startingPrice,
                auctionStartTime,
                auctionEndTime,
            };

            await axiosInstance.post('/api/v1/products', requestData);

            alert('상품이 성공적으로 등록되었습니다.');
            navigate('/'); // 등록 성공 후 메인 페이지로 이동
        } catch (err: any) {
            console.error("상품 등록 실패:", err);

            if (err.response && err.response.data && err.response.data.message) {
                setError(err.response.data.message);
            } else {
                setError('알 수 없는 오류로 상품 등록에 실패했습니다.');
            }
        }
    };

    return (
        <div>
            <h1>상품 등록하기</h1>
            <form onSubmit={handleSubmit}>
                <div>
                    <label>상품명:</label>
                    <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required />
                </div>
                <div>
                    <label>상품 설명:</label>
                    <textarea value={description} onChange={(e) => setDescription(e.target.value)} required />
                </div>
                <div>
                    <label>시작 가격:</label>
                    <input type="number" value={startingPrice} onChange={(e) => setStartingPrice(Number(e.target.value))} required />
                </div>
                <div>
                    <label>경매 시작 시간:</label>
                    <input type="datetime-local" value={auctionStartTime} onChange={(e) => setAuctionStartTime(e.target.value)} required />
                </div>
                <div>
                    <label>경매 종료 시간:</label>
                    <input type="datetime-local" value={auctionEndTime} onChange={(e) => setAuctionEndTime(e.target.value)} required />
                </div>
                {error && <p style={{ color: 'red' }}>{error}</p>}
                <button type="submit">상품 등록</button>
            </form>
        </div>
    );
};

export default ProductCreatePage;
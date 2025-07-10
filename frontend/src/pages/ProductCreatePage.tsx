import React, {useEffect, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import Header from '../components/Header';

interface UserInfo {
    name: string;
    email: string;
    picture: string;
}

const CATEGORIES = [
    "DIGITAL_DEVICE", "HOME_APPLIANCES", "FURNITURE_INTERIOR", "LIFE_KITCHEN",
    "CLOTHING", "BEAUTY", "SPORTS_LEISURE", "BOOKS_TICKETS_RECORDS",
    "PET_SUPPLIES", "ETC"
];

const ProductCreatePage = () => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [startingPrice, setStartingPrice] = useState(1000);
    const [auctionStartTime, setAuctionStartTime] = useState('');
    const [auctionEndTime, setAuctionEndTime] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
    const [images, setImages] = useState<File[]>([]);
    const [category, setCategory] = useState(CATEGORIES[0]);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const response = await axiosInstance.get('/api/v1/users/me');
                setUserInfo(response.data);
            } catch {
                alert('로그인이 필요합니다.');
                navigate('/login');
            }
        };
        fetchUser();
    }, [navigate]);

    const handleLogout = async () => { /* ... HomePage와 동일한 로직 ... */ };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setImages(Array.from(e.target.files));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (images.length === 0) {
            setError("최소 1장 이상의 이미지를 등록해야 합니다.");
            return;
        }

        const formData = new FormData();

        // JSON 데이터를 Blob으로 만들어 FormData에 추가
        const requestData = { title, description, startingPrice, auctionStartTime, auctionEndTime, category };
        formData.append('request', new Blob([JSON.stringify(requestData)], { type: "application/json" }));

        // 이미지 파일들을 FormData에 추가
        images.forEach(image => {
            formData.append('images', image);
        });

        try {
            await axiosInstance.post('/api/v1/products', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            alert('상품이 성공적으로 등록되었습니다.');
            navigate('/');
        } catch (err: any) {
            console.error("상품 등록 실패:", err);
            setError(err.response?.data?.message || '상품 등록에 실패했습니다.');
        }
    };

    return (
        <div className="bg-gray-50 min-h-screen">
            <Header userInfo={userInfo} onLogout={handleLogout} />
            <main className="container mx-auto px-4 py-12">
                <div className="max-w-2xl mx-auto bg-white p-8 rounded-2xl shadow-xl">
                    <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">새 경매 상품 등록</h1>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">상품명</label>
                            <input id="title" type="text" value={title} onChange={(e) => setTitle(e.target.value)} required
                                   className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"/>
                        </div>
                        <div>
                            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">상품 설명</label>
                            <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} required rows={5}
                                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"/>
                        </div>
                        <div>
                            <label htmlFor="startingPrice" className="block text-sm font-medium text-gray-700 mb-1">시작 가격 (원)</label>
                            <input id="startingPrice" type="number" value={startingPrice} onChange={(e) => setStartingPrice(Number(e.target.value))} required
                                   className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"/>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label htmlFor="auctionStartTime" className="block text-sm font-medium text-gray-700 mb-1">경매 시작 시간</label>
                                <input id="auctionStartTime" type="datetime-local" value={auctionStartTime} onChange={(e) => setAuctionStartTime(e.target.value)} required
                                       className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"/>
                            </div>
                            <div>
                                <label htmlFor="auctionEndTime" className="block text-sm font-medium text-gray-700 mb-1">경매 종료 시간</label>
                                <input id="auctionEndTime" type="datetime-local" value={auctionEndTime} onChange={(e) => setAuctionEndTime(e.target.value)} required
                                       className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"/>
                            </div>
                        </div>

                        <div>
                            <label>카테고리</label>
                            <select value={category} onChange={(e) => setCategory(e.target.value)}>
                                {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                            </select>
                        </div>
                        <div>
                            <label>상품 이미지 (최소 1장)</label>
                            <input type="file" multiple onChange={handleImageChange} accept="image/*" />
                        </div>

                        {error && <p className="text-red-500 text-sm text-center">{error}</p>}

                        <button type="submit" className="w-full bg-blue-600 text-white font-bold py-4 px-6 rounded-lg hover:bg-blue-700 transition-all duration-300 shadow-md text-lg">
                            등록하기
                        </button>
                    </form>
                </div>
            </main>
        </div>
    );
};

export default ProductCreatePage;
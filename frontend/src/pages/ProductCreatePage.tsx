import React, {useCallback, useEffect, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import Header from '../components/Header';
import DatePicker from "react-datepicker"; // DatePicker import
import "react-datepicker/dist/react-datepicker.css"; // DatePicker 기본 CSS
import { ko } from 'date-fns/locale'; // 한글 로케일
import { useDropzone } from 'react-dropzone'; // useDropzone 훅 import

interface UserInfo {
    name: string;
    email: string;
    picture: string;
}

// 백엔드 Enum과 동일한 구조의 객체 배열 생성
const CATEGORIES = [
    { key: "DIGITAL_DEVICE", desc: "디지털 기기" },
    { key: "HOME_APPLIANCES", desc: "생활가전" },
    { key: "FURNITURE_INTERIOR", desc: "가구/인테리어" },
    { key: "LIFE_KITCHEN", desc: "생활/주방" },
    { key: "CLOTHING", desc: "의류" },
    { key: "BEAUTY", desc: "뷰티/미용" },
    { key: "SPORTS_LEISURE", desc: "스포츠/레저" },
    { key: "BOOKS_TICKETS_RECORDS", desc: "도서/티켓/음반" },
    { key: "PET_SUPPLIES", desc: "반려동물용품" },
    { key: "ETC", desc: "기타 중고물품" }
];

const ProductCreatePage = () => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [startingPrice, setStartingPrice] = useState(1000);
    // 날짜 상태 타입을 Date | null 로 변경
    const [auctionStartTime, setAuctionStartTime] = useState<Date | null>(new Date());
    const [auctionEndTime, setAuctionEndTime] = useState<Date | null>(null);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
    const [images, setImages] = useState<File[]>([]);
    const [category, setCategory] = useState<string>(CATEGORIES[0].key);

    // Dropzone 설정
    const onDrop = useCallback((acceptedFiles: File[]) => {
        // 새로 추가된 파일과 기존 파일 합치기 (최대 10개 제한 예시)
        setImages(prev => [...prev, ...acceptedFiles].slice(0, 10));
    }, []);
    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.gif'] }
    });

    // 이미지 삭제 핸들러
    const removeImage = (index: number) => {
        setImages(prev => prev.filter((_, i) => i !== index));
    };

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

        // 현재 시간 정보 로그
        console.log('=== 시간 디버깅 정보 ===');
        console.log('현재 시간 (로컬):', new Date().toString());
        console.log('현재 시간 (UTC):', new Date().toISOString());
        console.log('시작 시간 (로컬):', auctionStartTime?.toString());
        console.log('시작 시간 (UTC):', auctionStartTime?.toISOString());
        console.log('종료 시간 (로컬):', auctionEndTime?.toString());
        console.log('종료 시간 (UTC):', auctionEndTime?.toISOString());
        console.log('브라우저 시간대:', Intl.DateTimeFormat().resolvedOptions().timeZone);

        const formData = new FormData();

        // JSON 데이터를 Blob으로 만들어 FormData에 추가
        const requestData = {
            title,
            description,
            startingPrice,
            // auctionStartTime과 endTime이 Date 객체임을 확인
            auctionStartTime: auctionStartTime ? auctionStartTime.toISOString() : null,
            auctionEndTime: auctionEndTime ? auctionEndTime.toISOString() : null,
            category
        };
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
                                <DatePicker
                                    id="auctionStartTime"
                                    selected={auctionStartTime}
                                    onChange={(date: Date | null) => setAuctionStartTime(date)}
                                    showTimeSelect
                                    timeFormat="HH:mm"
                                    timeIntervals={15}
                                    dateFormat="yyyy. MM. dd. a h:mm"
                                    locale={ko} // 한글 로케일 적용
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label htmlFor="auctionEndTime" className="block text-sm font-medium text-gray-700 mb-1">경매 종료 시간</label>
                                <DatePicker
                                    id="auctionEndTime"
                                    selected={auctionEndTime}
                                    onChange={(date: Date | null) => setAuctionEndTime(date)}
                                    showTimeSelect
                                    timeFormat="HH:mm"
                                    timeIntervals={15}
                                    dateFormat="yyyy. MM. dd. a h:mm"
                                    locale={ko}
                                    minDate={auctionStartTime || undefined}
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">카테고리</label>
                            <select id="category" value={category} onChange={(e) => setCategory(e.target.value)}
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none">
                                {/* 화면에는 한글(desc)을, 값(value)으로는 영어(key)를 사용 */}
                                {CATEGORIES.map(cat => <option key={cat.key} value={cat.key}>{cat.desc}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">상품 이미지 (최소 1장, 최대 10장)</label>
                            <div {...getRootProps()} className={`p-10 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'}`}>
                                <input {...getInputProps()} />
                                {isDragActive ?
                                    <p>여기에 파일을 놓으세요...</p> :
                                    <p>파일을 드래그하거나 클릭하여 업로드하세요.</p>
                                }
                            </div>
                            {/* 이미지 미리보기 */}
                            <div className="mt-4 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                                {images.map((file, index) => (
                                    <div key={index} className="relative">
                                        <img src={URL.createObjectURL(file)} alt={`preview ${index}`} className="w-full h-24 object-cover rounded-lg"/>
                                        <button type="button" onClick={() => removeImage(index)}
                                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">
                                            X
                                        </button>
                                    </div>
                                ))}
                            </div>
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
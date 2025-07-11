import React, {useCallback, useEffect, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import Header from '../components/Header';
import DatePicker from "react-datepicker"; // DatePicker import
import "react-datepicker/dist/react-datepicker.css"; // DatePicker 기본 CSS
import { ko } from 'date-fns/locale'; // 한글 로케일
import { useDropzone } from 'react-dropzone';
import {useMutation, useQueryClient} from "@tanstack/react-query";
import {useAuth} from "../hooks/useAuth";
import {createProduct} from "../api/productApi"; // useDropzone 훅 import
import { toLocalISOString } from '../utils/dateUtils';

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
    // 1. UI와 직접 관련된 상태(폼 입력 값)는 그대로 useState를 사용합니다.
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [startingPrice, setStartingPrice] = useState(1000);
    const [auctionStartTime, setAuctionStartTime] = useState<Date | null>(new Date());
    const [auctionEndTime, setAuctionEndTime] = useState<Date | null>(null);
    const [images, setImages] = useState<File[]>([]);
    const [category, setCategory] = useState<string>(CATEGORIES[0].key);

    const navigate = useNavigate();
    const queryClient = useQueryClient(); // 캐시 무효화를 위해 queryClient를 가져옵니다.

    // 2. 인증 관련 로직은 useAuth 훅으로 대체합니다.
    const { userInfo, isLoggedIn, isLoading: isAuthLoading, logout } = useAuth();

    // 3. 데이터 "생성/수정/삭제"는 useMutation 훅을 사용합니다.
    const { mutate, isPending, error } = useMutation({
        mutationFn: createProduct, // 실제 API를 호출할 함수
        onSuccess: () => {
            // Mutation 성공 시 실행될 콜백
            alert('상품이 성공적으로 등록되었습니다.');
            // 'products' 쿼리 키를 가진 캐시를 무효화(invalidate)합니다.
            // 이렇게 하면 HomePage로 돌아갔을 때 React-Query가 자동으로 최신 상품 목록을 다시 불러옵니다.
            queryClient.invalidateQueries({ queryKey: ['products'] });
            navigate('/');
        },
        onError: (err) => {
            // Mutation 실패 시 실행될 콜백. error 상태에 자동으로 에러 객체가 담깁니다.
            console.error("상품 등록 실패:", err);
        },
    });

    // 4. 인증 상태를 확인하고, 비로그인 시 로그인 페이지로 리디렉션합니다.
    useEffect(() => {
        // useAuth의 로딩이 끝나고, 로그인이 되어있지 않다면
        if (!isAuthLoading && !isLoggedIn) {
            alert('상품을 등록하려면 로그인이 필요합니다.');
            navigate('/login');
        }
    }, [isAuthLoading, isLoggedIn, navigate]);

    // 5. handleSubmit 함수는 이제 API 호출 대신 'mutate' 함수를 호출합니다.
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (images.length === 0) {
            alert("최소 1장 이상의 이미지를 등록해야 합니다.");
            return;
        }

        const formData = new FormData();
        const requestData = {
            title,
            description,
            startingPrice,
            category,
            // .toISOString() 대신 toLocalISOString() 헬퍼 함수 사용
            auctionStartTime: auctionStartTime ? toLocalISOString(auctionStartTime) : null,
            auctionEndTime: auctionEndTime ? toLocalISOString(auctionEndTime) : null,
        };
        formData.append('request', new Blob([JSON.stringify(requestData)], { type: "application/json" }));
        images.forEach(image => formData.append('images', image));

        // mutate 함수에 form 데이터를 전달하여 API 호출을 실행합니다.
        // 로딩, 에러, 성공 처리는 useMutation이 알아서 해줍니다.
        mutate(formData);
    };

    // Dropzone 및 이미지 핸들러 로직 (기존과 동일)
    const onDrop = useCallback((acceptedFiles: File[]) => { setImages(prev => [...prev, ...acceptedFiles].slice(0, 10)); }, []);
    const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.gif'] } });
    const removeImage = (index: number) => { setImages(prev => prev.filter((_, i) => i !== index)); };

    return (
        <div className="bg-gray-50 min-h-screen">
            <Header userInfo={userInfo ?? null} onLogout={logout} />
            <main className="container mx-auto px-4 py-12">
                <div className="max-w-2xl mx-auto bg-white p-8 rounded-2xl shadow-xl">
                    <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">새 경매 상품 등록</h1>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* ▼▼▼ 모든 입력 요소에 disabled={isPending} 속성을 추가합니다. ▼▼▼ */}
                        <div>
                            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">상품명</label>
                            <input id="title" type="text" value={title} onChange={(e) => setTitle(e.target.value)} required disabled={isPending}
                                   className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"/>
                        </div>
                        <div>
                            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">상품 설명</label>
                            <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} required rows={5} disabled={isPending}
                                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"/>
                        </div>
                        <div>
                            <label htmlFor="startingPrice" className="block text-sm font-medium text-gray-700 mb-1">시작 가격 (원)</label>
                            <input id="startingPrice" type="number" value={startingPrice} onChange={(e) => setStartingPrice(Number(e.target.value))} required disabled={isPending}
                                   className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"/>
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
                                    locale={ko}
                                    disabled={isPending}
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
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
                                    disabled={isPending}
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">카테고리</label>
                            <select id="category" value={category} onChange={(e) => setCategory(e.target.value)} disabled={isPending}
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed">
                                {CATEGORIES.map(cat => <option key={cat.key} value={cat.key}>{cat.desc}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">상품 이미지 (최소 1장, 최대 10장)</label>
                            <div {...getRootProps()} className={`p-10 border-2 border-dashed rounded-lg text-center transition-colors ${isPending ? 'cursor-not-allowed bg-gray-100' : 'cursor-pointer hover:border-blue-400'} ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}>
                                <input {...getInputProps()} disabled={isPending} />
                                {isPending ?
                                    <p>등록 중...</p> :
                                    isDragActive ?
                                        <p>여기에 파일을 놓으세요...</p> :
                                        <p>파일을 드래그하거나 클릭하여 업로드하세요.</p>
                                }
                            </div>
                            <div className="mt-4 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                                {images.map((file, index) => (
                                    <div key={index} className="relative">
                                        <img src={URL.createObjectURL(file)} alt={`preview ${index}`} className="w-full h-24 object-cover rounded-lg"/>
                                        <button type="button" onClick={() => removeImage(index)} disabled={isPending}
                                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center disabled:bg-gray-400 disabled:cursor-not-allowed">
                                            X
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {error && <p className="text-red-500 text-sm text-center">{(error as any).response?.data?.message || '상품 등록에 실패했습니다.'}</p>}

                        <button type="submit" disabled={isPending}
                                className="w-full bg-blue-600 text-white font-bold py-4 px-6 rounded-lg hover:bg-blue-700 transition-all duration-300 shadow-md text-lg disabled:bg-gray-400 disabled:cursor-not-allowed">
                            {isPending ? '등록 중...' : '등록하기'}
                        </button>
                    </form>
                </div>
            </main>
        </div>
    );
};

export default ProductCreatePage;
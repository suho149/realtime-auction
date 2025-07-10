import React from 'react';
import { KeyRound } from 'lucide-react';

const LoginPage = () => {
    const GOOGLE_LOGIN_URL = 'http://localhost:8080/oauth2/authorization/google';

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="bg-white p-12 rounded-2xl shadow-xl text-center max-w-md w-full transform hover:scale-105 transition-transform duration-300">
                <h1 className="text-4xl font-bold text-gray-800 mb-4">로그인</h1>
                <p className="text-gray-500 mb-8">소셜 계정으로 간편하게 시작하세요.</p>
                <a href={GOOGLE_LOGIN_URL}
                   className="w-full flex items-center justify-center px-6 py-4 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-300 text-gray-700 font-semibold shadow-sm">
                    <KeyRound className="text-blue-500" size={40} strokeWidth={2} />
                    Google 계정으로 로그인
                </a>
            </div>
        </div>
    );
};

export default LoginPage;
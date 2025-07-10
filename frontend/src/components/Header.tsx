import React from 'react';
import { Link } from 'react-router-dom';
// import { FaPlus, FaSignInAlt, FaSignOutAlt } from 'react-icons/fa';
import { Plus, LogIn, LogOut } from 'lucide-react';

interface UserInfo {
    name: string;
    picture: string;
}

interface HeaderProps {
    userInfo: UserInfo | null;
    onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ userInfo, onLogout }) => {
    return (
        <header className="bg-white shadow-sm sticky top-0 z-50">
            <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
                <Link to="/" className="text-2xl font-bold text-gray-800 hover:text-blue-600 transition-colors">
                    🚀 Real-Time Auction
                </Link>
                <div className="flex items-center space-x-5">
                    {userInfo ? (
                        <>
                            <Link to="/products/new" className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all duration-300 shadow-sm text-sm font-medium">
                                <Plus className="mr-2" />
                                상품 등록
                            </Link>
                            <div className="flex items-center">
                                <img src={userInfo.picture} alt={userInfo.name} className="w-9 h-9 rounded-full mr-2 border-2 border-gray-200" />
                                <span className="text-gray-800 font-medium">{userInfo.name}님</span>
                            </div>
                            <button onClick={onLogout} className="flex items-center text-gray-500 hover:text-red-500 transition-colors">
                                <LogOut className="mr-1" />
                                로그아웃
                            </button>
                        </>
                    ) : (
                        <Link to="/login" className="flex items-center px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-all duration-300 shadow-sm text-sm font-medium">
                            <LogIn className="mr-2" />
                            로그인 / 회원가입
                        </Link>
                    )}
                </div>
            </nav>
        </header>
    );
};

export default Header;
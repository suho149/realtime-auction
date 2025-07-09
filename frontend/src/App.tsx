import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import ProductCreatePage from './pages/ProductCreatePage';
import ProductDetailPage from "./pages/ProductDetailPage"; // import 추가

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/products/new" element={<ProductCreatePage />} />
                <Route path="/products/:productId" element={<ProductDetailPage />} />
            </Routes>
        </Router>
    );
}

export default App;
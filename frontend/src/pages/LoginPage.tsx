import React from 'react';

const LoginPage = () => {
    const GOOGLE_LOGIN_URL = 'http://localhost:8080/oauth2/authorization/google';

    return (
        <div>
            <h1>소셜 로그인</h1>
            <a href={GOOGLE_LOGIN_URL}>
                <button>Google로 로그인</button>
            </a>
        </div>
    );
};

export default LoginPage;
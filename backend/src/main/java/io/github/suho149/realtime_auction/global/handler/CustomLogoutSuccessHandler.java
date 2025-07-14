package io.github.suho149.realtime_auction.global.handler;

import io.github.suho149.realtime_auction.global.util.CookieUtil;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.logout.LogoutSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Slf4j
@Component
@RequiredArgsConstructor
public class CustomLogoutSuccessHandler implements LogoutSuccessHandler {

    private final RedisTemplate<String, String> redisTemplate;

    @Override
    public void onLogoutSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication) throws IOException, ServletException {
        if (authentication != null && authentication.getName() != null) {
            log.info("로그아웃 처리 시작, 사용자: {}", authentication.getName());
            // 1. Redis에서 Refresh Token 삭제
            redisTemplate.delete("RT:" + authentication.getName());
        }

        // 2. 쿠키 삭제
        CookieUtil.deleteCookie(request, response, "access_token");
        CookieUtil.deleteCookie(request, response, "refresh_token");

        log.info("로그아웃 성공. Redis 토큰 및 쿠키 삭제 완료.");

        // 성공 응답 전송
        response.setStatus(HttpServletResponse.SC_OK);
        response.getWriter().write("Logout successful");
        response.getWriter().flush();
    }
}

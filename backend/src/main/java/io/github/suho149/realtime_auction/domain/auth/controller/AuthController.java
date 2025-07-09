package io.github.suho149.realtime_auction.domain.auth.controller;

import io.github.suho149.realtime_auction.global.jwt.JwtTokenProvider;
import io.github.suho149.realtime_auction.global.util.CookieUtil;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Optional;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final RedisTemplate<String, String> redisTemplate;
    private final JwtTokenProvider jwtTokenProvider;

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletRequest request, HttpServletResponse response, Authentication authentication) {
        // 1. Redis에서 Refresh Token 삭제
        if (authentication != null) {
            redisTemplate.delete("RT:" + authentication.getName());
        }

        // 2. 쿠키 삭제
        CookieUtil.deleteCookie(request, response, "access_token");
        CookieUtil.deleteCookie(request, response, "refresh_token");

        return ResponseEntity.ok("로그아웃되었습니다.");
    }

    // TODO: Refresh Token 갱신을 위한 엔드포인트 추가
    // ▼▼▼ 토큰 재발급 API 추가 ▼▼▼
    @PostMapping("/reissue")
    public ResponseEntity<?> reissue(HttpServletRequest request, HttpServletResponse response) {
        // 1. 쿠키에서 Refresh Token 가져오기
        Optional<Cookie> refreshTokenCookie = CookieUtil.getCookie(request, "refresh_token");

        if (refreshTokenCookie.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Refresh Token이 없습니다.");
        }
        String refreshToken = refreshTokenCookie.get().getValue();

        // 2. Refresh Token 유효성 검증
        if (!jwtTokenProvider.validateToken(refreshToken)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("유효하지 않은 Refresh Token 입니다.");
        }

        // 3. Refresh Token에서 Authentication 객체 가져오기
        Authentication authentication = jwtTokenProvider.getAuthentication(refreshToken);
        String email = authentication.getName();

        // 4. Redis에 저장된 Refresh Token과 일치하는지 확인
        String savedRefreshToken = redisTemplate.opsForValue().get("RT:" + email);
        if (savedRefreshToken == null || !savedRefreshToken.equals(refreshToken)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Refresh Token이 일치하지 않습니다.");
        }

        // 5. 새로운 Access Token 생성
        String newAccessToken = jwtTokenProvider.generateAccessToken(authentication);

        // 6. 새로운 Access Token을 쿠키에 저장
        int cookieMaxAge = (int) (jwtTokenProvider.getRefreshTokenExpirationMs() / 1000);
        CookieUtil.addCookie(response, "access_token", newAccessToken, cookieMaxAge);

        return ResponseEntity.ok("Access Token이 재발급되었습니다.");
    }
}
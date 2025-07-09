package io.github.suho149.realtime_auction.global.handler;

import io.github.suho149.realtime_auction.domain.user.entity.User;
import io.github.suho149.realtime_auction.domain.user.repository.UserRepository;
import io.github.suho149.realtime_auction.global.jwt.JwtTokenProvider;
import io.github.suho149.realtime_auction.global.util.CookieUtil;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.util.concurrent.TimeUnit;

@Slf4j
@Component
@RequiredArgsConstructor
public class OAuth2LoginSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final JwtTokenProvider jwtTokenProvider;
    private final RedisTemplate<String, String> redisTemplate;
    private final UserRepository userRepository;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication) throws
            IOException {
        log.info("OAuth2 Login 성공!");

        // 이제 authentication.getName()으로 사용자의 이메일을 가져올 수 있습니다.
        String email = authentication.getName();

        String accessToken = jwtTokenProvider.generateAccessToken(authentication);
        String refreshToken = jwtTokenProvider.generateRefreshToken(authentication);

        // Redis에 Refresh Token 저장
        redisTemplate.opsForValue().set(
                "RT:" + email, // user.getEmail() 대신 email 변수 사용
                refreshToken,
                jwtTokenProvider.getRefreshTokenExpirationMs(),
                TimeUnit.MILLISECONDS
        );

        int cookieMaxAge = (int) (jwtTokenProvider.getRefreshTokenExpirationMs() / 1000);
        CookieUtil.deleteCookie(request, response, "access_token");
        CookieUtil.addCookie(response, "access_token", accessToken, cookieMaxAge);

        // Refresh Token은 보안상 더 민감하므로 별도 쿠키나 다른 방식으로 관리할 수도 있음
        // 여기서는 예시로 함께 쿠키에 저장
        CookieUtil.deleteCookie(request, response, "refresh_token");
        CookieUtil.addCookie(response, "refresh_token", refreshToken, cookieMaxAge);


        String targetUrl = UriComponentsBuilder.fromUriString("http://localhost:3000/")
                .build().toUriString();

        getRedirectStrategy().sendRedirect(request, response, targetUrl);
    }
}

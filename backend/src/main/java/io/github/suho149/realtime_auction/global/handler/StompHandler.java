package io.github.suho149.realtime_auction.global.handler;

import io.github.suho149.realtime_auction.global.jwt.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class StompHandler implements ChannelInterceptor {

    private final JwtTokenProvider jwtTokenProvider;

    // WebSocket을 통해 들어온 요청이 처리되기 전에 실행
    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(message);

        // WebSocket 연결 요청(CONNECT)일 때만 JWT 인증
        if (StompCommand.CONNECT.equals(accessor.getCommand())) {
            // 헤더에서 Authorization 토큰을 가져옴
            String jwtToken = accessor.getFirstNativeHeader("Authorization");
            log.info("STOMP CONNECT - Authorization 헤더: {}", jwtToken);

            if (jwtToken != null && jwtToken.startsWith("Bearer ")) {
                String token = jwtToken.substring(7);

                // 토큰 유효성 검증
                if (jwtTokenProvider.validateToken(token)) {
                    // 유효하면 Authentication 객체를 가져와서 StompHeaderAccessor에 저장
                    Authentication authentication = jwtTokenProvider.getAuthentication(token);
                    accessor.setUser(authentication);
                    log.info("STOMP 인증 성공: {}", authentication.getName());
                } else {
                    log.warn("STOMP 인증 실패: 유효하지 않은 토큰");
                    // 여기서 예외를 던지거나 연결을 거부할 수 있음
                }
            }
        }
        return message;
    }
}

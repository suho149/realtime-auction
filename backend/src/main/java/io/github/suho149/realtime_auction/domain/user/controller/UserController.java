package io.github.suho149.realtime_auction.domain.user.controller;

import io.github.suho149.realtime_auction.domain.user.dto.UserInfoResponse;
import io.github.suho149.realtime_auction.domain.user.entity.User;
import io.github.suho149.realtime_auction.domain.user.repository.UserRepository;
import io.github.suho149.realtime_auction.global.error.exception.UserNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository; // DB에서 사용자 정보를 가져오기 위해 주입

    @GetMapping("/me")
    public ResponseEntity<?> getMyInfo(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        // SecurityContext에서 사용자 이메일(principal의 name)을 가져옴
        String email = authentication.getName();

        // DB에서 해당 이메일의 사용자 정보를 조회
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UserNotFoundException("사용자를 찾을 수 없습니다."));

        // User 엔티티를 UserInfoResponse DTO로 변환하여 반환
        return ResponseEntity.ok(new UserInfoResponse(user));
    }
}

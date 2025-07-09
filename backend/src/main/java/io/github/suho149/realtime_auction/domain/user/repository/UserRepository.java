package io.github.suho149.realtime_auction.domain.user.repository;

import io.github.suho149.realtime_auction.domain.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email); // 이메일로 사용자 정보 가져오기
}

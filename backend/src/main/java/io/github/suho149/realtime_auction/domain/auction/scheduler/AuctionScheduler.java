package io.github.suho149.realtime_auction.domain.auction.scheduler;

import io.github.suho149.realtime_auction.domain.product.entity.Product;
import io.github.suho149.realtime_auction.domain.product.entity.ProductStatus;
import io.github.suho149.realtime_auction.domain.product.repository.ProductRepository;
import io.github.suho149.realtime_auction.domain.user.entity.User;
import io.github.suho149.realtime_auction.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class AuctionScheduler {

    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final RedisTemplate<String, String> redisTemplate;

    // 1분마다 실행 (fixedRate = 60000ms)
    @Scheduled(fixedRate = 60000)
    @Transactional // 여러 상품을 처리하므로 트랜잭션으로 묶음
    public void closeAuctions() {
        log.info("경매 종료 스케줄러 실행: {}", LocalDateTime.now());

        // 1. 종료 시간이 지난 경매 대상 상품들 조회
        List<Product> productsToClose = productRepository.findByAuctionEndTimeBeforeAndStatus(
                LocalDateTime.now(),
                ProductStatus.SELLING
        );

        if (productsToClose.isEmpty()) {
            log.info("종료할 경매가 없습니다.");
            return;
        }

        for (Product product : productsToClose) {
            log.info("경매 종료 처리 시작 - 상품 ID: {}", product.getId());

            // 2. Redis에서 최종 낙찰 정보 조회
            String highestBidderEmail = redisTemplate.opsForValue().get("auction:" + product.getId() + ":highestBidder");
            String highestBidStr = redisTemplate.opsForValue().get("auction:" + product.getId() + ":highestBid");

            // 3. 낙찰자가 있는 경우, 낙찰 처리 진행
            if (highestBidderEmail != null && highestBidStr != null) {
                User winner = userRepository.findByEmail(highestBidderEmail)
                        .orElse(null); // 낙찰자가 탈퇴했을 경우 등 예외 상황 고려

                if (winner != null) {
                    long winningPrice = Long.parseLong(highestBidStr);
                    product.closeAuction(winner, winningPrice);
                    log.info("낙찰 성공! 상품 ID: {}, 낙찰자: {}, 낙찰가: {}", product.getId(), winner.getEmail(), winningPrice);

                    // TODO: 판매자와 낙찰자에게 알림 전송 로직 추가
                } else {
                    // 낙찰자는 있지만 DB에 없는 경우 (탈퇴 등) - 유찰 처리
                    product.closeAuction(null, null); // 낙찰자 없음으로 상태 변경
                    log.warn("낙찰자({})를 찾을 수 없어 유찰 처리됩니다. 상품 ID: {}", highestBidderEmail, product.getId());
                }

            } else {
                // 4. 입찰자가 아무도 없는 경우 - 유찰 처리
                product.closeAuction(null, null); // winner와 winningPrice를 null로 설정
                log.info("입찰자가 없어 유찰되었습니다. 상품 ID: {}", product.getId());
            }

            // 5. 처리 후 Redis 데이터 정리 (선택사항이지만 권장)
            redisTemplate.delete("auction:" + product.getId() + ":highestBid");
            redisTemplate.delete("auction:" + product.getId() + ":highestBidder");
            redisTemplate.delete("auction:" + product.getId() + ":bidders");
        }
    }
}

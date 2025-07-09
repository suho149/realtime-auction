package io.github.suho149.realtime_auction.domain.auction.service;

import io.github.suho149.realtime_auction.domain.auction.dto.AuctionStatusResponse;
import io.github.suho149.realtime_auction.domain.product.entity.Product;
import io.github.suho149.realtime_auction.domain.product.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.redisson.api.RLock;
import org.redisson.api.RedissonClient;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.messaging.simp.SimpMessageSendingOperations;
import org.springframework.stereotype.Service;

import java.util.concurrent.TimeUnit;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuctionService {

    private final ProductRepository productRepository;
    private final RedisTemplate<String, String> redisTemplate;
    private final RedissonClient redissonClient;
    private final SimpMessageSendingOperations messagingTemplate;

    public void placeBid(Long productId, Long bidAmount, String bidderName) {
        // Redisson을 이용한 분산 락 획득
        RLock lock = redissonClient.getLock("auction_lock:" + productId);

        try {
            // 락 획득 시도 (최대 10초 대기, 락 획득 후 5초간 유효)
            boolean isLocked = lock.tryLock(10, 5, TimeUnit.SECONDS);
            if (!isLocked) {
                log.warn("입찰 락 획득 실패: {}", productId);
                // TODO: 락 획득 실패 시 예외 처리 또는 재시도 로직
                return;
            }

            // --- 임계 영역 (Critical Section) ---
            // 1. 상품 정보 및 현재 최고가 조회
            Product product = productRepository.findById(productId)
                    .orElseThrow(() -> new IllegalArgumentException("상품을 찾을 수 없습니다."));

            String highestBidStr = redisTemplate.opsForValue().get("auction:" + productId + ":highestBid");
            long currentHighestBid = (highestBidStr != null) ? Long.parseLong(highestBidStr) : product.getStartingPrice();

            // 2. 유효성 검증: 새 입찰가가 현재 최고가보다 높은지 확인
            if (bidAmount <= currentHighestBid) {
                // TODO: 입찰가가 낮을 경우 특정 사용자에게만 에러 메시지 전송
                log.info("입찰가가 현재 최고가보다 낮거나 같습니다.");
                return;
            }

            // 3. Redis에 새로운 최고가와 입찰자 정보 업데이트
            redisTemplate.opsForValue().set("auction:" + productId + ":highestBid", String.valueOf(bidAmount));
            redisTemplate.opsForValue().set("auction:" + productId + ":highestBidder", bidderName);
            redisTemplate.opsForSet().add("auction:" + productId + ":bidders", bidderName);
            // --- 임계 영역 종료 ---

        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("입찰 처리 중 인터럽트 발생", e);
        } finally {
            // 락 해제
            if (lock.isLocked() && lock.isHeldByCurrentThread()) {
                lock.unlock();
            }
        }

        // 4. 경매 상태를 모든 구독자에게 브로드캐스팅
        broadcastAuctionStatus(productId);
    }

    public void broadcastAuctionStatus(Long productId) {
        String highestBidStr = redisTemplate.opsForValue().get("auction:" + productId + ":highestBid");
        String highestBidder = redisTemplate.opsForValue().get("auction:" + productId + ":highestBidder");
        Long bidderCount = redisTemplate.opsForSet().size("auction:" + productId + ":bidders");

        long currentHighestBid = (highestBidStr != null) ? Long.parseLong(highestBidStr) : 0L;

        AuctionStatusResponse statusResponse = new AuctionStatusResponse(
                currentHighestBid,
                highestBidder != null ? highestBidder : "입찰자 없음",
                bidderCount != null ? bidderCount.intValue() : 0
        );

        // 해당 상품의 토픽을 구독 중인 모든 클라이언트에게 메시지 전송
        messagingTemplate.convertAndSend("/topic/auctions/" + productId, statusResponse);
    }
}

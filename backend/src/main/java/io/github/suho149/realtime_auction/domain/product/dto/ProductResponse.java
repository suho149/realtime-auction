package io.github.suho149.realtime_auction.domain.product.dto;

import io.github.suho149.realtime_auction.domain.product.entity.Product;
import io.github.suho149.realtime_auction.domain.product.entity.ProductStatus;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
public class ProductResponse {
    private final Long id;
    private final String title;
    private final String description;
    private final Long startingPrice;
    private final Long currentPrice; // 현재가 (실시간 최고가 또는 최종 낙찰가)
    private final LocalDateTime auctionStartTime;
    private final LocalDateTime auctionEndTime;
    private final ProductStatus status;
    private final String sellerName;
    private final String highestBidderName;
    private final int bidderCount;

    // private 생성자: 모든 필드를 초기화하는 단일 생성자
    private ProductResponse(Long id, String title, String description, Long startingPrice, Long currentPrice, LocalDateTime auctionStartTime, LocalDateTime auctionEndTime, ProductStatus status, String sellerName, String highestBidderName, int bidderCount) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.startingPrice = startingPrice;
        this.currentPrice = currentPrice;
        this.auctionStartTime = auctionStartTime;
        this.auctionEndTime = auctionEndTime;
        this.status = status;
        this.sellerName = sellerName;
        this.highestBidderName = highestBidderName;
        this.bidderCount = bidderCount;
    }

    // 정적 팩토리 메서드: Product 엔티티와 Redis 데이터를 조합하여 DTO 생성
    public static ProductResponse of(Product product, String redisHighestBid, String redisHighestBidderEmail, Long redisBidderCount) {
        Long finalPrice;
        String finalBidderName;

        // 1. 최종 가격 결정
        // 경매가 종료되고 낙찰가가 정해졌으면 DB의 winningPrice를 사용
        if (product.getStatus() == ProductStatus.SOLD_OUT && product.getWinningPrice() != null) {
            finalPrice = product.getWinningPrice();
        }
        // 경매 진행 중 Redis에 최고가가 있으면 그 값을 사용
        else if (redisHighestBid != null) {
            finalPrice = Long.parseLong(redisHighestBid);
        }
        // 그 외의 경우 (아직 입찰이 없는 경우) 시작가를 현재가로 사용
        else {
            finalPrice = product.getStartingPrice();
        }

        // 2. 최종 입찰자 이름 결정
        // 경매가 종료되고 낙찰자가 정해졌으면 DB의 winner 이름을 사용
        if (product.getStatus() == ProductStatus.SOLD_OUT && product.getWinner() != null) {
            finalBidderName = product.getWinner().getName();
        }
        // 경매 진행 중 Redis에 최고 입찰자가 있으면 그 이메일(또는 이름)을 사용
        else if (redisHighestBidderEmail != null) {
            finalBidderName = redisHighestBidderEmail; // 우선 이메일로 설정 (추후 User 조회로 이름 변경 가능)
        }
        // 그 외의 경우
        else {
            finalBidderName = "입찰자 없음";
        }

        // 3. 총 입찰자 수 결정
        int finalBidderCount = (redisBidderCount != null) ? redisBidderCount.intValue() : 0;

        return new ProductResponse(
                product.getId(),
                product.getTitle(),
                product.getDescription(),
                product.getStartingPrice(),
                finalPrice, // 결정된 최종 가격을 currentPrice로 전달
                product.getAuctionStartTime(),
                product.getAuctionEndTime(),
                product.getStatus(),
                product.getSeller().getName(),
                finalBidderName, // 결정된 최종 입찰자 이름을 highestBidderName으로 전달
                finalBidderCount
        );
    }

    // ▼▼▼ 목록 조회를 위한 정적 팩토리 메서드 추가 ▼▼▼
    public static ProductResponse forList(Product product) {
        // 목록에서는 실시간 Redis 정보 없이 DB 데이터 기반으로만 생성
        // currentPrice는 시작가 또는 낙찰가로, bidder 정보는 기본값으로 설정
        Long currentPrice = (product.getWinningPrice() != null) ? product.getWinningPrice() : product.getStartingPrice();
        String bidderName = (product.getWinner() != null) ? product.getWinner().getName() : "입찰자 없음";

        return new ProductResponse(
                product.getId(),
                product.getTitle(),
                // 목록에서는 상세 설명이 필요 없으므로 null 또는 빈 문자열 처리
                "",
                product.getStartingPrice(),
                currentPrice,
                product.getAuctionStartTime(),
                product.getAuctionEndTime(),
                product.getStatus(),
                product.getSeller().getName(),
                bidderName,
                0 // 목록에서는 총 입찰자 수를 보여주지 않음 (성능 이슈)
        );
    }
}
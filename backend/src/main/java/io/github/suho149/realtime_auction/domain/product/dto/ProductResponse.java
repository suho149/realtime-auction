package io.github.suho149.realtime_auction.domain.product.dto;

import io.github.suho149.realtime_auction.domain.product.entity.Product;
import io.github.suho149.realtime_auction.domain.product.entity.ProductStatus;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
public class ProductResponse {
    private final Long id;
    private final String title;
    private final String description; // 상세 조회 시에만 필요할 수 있음
    private final Long startingPrice;
    private final Long winningPrice;
    private final LocalDateTime auctionStartTime;
    private final LocalDateTime auctionEndTime;
    private final ProductStatus status;
    private final String sellerName; // 판매자 닉네임

    // Product 엔티티를 DTO로 변환하는 정적 팩토리 메서드
    public static ProductResponse from(Product product) {
        return new ProductResponse(
                product.getId(),
                product.getTitle(),
                product.getDescription(),
                product.getStartingPrice(),
                product.getWinningPrice(),
                product.getAuctionStartTime(),
                product.getAuctionEndTime(),
                product.getStatus(),
                product.getSeller().getName() // Lazy Loading 주의!
        );
    }

    // private 생성자
    private ProductResponse(Long id, String title, String description, Long startingPrice, Long winningPrice, LocalDateTime auctionStartTime, LocalDateTime auctionEndTime, ProductStatus status, String sellerName) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.startingPrice = startingPrice;
        this.winningPrice = winningPrice;
        this.auctionStartTime = auctionStartTime;
        this.auctionEndTime = auctionEndTime;
        this.status = status;
        this.sellerName = sellerName;
    }
}

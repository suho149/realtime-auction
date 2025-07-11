package io.github.suho149.realtime_auction.domain.product.dto;

import io.github.suho149.realtime_auction.domain.auction.dto.AuctionStateDto;
import io.github.suho149.realtime_auction.domain.product.entity.Category;
import io.github.suho149.realtime_auction.domain.product.entity.Product;
import io.github.suho149.realtime_auction.domain.product.entity.ProductImage;
import io.github.suho149.realtime_auction.domain.product.entity.ProductStatus;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

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
    private final Category category;
    private final List<String> imageUrls;
    private final String thumbnailUrl; // 썸네일 URL 필드 추가

    // private 생성자: 모든 필드를 초기화하는 단일 생성자
    private ProductResponse(Long id, String title, String description, Long startingPrice, Long currentPrice, LocalDateTime auctionStartTime, LocalDateTime auctionEndTime, ProductStatus status, String sellerName, String highestBidderName, int bidderCount, Category category, List<String> imageUrls, String thumbnailUrl) {
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
        this.category = category;
        this.imageUrls = imageUrls;
        this.thumbnailUrl = thumbnailUrl;
    }

    // 정적 팩토리 메서드: Product 엔티티와 Redis 데이터를 조합하여 DTO 생성
    public static ProductResponse of(Product product, AuctionStateDto auctionState) {
        Long finalPrice;
        String finalBidderName;

        // 1. 최종 가격 결정
        if (product.getStatus() == ProductStatus.SOLD_OUT && product.getWinningPrice() != null) {
            finalPrice = product.getWinningPrice();
        } else if (auctionState.getHighestBid() != null) {
            finalPrice = auctionState.getHighestBid();
        } else {
            finalPrice = product.getStartingPrice();
        }

        // 2. 최종 입찰자 이름 결정
        if (product.getStatus() == ProductStatus.SOLD_OUT && product.getWinner() != null) {
            finalBidderName = product.getWinner().getName();
        } else if (auctionState.getHighestBidderEmail() != null) {
            // 참고: 이메일 대신 이름을 보여주고 싶다면 여기서 User 조회를 한 번 더 해야 함
            // 하지만 API 응답 속도를 위해 이메일을 그대로 보여주는 것도 선택
            finalBidderName = auctionState.getHighestBidderEmail();
        } else {
            finalBidderName = "입찰자 없음";
        }

        // 3. 총 입찰자 수 결정
        int finalBidderCount = auctionState.getBidderCount();

        // 이미지 URL 목록 추출
        List<String> imageUrls = product.getImages().stream()
                .map(ProductImage::getImageUrl)
                .collect(Collectors.toList());

        String thumbnailUrl = imageUrls.isEmpty() ? null : imageUrls.get(0);

        return new ProductResponse(
                product.getId(),
                product.getTitle(),
                product.getDescription(),
                product.getStartingPrice(),
                finalPrice,
                product.getAuctionStartTime(),
                product.getAuctionEndTime(),
                product.getStatus(),
                product.getSeller().getName(),
                finalBidderName,
                finalBidderCount,
                product.getCategory(),
                imageUrls,
                thumbnailUrl // 생성자에 thumbnailUrl 전달
        );
    }

    // 목록 조회를 위한 정적 팩토리 메서드
    public static ProductResponse forList(Product product) {
        Long currentPrice = (product.getWinningPrice() != null) ? product.getWinningPrice() : product.getStartingPrice();
        String bidderName = (product.getWinner() != null) ? product.getWinner().getName() : "입찰자 없음";

        // 목록에서는 대표 이미지 1장만 필요
        String thumbnailUrl = product.getImages().isEmpty() ? null : product.getImages().get(0).getImageUrl();

        return new ProductResponse(
                product.getId(),
                product.getTitle(),
                "", // 목록에서는 상세 설명 비움
                product.getStartingPrice(),
                currentPrice,
                product.getAuctionStartTime(),
                product.getAuctionEndTime(),
                product.getStatus(),
                product.getSeller().getName(),
                bidderName,
                0, // 목록에서는 총 입찰자 수 0으로 고정
                product.getCategory(),
                Collections.emptyList(), // 목록에서는 전체 이미지 URL 목록이 필요 없으므로 빈 리스트 전달
                thumbnailUrl // 생성자에 thumbnailUrl 전달
        );
    }
}
package io.github.suho149.realtime_auction.domain.product.entity;

import io.github.suho149.realtime_auction.domain.user.entity.User;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String title;

    @Lob // 대용량 텍스트를 위한 어노테이션
    @Column(nullable = false)
    private String description;

    @Column(nullable = false)
    private Long startingPrice;

    private Long winningPrice; // 낙찰 가격

    @Column(nullable = false)
    private LocalDateTime auctionStartTime;

    @Column(nullable = false)
    private LocalDateTime auctionEndTime;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ProductStatus status;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "seller_id", nullable = false)
    private User seller; // 판매자

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "winner_id")
    private User winner; // 낙찰자

    // 낙찰 처리 메서드
    public void closeAuction(User winner, Long winningPrice) {
        this.winner = winner;
        this.winningPrice = winningPrice;
        this.status = ProductStatus.SOLD_OUT;
    }

    @Builder
    public Product(String title, String description, Long startingPrice, LocalDateTime auctionStartTime, LocalDateTime auctionEndTime, User seller) {
        this.title = title;
        this.description = description;
        this.startingPrice = startingPrice;
        this.auctionStartTime = auctionStartTime;
        this.auctionEndTime = auctionEndTime;
        this.seller = seller;
        this.status = ProductStatus.SELLING; // 생성 시 기본 상태는 '판매중'
    }
}

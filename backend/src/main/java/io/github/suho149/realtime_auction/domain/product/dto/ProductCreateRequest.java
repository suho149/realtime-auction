package io.github.suho149.realtime_auction.domain.product.dto;

import io.github.suho149.realtime_auction.global.validation.NotBeforeNow;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
public class ProductCreateRequest {

    @NotBlank(message = "상품 제목은 필수입니다.")
    private String title;

    @NotBlank(message = "상품 설명은 필수입니다.")
    private String description;

    @NotNull(message = "시작 가격은 필수입니다.")
    @Min(value = 100, message = "시작 가격은 100원 이상이어야 합니다.")
    private Long startingPrice;

    @NotNull(message = "경매 시작 시간은 필수입니다.")
    @NotBeforeNow(message = "경매 시작 시간은 현재 또는 미래여야 합니다.") // @Future 대신 사용
    private LocalDateTime auctionStartTime;

    @NotNull(message = "경매 종료 시간은 필수입니다.")
    @NotBeforeNow(message = "경매 종료 시간은 현재 또는 미래여야 합니다.") // @Future 대신 사용
    private LocalDateTime auctionEndTime;
}

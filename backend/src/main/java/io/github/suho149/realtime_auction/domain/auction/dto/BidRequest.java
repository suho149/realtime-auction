package io.github.suho149.realtime_auction.domain.auction.dto;

import lombok.Getter;

@Getter
public class BidRequest {
    private Long productId;
    private Long bidAmount;
}

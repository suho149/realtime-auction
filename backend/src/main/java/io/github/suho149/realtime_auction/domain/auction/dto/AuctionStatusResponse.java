package io.github.suho149.realtime_auction.domain.auction.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class AuctionStatusResponse {
    private Long currentHighestBid;
    private String highestBidderName;
    private int bidderCount;
}

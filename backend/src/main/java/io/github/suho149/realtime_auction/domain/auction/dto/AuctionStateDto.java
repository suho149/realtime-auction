package io.github.suho149.realtime_auction.domain.auction.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class AuctionStateDto {
    private final Long highestBid;
    private final String highestBidderEmail;
    private final int bidderCount;
}

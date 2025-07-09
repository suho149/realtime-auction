package io.github.suho149.realtime_auction.domain.auction.controller;

import io.github.suho149.realtime_auction.domain.auction.dto.BidRequest;
import io.github.suho149.realtime_auction.domain.auction.service.AuctionService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Controller;

import java.security.Principal;

@Controller
@RequiredArgsConstructor
public class AuctionController {

    private final AuctionService auctionService;

    // 클라이언트가 /app/auctions/bid 경로로 메시지를 보내면 이 메서드가 처리
    @MessageMapping("/auctions/bid")
    public void handleBid(@Payload BidRequest bidRequest, Principal principal) {
        // Principal 객체에서 현재 로그인한 사용자의 이메일을 가져옴
        String bidderEmail = principal.getName();
        auctionService.placeBid(bidRequest.getProductId(), bidRequest.getBidAmount(), bidderEmail);
    }
}

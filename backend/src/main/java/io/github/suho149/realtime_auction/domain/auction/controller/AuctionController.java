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
        if (principal == null) {
            // 인증되지 않은 사용자의 요청은 무시 (StompHandler에서 이미 처리하지만, 방어 코드)
            return;
        }
        // Principal 객체에서 현재 로그인한 사용자의 이메일을 가져옴
        String bidderEmail = principal.getName();
        // principal 객체도 함께 서비스로 전달
        auctionService.placeBid(bidRequest.getProductId(), bidRequest.getBidAmount(), bidderEmail, principal);
    }
}

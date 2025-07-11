package io.github.suho149.realtime_auction.global.constant;

public final class AuctionConstants {

    // 인스턴스화 방지
    private AuctionConstants() {}

    // WebSocket Topic Prefix
    public static final String AUCTION_TOPIC_PREFIX = "/topic/auctions/";

    // Redisson Lock Prefix
    public static final String AUCTION_LOCK_PREFIX = "auction_lock:";

    // Redis Key Prefixes
    private static final String AUCTION_KEY_PREFIX = "auction:";
    private static final String HIGHEST_BID_SUFFIX = ":highestBid";
    private static final String HIGHEST_BIDDER_SUFFIX = ":highestBidder";
    private static final String BIDDERS_SET_SUFFIX = ":bidders";

    // 동적 키 생성 메서드
    public static String getHighestBidKey(Long productId) {
        return AUCTION_KEY_PREFIX + productId + HIGHEST_BID_SUFFIX;
    }

    public static String getHighestBidderKey(Long productId) {
        return AUCTION_KEY_PREFIX + productId + HIGHEST_BIDDER_SUFFIX;
    }

    public static String getBiddersSetKey(Long productId) {
        return AUCTION_KEY_PREFIX + productId + BIDDERS_SET_SUFFIX;
    }

    public static String getAuctionLockKey(Long productId) {
        return AUCTION_LOCK_PREFIX + productId;
    }

    public static String getAuctionTopicPath(Long productId) {
        return AUCTION_TOPIC_PREFIX + productId;
    }
}

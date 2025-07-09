package io.github.suho149.realtime_auction.domain.product.service;

import io.github.suho149.realtime_auction.domain.product.dto.ProductCreateRequest;
import io.github.suho149.realtime_auction.domain.product.dto.ProductResponse;
import io.github.suho149.realtime_auction.domain.product.entity.Product;
import io.github.suho149.realtime_auction.domain.product.repository.ProductRepository;
import io.github.suho149.realtime_auction.domain.user.entity.User;
import io.github.suho149.realtime_auction.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true) // 조회 기능이므로 readOnly = true 설정
public class ProductService {

    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final RedisTemplate<String, String> redisTemplate;

    @Transactional
    public Long createProduct(ProductCreateRequest request, String sellerEmail) {
        // 1. 판매자 정보 조회
        User seller = userRepository.findByEmail(sellerEmail)
                .orElseThrow(() -> new IllegalArgumentException("판매자 정보를 찾을 수 없습니다."));

        // 2. 요청 DTO를 Product 엔티티로 변환
        Product product = Product.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .startingPrice(request.getStartingPrice())
                .auctionStartTime(request.getAuctionStartTime())
                .auctionEndTime(request.getAuctionEndTime())
                .seller(seller)
                .build();

        // 3. 상품 저장
        Product savedProduct = productRepository.save(product);

        return savedProduct.getId();
    }

    // 상품 목록 조회
    public Page<ProductResponse> getProducts(Pageable pageable) {
        return productRepository.findAllWithSeller(pageable)
                .map(ProductResponse::forList);
    }

    // 상품 상세 조회
    public ProductResponse getProduct(Long productId) {
        // 1. RDBMS에서 상품 기본 정보 조회
        Product product = productRepository.findByIdWithSeller(productId)
                .orElseThrow(() -> new IllegalArgumentException("상품을 찾을 수 없습니다."));

        // 2. Redis에서 현재 경매 상태 조회
        String highestBidStr = redisTemplate.opsForValue().get("auction:" + productId + ":highestBid");
        String highestBidderEmail = redisTemplate.opsForValue().get("auction:" + productId + ":highestBidder");

        // 총 입찰자 수 조회 로직 추가
        Long bidderCount = redisTemplate.opsForSet().size("auction:" + productId + ":bidders");

        // 3. ProductResponse DTO 생성 시, Redis 정보도 함께 넘겨줌
        return ProductResponse.of(product, highestBidStr, highestBidderEmail, bidderCount);
    }
}

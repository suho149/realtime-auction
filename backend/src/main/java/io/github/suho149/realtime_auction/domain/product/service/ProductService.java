package io.github.suho149.realtime_auction.domain.product.service;

import io.github.suho149.realtime_auction.domain.auction.dto.AuctionStateDto;
import io.github.suho149.realtime_auction.domain.product.dto.ProductCreateRequest;
import io.github.suho149.realtime_auction.domain.product.dto.ProductResponse;
import io.github.suho149.realtime_auction.domain.product.entity.Product;
import io.github.suho149.realtime_auction.domain.product.entity.ProductImage;
import io.github.suho149.realtime_auction.domain.product.repository.ProductRepository;
import io.github.suho149.realtime_auction.domain.user.entity.User;
import io.github.suho149.realtime_auction.domain.user.repository.UserRepository;
import io.github.suho149.realtime_auction.global.constant.AuctionConstants;
import io.github.suho149.realtime_auction.global.service.FileStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true) // 조회 기능이므로 readOnly = true 설정
public class ProductService {

    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final RedisTemplate<String, String> redisTemplate;
    private final FileStorageService fileStorageService;

    @Transactional
    public Long createProduct(ProductCreateRequest request, List<MultipartFile> images, String sellerEmail) {
        // 1. 판매자 정보 조회
        User seller = userRepository.findByEmail(sellerEmail)
                .orElseThrow(() -> new IllegalArgumentException("판매자 정보를 찾을 수 없습니다."));

        Product product = Product.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .startingPrice(request.getStartingPrice())
                .auctionStartTime(request.getAuctionStartTime())
                .auctionEndTime(request.getAuctionEndTime())
                .seller(seller)
                .category(request.getCategory()) // 카테고리 설정
                .build();

        // 이미지 저장 및 Product와 연관관계 설정
        if (images != null && !images.isEmpty()) {
            for (MultipartFile imageFile : images) {
                String imageUrl = fileStorageService.storeFile(imageFile);
                ProductImage productImage = ProductImage.builder()
                        .imageUrl(imageUrl)
                        .product(product)
                        .build();
                product.addImage(productImage);
            }
        }

        // 4. 상품을 DB에 저장 (이 시점에 product.id가 생성됨)
        Product savedProduct = productRepository.save(product);
        Long productId = savedProduct.getId();

        // 상품 생성 후, 해당 ID의 잔여 Redis 데이터를 정리합니다.
        cleanupAuctionRedisData(productId);

        return productId;
    }

    // Redis 데이터를 정리하는 헬퍼 메서드
    private void cleanupAuctionRedisData(Long productId) {
        List<String> keysToDelete = List.of(
                AuctionConstants.getHighestBidKey(productId),
                AuctionConstants.getHighestBidderKey(productId),
                AuctionConstants.getBiddersSetKey(productId)
        );
        redisTemplate.delete(keysToDelete);
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
        // 2. Redis에서 현재 경매 상태 조회 (헬퍼 메서드 사용)
        AuctionStateDto auctionState = getAuctionStateFromRedis(productId);

        // 3. Product와 AuctionStateDto를 DTO 생성 시 넘겨줌
        return ProductResponse.of(product, auctionState);
    }

    // Redis에서 경매 정보를 조회하여 DTO로 반환하는 헬퍼 메서드
    private AuctionStateDto getAuctionStateFromRedis(Long productId) {
        String highestBidStr = redisTemplate.opsForValue().get("auction:" + productId + ":highestBid");
        String highestBidderEmail = redisTemplate.opsForValue().get("auction:" + productId + ":highestBidder");
        Long bidderCount = redisTemplate.opsForSet().size("auction:" + productId + ":bidders");

        return AuctionStateDto.builder()
                .highestBid(highestBidStr != null ? Long.parseLong(highestBidStr) : null)
                .highestBidderEmail(highestBidderEmail)
                .bidderCount(bidderCount != null ? bidderCount.intValue() : 0)
                .build();
    }
}

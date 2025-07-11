package io.github.suho149.realtime_auction.domain.product.repository;

import io.github.suho149.realtime_auction.domain.product.entity.Category;
import io.github.suho149.realtime_auction.domain.product.entity.Product;
import io.github.suho149.realtime_auction.domain.product.entity.ProductStatus;
import io.lettuce.core.dynamic.annotation.Param;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface ProductRepository extends JpaRepository<Product, Long> {

    // 목록 조회를 위한 Fetch Join + 페이징
    // p.seller를 함께 조회하여 N+1 문제를 방지
    @Query("SELECT p FROM Product p JOIN FETCH p.seller")
    Page<Product> findAllWithSeller(Pageable pageable);

    // 상세 조회를 위한 Fetch Join
    // id로 상품을 조회할 때 seller 정보도 함께 가져옴
    @Query("SELECT p FROM Product p JOIN FETCH p.seller WHERE p.id = :id")
    Optional<Product> findByIdWithSeller(@Param("id") Long id);

    // 스케줄링 대상 조회 메서드 추가
    // 현재 시간을 기준으로, 경매 종료 시간이 지났고 상태가 SELLING인 상품들을 조회
    List<Product> findByAuctionEndTimeBeforeAndStatus(LocalDateTime now, ProductStatus status);

    // 카테고리별 조회 메서드 추가
    Page<Product> findByCategory(Category category, Pageable pageable);
}

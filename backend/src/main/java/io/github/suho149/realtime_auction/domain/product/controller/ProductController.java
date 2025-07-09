package io.github.suho149.realtime_auction.domain.product.controller;

import io.github.suho149.realtime_auction.domain.product.dto.ProductCreateRequest;
import io.github.suho149.realtime_auction.domain.product.dto.ProductResponse;
import io.github.suho149.realtime_auction.domain.product.service.ProductService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.net.URI;

@RestController
@RequestMapping("/api/v1/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;

    @PostMapping
    public ResponseEntity<Void> createProduct(@Valid @RequestBody ProductCreateRequest request, Authentication authentication) {
        // Authentication 객체에서 현재 로그인한 사용자의 이메일을 가져옴
        String sellerEmail = authentication.getName();

        Long productId = productService.createProduct(request, sellerEmail);

        // 생성된 상품의 URI를 Location 헤더에 담아 201 Created 응답 반환
        return ResponseEntity.created(URI.create("/api/v1/products/" + productId)).build();
    }

    // 상품 목록 조회 API
    // 예: /api/v1/products?page=0&size=10&sort=id,desc
    @GetMapping
    public ResponseEntity<Page<ProductResponse>> getProducts(@PageableDefault(size = 10, sort = "id") Pageable pageable) {
        Page<ProductResponse> products = productService.getProducts(pageable);
        return ResponseEntity.ok(products);
    }

    // 상품 상세 조회 API
    @GetMapping("/{productId}")
    public ResponseEntity<ProductResponse> getProduct(@PathVariable Long productId) {
        ProductResponse product = productService.getProduct(productId);
        return ResponseEntity.ok(product);
    }
}

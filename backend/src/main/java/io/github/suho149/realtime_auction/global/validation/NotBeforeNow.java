package io.github.suho149.realtime_auction.global.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@Target({ElementType.FIELD}) // 필드에 적용할 어노테이션
@Retention(RetentionPolicy.RUNTIME) // 런타임까지 어노테이션 정보 유지
@Constraint(validatedBy = NotBeforeNowValidator.class) // 이 어노테이션의 유효성 검증 로직을 담은 클래스
public @interface NotBeforeNow {
    String message() default "시간은 현재 또는 미래여야 합니다.";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}

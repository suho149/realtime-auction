package io.github.suho149.realtime_auction.global.validation;

// global/validation/NotBeforeNowValidator.java

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

import java.time.LocalDateTime;

public class NotBeforeNowValidator implements ConstraintValidator<NotBeforeNow, LocalDateTime> {

    @Override
    public boolean isValid(LocalDateTime value, ConstraintValidatorContext context) {
        // 입력값이 null이면 유효성 검사를 통과시킴 (@NotNull과 역할을 분리)
        if (value == null) {
            return true;
        }

        // 현재 시간에서 약간의 여유 시간(예: 100초)을 뺀 시간과 비교
        // 즉, 100초 전까지는 '현재'로 간주하여 통과시켜줌
        LocalDateTime nowWithGracePeriod = LocalDateTime.now().minusMinutes(10);

        // 입력된 시간이 (현재-100초) 보다 이후인지 확인
        return value.isAfter(nowWithGracePeriod);
    }
}

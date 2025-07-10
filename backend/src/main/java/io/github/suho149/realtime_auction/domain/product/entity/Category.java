package io.github.suho149.realtime_auction.domain.product.entity;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum Category {
    DIGITAL_DEVICE("디지털 기기"),
    HOME_APPLIANCES("생활가전"),
    FURNITURE_INTERIOR("가구/인테리어"),
    LIFE_KITCHEN("생활/주방"),
    CLOTHING("의류"),
    BEAUTY("뷰티/미용"),
    SPORTS_LEISURE("스포츠/레저"),
    BOOKS_TICKETS_RECORDS("도서/티켓/음반"),
    PET_SUPPLIES("반려동물용품"),
    ETC("기타 중고물품");

    private final String description;
}

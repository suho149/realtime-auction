package io.github.suho149.realtime_auction.domain.user.dto;

import io.github.suho149.realtime_auction.domain.user.entity.Role;
import io.github.suho149.realtime_auction.domain.user.entity.User;
import lombok.Builder;
import lombok.Getter;

import java.util.Arrays;
import java.util.Map;
import java.util.function.Function;

@Getter
public class OAuthAttributes {
    private final Map<String, Object> attributes;
    private final String nameAttributeKey;
    private final String name;
    private final String email;
    private final String picture;

    @Builder
    public OAuthAttributes(Map<String, Object> attributes, String nameAttributeKey, String name, String email, String picture) {
        this.attributes = attributes;
        this.nameAttributeKey = nameAttributeKey;
        this.name = name;
        this.email = email;
        this.picture = picture;
    }

    public static OAuthAttributes of(String registrationId, String userNameAttributeName, Map<String, Object> attributes) {
        // registrationId를 통해 적절한 SocialType을 찾고, 해당 Enum의 extract 메서드를 호출
        return SocialType.find(registrationId).extract(userNameAttributeName, attributes);
    }

    public User toEntity() {
        return User.builder()
                .name(name)
                .email(email)
                .picture(picture)
                .role(Role.USER)
                .build();
    }

    // 각 소셜 타입별로 데이터를 변환하는 로직을 담당하는 Enum
    public enum SocialType {
        GOOGLE("google", (attributes) -> {
            return OAuthAttributes.builder()
                    .name((String) attributes.get("name"))
                    .email((String) attributes.get("email"))
                    .picture((String) attributes.get("picture"))
                    .attributes(attributes)
                    .build();
        }),
        NAVER("naver", (attributes) -> {
            Map<String, Object> response = (Map<String, Object>) attributes.get("response");
            return OAuthAttributes.builder()
                    .name((String) response.get("name"))
                    .email((String) response.get("email"))
                    .picture((String) response.get("profile_image"))
                    .attributes(response)
                    .build();
        });
        // KAKAO, GITHUB 등 다른 소셜 로그인 추가 시 여기에 계속 추가

        private final String registrationId;
        private final Function<Map<String, Object>, OAuthAttributes> from;

        SocialType(String registrationId, Function<Map<String, Object>, OAuthAttributes> from) {
            this.registrationId = registrationId;
            this.from = from;
        }

        public static SocialType find(String registrationId) {
            return Arrays.stream(values())
                    .filter(provider -> provider.registrationId.equals(registrationId))
                    .findFirst()
                    .orElseThrow(() -> new IllegalArgumentException("지원하지 않는 소셜 로그인입니다: " + registrationId));
        }

        // nameAttributeKey는 JWT 생성 시 필요할 수 있으므로 파라미터로 전달
        public OAuthAttributes extract(String nameAttributeKey, Map<String, Object> attributes) {
            // from 람다식을 실행하고, nameAttributeKey를 추가로 설정
            OAuthAttributes extracted = this.from.apply(attributes);
            return new OAuthAttributes(extracted.getAttributes(), nameAttributeKey, extracted.getName(), extracted.getEmail(), extracted.getPicture());
        }
    }
}
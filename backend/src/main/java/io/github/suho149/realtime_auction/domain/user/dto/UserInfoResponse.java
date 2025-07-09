package io.github.suho149.realtime_auction.domain.user.dto;

import io.github.suho149.realtime_auction.domain.user.entity.User;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class UserInfoResponse {
    private String name;
    private String email;
    private String picture;

    public UserInfoResponse(User user) {
        this.name = user.getName();
        this.email = user.getEmail();
        this.picture = user.getPicture();
    }
}

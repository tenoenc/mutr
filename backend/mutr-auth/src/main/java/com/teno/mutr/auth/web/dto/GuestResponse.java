package com.teno.mutr.auth.web.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class GuestResponse {
    private String guestToken;
    private String nickname;
}

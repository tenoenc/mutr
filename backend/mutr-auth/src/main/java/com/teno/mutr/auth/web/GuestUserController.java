package com.teno.mutr.auth.web;

import com.teno.mutr.auth.domain.entity.User;
import com.teno.mutr.auth.service.GuestUserService;
import com.teno.mutr.auth.web.dto.GuestResponse;
import com.teno.mutr.core.web.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class GuestUserController {
    private final GuestUserService guestUserService;

    @PostMapping("/guest")
    public ApiResponse<GuestResponse> createGuest() {
        User guest = guestUserService.registerNewGuest();

        GuestResponse response = GuestResponse.builder()
                .guestToken(guest.getGuestToken())
                .nickname(guest.getNickname())
                .build();

        return ApiResponse.ok(response);
    }
}

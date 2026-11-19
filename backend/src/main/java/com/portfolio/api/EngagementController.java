package com.portfolio.api;

import com.portfolio.api.ApiDtos.ArtworkResponse;
import com.portfolio.api.ApiDtos.CommentInput;
import com.portfolio.api.ApiDtos.CommentResponse;
import com.portfolio.api.ApiDtos.ReactionInput;
import com.portfolio.engagement.EngagementService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api")
public class EngagementController {

    private static final String VISITOR_COOKIE = "PORTFOLIO_VISITOR";

    private final EngagementService engagementService;

    public EngagementController(EngagementService engagementService) {
        this.engagementService = engagementService;
    }

    @PostMapping("/artworks/{id}/views")
    public ResponseEntity<Void> recordView(
            @PathVariable Long id,
            @CookieValue(name = VISITOR_COOKIE, required = false) String cookieValue,
            HttpServletRequest request,
            HttpServletResponse response
    ) {
        String visitorKey = validVisitorKey(cookieValue);
        if (visitorKey == null) {
            visitorKey = UUID.randomUUID().toString();
            ResponseCookie cookie = ResponseCookie.from(VISITOR_COOKIE, visitorKey)
                    .path("/")
                    .httpOnly(true)
                    .secure(request.isSecure())
                    .sameSite("Lax")
                    .build();
            response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
        }
        engagementService.recordView(id, visitorKey);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/artworks/{id}/reactions")
    public ArtworkResponse react(
            @PathVariable Long id,
            @Valid @RequestBody ReactionInput input,
            Authentication authentication
    ) {
        return engagementService.react(id, authentication.getName(), input.reaction());
    }

    @PostMapping("/artworks/{id}/comments")
    public ResponseEntity<CommentResponse> comment(
            @PathVariable Long id,
            @Valid @RequestBody CommentInput input,
            Authentication authentication
    ) {
        return ResponseEntity.status(201)
                .body(engagementService.addComment(id, authentication.getName(), input));
    }

    @org.springframework.web.bind.annotation.GetMapping("/admin/comments")
    public java.util.List<com.portfolio.api.ApiDtos.AdminCommentResponse> recentComments() {
        return engagementService.getRecentComments();
    }

    @DeleteMapping("/admin/comments/{commentId}")
    public ResponseEntity<Void> deleteComment(@PathVariable Long commentId) {
        engagementService.deleteComment(commentId);
        return ResponseEntity.noContent().build();
    }

    private static String validVisitorKey(String value) {
        if (value == null) return null;
        try {
            return UUID.fromString(value).toString();
        } catch (IllegalArgumentException exception) {
            return null;
        }
    }
}

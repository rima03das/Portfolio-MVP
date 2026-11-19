package com.portfolio.api;

import com.portfolio.model.AccountRole;
import com.portfolio.model.ArtworkStatus;
import com.portfolio.model.Medium;
import com.portfolio.model.ReactionType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.util.List;

public final class ApiDtos {

    private ApiDtos() {
    }

    public record AccountInput(
            @NotBlank
            @Size(min = 3, max = 40)
            @Pattern(regexp = "[A-Za-z0-9_.-]+")
            String username,
            @NotBlank
            @Size(min = 12, max = 128)
            String password
    ) {
    }

    public record AccountResponse(Long id, String username, AccountRole role) {
    }

    public record SetupStatus(boolean setupRequired) {
    }

    public record ArtworkInput(
            @NotBlank @Size(max = 120) String title,
            @NotNull Medium medium,
            @NotBlank @Size(max = 2000) String description,
            @NotBlank @Pattern(regexp = "(?i)[a-z0-9][a-z0-9._-]{0,79}\\.(jpg|jpeg|png|webp)") String imagePath,
            @NotNull ArtworkStatus status
    ) {
    }

    public record StatusInput(@NotNull ArtworkStatus status) {
    }

    public record ReactionInput(@NotNull ReactionType reaction) {
    }

    public record CommentInput(@NotBlank @Size(max = 1000) String content) {
    }

    public record CommentResponse(Long id, String username, String content, Instant createdAt) {
    }

    public record AdminCommentResponse(
            Long id,
            Long artworkId,
            String artworkTitle,
            String username,
            String content,
            Instant createdAt
    ) {
    }

    public record ArtworkResponse(
            Long id,
            String title,
            Medium medium,
            String description,
            String imagePath,
            ArtworkStatus status,
            Instant createdAt,
            Instant updatedAt,
            long views,
            long likes,
            long dislikes,
            long comments,
            ReactionType myReaction,
            List<CommentResponse> commentSnippets
    ) {
    }

    public record MediumSummary(
            Medium medium,
            long uploaded,
            long published,
            long unpublished,
            long views,
            long likes,
            long dislikes,
            long comments
    ) {
    }

    public record MonthlyEngagement(String month, long views, long likes) {
    }

    public record DashboardResponse(
            long uploaded,
            long published,
            long unpublished,
            long views,
            long likes,
            long dislikes,
            long comments,
            List<MediumSummary> byMedium,
            List<MonthlyEngagement> monthly,
            List<ArtworkResponse> topWorks
    ) {
    }
}

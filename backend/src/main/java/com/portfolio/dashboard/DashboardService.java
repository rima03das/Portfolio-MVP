package com.portfolio.dashboard;

import com.portfolio.api.ApiDtos.ArtworkResponse;
import com.portfolio.api.ApiDtos.DashboardResponse;
import com.portfolio.api.ApiDtos.MediumSummary;
import com.portfolio.api.ApiDtos.MonthlyEngagement;
import com.portfolio.artwork.ArtworkService;
import com.portfolio.model.Artwork;
import com.portfolio.model.ArtworkStatus;
import com.portfolio.model.Medium;
import com.portfolio.model.ReactionType;
import com.portfolio.repository.ArtworkRepository;
import com.portfolio.repository.ReactionRepository;
import com.portfolio.repository.ViewEventRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.YearMonth;
import java.time.ZoneId;
import java.time.format.TextStyle;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;

@Service
public class DashboardService {

    private final ArtworkRepository artworkRepository;
    private final ReactionRepository reactionRepository;
    private final ViewEventRepository viewEventRepository;
    private final ArtworkService artworkService;

    public DashboardService(
            ArtworkRepository artworkRepository,
            ReactionRepository reactionRepository,
            ViewEventRepository viewEventRepository,
            ArtworkService artworkService
    ) {
        this.artworkRepository = artworkRepository;
        this.reactionRepository = reactionRepository;
        this.viewEventRepository = viewEventRepository;
        this.artworkService = artworkService;
    }

    @Transactional(readOnly = true)
    public DashboardResponse getDashboard() {
        List<Artwork> artworks = artworkRepository.findAll();
        List<ArtworkResponse> responses = artworks.stream()
                .map(artwork -> artworkService.toResponse(artwork, null))
                .toList();
        long uploaded = artworks.stream().filter(item -> item.getStatus() == ArtworkStatus.UPLOADED).count();
        long published = artworks.stream().filter(item -> item.getStatus() == ArtworkStatus.PUBLISHED).count();
        long unpublished = artworks.stream().filter(item -> item.getStatus() == ArtworkStatus.UNPUBLISHED).count();
        long views = responses.stream().mapToLong(ArtworkResponse::views).sum();
        long likes = responses.stream().mapToLong(ArtworkResponse::likes).sum();
        long dislikes = responses.stream().mapToLong(ArtworkResponse::dislikes).sum();
        long comments = responses.stream().mapToLong(ArtworkResponse::comments).sum();

        List<MediumSummary> byMedium = new ArrayList<>();
        for (Medium medium : Medium.values()) {
            List<ArtworkResponse> forMedium = responses.stream()
                    .filter(item -> item.medium() == medium)
                    .toList();
            byMedium.add(new MediumSummary(
                    medium,
                    forMedium.stream().filter(item -> item.status() == ArtworkStatus.UPLOADED).count(),
                    forMedium.stream().filter(item -> item.status() == ArtworkStatus.PUBLISHED).count(),
                    forMedium.stream().filter(item -> item.status() == ArtworkStatus.UNPUBLISHED).count(),
                    forMedium.stream().mapToLong(ArtworkResponse::views).sum(),
                    forMedium.stream().mapToLong(ArtworkResponse::likes).sum(),
                    forMedium.stream().mapToLong(ArtworkResponse::dislikes).sum(),
                    forMedium.stream().mapToLong(ArtworkResponse::comments).sum()
            ));
        }

        List<MonthlyEngagement> monthly = monthlyEngagement();
        List<ArtworkResponse> topWorks = responses.stream()
                .sorted(Comparator.comparingLong(ArtworkResponse::views).reversed()
                        .thenComparing(ArtworkResponse::title, String.CASE_INSENSITIVE_ORDER))
                .limit(5)
                .toList();
        return new DashboardResponse(
                uploaded,
                published,
                unpublished,
                views,
                likes,
                dislikes,
                comments,
                byMedium,
                monthly,
                topWorks
        );
    }

    private List<MonthlyEngagement> monthlyEngagement() {
        YearMonth current = YearMonth.now();
        List<MonthlyEngagement> monthly = new ArrayList<>();
        for (int offset = 5; offset >= 0; offset--) {
            YearMonth month = current.minusMonths(offset);
            Instant start = month.atDay(1).atStartOfDay(ZoneId.systemDefault()).toInstant();
            Instant end = month.plusMonths(1).atDay(1).atStartOfDay(ZoneId.systemDefault()).toInstant();
            monthly.add(new MonthlyEngagement(
                    month.getMonth().getDisplayName(TextStyle.SHORT, Locale.ENGLISH),
                    viewEventRepository.countByCreatedAtGreaterThanEqualAndCreatedAtLessThan(start, end),
                    reactionRepository.countByTypeAndCreatedAtGreaterThanEqualAndCreatedAtLessThan(
                            ReactionType.LIKE, start, end
                    )
            ));
        }
        return monthly;
    }
}

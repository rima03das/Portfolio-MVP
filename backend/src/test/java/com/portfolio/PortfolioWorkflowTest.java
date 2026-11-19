package com.portfolio;

import com.portfolio.account.AccountService;
import com.portfolio.api.ApiDtos.AccountInput;
import com.portfolio.api.ApiDtos.CommentInput;
import com.portfolio.dashboard.DashboardService;
import com.portfolio.data.SampleDataService;
import com.portfolio.engagement.EngagementService;
import com.portfolio.exception.ConflictException;
import com.portfolio.model.Account;
import com.portfolio.model.AccountRole;
import com.portfolio.model.Artwork;
import com.portfolio.model.ArtworkStatus;
import com.portfolio.model.Medium;
import com.portfolio.model.ReactionType;
import com.portfolio.repository.AccountRepository;
import com.portfolio.repository.ArtworkRepository;
import com.portfolio.repository.CommentRepository;
import com.portfolio.repository.ReactionRepository;
import com.portfolio.repository.ViewEventRepository;
import com.portfolio.artwork.ArtworkService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest(properties = "spring.datasource.url=jdbc:h2:mem:portfolio-workflow;DB_CLOSE_DELAY=-1")
@Transactional
class PortfolioWorkflowTest {

    @Autowired
    private SampleDataService sampleDataService;

    @Autowired
    private ArtworkService artworkService;

    @Autowired
    private EngagementService engagementService;

    @Autowired
    private DashboardService dashboardService;

    @Autowired
    private AccountService accountService;

    @Autowired
    private AccountRepository accountRepository;

    @Autowired
    private ArtworkRepository artworkRepository;

    @Autowired
    private CommentRepository commentRepository;

    @Autowired
    private ReactionRepository reactionRepository;

    @Autowired
    private ViewEventRepository viewEventRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @BeforeEach
    void resetSample() {
        sampleDataService.reset();
    }

    @Test
    void sampleResetRestoresTheSameFivePublishedPiecesAndRepresentativeComments() {
        Set<String> initialTitles = artworkService.getPublicArtworks(null, null, "title", null).stream()
                .map(item -> item.title())
                .collect(Collectors.toSet());
        assertThat(initialTitles).hasSize(5);
        assertThat(artworkService.getPublicArtworks(null, null, "recent", null))
                .allSatisfy(artwork -> assertThat(artwork.commentSnippets()).hasSize(2));
        assertThat(artworkService.getPublicArtworks(null, null, "title", null))
                .extracting(item -> item.id())
                .contains(1L);

        sampleDataService.reset();

        assertThat(artworkService.getPublicArtworks(null, null, "title", null).stream()
                .map(item -> item.title())
                .collect(Collectors.toSet())).isEqualTo(initialTitles);
        assertThat(artworkRepository.count()).isEqualTo(5);
        assertThat(artworkRepository.findAll()).extracting(Artwork::getId).contains(1L, 2L, 3L, 4L, 5L);
        assertThat(commentRepository.count()).isEqualTo(10);
    }

    @Test
    void gallerySearchAndStatusFiltersCoverAllFiveMediumsAndHideNonPublishedWork() {
        artworkRepository.save(new Artwork(
                "Unpublished note", Medium.CHARCOAL, "Hidden from the public.", "face.jpg", ArtworkStatus.UNPUBLISHED
        ));
        artworkRepository.save(new Artwork(
                "Draft", Medium.CHARCOAL, "Not yet published.", "face.jpg", ArtworkStatus.UPLOADED
        ));

        assertThat(artworkService.getPublicArtworks(null, null, "title", null)).hasSize(5);
        assertThat(artworkService.getPublicArtworks(Medium.PEN_AND_INK, "birds", "title", null))
                .extracting(item -> item.title())
                .containsExactly("Birds & Letters");
        assertThat(artworkService.getAdminArtworks(Medium.CHARCOAL, null, null, "title", null)).hasSize(3);
        assertThat(artworkService.getAdminArtworks(null, ArtworkStatus.UPLOADED, null, "recent", null))
                .hasSize(1);
        assertThat(Set.of(Medium.values())).hasSize(5);
    }

    @Test
    void publicationTransitionsControlPublicVisibility() {
        Artwork uploaded = artworkRepository.save(new Artwork(
                "Pending Study", Medium.GRAPHITE, "Ready to share.", "face.jpg", ArtworkStatus.UPLOADED
        ));
        assertThatThrownBy(() -> artworkService.getPublicArtwork(uploaded.getId(), null))
                .isInstanceOf(com.portfolio.exception.ResourceNotFoundException.class);

        artworkService.updateStatus(uploaded.getId(), ArtworkStatus.PUBLISHED, null);
        assertThat(artworkService.getPublicArtwork(uploaded.getId(), null).status())
                .isEqualTo(ArtworkStatus.PUBLISHED);

        artworkService.updateStatus(uploaded.getId(), ArtworkStatus.UNPUBLISHED, null);
        assertThatThrownBy(() -> artworkService.getPublicArtwork(uploaded.getId(), null))
                .isInstanceOf(com.portfolio.exception.ResourceNotFoundException.class);
    }

    @Test
    void reactionTogglesOffWhenRepeatedAndReplacesTheOppositeReaction() {
        Account viewer = createViewer("reaction-viewer");
        Long artworkId = artworkRepository.findAll().get(0).getId();

        var liked = engagementService.react(artworkId, viewer.getUsername(), ReactionType.LIKE);
        assertThat(liked.likes()).isEqualTo(1);
        assertThat(liked.myReaction()).isEqualTo(ReactionType.LIKE);

        var replaced = engagementService.react(artworkId, viewer.getUsername(), ReactionType.DISLIKE);
        assertThat(replaced.likes()).isZero();
        assertThat(replaced.dislikes()).isEqualTo(1);
        assertThat(replaced.myReaction()).isEqualTo(ReactionType.DISLIKE);

        var removed = engagementService.react(artworkId, viewer.getUsername(), ReactionType.DISLIKE);
        assertThat(removed.dislikes()).isZero();
        assertThat(removed.myReaction()).isNull();
    }

    @Test
    void viewTrackingCountsOncePerArtworkAndBrowserSession() {
        Long artworkId = artworkRepository.findAll().get(0).getId();
        String browserSession = UUID.randomUUID().toString();

        engagementService.recordView(artworkId, browserSession);
        engagementService.recordView(artworkId, browserSession);
        engagementService.recordView(artworkId, UUID.randomUUID().toString());

        assertThat(artworkService.getPublicArtwork(artworkId, null).views()).isEqualTo(2);
    }

    @Test
    void dashboardCountsPortfolioAndPerMediumActivityAndSupportsAnEmptyCollection() {
        Account viewer = createViewer("dashboard-viewer");
        Artwork graphite = artworkRepository.findAll().stream()
                .filter(item -> item.getMedium() == Medium.GRAPHITE)
                .findFirst()
                .orElseThrow();
        Artwork charcoal = artworkRepository.findAll().stream()
                .filter(item -> item.getMedium() == Medium.CHARCOAL)
                .findFirst()
                .orElseThrow();
        artworkRepository.save(new Artwork(
                "Uploaded study", Medium.GRAPHITE, "A new upload.", "face.jpg", ArtworkStatus.UPLOADED
        ));
        artworkRepository.save(new Artwork(
                "Hidden study", Medium.CHARCOAL, "An unpublished piece.", "face.jpg", ArtworkStatus.UNPUBLISHED
        ));
        engagementService.recordView(graphite.getId(), UUID.randomUUID().toString());
        engagementService.react(graphite.getId(), viewer.getUsername(), ReactionType.LIKE);
        engagementService.react(charcoal.getId(), viewer.getUsername(), ReactionType.DISLIKE);
        engagementService.addComment(graphite.getId(), viewer.getUsername(), new CommentInput("Lovely detail."));

        var dashboard = dashboardService.getDashboard();
        assertThat(dashboard.uploaded()).isEqualTo(1);
        assertThat(dashboard.published()).isEqualTo(5);
        assertThat(dashboard.unpublished()).isEqualTo(1);
        assertThat(dashboard.views()).isEqualTo(1);
        assertThat(dashboard.likes()).isEqualTo(1);
        assertThat(dashboard.dislikes()).isEqualTo(1);
        assertThat(dashboard.comments()).isEqualTo(11);
        assertThat(dashboard.byMedium()).hasSize(5);
        assertThat(dashboard.byMedium().stream().filter(item -> item.medium() == Medium.GRAPHITE)
                .findFirst().orElseThrow().likes()).isEqualTo(1);
        assertThat(dashboard.monthly()).hasSize(6);

        viewEventRepository.deleteAllInBatch();
        reactionRepository.deleteAllInBatch();
        commentRepository.deleteAllInBatch();
        artworkRepository.deleteAllInBatch();
        var empty = dashboardService.getDashboard();
        assertThat(empty.uploaded() + empty.published() + empty.unpublished()
                + empty.views() + empty.likes() + empty.dislikes() + empty.comments()).isZero();
        assertThat(empty.byMedium()).hasSize(5);
    }

    @Test
    void deletingArtworkRemovesItsCommentsReactionsAndViews() {
        Account viewer = createViewer("delete-viewer");
        Long artworkId = artworkRepository.findAll().get(0).getId();
        engagementService.react(artworkId, viewer.getUsername(), ReactionType.LIKE);
        engagementService.addComment(artworkId, viewer.getUsername(), new CommentInput("Keep this tied to the work."));
        engagementService.recordView(artworkId, UUID.randomUUID().toString());

        artworkService.deleteArtwork(artworkId);

        assertThat(artworkRepository.findById(artworkId)).isEmpty();
        assertThat(commentRepository.countByArtworkId(artworkId)).isZero();
        assertThat(reactionRepository.countByArtworkIdAndType(artworkId, ReactionType.LIKE)).isZero();
        assertThat(viewEventRepository.countByArtworkId(artworkId)).isZero();
    }

    @Test
    void onlyOneAdminCanBeProvisionedAndViewerNamesAreUnique() {
        AccountInput admin = new AccountInput("artist", "correct-horse-battery");
        assertThat(accountService.createInitialAdmin(admin).getRole()).isEqualTo(AccountRole.ADMIN);
        assertThatThrownBy(() -> accountService.createInitialAdmin(new AccountInput("second", "another-secure-password")))
                .isInstanceOf(ConflictException.class);
        accountService.registerViewer(new AccountInput("UniqueViewer", "a-viewer-password-long"));
        assertThatThrownBy(() -> accountService.registerViewer(
                new AccountInput("uniqueviewer", "another-viewer-password")
        )).isInstanceOf(ConflictException.class);
    }

    private Account createViewer(String username) {
        return accountRepository.save(new Account(
                username,
                passwordEncoder.encode("viewer-password-123"),
                AccountRole.VIEWER
        ));
    }
}

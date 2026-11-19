package com.portfolio.artwork;

import com.portfolio.api.ApiDtos.ArtworkInput;
import com.portfolio.api.ApiDtos.ArtworkResponse;
import com.portfolio.api.ApiDtos.CommentResponse;
import com.portfolio.exception.ResourceNotFoundException;
import com.portfolio.model.Account;
import com.portfolio.model.Artwork;
import com.portfolio.model.ArtworkStatus;
import com.portfolio.model.Medium;
import com.portfolio.model.Reaction;
import com.portfolio.model.ReactionType;
import com.portfolio.repository.AccountRepository;
import com.portfolio.repository.ArtworkRepository;
import com.portfolio.repository.CommentRepository;
import com.portfolio.repository.ReactionRepository;
import com.portfolio.repository.ViewEventRepository;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ArtworkService {

  private final ArtworkRepository artworkRepository;
  private final AccountRepository accountRepository;
  private final CommentRepository commentRepository;
  private final ReactionRepository reactionRepository;
  private final ViewEventRepository viewEventRepository;

  public ArtworkService(
      ArtworkRepository artworkRepository,
      AccountRepository accountRepository,
      CommentRepository commentRepository,
      ReactionRepository reactionRepository,
      ViewEventRepository viewEventRepository) {
    this.artworkRepository = artworkRepository;
    this.accountRepository = accountRepository;
    this.commentRepository = commentRepository;
    this.reactionRepository = reactionRepository;
    this.viewEventRepository = viewEventRepository;
  }

  @Transactional(readOnly = true)
  public List<ArtworkResponse> getPublicArtworks(
      Medium medium, String search, String sort, String username) {
    String query = normalizeSearch(search);
    Comparator<Artwork> comparator = comparatorFor(sort);
    return artworkRepository.findAll().stream()
        .filter(artwork -> artwork.getStatus() == ArtworkStatus.PUBLISHED)
        .filter(artwork -> medium == null || artwork.getMedium() == medium)
        .filter(artwork -> matchesSearch(artwork, query))
        .sorted(comparator)
        .map(artwork -> toResponse(artwork, username))
        .toList();
  }

  @Transactional(readOnly = true)
  public List<ArtworkResponse> getAdminArtworks(
      Medium medium, ArtworkStatus status, String search, String sort, String username) {
    String query = normalizeSearch(search);
    return artworkRepository.findAll().stream()
        .filter(artwork -> medium == null || artwork.getMedium() == medium)
        .filter(artwork -> status == null || artwork.getStatus() == status)
        .filter(artwork -> matchesSearch(artwork, query))
        .sorted(comparatorFor(sort))
        .map(artwork -> toResponse(artwork, username))
        .toList();
  }

  @Transactional(readOnly = true)
  public ArtworkResponse getPublicArtwork(Long id, String username) {
    Artwork artwork = findArtwork(id);
    if (artwork.getStatus() != ArtworkStatus.PUBLISHED) {
      throw new ResourceNotFoundException("Artwork not found.");
    }
    return toResponse(artwork, username);
  }

  @Transactional(readOnly = true)
  public ArtworkResponse getAdminArtwork(Long id, String username) {
    return toResponse(findArtwork(id), username);
  }

  @Transactional(readOnly = true)
  public Artwork getPublishedEntity(Long id) {
    Artwork artwork = findArtwork(id);
    if (artwork.getStatus() != ArtworkStatus.PUBLISHED) {
      throw new ResourceNotFoundException("Artwork not found.");
    }
    return artwork;
  }

  @Transactional
  public ArtworkResponse createArtwork(ArtworkInput input, String username) {
    Artwork artwork =
        new Artwork(
            input.title().trim(),
            input.medium(),
            input.description().trim(),
            input.imagePath(),
            input.status());
    return toResponse(artworkRepository.save(artwork), username);
  }

  @Transactional
  public ArtworkResponse updateArtwork(Long id, ArtworkInput input, String username) {
    Artwork artwork = findArtwork(id);
    artwork.update(
        input.title().trim(),
        input.medium(),
        input.description().trim(),
        input.imagePath(),
        input.status());
    return toResponse(artwork, username);
  }

  @Transactional
  public ArtworkResponse updateStatus(Long id, ArtworkStatus status, String username) {
    Artwork artwork = findArtwork(id);
    artwork.setStatus(status);
    return toResponse(artwork, username);
  }

  @Transactional
  public void deleteArtwork(Long id) {
    Artwork artwork = findArtwork(id);
    viewEventRepository.deleteByArtworkId(id);
    reactionRepository.deleteByArtworkId(id);
    commentRepository.deleteByArtworkId(id);
    artworkRepository.delete(artwork);
  }

  @Transactional(readOnly = true)
  public ArtworkResponse toResponse(Artwork artwork, String username) {
    Long accountId =
        username == null
            ? null
            : accountRepository.findByUsernameIgnoreCase(username).map(Account::getId).orElse(null);
    ReactionType myReaction =
        accountId == null
            ? null
            : reactionRepository
                .findByArtworkIdAndAccountId(artwork.getId(), accountId)
                .map(Reaction::getType)
                .orElse(null);
    List<CommentResponse> commentSnippets =
        commentRepository.findTop20ByArtworkIdOrderByCreatedAtDesc(artwork.getId()).stream()
            .map(
                comment ->
                    new CommentResponse(
                        comment.getId(),
                        comment.getAccount().getUsername(),
                        comment.getContent(),
                        comment.getCreatedAt()))
            .toList();
    return new ArtworkResponse(
        artwork.getId(),
        artwork.getTitle(),
        artwork.getMedium(),
        artwork.getDescription(),
        artwork.getImagePath(),
        artwork.getStatus(),
        artwork.getCreatedAt(),
        artwork.getUpdatedAt(),
        viewEventRepository.countByArtworkId(artwork.getId()),
        reactionRepository.countByArtworkIdAndType(artwork.getId(), ReactionType.LIKE),
        reactionRepository.countByArtworkIdAndType(artwork.getId(), ReactionType.DISLIKE),
        commentRepository.countByArtworkId(artwork.getId()),
        myReaction,
        commentSnippets);
  }

  private Artwork findArtwork(Long id) {
    return artworkRepository
        .findById(id)
        .orElseThrow(() -> new ResourceNotFoundException("Artwork not found."));
  }

  private static String normalizeSearch(String search) {
    return search == null ? "" : search.trim().toLowerCase(Locale.ROOT);
  }

  private static boolean matchesSearch(Artwork artwork, String query) {
    return query.isEmpty()
        || artwork.getTitle().toLowerCase(Locale.ROOT).contains(query)
        || artwork.getDescription().toLowerCase(Locale.ROOT).contains(query);
  }

  private Comparator<Artwork> comparatorFor(String sort) {
    if ("title".equalsIgnoreCase(sort)) {
      return Comparator.comparing(Artwork::getTitle, String.CASE_INSENSITIVE_ORDER);
    }
    if ("popular".equalsIgnoreCase(sort) || "views".equalsIgnoreCase(sort)) {
      return Comparator.<Artwork>comparingLong(
              artwork -> viewEventRepository.countByArtworkId(artwork.getId()))
          .reversed()
          .thenComparing(Artwork::getTitle, String.CASE_INSENSITIVE_ORDER);
    }
    return Comparator.comparing(Artwork::getCreatedAt).reversed();
  }
}

package com.portfolio.engagement;

import com.portfolio.api.ApiDtos.AdminCommentResponse;
import com.portfolio.api.ApiDtos.ArtworkResponse;
import com.portfolio.api.ApiDtos.CommentInput;
import com.portfolio.api.ApiDtos.CommentResponse;
import com.portfolio.exception.ResourceNotFoundException;
import com.portfolio.model.Account;
import com.portfolio.model.Artwork;
import com.portfolio.model.CommentEntry;
import com.portfolio.model.Reaction;
import com.portfolio.model.ReactionType;
import com.portfolio.model.ViewEvent;
import com.portfolio.repository.AccountRepository;
import com.portfolio.repository.CommentRepository;
import com.portfolio.repository.ReactionRepository;
import com.portfolio.repository.ViewEventRepository;
import com.portfolio.artwork.ArtworkService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class EngagementService {

    private final ArtworkService artworkService;
    private final AccountRepository accountRepository;
    private final CommentRepository commentRepository;
    private final ReactionRepository reactionRepository;
    private final ViewEventRepository viewEventRepository;

    public EngagementService(
            ArtworkService artworkService,
            AccountRepository accountRepository,
            CommentRepository commentRepository,
            ReactionRepository reactionRepository,
            ViewEventRepository viewEventRepository
    ) {
        this.artworkService = artworkService;
        this.accountRepository = accountRepository;
        this.commentRepository = commentRepository;
        this.reactionRepository = reactionRepository;
        this.viewEventRepository = viewEventRepository;
    }

    @Transactional
    public void recordView(Long artworkId, String browserSessionKey) {
        Artwork artwork = artworkService.getPublishedEntity(artworkId);
        UUID.fromString(browserSessionKey);
        if (!viewEventRepository.existsByArtworkIdAndBrowserSessionKey(artworkId, browserSessionKey)) {
            viewEventRepository.save(new ViewEvent(artwork, browserSessionKey));
        }
    }

    @Transactional
    public ArtworkResponse react(Long artworkId, String username, ReactionType reactionType) {
        Artwork artwork = artworkService.getPublishedEntity(artworkId);
        Account account = findAccount(username);
        var existing = reactionRepository.findByArtworkIdAndAccountId(artworkId, account.getId());
        if (existing.isPresent()) {
            Reaction reaction = existing.get();
            if (reaction.getType() == reactionType) {
                reactionRepository.delete(reaction);
            } else {
                reaction.setType(reactionType);
            }
        } else {
            reactionRepository.save(new Reaction(artwork, account, reactionType));
        }
        return artworkService.toResponse(artwork, username);
    }

    @Transactional
    public CommentResponse addComment(Long artworkId, String username, CommentInput input) {
        Artwork artwork = artworkService.getPublishedEntity(artworkId);
        Account account = findAccount(username);
        String content = input.content().trim();
        if (content.isEmpty()) {
            throw new IllegalArgumentException("Comment cannot be empty.");
        }
        CommentEntry saved = commentRepository.save(new CommentEntry(artwork, account, content));
        return new CommentResponse(saved.getId(), account.getUsername(), saved.getContent(), saved.getCreatedAt());
    }

    @Transactional(readOnly = true)
    public List<AdminCommentResponse> getRecentComments() {
        return commentRepository.findTop200ByOrderByCreatedAtDesc().stream()
                .map(comment -> new AdminCommentResponse(
                        comment.getId(),
                        comment.getArtwork().getId(),
                        comment.getArtwork().getTitle(),
                        comment.getAccount().getUsername(),
                        comment.getContent(),
                        comment.getCreatedAt()
                ))
                .toList();
    }

    @Transactional
    public void deleteComment(Long commentId) {
        if (!commentRepository.existsById(commentId)) {
            throw new ResourceNotFoundException("Comment not found.");
        }
        commentRepository.deleteById(commentId);
    }

    private Account findAccount(String username) {
        return accountRepository.findByUsernameIgnoreCase(username)
                .orElseThrow(() -> new ResourceNotFoundException("Account not found."));
    }
}

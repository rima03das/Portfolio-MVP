package com.portfolio.data;

import com.portfolio.model.Account;
import com.portfolio.model.AccountRole;
import com.portfolio.model.Artwork;
import com.portfolio.model.ArtworkStatus;
import com.portfolio.model.CommentEntry;
import com.portfolio.model.Medium;
import com.portfolio.repository.AccountRepository;
import com.portfolio.repository.ArtworkRepository;
import com.portfolio.repository.CommentRepository;
import com.portfolio.repository.ReactionRepository;
import com.portfolio.repository.ViewEventRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SampleDataService {

  private final AccountRepository accountRepository;
  private final ArtworkRepository artworkRepository;
  private final CommentRepository commentRepository;
  private final ReactionRepository reactionRepository;
  private final ViewEventRepository viewEventRepository;
  private final PasswordEncoder passwordEncoder;
  private final JdbcTemplate jdbcTemplate;

  @PersistenceContext private EntityManager entityManager;

  public SampleDataService(
      AccountRepository accountRepository,
      ArtworkRepository artworkRepository,
      CommentRepository commentRepository,
      ReactionRepository reactionRepository,
      ViewEventRepository viewEventRepository,
      PasswordEncoder passwordEncoder,
      JdbcTemplate jdbcTemplate) {
    this.accountRepository = accountRepository;
    this.artworkRepository = artworkRepository;
    this.commentRepository = commentRepository;
    this.reactionRepository = reactionRepository;
    this.viewEventRepository = viewEventRepository;
    this.passwordEncoder = passwordEncoder;
    this.jdbcTemplate = jdbcTemplate;
  }

  @Transactional
  public void reset() {
    viewEventRepository.deleteAllInBatch();
    reactionRepository.deleteAllInBatch();
    commentRepository.deleteAllInBatch();
    artworkRepository.deleteAllInBatch();
    accountRepository.deleteAllInBatch();
    entityManager.clear();
    jdbcTemplate.execute("ALTER TABLE accounts ALTER COLUMN id RESTART WITH 1");
    jdbcTemplate.execute("ALTER TABLE artworks ALTER COLUMN id RESTART WITH 1");
    jdbcTemplate.execute("ALTER TABLE comments ALTER COLUMN id RESTART WITH 1");
    jdbcTemplate.execute("ALTER TABLE reactions ALTER COLUMN id RESTART WITH 1");
    jdbcTemplate.execute("ALTER TABLE view_events ALTER COLUMN id RESTART WITH 1");

    Account sampleViewer =
        accountRepository.saveAndFlush(
            new Account(
                "Visitor A",
                passwordEncoder.encode(UUID.randomUUID().toString()),
                AccountRole.VIEWER));

    seedArtwork(
        sampleViewer,
        "Portrait Study",
        Medium.GRAPHITE,
        "A close portrait study, built from soft graphite layers and quiet changes in light.",
        "face.jpg",
        "The expression feels so present.",
        "The shading is beautifully gentle.");
    seedArtwork(
        sampleViewer,
        "Yin & Yang",
        Medium.CHARCOAL,
        "A monochrome study of opposing forms finding balance in one flowing composition.",
        "IMG-20211204-WA0027.jpg",
        "There is so much movement in this piece.",
        "I keep noticing new details.");
    seedArtwork(
        sampleViewer,
        "Birds & Letters",
        Medium.PEN_AND_INK,
        "A detailed ink composition where birds and lettering meet in a playful, intricate pattern.",
        "IMG-20211204-WA0017.jpg",
        "I love how the lettering becomes part of the drawing.",
        "The linework is wonderfully confident.");
    seedArtwork(
        sampleViewer,
        "Armoured Study",
        Medium.WATERCOLOUR_AND_GOUACHE,
        "A character study of an armoured figure, using layered washes and expressive texture.",
        "armour.jpg",
        "The atmosphere is beautiful.",
        "The colours make the armour feel almost weightless.");
    seedArtwork(
        sampleViewer,
        "Fan in Bloom",
        Medium.COLOURS,
        "A fan illustration dressed with cherry blossoms, pattern, and a bright spring palette.",
        "IMG-20211204-WA0031.jpg",
        "The blossoms bring so much warmth to this.",
        "Such a lovely balance of detail and colour.");
  }

  private void seedArtwork(
      Account sampleViewer,
      String title,
      Medium medium,
      String description,
      String imagePath,
      String firstComment,
      String secondComment) {
    Artwork artwork =
        artworkRepository.save(
            new Artwork(title, medium, description, imagePath, ArtworkStatus.PUBLISHED));
    commentRepository.save(new CommentEntry(artwork, sampleViewer, firstComment));
    commentRepository.save(new CommentEntry(artwork, sampleViewer, secondComment));
  }
}

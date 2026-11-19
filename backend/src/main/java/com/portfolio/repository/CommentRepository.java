package com.portfolio.repository;

import com.portfolio.model.CommentEntry;
import java.time.Instant;
import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CommentRepository extends JpaRepository<CommentEntry, Long> {
  long countByArtworkId(Long artworkId);

  long countByCreatedAtGreaterThanEqualAndCreatedAtLessThan(Instant start, Instant end);

  List<CommentEntry> findTop20ByArtworkIdOrderByCreatedAtDesc(Long artworkId);

  List<CommentEntry> findTop200ByOrderByCreatedAtDesc();

  List<CommentEntry> findByArtworkIdInOrderByCreatedAtDesc(Collection<Long> artworkIds);

  void deleteByArtworkId(Long artworkId);
}

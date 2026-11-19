package com.portfolio.repository;

import com.portfolio.model.CommentEntry;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.time.Instant;

public interface CommentRepository extends JpaRepository<CommentEntry, Long> {
    long countByArtworkId(Long artworkId);

    long countByCreatedAtGreaterThanEqualAndCreatedAtLessThan(Instant start, Instant end);

    List<CommentEntry> findTop20ByArtworkIdOrderByCreatedAtDesc(Long artworkId);

    List<CommentEntry> findTop200ByOrderByCreatedAtDesc();

    List<CommentEntry> findByArtworkIdInOrderByCreatedAtDesc(Collection<Long> artworkIds);

    void deleteByArtworkId(Long artworkId);
}

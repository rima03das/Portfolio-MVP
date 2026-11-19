package com.portfolio.repository;

import com.portfolio.model.Reaction;
import com.portfolio.model.ReactionType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.Optional;

public interface ReactionRepository extends JpaRepository<Reaction, Long> {
    Optional<Reaction> findByArtworkIdAndAccountId(Long artworkId, Long accountId);

    long countByArtworkIdAndType(Long artworkId, ReactionType type);

    long countByTypeAndCreatedAtGreaterThanEqualAndCreatedAtLessThan(
            ReactionType type,
            Instant start,
            Instant end
    );

    void deleteByArtworkId(Long artworkId);
}

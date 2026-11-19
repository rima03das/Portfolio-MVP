package com.portfolio.repository;

import com.portfolio.model.ViewEvent;
import java.time.Instant;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ViewEventRepository extends JpaRepository<ViewEvent, Long> {
  boolean existsByArtworkIdAndBrowserSessionKey(Long artworkId, String browserSessionKey);

  long countByArtworkId(Long artworkId);

  long countByCreatedAtGreaterThanEqualAndCreatedAtLessThan(Instant start, Instant end);

  void deleteByArtworkId(Long artworkId);
}

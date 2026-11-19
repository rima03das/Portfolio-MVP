package com.portfolio.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

import java.time.Instant;

@Entity
@Table(
        name = "view_events",
        uniqueConstraints = @UniqueConstraint(columnNames = {"artwork_id", "browser_session_key"})
)
public class ViewEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "artwork_id", nullable = false)
    private Artwork artwork;

    @Column(name = "browser_session_key", nullable = false, length = 36)
    private String browserSessionKey;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected ViewEvent() {
    }

    public ViewEvent(Artwork artwork, String browserSessionKey) {
        this.artwork = artwork;
        this.browserSessionKey = browserSessionKey;
    }

    @PrePersist
    void setCreatedAt() {
        createdAt = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public Artwork getArtwork() {
        return artwork;
    }

    public String getBrowserSessionKey() {
        return browserSessionKey;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}

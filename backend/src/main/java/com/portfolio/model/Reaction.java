package com.portfolio.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import jakarta.persistence.PrePersist;

import java.time.Instant;

@Entity
@Table(
        name = "reactions",
        uniqueConstraints = @UniqueConstraint(columnNames = {"artwork_id", "account_id"})
)
public class Reaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "artwork_id", nullable = false)
    private Artwork artwork;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "account_id", nullable = false)
    private Account account;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 8)
    private ReactionType type;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected Reaction() {
    }

    public Reaction(Artwork artwork, Account account, ReactionType type) {
        this.artwork = artwork;
        this.account = account;
        this.type = type;
    }

    public Long getId() {
        return id;
    }

    public Artwork getArtwork() {
        return artwork;
    }

    public Account getAccount() {
        return account;
    }

    public ReactionType getType() {
        return type;
    }

    public void setType(ReactionType type) {
        this.type = type;
    }

    @PrePersist
    void setCreatedAt() {
        createdAt = Instant.now();
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}

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
import java.time.Instant;

@Entity
@Table(name = "comments")
public class CommentEntry {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "artwork_id", nullable = false)
  private Artwork artwork;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "account_id", nullable = false)
  private Account account;

  @Column(nullable = false, length = 1000)
  private String content;

  @Column(name = "created_at", nullable = false, updatable = false)
  private Instant createdAt;

  protected CommentEntry() {}

  public CommentEntry(Artwork artwork, Account account, String content) {
    this.artwork = artwork;
    this.account = account;
    this.content = content;
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

  public Account getAccount() {
    return account;
  }

  public String getContent() {
    return content;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }
}

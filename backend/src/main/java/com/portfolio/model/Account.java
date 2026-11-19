package com.portfolio.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.time.Instant;

@Entity
@Table(name = "accounts", uniqueConstraints = @UniqueConstraint(columnNames = "username"))
public class Account {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false, length = 40)
  private String username;

  @Column(name = "password_hash", nullable = false, length = 255)
  private String passwordHash;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 12)
  private AccountRole role;

  @Column(name = "created_at", nullable = false, updatable = false)
  private Instant createdAt;

  protected Account() {}

  public Account(String username, String passwordHash, AccountRole role) {
    this.username = username;
    this.passwordHash = passwordHash;
    this.role = role;
  }

  @PrePersist
  void setCreatedAt() {
    createdAt = Instant.now();
  }

  public Long getId() {
    return id;
  }

  public String getUsername() {
    return username;
  }

  public String getPasswordHash() {
    return passwordHash;
  }

  public AccountRole getRole() {
    return role;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }
}

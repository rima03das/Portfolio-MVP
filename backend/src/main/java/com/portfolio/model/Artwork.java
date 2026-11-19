package com.portfolio.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import java.time.Instant;

@Entity
@Table(name = "artworks")
public class Artwork {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 120)
    private String title;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private Medium medium;

    @Column(nullable = false, length = 2000)
    private String description;

    @Column(name = "image_path", nullable = false, length = 100)
    private String imagePath;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private ArtworkStatus status;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected Artwork() {
    }

    public Artwork(String title, Medium medium, String description, String imagePath, ArtworkStatus status) {
        this.title = title;
        this.medium = medium;
        this.description = description;
        this.imagePath = imagePath;
        this.status = status;
    }

    public void update(String title, Medium medium, String description, String imagePath, ArtworkStatus status) {
        this.title = title;
        this.medium = medium;
        this.description = description;
        this.imagePath = imagePath;
        this.status = status;
    }

    public void setStatus(ArtworkStatus status) {
        this.status = status;
    }

    @PrePersist
    void setCreatedAt() {
        Instant now = Instant.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    void setUpdatedAt() {
        updatedAt = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public String getTitle() {
        return title;
    }

    public Medium getMedium() {
        return medium;
    }

    public String getDescription() {
        return description;
    }

    public String getImagePath() {
        return imagePath;
    }

    public ArtworkStatus getStatus() {
        return status;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}

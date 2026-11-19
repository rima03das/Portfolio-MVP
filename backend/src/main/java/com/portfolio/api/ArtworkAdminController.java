package com.portfolio.api;

import com.portfolio.api.ApiDtos.ArtworkInput;
import com.portfolio.api.ApiDtos.ArtworkResponse;
import com.portfolio.api.ApiDtos.StatusInput;
import com.portfolio.artwork.ArtworkService;
import com.portfolio.model.ArtworkStatus;
import com.portfolio.model.Medium;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/artworks")
public class ArtworkAdminController {

  private final ArtworkService artworkService;

  public ArtworkAdminController(ArtworkService artworkService) {
    this.artworkService = artworkService;
  }

  @GetMapping
  public List<ArtworkResponse> list(
      @RequestParam(required = false) Medium medium,
      @RequestParam(required = false) ArtworkStatus status,
      @RequestParam(required = false) String search,
      @RequestParam(defaultValue = "recent") String sort,
      Authentication authentication) {
    return artworkService.getAdminArtworks(
        medium, status, search, sort, ArtworkController.username(authentication));
  }

  @GetMapping("/{id}")
  public ArtworkResponse get(@PathVariable Long id, Authentication authentication) {
    return artworkService.getAdminArtwork(id, ArtworkController.username(authentication));
  }

  @PostMapping
  public ResponseEntity<ArtworkResponse> create(
      @Valid @RequestBody ArtworkInput input, Authentication authentication) {
    return ResponseEntity.status(HttpStatus.CREATED)
        .body(artworkService.createArtwork(input, ArtworkController.username(authentication)));
  }

  @PutMapping("/{id}")
  public ArtworkResponse update(
      @PathVariable Long id,
      @Valid @RequestBody ArtworkInput input,
      Authentication authentication) {
    return artworkService.updateArtwork(id, input, ArtworkController.username(authentication));
  }

  @PatchMapping("/{id}/status")
  public ArtworkResponse updateStatus(
      @PathVariable Long id, @Valid @RequestBody StatusInput input, Authentication authentication) {
    return artworkService.updateStatus(
        id, input.status(), ArtworkController.username(authentication));
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<Void> delete(@PathVariable Long id) {
    artworkService.deleteArtwork(id);
    return ResponseEntity.noContent().build();
  }
}

package com.portfolio.api;

import com.portfolio.api.ApiDtos.ArtworkResponse;
import com.portfolio.artwork.ArtworkService;
import com.portfolio.model.Medium;
import java.util.List;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/artworks")
public class ArtworkController {

  private final ArtworkService artworkService;

  public ArtworkController(ArtworkService artworkService) {
    this.artworkService = artworkService;
  }

  @GetMapping
  public List<ArtworkResponse> getPublicArtworks(
      @RequestParam(required = false) Medium medium,
      @RequestParam(required = false) String search,
      @RequestParam(defaultValue = "recent") String sort,
      Authentication authentication) {
    return artworkService.getPublicArtworks(medium, search, sort, username(authentication));
  }

  @GetMapping("/{id}")
  public ArtworkResponse getPublicArtwork(@PathVariable Long id, Authentication authentication) {
    return artworkService.getPublicArtwork(id, username(authentication));
  }

  static String username(Authentication authentication) {
    if (authentication == null
        || !authentication.isAuthenticated()
        || "anonymousUser".equals(authentication.getPrincipal())) {
      return null;
    }
    return authentication.getName();
  }
}

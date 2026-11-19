package com.portfolio.data;

import com.portfolio.repository.ArtworkRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class SampleDataRunner implements CommandLineRunner {

  private final SampleDataService sampleDataService;
  private final ArtworkRepository artworkRepository;
  private final boolean reset;

  public SampleDataRunner(
      SampleDataService sampleDataService,
      ArtworkRepository artworkRepository,
      @Value("${app.data.reset:false}") boolean reset) {
    this.sampleDataService = sampleDataService;
    this.artworkRepository = artworkRepository;
    this.reset = reset;
  }

  @Override
  public void run(String... args) {
    if (reset || artworkRepository.count() == 0) {
      sampleDataService.reset();
    }
  }
}

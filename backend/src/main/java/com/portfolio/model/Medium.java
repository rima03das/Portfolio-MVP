package com.portfolio.model;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import java.util.Arrays;

public enum Medium {
  GRAPHITE("Graphite"),
  CHARCOAL("Charcoal"),
  PEN_AND_INK("Pen and Ink"),
  WATERCOLOUR_AND_GOUACHE("Watercolour and Gouache"),
  COLOURS("Colours");

  private final String label;

  Medium(String label) {
    this.label = label;
  }

  @JsonValue
  public String label() {
    return label;
  }

  @JsonCreator
  public static Medium fromLabel(String value) {
    return Arrays.stream(values())
        .filter(
            medium -> medium.label.equalsIgnoreCase(value) || medium.name().equalsIgnoreCase(value))
        .findFirst()
        .orElseThrow(() -> new IllegalArgumentException("Unsupported artwork medium."));
  }
}

package com.portfolio.config;

import com.portfolio.model.Medium;
import org.springframework.core.convert.converter.Converter;
import org.springframework.stereotype.Component;

@Component
public class MediumConverter implements Converter<String, Medium> {

  @Override
  public Medium convert(String source) {
    return Medium.fromLabel(source);
  }
}

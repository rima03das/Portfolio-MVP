package com.portfolio.api;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class SpaController {

  @GetMapping({
    "/",
    "/gallery",
    "/signin",
    "/signup",
    "/setup",
    "/admin",
    "/admin/**",
    "/artworks/{id}"
  })
  public String index() {
    return "forward:/index.html";
  }
}

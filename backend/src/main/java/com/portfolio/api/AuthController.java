package com.portfolio.api;

import com.portfolio.account.AccountService;
import com.portfolio.api.ApiDtos.AccountInput;
import com.portfolio.api.ApiDtos.AccountResponse;
import com.portfolio.api.ApiDtos.SetupStatus;
import com.portfolio.exception.UnauthorizedException;
import com.portfolio.model.Account;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.session.SessionAuthenticationStrategy;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class AuthController {

  private final AccountService accountService;
  private final AuthenticationManager authenticationManager;
  private final SessionAuthenticationStrategy sessionAuthenticationStrategy;
  private final SecurityContextRepository securityContextRepository;

  public AuthController(
      AccountService accountService,
      AuthenticationManager authenticationManager,
      SessionAuthenticationStrategy sessionAuthenticationStrategy,
      SecurityContextRepository securityContextRepository) {
    this.accountService = accountService;
    this.authenticationManager = authenticationManager;
    this.sessionAuthenticationStrategy = sessionAuthenticationStrategy;
    this.securityContextRepository = securityContextRepository;
  }

  @GetMapping("/auth/csrf")
  public Map<String, String> csrf(CsrfToken csrfToken) {
    return Map.of("token", csrfToken.getToken());
  }

  @GetMapping("/setup/status")
  public SetupStatus setupStatus() {
    return new SetupStatus(accountService.setupRequired());
  }

  @PostMapping("/setup/admin")
  public ResponseEntity<AccountResponse> setupAdmin(@Valid @RequestBody AccountInput input) {
    return ResponseEntity.status(HttpStatus.CREATED)
        .body(toResponse(accountService.createInitialAdmin(input)));
  }

  @PostMapping("/auth/register")
  public ResponseEntity<AccountResponse> registerViewer(@Valid @RequestBody AccountInput input) {
    return ResponseEntity.status(HttpStatus.CREATED)
        .body(toResponse(accountService.registerViewer(input)));
  }

  @PostMapping("/auth/login")
  public AccountResponse login(
      @Valid @RequestBody AccountInput input,
      HttpServletRequest request,
      HttpServletResponse response) {
    Authentication authentication;
    try {
      authentication =
          authenticationManager.authenticate(
              UsernamePasswordAuthenticationToken.unauthenticated(
                  input.username(), input.password()));
    } catch (AuthenticationException exception) {
      throw new UnauthorizedException("Username or password is incorrect.");
    }

    sessionAuthenticationStrategy.onAuthentication(authentication, request, response);
    SecurityContext context = SecurityContextHolder.createEmptyContext();
    context.setAuthentication(authentication);
    SecurityContextHolder.setContext(context);
    securityContextRepository.saveContext(context, request, response);
    return toResponse(accountService.findByUsername(authentication.getName()));
  }

  @PostMapping("/auth/logout")
  public ResponseEntity<Void> logout(HttpServletRequest request) {
    SecurityContextHolder.clearContext();
    if (request.getSession(false) != null) {
      request.getSession(false).invalidate();
    }
    return ResponseEntity.noContent().build();
  }

  @GetMapping("/auth/me")
  public ResponseEntity<AccountResponse> currentAccount(Authentication authentication) {
    if (authentication == null
        || !authentication.isAuthenticated()
        || "anonymousUser".equals(authentication.getPrincipal())) {
      return ResponseEntity.noContent().build();
    }
    return ResponseEntity.ok(toResponse(accountService.findByUsername(authentication.getName())));
  }

  private static AccountResponse toResponse(Account account) {
    return new AccountResponse(account.getId(), account.getUsername(), account.getRole());
  }
}

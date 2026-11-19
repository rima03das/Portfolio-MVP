package com.portfolio.account;

import com.portfolio.api.ApiDtos.AccountInput;
import com.portfolio.exception.ConflictException;
import com.portfolio.exception.ResourceNotFoundException;
import com.portfolio.model.Account;
import com.portfolio.model.AccountRole;
import com.portfolio.repository.AccountRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AccountService {

  private final AccountRepository accountRepository;
  private final PasswordEncoder passwordEncoder;

  public AccountService(AccountRepository accountRepository, PasswordEncoder passwordEncoder) {
    this.accountRepository = accountRepository;
    this.passwordEncoder = passwordEncoder;
  }

  @Transactional(readOnly = true)
  public boolean setupRequired() {
    return !accountRepository.existsByRole(AccountRole.ADMIN);
  }

  @Transactional
  public synchronized Account createInitialAdmin(AccountInput input) {
    if (accountRepository.existsByRole(AccountRole.ADMIN)) {
      throw new ConflictException("The artist account has already been created.");
    }
    return accountRepository.saveAndFlush(createAccount(input, AccountRole.ADMIN));
  }

  @Transactional
  public Account registerViewer(AccountInput input) {
    return accountRepository.save(createAccount(input, AccountRole.VIEWER));
  }

  @Transactional(readOnly = true)
  public Account findByUsername(String username) {
    return accountRepository
        .findByUsernameIgnoreCase(username)
        .orElseThrow(() -> new ResourceNotFoundException("Account not found."));
  }

  @Transactional(readOnly = true)
  public Account findViewerByUsername(String username) {
    return findByUsername(username);
  }

  private Account createAccount(AccountInput input, AccountRole role) {
    String username = input.username().trim().toLowerCase();
    if (accountRepository.existsByUsernameIgnoreCase(username)) {
      throw new ConflictException("That username is already in use.");
    }
    return new Account(username, passwordEncoder.encode(input.password()), role);
  }
}

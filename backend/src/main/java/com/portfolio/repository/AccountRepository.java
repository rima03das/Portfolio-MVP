package com.portfolio.repository;

import com.portfolio.model.Account;
import com.portfolio.model.AccountRole;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AccountRepository extends JpaRepository<Account, Long> {
  Optional<Account> findByUsernameIgnoreCase(String username);

  boolean existsByUsernameIgnoreCase(String username);

  boolean existsByRole(AccountRole role);
}

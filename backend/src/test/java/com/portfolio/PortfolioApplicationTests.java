package com.portfolio;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest(properties = "spring.datasource.url=jdbc:h2:mem:portfolio-context;DB_CLOSE_DELAY=-1")
class PortfolioApplicationTests {

    @Test
    void applicationContextStartsWithAnIsolatedRelationalDatabase() {
    }
}

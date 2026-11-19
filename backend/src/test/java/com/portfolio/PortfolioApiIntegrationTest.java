package com.portfolio;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.portfolio.data.SampleDataService;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;

@SpringBootTest(properties = "spring.datasource.url=jdbc:h2:mem:portfolio-api;DB_CLOSE_DELAY=-1")
@AutoConfigureMockMvc
class PortfolioApiIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private SampleDataService sampleDataService;

    @BeforeEach
    void resetSample() {
        sampleDataService.reset();
    }

    @Test
    void anonymousVisitorsCanBrowsePublishedWorksButCannotManageOrInteract() throws Exception {
        mockMvc.perform(get("/api/artworks"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(5));

        mockMvc.perform(get("/api/admin/artworks"))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(put("/api/artworks/1/reactions")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"reaction\":\"LIKE\"}"))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(post("/api/artworks/1/comments")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"content\":\"Nice work.\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void setupAndRegistrationEnforceOneAdminAndUniqueViewerAccounts() throws Exception {
        mockMvc.perform(get("/api/setup/status"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.setupRequired").value(true));

        String adminJson = "{\"username\":\"artist\",\"password\":\"artist-password-long\"}";
        mockMvc.perform(post("/api/setup/admin")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(adminJson))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.role").value("ADMIN"));
        mockMvc.perform(post("/api/setup/admin")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"second\",\"password\":\"second-password-long\"}"))
                .andExpect(status().isConflict());
        mockMvc.perform(get("/api/setup/status"))
                .andExpect(jsonPath("$.setupRequired").value(false));

        String viewerJson = "{\"username\":\"viewer\",\"password\":\"viewer-password-long\"}";
        mockMvc.perform(post("/api/auth/register")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(viewerJson))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.role").value("VIEWER"));
        mockMvc.perform(post("/api/auth/register")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"VIEWER\",\"password\":\"another-password-long\"}"))
                .andExpect(status().isConflict());
    }

    @Test
    void viewerLoginCreatesSessionAndViewerCannotAccessAdminRoutes() throws Exception {
        String viewerJson = "{\"username\":\"viewer\",\"password\":\"viewer-password-long\"}";
        mockMvc.perform(post("/api/auth/register")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(viewerJson))
                .andExpect(status().isCreated());

        MvcResult login = mockMvc.perform(post("/api/auth/login")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(viewerJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("viewer"))
                .andReturn();
        MockHttpSession session = (MockHttpSession) login.getRequest().getSession(false);

        mockMvc.perform(get("/api/auth/me").session(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("VIEWER"));
        mockMvc.perform(get("/api/admin/dashboard").session(session))
                .andExpect(status().isForbidden());
    }

    @Test
    void anonymousViewCookieDeduplicatesWithinTheBrowserSession() throws Exception {
        MvcResult gallery = mockMvc.perform(get("/api/artworks"))
                .andExpect(status().isOk())
                .andReturn();
        long artworkId = objectMapper.readTree(gallery.getResponse().getContentAsString()).get(0).get("id").asLong();
        String artworkPath = "/api/artworks/" + artworkId;
        MvcResult first = mockMvc.perform(post(artworkPath + "/views").with(csrf()))
                .andExpect(status().isNoContent())
                .andReturn();
        String visitorCookie = first.getResponse().getCookie("PORTFOLIO_VISITOR").getValue();

        mockMvc.perform(post(artworkPath + "/views")
                        .with(csrf())
                        .cookie(new Cookie("PORTFOLIO_VISITOR", visitorCookie)))
                .andExpect(status().isNoContent());
        mockMvc.perform(get(artworkPath))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.views").value(1));

        mockMvc.perform(post(artworkPath + "/views")
                        .with(csrf())
                        .cookie(new Cookie("PORTFOLIO_VISITOR", "not-a-session-uuid")))
                .andExpect(status().isNoContent());
        mockMvc.perform(get(artworkPath))
                .andExpect(jsonPath("$.views").value(2));
    }

    @Test
    void adminCanManageArtworkAndInvalidInputIsReported() throws Exception {
        mockMvc.perform(post("/api/admin/artworks")
                        .with(user("artist").roles("ADMIN"))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"\",\"medium\":\"Graphite\",\"description\":\"Description\",\"imagePath\":\"https://example.com/image.jpg\",\"status\":\"UPLOADED\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON));

        String artworkJson = """
                {"title":"New study","medium":"Graphite","description":"A newly uploaded work.","imagePath":"face.jpg","status":"UPLOADED"}
                """;
        MvcResult created = mockMvc.perform(post("/api/admin/artworks")
                        .with(user("artist").roles("ADMIN"))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(artworkJson))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("UPLOADED"))
                .andReturn();
        long id = objectMapper.readTree(created.getResponse().getContentAsString()).get("id").asLong();

        mockMvc.perform(get("/api/artworks/" + id))
                .andExpect(status().isNotFound());
        mockMvc.perform(patch("/api/admin/artworks/" + id + "/status")
                        .with(user("artist").roles("ADMIN"))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"PUBLISHED\"}"))
                .andExpect(status().isOk());
        mockMvc.perform(get("/api/artworks/" + id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("New study"));

        mockMvc.perform(delete("/api/admin/artworks/" + id)
                        .with(user("artist").roles("ADMIN"))
                        .with(csrf()))
                .andExpect(status().isNoContent());
    }
}

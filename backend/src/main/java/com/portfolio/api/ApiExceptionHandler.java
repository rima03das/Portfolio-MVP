package com.portfolio.api;

import com.portfolio.exception.ConflictException;
import com.portfolio.exception.ResourceNotFoundException;
import com.portfolio.exception.UnauthorizedException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class ApiExceptionHandler {

  @ExceptionHandler(ResourceNotFoundException.class)
  ResponseEntity<ProblemDetail> handleNotFound(ResourceNotFoundException exception) {
    return problem(HttpStatus.NOT_FOUND, exception.getMessage());
  }

  @ExceptionHandler(ConflictException.class)
  ResponseEntity<ProblemDetail> handleConflict(ConflictException exception) {
    return problem(HttpStatus.CONFLICT, exception.getMessage());
  }

  @ExceptionHandler(UnauthorizedException.class)
  ResponseEntity<ProblemDetail> handleUnauthorized(UnauthorizedException exception) {
    return problem(HttpStatus.UNAUTHORIZED, exception.getMessage());
  }

  @ExceptionHandler(MethodArgumentNotValidException.class)
  ResponseEntity<ProblemDetail> handleValidation(MethodArgumentNotValidException exception) {
    FieldError fieldError =
        exception.getBindingResult().getFieldErrors().stream().findFirst().orElse(null);
    String detail =
        fieldError == null
            ? "The submitted data is invalid."
            : fieldError.getField() + ": " + fieldError.getDefaultMessage();
    return problem(HttpStatus.BAD_REQUEST, detail);
  }

  @ExceptionHandler(HttpMessageNotReadableException.class)
  ResponseEntity<ProblemDetail> handleUnreadable(HttpMessageNotReadableException exception) {
    return problem(HttpStatus.BAD_REQUEST, "The request body contains an unsupported value.");
  }

  @ExceptionHandler(IllegalArgumentException.class)
  ResponseEntity<ProblemDetail> handleIllegalArgument(IllegalArgumentException exception) {
    return problem(HttpStatus.BAD_REQUEST, exception.getMessage());
  }

  @ExceptionHandler(DataIntegrityViolationException.class)
  ResponseEntity<ProblemDetail> handleConstraintViolation(
      DataIntegrityViolationException exception) {
    return problem(HttpStatus.CONFLICT, "The request conflicts with an existing record.");
  }

  private static ResponseEntity<ProblemDetail> problem(HttpStatus status, String detail) {
    ProblemDetail problem = ProblemDetail.forStatusAndDetail(status, detail);
    problem.setTitle(status.getReasonPhrase());
    return ResponseEntity.status(status).body(problem);
  }
}

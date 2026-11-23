package br.com.linhafina.exception;

import jakarta.servlet.http.HttpServletRequest;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

@RestControllerAdvice
public class ApiExceptionHandler {

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<Map<String, Object>> credenciais(BadCredentialsException erro, HttpServletRequest request) {
        return resposta(HttpStatus.UNAUTHORIZED, erro.getMessage(), request, null);
    }

    @ExceptionHandler(RecursoNaoEncontradoException.class)
    public ResponseEntity<Map<String, Object>> naoEncontrado(RecursoNaoEncontradoException erro, HttpServletRequest request) {
        return resposta(HttpStatus.NOT_FOUND, erro.getMessage(), request, null);
    }

    @ExceptionHandler(RegraNegocioException.class)
    public ResponseEntity<Map<String, Object>> regraNegocio(RegraNegocioException erro, HttpServletRequest request) {
        return resposta(HttpStatus.UNPROCESSABLE_ENTITY, erro.getMessage(), request, null);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> validacao(MethodArgumentNotValidException erro, HttpServletRequest request) {
        Map<String, String> campos = new LinkedHashMap<>();
        for (FieldError campo : erro.getBindingResult().getFieldErrors()) {
            campos.putIfAbsent(campo.getField(), campo.getDefaultMessage());
        }
        String mensagem = campos.values().stream().findFirst().orElse("Revise os dados informados.");
        return resposta(HttpStatus.BAD_REQUEST, mensagem, request, campos);
    }

    @ExceptionHandler({HttpMessageNotReadableException.class, MethodArgumentTypeMismatchException.class, IllegalArgumentException.class})
    public ResponseEntity<Map<String, Object>> requisicaoInvalida(Exception erro, HttpServletRequest request) {
        return resposta(HttpStatus.BAD_REQUEST, "Os dados enviados possuem formato ou identificador invalido.", request, null);
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Map<String, Object>> conflito(DataIntegrityViolationException erro, HttpServletRequest request) {
        return resposta(HttpStatus.CONFLICT, "O registro nao pode ser salvo porque conflita com dados relacionados.", request, null);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> interno(Exception erro, HttpServletRequest request) {
        erro.printStackTrace();
        return resposta(HttpStatus.INTERNAL_SERVER_ERROR, "Nao foi possivel concluir a operacao no servidor.", request, null);
    }

    private ResponseEntity<Map<String, Object>> resposta(HttpStatus status, String mensagem, HttpServletRequest request, Map<String, String> campos) {
        Map<String, Object> corpo = new LinkedHashMap<>();
        corpo.put("timestamp", LocalDateTime.now().toString());
        corpo.put("status", status.value());
        corpo.put("message", mensagem);
        corpo.put("path", request.getRequestURI());
        if (campos != null) corpo.put("errors", campos);
        return ResponseEntity.status(status).body(corpo);
    }
}

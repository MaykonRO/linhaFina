package br.com.linhafina;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import br.com.linhafina.exception.RegraNegocioException;
import br.com.linhafina.model.StatusOrdem;
import org.junit.jupiter.api.Test;

class StatusOrdemTest {

    @Test
    void deveSeguirOFluxoDoFrontend() {
        assertThat(StatusOrdem.AGUARDANDO.proximo()).isEqualTo(StatusOrdem.PRODUCAO);
        assertThat(StatusOrdem.PRODUCAO.proximo()).isEqualTo(StatusOrdem.PROVA);
        assertThat(StatusOrdem.PROVA.proximo()).isEqualTo(StatusOrdem.PRONTA);
        assertThat(StatusOrdem.PRONTA.proximo()).isEqualTo(StatusOrdem.ENTREGUE);
    }

    @Test
    void naoDeveAvancarDepoisDeEntregueOuCancelada() {
        assertThatThrownBy(StatusOrdem.ENTREGUE::proximo).isInstanceOf(RegraNegocioException.class);
        assertThatThrownBy(StatusOrdem.CANCELADA::proximo).isInstanceOf(RegraNegocioException.class);
    }
}

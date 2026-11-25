package br.com.linhafina;

import static org.assertj.core.api.Assertions.assertThat;

import br.com.linhafina.model.Cliente;
import br.com.linhafina.model.Papel;
import br.com.linhafina.model.Pessoa;
import br.com.linhafina.model.Usuario;
import org.junit.jupiter.api.Test;

class PessoaTest {

    @Test
    void deveDemonstrarHerancaAbstracaoPolimorfismoESobrescrita() {
        Pessoa cliente = new Cliente("Maria", "11999999999", "maria@teste.local");
        Pessoa usuario = new Usuario("Admin", "admin@teste.local", "hash", Papel.DONO);

        assertThat(cliente).isInstanceOf(Pessoa.class);
        assertThat(usuario).isInstanceOf(Pessoa.class);

        assertThat(cliente.getTipoPessoa()).isEqualTo("cliente");
        assertThat(usuario.getTipoPessoa()).isEqualTo("usuario");

        // O metodo toString da classe base chama o metodo sobrescrito em cada filha.
        assertThat(cliente.toString()).isEqualTo("cliente: Maria");
        assertThat(usuario.toString()).isEqualTo("usuario: Admin");
    }
}

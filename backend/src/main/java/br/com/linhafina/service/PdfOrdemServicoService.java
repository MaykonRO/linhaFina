package br.com.linhafina.service;

import br.com.linhafina.model.OrdemServico;
import com.lowagie.text.Document;
import com.lowagie.text.Font;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.pdf.PdfWriter;
import java.io.ByteArrayOutputStream;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PdfOrdemServicoService {

    private final OrdemServicoService ordemService;

    public PdfOrdemServicoService(OrdemServicoService ordemService) {
        this.ordemService = ordemService;
    }

    @Transactional(readOnly = true)
    public byte[] gerar(Long id) {
        OrdemServico os = ordemService.buscar(id);
        try (ByteArrayOutputStream saida = new ByteArrayOutputStream()) {
            Document documento = new Document(PageSize.A4);
            PdfWriter.getInstance(documento, saida);
            documento.open();
            documento.add(new Paragraph("LINHA FINA", new Font(Font.HELVETICA, 20, Font.BOLD)));
            documento.add(new Paragraph("Comprovante de Ordem de Servico", new Font(Font.HELVETICA, 14)));
            documento.add(new Paragraph(" "));
            documento.add(new Paragraph("Codigo: " + os.getCodigo()));
            documento.add(new Paragraph("Cliente: " + os.getCliente().getNome()));
            documento.add(new Paragraph("Telefone: " + os.getCliente().getTelefone()));
            documento.add(new Paragraph("Servico: " + os.getServico().getNome()));
            documento.add(new Paragraph("Peca: " + os.getTipoPeca() + " - " + os.getDescricaoPeca()));
            if (os.getResponsavel() != null) documento.add(new Paragraph("Responsavel: " + os.getResponsavel().getNome()));
            documento.add(new Paragraph("Status: " + os.getStatus().paraApi()));
            documento.add(new Paragraph("Entrada: " + os.getDataEntrada()));
            documento.add(new Paragraph("Previsao de entrega: " + os.getDataPrevistaEntrega()));
            if (os.getDataProva() != null) documento.add(new Paragraph("Prova: " + os.getDataProva()));
            documento.add(new Paragraph("Valor do servico: R$ " + os.getValorServico()));
            documento.add(new Paragraph("Taxa de urgencia: R$ " + os.getTaxaUrgencia()));
            documento.add(new Paragraph("Taxa de guarda: R$ " + os.getTaxaGuarda()));
            documento.add(new Paragraph("Desconto: R$ " + os.getDesconto()));
            documento.add(new Paragraph("Valor final: R$ " + os.getValorFinal(), new Font(Font.HELVETICA, 13, Font.BOLD)));
            documento.add(new Paragraph("Valor pago: R$ " + os.getValorPago()));
            documento.add(new Paragraph("Pagamento: " + os.getPagamentoStatus().paraApi()));
            if (os.getMotivoCancelamento() != null) documento.add(new Paragraph("Motivo do cancelamento: " + os.getMotivoCancelamento()));
            documento.close();
            return saida.toByteArray();
        } catch (Exception erro) {
            throw new IllegalStateException("Nao foi possivel gerar o PDF da OS.", erro);
        }
    }
}

import type { Metadata } from "next";

import { getCurrentBrand } from "@/brands/server";
import { LegalPage } from "@/components/sales/legal-page";

export async function generateMetadata(): Promise<Metadata> {
  const brand = await getCurrentBrand();
  return { title: "Termos de Uso", description: `Termos de Uso do ${brand.name}.` };
}

export default async function TermsPage() {
  const brand = await getCurrentBrand();
  const contact = brand.emailFrom.address;
  return (
    <LegalPage title="Termos de Uso" brandName={brand.name} updatedAt="12/10/2026">
      <p>
        Estes Termos regulam o uso do {brand.name}, plataforma de página de apresentação, agenda e
        ferramentas de venda para negócios de serviço com horário marcado. Ao criar uma conta, você
        concorda com eles.
      </p>
      <h2>1. Conta e responsabilidades</h2>
      <ul>
        <li>
          Você é responsável pelas informações publicadas na sua página, pelos preços e pelos
          serviços prestados.
        </li>
        <li>
          Mantenha sua senha em sigilo. Atividades feitas com sua conta são de sua responsabilidade.
        </li>
        <li>
          É proibido publicar conteúdo ilegal, enganoso, ofensivo ou que viole direitos de
          terceiros.
        </li>
      </ul>
      <h2>2. Planos e pagamentos</h2>
      <ul>
        <li>
          Há um único plano, cobrado de forma recorrente (mensal ou anual) até o cancelamento.
        </li>
        <li>
          Todo cadastro começa com um teste de 14 dias, sem cartão, que pode ser usado uma vez por
          pessoa (e-mail, telefone e CPF/CNPJ). Sem pagamento ao fim do teste, a conta entra em modo
          de espera: o link continua no ar e os pedidos dos clientes são encaminhados ao WhatsApp do
          profissional, sem reserva de horário; o painel fica restrito à assinatura e à conta. Nada é
          apagado, e os horários já marcados continuam valendo.
        </li>
        <li>
          O cancelamento interrompe as próximas cobranças; o plano continua até o fim do período já
          pago e, depois, a conta entra em modo de espera.
        </li>
        <li>
          Pagamentos em atraso por mais de 5 dias fazem a conta entrar em modo de espera, sem perda
          de dados.
        </li>
      </ul>
      <h2>3. Sinal por Pix</h2>
      <p>
        O sinal cobrado das suas clientes é pago diretamente na sua chave Pix. O {brand.name} não
        recebe, não guarda e não repassa dinheiro de clientes finais e não se responsabiliza por
        esses pagamentos.
      </p>
      <h2>4. Clientes finais</h2>
      <p>
        Você é responsável pelo uso dos dados das suas clientes conforme a LGPD. E-mails de
        novidades só são enviados a quem autorizou, sempre com opção de descadastro.
      </p>
      <h2>5. Disponibilidade</h2>
      <p>
        Trabalhamos para manter o serviço disponível, mas podem ocorrer interrupções para manutenção
        ou por fatores externos.
      </p>
      <h2>6. Encerramento</h2>
      <p>
        Você pode excluir sua conta a qualquer momento no painel. Podemos suspender contas que
        violem estes Termos.
      </p>
      <h2>7. Contato</h2>
      <p>Dúvidas: {contact}.</p>
    </LegalPage>
  );
}

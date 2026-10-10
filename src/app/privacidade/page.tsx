import type { Metadata } from "next";

import { getCurrentBrand } from "@/brands/server";
import { LegalPage } from "@/components/sales/legal-page";

export async function generateMetadata(): Promise<Metadata> {
  const brand = await getCurrentBrand();
  return {
    title: "Política de Privacidade",
    description: `Como o ${brand.name} trata seus dados.`,
  };
}

export default async function PrivacyPage() {
  const brand = await getCurrentBrand();
  const contact = brand.emailFrom.address;
  return (
    <LegalPage title="Política de Privacidade" brandName={brand.name} updatedAt="02/10/2026">
      <p>
        Esta Política explica como o {brand.name} trata dados pessoais, conforme a Lei Geral de
        Proteção de Dados (LGPD).
      </p>
      <h2>1. Dados de quem tem conta (profissionais)</h2>
      <ul>
        <li>
          E-mail, senha (guardada de forma cifrada) e dados do negócio informados no cadastro.
        </li>
        <li>Dados de cobrança (nome e CPF/CNPJ), enviados ao processador de pagamentos.</li>
      </ul>
      <h2>2. Dados de clientes finais</h2>
      <ul>
        <li>
          Nome, telefone e e-mail informados ao pedir ou agendar um horário, usados para o
          agendamento e os avisos dele.
        </li>
        <li>
          O negócio que você contratou é o controlador desses dados; o {brand.name} atua como
          operador.
        </li>
        <li>E-mails de novidades só com sua autorização, com descadastro em um clique.</li>
      </ul>
      <h2>3. Estatísticas e cookies</h2>
      <p>
        Usamos um cookie anônimo com um identificador de sessão para contar visitas e cliques. Não
        guardamos IP, nome ou qualquer dado que identifique quem visita. Números pequenos (abaixo de
        5) nunca são exibidos.
      </p>
      <h2>4. Compartilhamento</h2>
      <p>
        Usamos fornecedores para hospedagem, banco de dados, envio de e-mails, armazenamento de
        imagens e cobrança. Eles tratam os dados apenas para prestar esses serviços.
      </p>
      <h2>5. Seus direitos</h2>
      <p>
        Você pode pedir acesso, correção, exportação ou exclusão dos seus dados. Profissionais
        exportam e excluem tudo pelo painel; clientes finais podem pedir ao negócio ou a nós.
      </p>
      <h2>6. Retenção</h2>
      <p>
        Mantemos os dados enquanto a conta existir. Registros de “quase agendou” são apagados após
        30 dias; eventos de estatística brutos, após 180 dias. Comprovantes de Pix enviados pelo
        cliente ficam em armazenamento privado, só o profissional que recebeu consegue ver, e o
        arquivo é apagado 30 dias depois que ele confirma ou recusa o pagamento (guardamos apenas
        uma impressão digital do arquivo, para recusar o mesmo comprovante em outro agendamento).
        O MeetChat não lê o conteúdo dos comprovantes nem recebe o dinheiro.
      </p>
      <h2>7. Contato do encarregado</h2>
      <p>{contact}</p>
    </LegalPage>
  );
}

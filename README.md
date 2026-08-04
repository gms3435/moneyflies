# MoneyFlies — Gestão Financeira Pessoal & Privada 💸✨

O **MoneyFlies** é um aplicativo web completo e independente para gestão de finanças pessoais, despesas à vista, faturas de cartões de crédito, receitas e contas recorrentes, desenvolvido com foco em **fidelidade visual**, **privacidade** e **facilidade de uso**.

---

## 🌟 Principais Funcionalidades

### 🔐 1. Proteção de Acesso por Senha (PIN)
* **Bloqueio de Inicialização**: Tela de login modal exigindo senha para visualizar os dados financeiros.
* **Teclado Numérico Mobile**: Ajustado especificamente (`inputmode="numeric"`) para abrir o teclado de PIN em celulares iOS e Android.
* **Mensagem de Apresentação**: Apresentação clara sobre os objetivos do app no primeiro acesso.
* **Bloqueio Rápido**: Ícone de cadeado no cabeçalho para trancar a sessão a qualquer momento.
* **Senha Padrão Inicial**: `admin` (configurável na aba *Configurações & Dados*).

---

### 💳 2. Cartões de Crédito & Limite em Tempo Real
* **Crédito Disponível Real**: Calcula o limite disponível deduzindo a soma de todas as parcelas futuras comprometidas nos cartões.
* **Faturas Individuais por Mês**: Cálculo automático do mês da fatura com base no dia de fechamento e vencimento de cada cartão.
* **Marcação de Fatura Paga**: Checkbox `[ ] Paga neste mês` na barra do cartão e selo `✅ Fatura Paga` no Dashboard.

---

### 🛡️ 3. Despesas Fixas & Assinaturas Recorrentes
* **Ajuste de Valores Variáveis**: Altere o valor de contas variáveis (ex: Luz ou Água) em um mês específico sem afetar o histórico dos meses anteriores.
* **Período de Vigência**: Configure meses iniciais e finais para assinaturas ou contratos temporários.
* **Totalizador no Cabeçalho**: Exibe o valor total acumulado no mês e um contador em tempo real (`X de Y pagas | R$ A pago | R$ B pendente`).
* **Integração com Cartões**: Opção de vincular o pagamento da despesa fixa diretamente à fatura de um cartão.

---

### 📊 4. Dashboard Inteligente & Projeção Financeira
* **KPIs Instantâneos**: Receitas, Gastos À Vista, Faturas de Cartão, Despesas Fixas e **Previsão de Saldo Final**.
* **Gráficos Dinâmicos (Chart.js)**:
  * *Gastos por Categoria* (Gráfico de Rosca).
  * *Projeção & Saldo Semestral* (Gráfico combinado de Linha e Barras).
* **Modo de Privacidade**: Botão `👁️` para ocultar/borrar valores sensíveis na tela.

---

### ⚙️ 5. Migração & Backups
* **Importação Nativa do TimeFlies**: Carrega backups `.json` do TimeFlies original (com suporte a arquivos criptografados com senha).
* **Exportação Exclusiva**: Gera arquivos JSON de backup dedicados do MoneyFlies.

---

## 🛠️ Tecnologias Utilizadas

* **Frontend**: HTML5 Semântico, Vanilla CSS3 (Design System *Swiss Minimalist*), JavaScript ES6+.
* **Gráficos & Ícones**: [Chart.js](https://www.chartjs.org/) & [Lucide Icons](https://lucide.dev/).
* **Backend Local**: Python 3 (`http.server` nativo, sem necessidade de dependências pip).

---

## 🚀 Como Executar o Projeto Localmente

### Pré-requisitos
* Python 3.x instalado em sua máquina.

### Passo a Passo

1. **Clonar ou Baixar o Repositório**:
   ```bash
   git clone https://github.com/seu-usuario/moneyflies.git
   cd moneyflies
   ```

2. **Iniciar o Servidor Python**:
   ```bash
   python server.py
   ```

3. **Acessar o Aplicativo**:
   Abra seu navegador e acesse:
   [http://localhost:8080](http://localhost:8080)

4. **Primeiro Acesso**:
   * **Senha inicial**: `admin`
   * Altere sua senha na aba **Configurações & Dados** quando desejar.

---

## 📁 Estrutura de Arquivos

```text
MoneyFlies/
├── index.html          # Interface principal do aplicativo
├── app.js              # Lógica de finanças, cálculos e segurança
├── style.css           # Estilos e tokens do Design System
├── server.py           # Servidor Python HTTP local e API JSON
├── moneyflies_db.json  # Banco de dados JSON persistente
├── manifest.json       # Configurações PWA (Progressive Web App)
├── icon-192.png        # Ícone PWA (192x192)
├── icon-512.png        # Ícone PWA (512x512)
└── README.md           # Documentação do projeto
```

---

## 🔒 Privacidade & Segurança

O MoneyFlies opera no modelo **Offline First / Local First**: todos os seus registros financeiros permanecem exclusivamente armazenados no seu próprio navegador e no servidor Python local (`moneyflies_db.json`). Nenhum dado é enviado para servidores externos.

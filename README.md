# Alinhador de Currículo

Envie seu currículo mestre em `.docx`, cole a descrição de uma vaga e receba:

- **Diagnóstico de alinhamento** (score 0–100) com classificação: bem alinhado, parcialmente alinhado ou não alinhado.
- **Tabela requisito × evidência** mostrando o que você atende, atende parcialmente e o que falta.
- **Currículo adaptado**: o conteúdo é enxugado para a vaga, com experiências, projetos e habilidades irrelevantes removidos e bullets reescritos.
- **Recomendações de desenvolvimento**: tecnologias para aprender e ideias de projeto de portfólio que cobrem as lacunas.
- **Exportação em PDF e DOCX** do currículo final, já com suas edições e remoções.

O currículo adaptado usa **somente fatos do currículo mestre**. Nada é inventado: o que falta vira recomendação, nunca experiência fictícia.

## Como rodar

Requisitos: Node.js 20.9+ e uma chave da [Gemini API](https://aistudio.google.com/apikey) (o free tier é suficiente para uso pessoal).

```bash
npm install
cp .env.local.example .env.local
# edite .env.local e informe GEMINI_API_KEY
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

Variáveis de ambiente:

| Variável | Obrigatória | Descrição |
| --- | --- | --- |
| `GEMINI_API_KEY` | Sim | Chave da Gemini Developer API. Fica apenas no servidor. |
| `GEMINI_MODEL` | Não | Modelo principal. Padrão: `gemini-3.5-flash`. |
| `GEMINI_FALLBACK_MODELS` | Não | Modelos alternativos em caso de indisponibilidade, separados por vírgula. Padrão: `gemini-2.5-flash,gemini-3.8-flash`. |

## Como usar

1. Arraste o `.docx` do seu currículo completo. O arquivo é lido no navegador com `mammoth`; revise o texto extraído se necessário.
2. Cole a descrição da vaga (responsabilidades, requisitos e diferenciais).
3. Escolha o idioma do currículo gerado (português ou inglês).
4. Clique em **Analisar alinhamento**.
5. Revise o diagnóstico e as recomendações.
6. Na aba **Currículo alinhado**, ajuste textos, reative ou remova itens e baixe em **PDF** ou **DOCX**.

## Como funciona

1. O `.docx` é convertido em texto estruturado no navegador (nada é enviado ao servidor além do texto extraído).
2. `POST /api/analyze` faz quatro chamadas ao Gemini:
   - extração estruturada do currículo mestre;
   - extração dos requisitos da vaga;
   - análise de alinhamento (requisitos, lacunas, palavras-chave e recomendações);
   - adaptação do currículo em uma chamada separada, com limites calculados pelo nível da vaga.
3. Parte do score é calculada no código, não pelo modelo:

   | Categoria | Peso | Cálculo |
   | --- | --- | --- |
   | Tecnologias e ferramentas | 40% | requisitos `skill` ponderados por prioridade e status |
   | Experiências e atividades | 25% | nota do modelo |
   | Senioridade | 15% | tempo de experiência extraído das datas vs. nível da vaga |
   | Formação e idiomas | 10% | nota do modelo |
   | Palavras-chave | 10% | termos encontrados / (encontrados + ausentes), conferidos no currículo |

   Requisitos obrigatórios ausentes aplicam um teto ao score final (69 com 1 ausência, 54 com 2 ou mais).

4. As respostas usam JSON Schema + validação Zod. Antes de exibir o resultado, uma camada de fidelidade verifica no código se evidências são trechos literais do mestre, se empresas/cargos/datas/formações/idiomas foram preservados e se tecnologias não foram movidas entre itens. Se houver violação, uma chamada curta de reparo tenta corrigir; se ainda falhar, o item original do mestre é restaurado.
5. Se o modelo principal estiver indisponível (erro 503/429), a análise tenta automaticamente os modelos de fallback.
6. Os dados ficam no `localStorage` do navegador. Não há banco de dados.

## Privacidade

- O arquivo `.docx` é processado localmente no navegador.
- Apenas o texto extraído é enviado à API do Gemini para a análise.
- Resultados e textos ficam salvos somente no seu navegador.
- A chave da API nunca é exposta ao cliente.

## Stack

- Next.js 16 (App Router) + React 19 + TypeScript
- Tailwind CSS 4
- Google Gemini (`@google/genai`)
- Zod para validação
- `mammoth` para leitura de DOCX e `docx` para geração de DOCX
- `@react-pdf/renderer` para geração de PDF
- `lucide-react` para ícones

## Estrutura

```
src/
  app/
    page.tsx               # upload do currículo + descrição da vaga
    resultado/page.tsx     # diagnóstico, editor e exportação
    api/analyze/route.ts   # análise server-side com Gemini
  components/
    AnalyzeForm.tsx        # formulário principal
    ResumeUpload.tsx       # drag & drop e revisão do texto extraído
    result/                # score, requisitos, recomendações, editor, PDF
  lib/
    alignment.ts           # orquestra extração, análise, adaptação e reparo
    prompts.ts             # prompts em português/inglês
    schemas.ts             # schemas Zod e JSON Schema
    scoring.ts             # pesos, score de requisitos, teto de obrigatórios
    seniority.ts           # parsing de datas e score de senioridade
    text.ts                # normalização, aliases e análise de keywords
    fidelity.ts            # validação e restauração de fidelidade ao mestre
    limits.ts              # limites de conteúdo por nível da vaga
    tailoring.ts           # montagem do resultado final
    docx-parser.ts         # leitura do DOCX no navegador
    export-docx.ts         # geração de DOCX
    export-pdf.tsx         # geração de PDF
    storage.ts             # persistência local
  types/
    analysis.ts            # tipos do domínio
```

## Scripts

```bash
npm run dev        # desenvolvimento
npm run build      # build de produção
npm run start      # servidor de produção
npm run lint       # ESLint
npm run typecheck  # checagem de tipos
```

## Limitações

- Apenas `.docx` é aceito (`.doc` antigo não é suportado).
- Currículos com layouts muito complexos (tabelas, múltiplas colunas) podem perder estrutura na leitura; o texto extraído é editável antes da análise.
- A IA pode errar. A validação de fidelidade reduz o risco e restaura dados do mestre, mas revise sempre o currículo antes de enviar a um recrutador.
- O free tier do Gemini tem limites de requisições por minuto/dia.
- Os limites de score (75/45) ainda não foram calibrados com um conjunto grande de vagas; ajuste em `src/lib/scoring.ts` se necessário.

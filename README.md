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
3. Clique em **Analisar alinhamento**.
4. Revise o diagnóstico e as recomendações.
5. Na aba **Currículo alinhado**, ajuste textos, reative ou remova itens e baixe em **PDF** ou **DOCX**.

## Como funciona

1. O `.docx` é convertido em texto estruturado no navegador (nada é enviado ao servidor além do texto extraído).
2. `POST /api/analyze` faz três chamadas ao Gemini:
   - extração estruturada do currículo mestre;
   - extração dos requisitos da vaga;
   - análise de alinhamento + geração do currículo adaptado.
3. O score é calculado no código com pesos fixos e transparentes:

   | Categoria | Peso |
   | --- | --- |
   | Tecnologias e ferramentas | 40% |
   | Experiências e atividades | 25% |
   | Senioridade | 15% |
   | Formação e idiomas | 10% |
   | Palavras-chave | 10% |

4. As respostas usam JSON Schema + validação Zod, com nova tentativa automática em caso de formato inválido.
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
    alignment.ts           # orquestra extração e análise
    prompts.ts             # prompts em português
    schemas.ts             # schemas Zod e JSON Schema
    scoring.ts             # cálculo do score
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
- A IA pode errar. Revise sempre o currículo antes de enviar a um recrutador.
- O free tier do Gemini tem limites de requisições por minuto/dia.

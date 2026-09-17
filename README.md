# ATS Matcher

Crie o web app ATS Match — Otimizador de Currículo para ATS.

Requisitos desta primeira versão:
- Sem autenticação e sem planos de assinatura; fluxo direto e aberto.
- Entrada de dados: duas áreas de texto para colagem direta (uma para o texto do Currículo e outra para a Descrição da Vaga), com exemplos pré-carregados para teste rápido (ex: Desenvolvedor Front-end / Product Designer).
- Análise local/interativa calculando:
  - Pontuação ATS Match (Score geral de 0 a 100%).
  - Palavras-chave encontradas vs. faltantes (skills técnicas, ferramentas, soft skills).
  - Verificação de estrutura do currículo (seções detectadas como Experiência, Educação, Habilidades, Contato).
  - Recomendações práticas e sugestões de reescrita para aumentar a pontuação.
- Interface moderna, limpa, responsiva, com visual profissional e dashboards claros de pontuação e tags.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/24da890c-65ae-42ec-b149-67670e0e1269).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

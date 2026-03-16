---
title: Dług Technologiczny
description: 
order: 2
---


***

# Raport: Dług Technologiczny w Erze AI-Assisted Development

Oto kompleksowy raport o długu technologicznym, który prędzej czy później da o sobie znać. Kierowany do osoby sterującej AI (Claude Code, Gemini CLI) z wiedzą architektoniczną, ale bez umiejętności kodowania.

## Profil osoby — kontekst

Tzw. **"vibe coder"** – osoba, która rozumie architekturę, umie definiować wymagania i sterować AI, ale nie czyta ani nie weryfikuje kodu na poziomie implementacji. To nowe zjawisko demokratyzuje tworzenie oprogramowania, ale generuje specyficzny, często **niewidoczny** dług technologiczny.[^1][^2]

***

## 🔴 Krytyczny dług — ryzyko natychmiastowe

### 1. Bezpieczeństwo (Security Debt)

Największa pułapka. AI generuje kod *działający*, nie *bezpieczny*.[^1]

- **Hardcoded secrets** – API keys, hasła w kodzie zamiast w zmiennych środowiskowych
- **Brak sanityzacji inputów** – podatność na SQL Injection, XSS, Path Traversal
- **Niebezpieczne zależności (dependencies)** – AI dobiera biblioteki bez sprawdzania CVE (znanych podatności)
- **Brak autoryzacji/autentykacji** na endpointach API – AI często pomija to, gdy prompt nie mówi wprost
- **Exposed error messages** – stack trace widoczny dla użytkownika końcowego

> ⚠️ Nie wiesz, że problem istnieje — do czasu incydentu.

### 2. Czarna skrzynka — nierozumiany kod

Jeśli nie możesz czytać kodu, nie możesz go debugować, modyfikować ani przekazać innemu deweloperowi.[^2]

- Każda zmiana = nowy prompt = ryzyko zepsucia czegoś innego
- Brak możliwości stwierdzenia, czy AI zrobiła to, o co prosiłeś
- Tzw. **"hallucination debt"** – AI wymyśla API/metody, które nie istnieją lub działają inaczej niż zakłada

***

## 🟠 Wysoki dług — rośnie z czasem

### 3. Brak testów (Testing Debt)

AI rzadko generuje testy bez wyraźnego polecenia.[^3]

- Brak unit testów → nie wiesz, czy refactor zepsuł logikę biznesową
- Brak testów integracyjnych → nie wiesz, czy komponenty współpracują poprawnie
- Brak testów regresji → każda nowa funkcja to ryzyko dla starych


### 4. Architektura spaghetti mimo wiedzy architektonicznej

Znasz wzorce, ale AI i tak je łamie, jeśli kontekst jest zbyt ogólny.[^2]

- **Coupling (silne powiązania)** – moduły nie są niezależne, zmiana jednego psuje inne
- **God objects** – AI tworzy klasy/moduły robiące za dużo, zamiast stosować SRP (Single Responsibility)
- **Inconsistent patterns** – różne fragmenty kodu robią to samo w różny sposób (AI nie pamięta poprzednich sesji)
- **Brak warstwowości** – logika biznesowa miesza się z warstwą prezentacji i bazą danych


### 5. Zależności (Dependency Debt)

- Nadmiar bibliotek – AI dobiera wiele paczek tam, gdzie wystarczyłaby jedna
- Nieaktualne wersje – AI ma datę graniczną wiedzy, instaluje stare wersje
- **Brak `lockfile` (package-lock.json, poetry.lock)** – projekt nie jest deterministyczny
- Porzucone lub słabo utrzymywane biblioteki

***

## 🟡 Średni dług — utrudnia rozwój

### 6. Dokumentacja (Documentation Debt)

- Brak komentarzy wyjaśniających *dlaczego* (AI pisze *co*, ale nie *dlaczego*)
- Nieaktualne README – AI generuje dokumentację na żądanie, ale nie aktualizuje po zmianach
- Brak ADR (Architecture Decision Records) – za rok nie będziesz wiedzieć, dlaczego architektura wygląda tak jak wygląda


### 7. Observability Debt (Monitoring i Logowanie)

- Brak structured logging (logi nieczytelne dla narzędzi jak Datadog, Grafana)
- Brak error tracking (Sentry, Rollbar)
- Brak metryk performance – nie wiesz, co zwalnia aplikację
- Brak health checków


### 8. Dług wydajnościowy (Performance Debt)

- **N+1 queries** – AI generuje pętle z zapytaniami do bazy zamiast jednego JOINa
- Brak paginacji – endpoint zwraca 100k rekordów zamiast stronicowania
- Brak cachowania – każde zapytanie uderza w bazę danych od zera
- Nieoptymalne indeksy bazy danych


### 9. Vendor Lock-in

- Uzależnienie od konkretnego API (OpenAI, Stripe, Firebase) bez warstwy abstrakcji
- Zmiana dostawcy = przepisanie dużej części kodu
- AI naturalnie preferuje popularne, drogie rozwiązania SaaS zamiast self-hosted

***

## 🔵 Operacyjny dług — widoczny dopiero przy skalowaniu

### 10. Git i wersjonowanie

- Commity "fix", "update", "test" bez znaczących opisów
- Brak branch strategy (wszystko na `main`)
- Brak konwencji commitów (np. Conventional Commits) – niemożliwy automatyczny changelog
- Brak `.gitignore` → secrets w repozytorium


### 11. Środowiska i DevOps

- Brak separacji środowisk (dev/staging/prod)
- Brak CI/CD – deploy = kopiowanie plików
- Brak zarządzania konfiguracją przez zmienne środowiskowe


### 12. Spójność kontekstu między sesjami

Claude Code i Gemini CLI tracą kontekst po skończeniu sesji.[^4]

- Każda nowa sesja = AI nie zna historii decyzji
- Kod generowany w różnych sesjach może być niespójny stylistycznie i architektonicznie
- **MEMORY.md / CLAUDE.md / GEMINI.md** – pliki kontekstowe, których brak to poważny dług

***

## ✅ Jak minimalizować dług — lista priorytetów

| Priorytet | Działanie | Narzędzie/Technika |
| :-- | :-- | :-- |
| 🔴 Krytyczny | Security audit każdego projektu | Prompt AI o OWASP Top 10 review |
| 🔴 Krytyczny | Nigdy nie commituj bez `.env` i `.gitignore` | GitHub secret scanning |
| 🟠 Wysoki | Plik `ARCHITECTURE.md` + `MEMORY.md` w każdym repo | Claude Projects / Gemini context |
| 🟠 Wysoki | Żądaj testów przy każdym prompcie | "Write tests first (TDD)" w prompcie |
| 🟡 Średni | Regularne audyty zależności | `npm audit`, `pip-audit` |
| 🟡 Średni | Structured logging od startu | Winston, Pino, structlog |
| 🔵 Operacyjny | Konwencje gitowe od dnia pierwszego | Conventional Commits spec |
| 🔵 Operacyjny | Separacja środowisk od startu | `.env.development`, `.env.production` |

***
## Kluczowy wniosek

Paradoks polega na tym, że AI przyspiesza development, ale dług technologiczny rośnie **niewidocznie** – bo nie ma osoby, która go zauważy w kodzie. 
Osoba sterująca AI musi kompensować brak umiejętności kodowania **znakomitymi promptami architektonicznymi** i regularnym zlecaniem AI **audytów własnego kodu** – 
podejście: *"Gemini jako senior architect / project manager, 
Claude jako coder"* jest tu dobrą praktyką.
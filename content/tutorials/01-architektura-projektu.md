---
title: Architektura projektu od zera
description: 
order: 1
---


# Poradnik: Architektura projektu od zera — unikaj długu technicznego

> Dla: projekty Python/FastAPI/AI, solo developer lub mały team
> Cel: nie refaktoryzować struktury po 3 tygodniach intensywnego budowania

---

## Problem który chcesz uniknąć

Budujesz iteracyjnie (dobrze), ale każda sesja dopisuje do istniejących plików (źle).
Po 15 sesjach masz:
- `api.py` z 1200 liniami i 6 domenami w jednym pliku
- `dashboard.js` który "wie" o wszystkim
- dokumentację która opisuje stan sprzed 2 tygodni
- refaktor struktury jako osobny projekt zajmujący tyle samo czasu co budowanie

---

## Zasada #1 — Zaprojektuj architekturę ZANIM napiszesz pierwszą linię kodu

Narysuj warstwy na kartce. Dosłownie. 5 minut.

```
presentation/   ← HTTP, SSE, HTML, routing — TYLKO wejście/wyjście
application/    ← orchestracja, pipeline, use cases — TYLKO logika przepływu
domain/         ← modele, reguły biznesowe — zero zewnętrznych zależności
infrastructure/ ← bazy danych, API zewnętrzne, pliki — TYLKO I/O
config/         ← settings, stałe — zero logiki
```

Reguła zależności (nigdy nie łam):
```
presentation → application → domain
infrastructure → domain
presentation NIE importuje z infrastructure bezpośrednio
```

Jeśli nie wiesz gdzie coś należy → zawsze idź głębiej (domain > infrastructure > application).

---

## Zasada #2 — Struktura plików od Sesji 0, nie od Sesji 17

Stwórz wszystkie katalogi z `__init__.py` zanim napiszesz pierwszy agent.
Pusty katalog nic nie kosztuje. Refaktor kosztuje.

```
projekt/
├── app/
│   ├── presentation/
│   │   ├── __init__.py
│   │   ├── api.py          ← tylko FastAPI() init + include_router()
│   │   ├── routers/        ← jeden plik per domena (auth.py, pipeline.py...)
│   │   └── static/
│   ├── application/
│   │   ├── __init__.py
│   │   ├── orchestrator.py
│   │   └── agents/
│   ├── domain/
│   │   ├── __init__.py
│   │   ├── models.py       ← Pydantic models
│   │   ├── state.py        ← LangGraph state
│   │   └── events.py
│   ├── infrastructure/
│   │   ├── __init__.py
│   │   ├── db.py           ← SQLite/store
│   │   ├── notion.py
│   │   └── slack.py
│   └── config/
│       ├── settings.py
│       └── prompts/
├── tests/
│   ├── unit/               ← testy domain/ (zero I/O, najszybsze)
│   ├── integration/        ← testy application/ z mockami infrastructure
│   └── e2e/                ← testy presentation/ (pełny stack)
├── docs/
│   ├── ARCHITECTURE.md
│   ├── ADR.md              ← od razu, nie po fakcie
│   └── archive/
├── data/
├── logs/
└── output/
```

---

## Zasada #3 — Limit linii jako hard constraint

Ustaw w głowie (lub w CI) twarde limity:

| Typ pliku | Max linii | Co zrobić gdy przekroczysz |
|-----------|-----------|---------------------------|
| Router (`routers/*.py`) | 150 | Wydziel helper do `application/` |
| Agent (`agents/*.py`) | 200 | Wydziel prompt do `config/prompts/` |
| `api.py` (init) | 50 | Masz za dużo logiki w init |
| JS moduł | 300 | Wydziel osobny moduł |
| `settings.py` | 100 | Podziel na grupy (APISettings, DBSettings...) |

Gdy plik przekracza limit → STOP, wydziel zanim dodasz nową funkcję.

---

## Zasada #4 — Dokumentacja jako kod (aktualizuj w tej samej sesji)

Każda sesja = commit z kodem + commit z dokumentacją. Nie "dopiszę jutro".

### Struktura dokumentacji od Sesji 0:

```
CLAUDE.md           ← ≤80 linii, tylko WHY + mapa + zasady (nigdy historia)
TASKS.md            ← ≤150 linii, tylko otwarte taski + log sesji
CHANGELOG.md        ← semver, rośnie normalnie, to jedyne miejsce na historię
docs/
├── ARCHITECTURE.md ← diagramy C4 + sequence (aktualizuj przy zmianie grafu)
├── ADR.md          ← każda nieoczywista decyzja = ADR, pisz w momencie decyzji
└── archive/        ← stare wersje, nigdy nie kasuj
```

### Freshness header w każdym pliku Warstwy 1:
```
<!-- FRESHNESS: 2026-03-13 | next review: po Sesji X | scope: co tu jest -->
```

### Kiedy pisać ADR:
- Wybrałeś technologię (SQLite zamiast Redis) → ADR
- Zrezygnowałeś z zewnętrznej biblioteki (Chainlit → SSE) → ADR
- Zdefiniowałeś granicę między warstwami → ADR
- Odrzuciłeś pomysł który będziesz rozważać znowu → ADR

---

## Zasada #5 — Rozmiar sesji = rozmiar zmiany

| Sesja robi | Ryzyko | Zasada |
|-----------|--------|--------|
| 1 nowy agent | niskie | OK |
| 1 nowy endpoint + testy | niskie | OK |
| nowy agent + nowy endpoint + dashboard | wysokie | podziel na 3 sesje |
| refaktor + nowa funkcja | bardzo wysokie | NIGDY razem |

**Stop condition do CLAUDE.md od Sesji 0:**
```
- Sesja > 5 plików → podziel
- Zmiana grafu LangGraph → najpierw zaktualizuj ARCHITECTURE.md
- Nowy agent → najpierw szkic w docs/features/{agent}_FSD.md
- Refaktor → osobna sesja, zero nowych funkcji
```

---

## Zasada #6 — Testy jako architektura

Struktura testów wymusza dobrą architekturę. Jeśli test `unit/` wymaga mocka bazy danych
→ twój domain/ ma zależność od infrastructure/ — błąd architektoniczny.

```python
# ŹLE — domain zależy od infrastructure
# tests/unit/test_state.py
from app.infrastructure.db import BatchStore  # nie powinno tu być

# DOBRZE — domain jest czysty
# tests/unit/test_state.py
from app.domain.state import ProductState  # zero zewnętrznych deps
state = ProductState(product_id="x", ...)
assert state["pipeline_status"] == "pending"
```

Reguła: `tests/unit/` nie może importować z `infrastructure/`. Jeśli importuje → przenieś kod.

---

## Zasada #7 — Frontend modularny od początku

Nie pisz jednego `dashboard.js`. Od Sesji 0:

```
static/
├── js/
│   ├── api.js          ← fetchJson(), SSE helper, auth — zero DOM
│   ├── {widok}.js      ← jeden plik per widok dashboardu
│   └── dashboard.js    ← tylko init + router widoków (≤100 linii)
└── dashboard.html      ← <script type="module" src="js/dashboard.js">
```

`type="module"` daje ci izolację scope i lazy loading za darmo.

---

## Checklist — Sesja 0 każdego projektu

```
□ Narysuj warstwy (presentation/application/domain/infrastructure)
□ Stwórz strukturę katalogów z __init__.py (wszystkie, nawet puste)
□ Napisz CLAUDE.md (WHY + mapa + 5 zasad) — ≤80 linii
□ Napisz TASKS.md z Fazą 0 i Fazą 1
□ Stwórz docs/ADR.md (pusty, gotowy na pierwszą decyzję)
□ Stwórz docs/ARCHITECTURE.md z pustym diagramem C4
□ Dodaj limity linii jako komentarz w CLAUDE.md
□ Skonfiguruj ruff + mypy + pytest w pyproject.toml
□ Napisz pierwszy test (nawet trywialny) — zanim pierwszy agent
□ Git init + .gitignore + .env.example + pierwszy commit
```

---

## TL;DR

| Rób od Sesji 0 | Nie rób nigdy |
|----------------|---------------|
| Warstwy w strukturze katalogów | Jeden plik na wszystko |
| Limity linii per plik | "Dopiszę refaktor później" |
| ADR przy każdej decyzji | Historia decyzji w CLAUDE.md |
| Testy jednostkowe bez I/O | Unit testy z prawdziwą bazą |
| 1 sesja = 1 outcome | Refaktor + nowa funkcja razem |
| `type="module"` w JS od razu | Jeden monolityczny dashboard.js |

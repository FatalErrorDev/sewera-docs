---
title: Claude-code-best-practice
description: Make claude-code great again.
order: 6
---





# Analiza repo `shanraisshan/claude-code-best-practice` → Plan implementacji

> Data: 2026-04-13

---

## 1. Co zawiera repo — first principles

Repo to **wzorcowa implementacja infrastruktury Claude Code**, nie aplikacja. Pokazuje jak
zorganizować folder `.claude/` żeby Claude Code działał jak orkiestra agentów zamiast
jak jeden chatbot.

### Pięć warstw architektury

```
.claude/
├── settings.json       ← WARSTWA 0: Uprawnienia i konfiguracja globalna projektu
├── rules/              ← WARSTWA 1: Standardy kodowania per glob (zastępuje część CLAUDE.md)
├── commands/           ← WARSTWA 2: Slash-komendy — entry points do przepływów
├── agents/             ← WARSTWA 3: Wyspecjalizowani subagenci z własnymi narzędziami
├── skills/             ← WARSTWA 4: Wielorazowe zestawy instrukcji
├── hooks/              ← WARSTWA 5: Automatyczne triggery na zdarzenia narzędzi
└── agent-memory/       ← WARSTWA 6: Pamięć persystentna per agent
```

### Dwa wzorce uruchamiania skills

| Wzorzec | Jak działa | Kiedy |
|---------|-----------|-------|
| **Agent Skill** | Agent ma `skills:` w YAML → skill preloadowany | Agent zawsze potrzebuje tej wiedzy |
| **Skill Tool** | Główny agent wywołuje `Skill` tool on-demand | Skill jest opcjonalny, zależny od kontekstu |

### Architektura przepływu (wzorzec Command → Agent → Skill)

```
Użytkownik wpisuje /komenda
        ↓
commands/komenda.md  (entry point, model: haiku lub sonnet)
        ↓
Task tool → agents/specjalista.md  (wyspecjalizowany agent, własny model/narzędzia/memory)
        ↓
Skill tool / preloaded skills  (reusable instructions)
        ↓
Output do pliku / raport do użytkownika
```

---

## 2. Mapping do twojego setupu

### Co już masz (ekwiwalenty z repo)

| Repo pattern | Twój odpowiednik | Gap |
|---|---|---|
| `CLAUDE.md` | `CLAUDE.md` ✅ | Twój jest dłuższy (150 linii), repo ma bardziej strukturalny |
| `skills/` (globalne) | `~/.claude/skills/wrapup`, `bugfind` ✅ | Brakuje skills per-projekt |
| `commands/` | Opisowe prompty w TASKS.md | ❌ Brak slash-komend |
| `agents/` | Plugin `superpowers` subagents | ❌ Brak własnych, konfigurowalnych agentów |
| `rules/` | Fragment CLAUDE.md | ❌ Brak glob-based rules |
| `hooks/` | Brak | ❌ Całkowicie brakuje |
| `settings.json` (projekt) | Globalny `~/.claude/settings.json` | ⚠️ Brak per-projekt konfiguracji |
| `agent-memory/` | Brak | ❌ Całkowicie brakuje |

### Ocena luk (priorytet implementacji)

```
🔴 KRYTYCZNE (duży gain, mały koszt):
   - Custom slash commands (.claude/commands/)
   - Project-level rules (.claude/rules/)
   - Project-level settings.json

🟠 WYSOKIE (duży gain, średni koszt):
   - Custom subagents (.claude/agents/)
   - Project-level skills (.claude/skills/)

🟡 ŚREDNIE (średni gain, większy koszt):
   - Hooks (.claude/hooks/)
   - Agent memory (.claude/agent-memory/)
```

---

## 3. Plan implementacji — 4 fazy

### FAZA 1 — Fundament (ok. 1h, zrób to teraz)

Stwórz strukturę `.claude/` w **każdym nowym projekcie** i w globalnym template.

**Krok 1.1 — Szablon struktury (zrób raz, kopiuj zawsze)**

```powershell
# W każdym nowym projekcie — uruchom z głównego katalogu
New-Item -ItemType Directory -Force .claude/commands/workflows
New-Item -ItemType Directory -Force .claude/agents
New-Item -ItemType Directory -Force .claude/rules
New-Item -ItemType Directory -Force .claude/skills
New-Item -ItemType Directory -Force .claude/hooks/scripts
New-Item -ItemType Directory -Force .claude/agent-memory
```

**Krok 1.2 — settings.json per projekt**

Utwórz `.claude/settings.json` — bardziej restrykcyjny niż globalny, per projekt:

```json
{
  "permissions": {
    "allow": [
      "Edit(*)",
      "Write(*)",
      "Bash(make *)",
      "Bash(uv *)",
      "Bash(python *)",
      "Bash(git *)",
      "Bash(ruff *)",
      "Bash(mypy *)",
      "Bash(pytest *)"
    ],
    "deny": [
      "Bash(rm -rf *)",
      "Bash(curl * | bash *)"
    ]
  }
}
```

> **Dlaczego to ważne**: Globalny settings ma wildcards — projekt-level może być bardziej
> restrykcyjny. To warstwa bezpieczeństwa, nie konfiguracji.

**Krok 1.3 — rules/ zamiast fragmentów w CLAUDE.md**

Utwórz `.claude/rules/python-standards.md`:

```markdown
# Glob: **/*.py

## Standardy Python (projekt X)
- Type hints obowiązkowe na wszystkich funkcjach publicznych
- Docstring na każdej funkcji powyżej 5 linii
- `logging` zamiast `print`
- Parameterized queries — nigdy string interpolation w SQL
- NIE importuj z `infrastructure/` w plikach `domain/`
```

Utwórz `.claude/rules/docs-standards.md`:

```markdown
# Glob: **/*.md

## Standardy dokumentacji
- FRESHNESS header w każdym pliku Warstwy 1
- ADR przy każdej nieoczywistej decyzji architektonicznej
- Maksymalnie 150 linii w CLAUDE.md — reszta do docs/
- NIE opisuj historii w CLAUDE.md — od tego jest CHANGELOG.md
```

> **Dlaczego rules/ zamiast CLAUDE.md**: Rules są glob-based — Claude Code ładuje je
> tylko gdy pracuje z pasującymi plikami. CLAUDE.md jest zawsze w kontekście.
> To redukuje zużycie okna kontekstu.

---

### FAZA 2 — Slash komendy (ok. 2h)

Slash komendy to najszybszy win — zamiast wklejać długie prompty, wpisujesz `/komenda`.

**Krok 2.1 — Mapa twoich komend do plików**

```
.claude/commands/
├── wrapup.md              ← zastąp skill ~/wrapup lub uzupełnij
├── bugfind.md             ← zastąp skill ~/bugfind lub uzupełnij
├── feature.md             ← zastąpi opis słowny → feature-dev plugin
├── review.md              ← code-review przed merge
├── security-audit.md      ← security-guidance workflow
└── workflows/
    ├── session-start.md   ← reality check + context load
    └── new-project.md     ← Sesja 0 checklist
```

**Krok 2.2 — Przykład: `/session-start`**

Utwórz `.claude/commands/workflows/session-start.md`:

```markdown
---
description: Inicjalizacja sesji — reality check, context load, cel sesji
model: haiku
---

# Session Start

## Krok 1: Reality Check

Sprawdź stan projektu:
- Uruchom `git status` i `git branch --show-current`
- Sprawdź czy TASKS.md istnieje i jakie taski są PENDING
- Sprawdź datę ostatniej modyfikacji CLAUDE.md

## Krok 2: Context Load

Przeczytaj w kolejności:
1. CLAUDE.md (mapa projektu + zasady)
2. TASKS.md (aktywne taski)
3. docs/ADR.md (ostatnie 3 decyzje)

## Krok 3: Cel sesji

Zapytaj użytkownika: "Co ma być gotowe na końcu tej sesji? (1 zdanie)"

Zapisz cel na początku aktualnego logu w TASKS.md.

## Krok 4: Stop conditions

Przypomnij użytkownikowi:
- Sesja > 5 plików → STOP, podziel
- Refaktor + nowa funkcja → NIGDY razem
```

**Krok 2.3 — Przykład: `/feature`**

Utwórz `.claude/commands/feature.md`:

```markdown
---
description: Zaplanuj i zaimplementuj nowy feature — 7-fazowy workflow
model: sonnet
---

# Feature Development

Użytkownik opisuje feature słowami. Twoim zadaniem jest:

## Faza 1: Analiza

Zanim napiszesz kod, odpowiedz na pytania:
- Co to feature rozwiązuje? (problem, nie rozwiązanie)
- Jakie pliki będą zmienione? (max 5)
- Jakie są kryteria akceptacji? (testowalne)

## Faza 2: Feature Scoping Document

Stwórz `docs/features/{FEATURE_NAME}.md` z szablonem FSD:
- Motivation (DLACZEGO)
- Scope IN (pliki + numery linii)
- Scope OUT (czego NIE ruszamy)
- Plan implementacji (3-5 kroków)
- Kryteria akceptacji (testowalne)
- Token budget

## Faza 3: Implementacja

Implementuj krok po kroku. Po każdym pliku:
- Uruchom `make test` lub `pytest tests/test_{modul}.py`
- Jeśli PASS → commit
- Jeśli FAIL → fix, re-test

## Stop conditions

- Scope IN > 5 plików → podziel na sub-features, wróć do Fazy 1
- > 80k tokenów → STOP, opisz stan w TASKS.md
- Zmiana poza Scope IN → STOP, zapytaj użytkownika
```

---

### FAZA 3 — Subagenci (ok. 3h, per projekt)

Subagenci to wyspecjalizowane instancje Claude z własnym modelem, narzędziami i pamięcią.
Dla twojego setupu najważniejsi agenci:

**Krok 3.1 — Wzorzec agenta (YAML frontmatter)**

```yaml
---
name: nazwa-agenta
description: Kiedy uruchomić — używaj czasowników "kiedy X, użyj tego agenta"
allowedTools:
  - "Bash(pytest *)"
  - "Bash(ruff *)"
  - "Read"
  - "Write"
  - "Edit"
model: sonnet          # haiku dla prostych, sonnet dla złożonych
color: blue            # wizualna identyfikacja w UI
maxTurns: 10
permissionMode: acceptEdits
memory: project        # lub "user" dla globalnej pamięci
skills:
  - nazwa-skilla       # preloaded skills
---
```

**Krok 3.2 — Agenci dla twojego setupu**

Utwórz `.claude/agents/security-auditor.md`:

```markdown
---
name: security-auditor
description: Użyj tego agenta gdy kończysz feature lub przed deploymentem — przeprowadza
  audyt OWASP Top 10 na wskazanych plikach
allowedTools:
  - "Read"
  - "Bash(ruff *)"
  - "Bash(bandit *)"
  - "Bash(grep *)"
model: sonnet
color: red
maxTurns: 15
permissionMode: default
---

# Security Auditor

Jesteś senior security engineer. Przeprowadzasz audyt wskazanych plików.

## Checklist OWASP Top 10 dla Python/FastAPI

1. **Injection** — czy wszystkie SQL query używają parameterized queries?
2. **Broken Auth** — czy endpointy mają autoryzację?
3. **Sensitive Data** — czy żadne sekrety nie są w kodzie (nie w .env)?
4. **Security Misconfiguration** — czy CORS, headers są skonfigurowane?
5. **Vulnerable Dependencies** — uruchom `bandit -r {katalog}` i zaraportuj

## Output

Zwróć listę findingów w formacie:
- KRYTYCZNE: [opis + plik + linia]
- WYSOKIE: [opis + plik + linia]
- ŚREDNIE: [opis]

NIE naprawiaj — tylko raportuj. Naprawa to osobna sesja.
```

Utwórz `.claude/agents/arch-reviewer.md`:

```markdown
---
name: arch-reviewer
description: Użyj gdy zmieniłeś > 3 pliki lub masz wątpliwości architektoniczne —
  sprawdza granice warstw i naruszenia zasad
allowedTools:
  - "Read"
  - "Bash(grep *)"
  - "Glob"
model: sonnet
color: purple
maxTurns: 10
permissionMode: default
---

# Architecture Reviewer

Jesteś senior architect. Sprawdzasz czy kod nie łamie zasad warstw.

## Zasady architektury (z docs/ARCHITECTURE.md projektu)

Zawsze przeczytaj docs/ARCHITECTURE.md przed audytem.

## Co sprawdzasz

1. **Zależności warstw** — czy presentation importuje z infrastructure bezpośrednio?
2. **Limity linii** — czy router > 150 linii? Agent > 200 linii?
3. **God objects** — czy plik robi za dużo?
4. **Inconsistent patterns** — czy różne miejsca robią to samo inaczej?

## Output

Lista naruszeń z plikiem i linią. Bez refaktoru — tylko diagnoza.
```

---

### FAZA 4 — Hooks (ok. 2h, zaawansowane)

Hooks to automatyczne triggery. Dla twojego setupu na Windows/PowerShell:

**Krok 4.1 — Najważniejszy hook: auto-lint po edycji**

Utwórz `.claude/hooks/scripts/post-edit.py`:

```python
#!/usr/bin/env python3
"""
PostToolUse hook — uruchamia ruff na zmienionym pliku Python
"""
import sys
import json
import subprocess
import os

def main():
    # Claude Code przekazuje dane przez stdin jako JSON
    data = json.loads(sys.stdin.read())
    
    tool_name = data.get("tool_name", "")
    tool_input = data.get("tool_input", {})
    
    # Tylko dla edycji plików Python
    if tool_name not in ("Write", "Edit", "MultiEdit"):
        return
    
    file_path = tool_input.get("path", "")
    if not file_path.endswith(".py"):
        return
    
    # Uruchom ruff na pliku
    result = subprocess.run(
        ["uv", "run", "ruff", "check", file_path, "--fix", "--quiet"],
        capture_output=True,
        text=True,
        cwd=os.environ.get("CLAUDE_PROJECT_DIR", ".")
    )
    
    if result.returncode != 0:
        # Hook może zwrócić błąd przez stdout
        print(f"RUFF FINDINGS in {file_path}:\n{result.stdout}")

if __name__ == "__main__":
    main()
```

**Krok 4.2 — Konfiguracja hooków w settings.json**

Dodaj do `.claude/settings.json`:

```json
{
  "permissions": { ... },
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit|MultiEdit",
        "hooks": [
          {
            "type": "command",
            "command": "python .claude/hooks/scripts/post-edit.py",
            "timeout": 10000
          }
        ]
      }
    ]
  }
}
```

> **UWAGA Windows**: Użyj `python` nie `python3`. Upewnij się że hook script ma
> absolutną ścieżkę lub używa `CLAUDE_PROJECT_DIR`.

---

## 4. Twój globalny template — `~/.claude/`

Na podstawie repo, zaktualizuj strukturę globalną:

```
~/.claude/
├── settings.json          ← Twój istniejący (wildcards) — zostaw
├── skills/
│   ├── wrapup/
│   │   └── SKILL.md       ← Twój istniejący skill — skonwertuj do formatu repo
│   └── bugfind/
│       └── SKILL.md       ← Twój istniejący skill — skonwertuj
└── commands/              ← NOWE — globalne komendy dostępne w każdym projekcie
    ├── session-start.md
    ├── security-audit.md
    └── new-project.md
```

### Format SKILL.md (wzorzec z repo)

```markdown
---
name: wrapup
description: Użyj po zakończeniu sesji — zamyka sesję, aktualizuje TASKS.md, tworzy
  commit, sprawdza czy dokumentacja jest aktualna
argument-hint: [opcjonalnie: opis co poszło dobrze/źle]
---

# Wrapup — Zamknięcie Sesji

[Twoje istniejące instrukcje wrapup przepisane tutaj]

## Kroki
1. Sprawdź git diff — jakie pliki zostały zmienione?
2. Zaktualizuj TASKS.md — oznacz zakończone taski, dodaj log sesji
3. Sprawdź czy CHANGELOG.md wymaga wpisu
4. Sprawdź czy CLAUDE.md wymaga aktualizacji
5. Uruchom: `make regression` (jeśli istnieje)
6. Stwórz commit: `git add . && git commit -m "..."`

## Stop conditions
- Nieudane testy → NIE commituj, opisz stan w TASKS.md
- > 5 zmienionych plików poza scopem sesji → zapytaj użytkownika
```

---

## 5. Kolejność implementacji — priorytety

### Tydzień 1 — Fundament (niskie ryzyko, duży gain)

```
Dzień 1 (30 min):
□ Stwórz template struktury .claude/ (PowerShell skrypt)
□ Dodaj .claude/settings.json do każdego aktywnego projektu
□ Dodaj .claude/rules/python-standards.md

Dzień 2 (1h):
□ Stwórz /session-start command
□ Stwórz /feature command (uproszczony feature-dev)
□ Stwórz /wrapup command (przeniesienie ze skilla)

Dzień 3 (30 min):
□ Przetestuj komendy na jednym projekcie
□ Iteruj na podstawie doświadczenia
```

### Tydzień 2 — Agenci

```
□ Stwórz security-auditor agent
□ Stwórz arch-reviewer agent
□ Dodaj do workflow: po każdym feature → /security-audit
```

### Tydzień 3 — Hooks (opcjonalne, zaawansowane)

```
□ Post-edit lint hook (ruff auto-fix)
□ Przetestuj na jednym projekcie 3 dni przed rozszerzeniem
```

---

## 6. Czego NIE brać z repo

| Element | Powód pominięcia |
|---------|-----------------|
| Weather example workflow | Demo, nie produkcja |
| Agent memory (agent-memory/) | Zaawansowane, zacznij bez |
| Hooks z audio/sounds | Specyfika macOS, nie Windows |
| `.codex/` folder | Dla OpenAI Codex, nie Claude |
| `agent-memory/weather-agent/` | Per-demo, nie per-projekt |

---

## 7. Kryteria akceptacji wdrożenia

```
□ Każdy nowy projekt ma .claude/ z: settings.json, rules/, commands/
□ /session-start działa i ładuje kontekst projektu w < 2 min
□ /feature zastępuje ręczne FSD dla prostych tasków
□ /wrapup działa bez wklejania instrukcji
□ security-auditor agent uruchamia się przed każdym merge
□ Ruff nie zgłasza błędów po żadnej sesji kodowania
□ CLAUDE.md każdego projektu ma ≤ 150 linii (reszta w rules/)
```

---

## TL;DR — 3 zmiany o największym impakcie

1. **`.claude/commands/session-start.md`** — eliminuje "dryfowanie kontekstu" na starcie
   każdej sesji. Zamiast wklejać kontekst, wpisujesz `/session-start`.

2. **`.claude/rules/`** — przenosi standardy kodowania z CLAUDE.md do glob-based rules.
   Lżejszy kontekst + automatyczne stosowanie do właściwych plików.

3. **`.claude/agents/security-auditor.md`** — wyspecjalizowany agent z własnymi
   narzędziami zamiast ogólnego Superpowers. Mniejsze ryzyko hallucynacji w
   specjalistycznym zadaniu.

---
title: "Budowanie agentów z Claude"
description: "Jak projektować i implementować systemy agentowe — od prostych pętli narzędziowych po wieloagentowe pipeline'y"
order: 18
---

# Budowanie agentów z Claude

Standardowe wywołanie API to wymiana: prompt → odpowiedź. Agent to coś więcej — system, który **samodzielnie planuje**, **podejmuje decyzje**, **wywołuje narzędzia** i **iteruje**, aż osiągnie cel. Zamiast jednego kroku jest pętla: obserwuj → planuj → działaj → obserwuj wynik → działaj dalej. Ten poradnik pokazuje, jak takie systemy budować z Claude'em.

---

## Czym jest agent?

Agent to program, który:

1. **Dostaje cel** — nie instrukcję krok po kroku, lecz zadanie do osiągnięcia
2. **Planuje** — samodzielnie decyduje, co zrobić i w jakiej kolejności
3. **Używa narzędzi** — wywołuje funkcje, API, przeglądarki, bazy danych
4. **Ocenia wyniki** — sprawdza, czy jest bliżej celu
5. **Iteruje** — powtarza kroki aż do zakończenia lub napotkania blokady

W praktyce agent to Claude w pętli z zestawem narzędzi i logiką, która decyduje kiedy pętla się kończy.

---

## Anatomia prostego agenta

Minimalny agent składa się z czterech elementów:

```
┌─────────────────────────────────────────────┐
│                  AGENT LOOP                 │
│                                             │
│  [1] System prompt z rolą i narzędziami     │
│           ↓                                 │
│  [2] Claude decyduje: tekst lub tool_use?   │
│           ↓                                 │
│  [3] Jeśli tool_use → wykonaj narzędzie     │
│           ↓                                 │
│  [4] Wynik wraca do Claude → wróć do [2]    │
│           ↓                                 │
│  [5] stop_reason == end_turn → koniec       │
└─────────────────────────────────────────────┘
```

Implementacja w Pythonie:

```python
import anthropic

client = anthropic.Anthropic()

# Definicje narzędzi
narzedzia = [
    {
        "name": "czytaj_plik",
        "description": "Odczytuje zawartość pliku tekstowego.",
        "input_schema": {
            "type": "object",
            "properties": {
                "sciezka": {"type": "string", "description": "Ścieżka do pliku"}
            },
            "required": ["sciezka"]
        }
    },
    {
        "name": "zapisz_plik",
        "description": "Zapisuje tekst do pliku.",
        "input_schema": {
            "type": "object",
            "properties": {
                "sciezka": {"type": "string"},
                "tresc": {"type": "string"}
            },
            "required": ["sciezka", "tresc"]
        }
    }
]

# Implementacje narzędzi
def czytaj_plik(sciezka: str) -> str:
    try:
        with open(sciezka, "r") as f:
            return f.read()
    except FileNotFoundError:
        return f"Błąd: plik {sciezka} nie istnieje"

def zapisz_plik(sciezka: str, tresc: str) -> str:
    with open(sciezka, "w") as f:
        f.write(tresc)
    return f"Plik {sciezka} zapisany pomyślnie"

def wykonaj_narzedzie(nazwa: str, parametry: dict) -> str:
    if nazwa == "czytaj_plik":
        return czytaj_plik(**parametry)
    elif nazwa == "zapisz_plik":
        return zapisz_plik(**parametry)
    return f"Nieznane narzędzie: {nazwa}"

# Pętla agenta
def uruchom_agenta(cel: str, max_iteracji: int = 10) -> str:
    wiadomosci = [{"role": "user", "content": cel}]

    for i in range(max_iteracji):
        odpowiedz = client.messages.create(
            model="claude-opus-4-6",  # Opus do agentów — lepsze planowanie
            max_tokens=4096,
            tools=narzedzia,
            messages=wiadomosci
        )

        # Dodaj odpowiedź do historii
        wiadomosci.append({"role": "assistant", "content": odpowiedz.content})

        # Koniec — Claude skończył
        if odpowiedz.stop_reason == "end_turn":
            tekst = next(
                (b.text for b in odpowiedz.content if hasattr(b, "text")),
                "Zadanie zakończone."
            )
            return tekst

        # Claude chce użyć narzędzia
        if odpowiedz.stop_reason == "tool_use":
            wyniki_narzedzi = []

            for blok in odpowiedz.content:
                if blok.type == "tool_use":
                    print(f"[Agent] Wywołuję: {blok.name}({blok.input})")
                    wynik = wykonaj_narzedzie(blok.name, blok.input)
                    print(f"[Agent] Wynik: {wynik[:100]}...")

                    wyniki_narzedzi.append({
                        "type": "tool_result",
                        "tool_use_id": blok.id,
                        "content": wynik
                    })

            wiadomosci.append({"role": "user", "content": wyniki_narzedzi})

    return "Przekroczono limit iteracji."

# Użycie
wynik = uruchom_agenta(
    "Przeczytaj plik dane.txt, popraw błędy ortograficzne i zapisz wynik do poprawione.txt"
)
print(wynik)
```

---

## System prompt dla agenta

System prompt agenta różni się od zwykłego — musi definiować nie tylko rolę, ale też **styl podejmowania decyzji** i **zasady bezpieczeństwa**:

```
Jesteś agentem analitycznym. Masz dostęp do narzędzi i możesz ich używać
wielokrotnie, żeby osiągnąć powierzony cel.

Zasady działania:
1. Przed działaniem zaplanuj kroki w myślach — nie działaj impulsywnie
2. Jeśli wynik narzędzia jest nieoczekiwany, zastanów się dlaczego zanim ruszysz dalej
3. Jeśli zadanie jest niejednoznaczne, zapytaj zamiast zgadywać
4. Jeśli napotkasz błąd, spróbuj alternatywnego podejścia (maksymalnie 2 razy)
5. Po zakończeniu podsumuj co zrobiłeś i jaki jest wynik

Czego NIE robisz:
- Nie usuwasz plików bez wyraźnego polecenia
- Nie wysyłasz danych na zewnętrzne serwery
- Nie wykonujesz działań nieodwracalnych bez potwierdzenia
```

---

## Wzorce projektowe agentów

### 1. ReAct — Reason + Act

Klasyczny wzorzec: agent na przemian rozumuje i działa. Wymuszamy go przez system prompt:

```
Przy każdym kroku postępuj według schematu:

Myśl: [co obserwujesz i co zamierzasz zrobić]
Działanie: [które narzędzie wywołujesz i dlaczego]
Obserwacja: [co zwróciło narzędzie]
... (powtarzaj aż do celu)
Wniosek: [końcowa odpowiedź]
```

ReAct poprawia jakość decyzji, bo Claude musi uzasadniać każdy krok — co znacząco redukuje błędy przy wieloetapowych zadaniach.

### 2. Plan-and-Execute

Agent najpierw tworzy plan, potem go wykonuje. Dobre przy złożonych zadaniach wieloetapowych:

```python
# Krok 1: Utwórz plan (bez narzędzi — tylko myślenie)
plan_odpowiedz = client.messages.create(
    model="claude-opus-4-6",
    max_tokens=1024,
    system="Jesteś planistą. Nie wykonuj żadnych działań — tylko stwórz szczegółowy plan.",
    messages=[{"role": "user", "content": f"Zaplanuj jak wykonać: {cel}"}]
)
plan = plan_odpowiedz.content[0].text

# Krok 2: Wykonaj plan krok po kroku
wykonaj_wedlug_planu(plan, narzedzia)
```

### 3. Reflection — samokrytyka przed finałem

Przed zwróceniem odpowiedzi agent ocenia własną pracę:

```python
def agent_z_refleksja(cel: str) -> str:
    wynik_wstepny = uruchom_agenta(cel)

    # Poproś Claude'a o ocenę własnego wyniku
    ocena = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=512,
        messages=[
            {"role": "user", "content": cel},
            {"role": "assistant", "content": wynik_wstepny},
            {"role": "user", "content":
             "Oceń swój wynik: czy w pełni odpowiada na pytanie? "
             "Czy czegoś brakuje? Jeśli tak — popraw. Jeśli jest dobry — potwierdź."}
        ]
    )
    return ocena.content[0].text
```

---

## Wieloagentowe systemy

Zamiast jednego agenta robiącego wszystko, można podzielić zadania między wyspecjalizowane agenty. Orkiestrator zarządza przepływem:

```python
def orkiestrator(zadanie: str) -> str:
    # Zdecyduj, który agent jest potrzebny
    decyzja = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=64,
        system="""Jesteś dyspozytorem. Na podstawie zadania wybierz właściwego agenta:
- 'analityk' — analiza danych i raportów
- 'pisarz' — tworzenie treści
- 'developer' — zadania z kodem
Odpowiedz tylko jednym słowem — nazwą agenta.""",
        messages=[{"role": "user", "content": zadanie}]
    )

    agent = decyzja.content[0].text.strip().lower()

    agenci = {
        "analityk": lambda z: uruchom_agenta(z, system=SYSTEM_ANALITYK, tools=TOOLS_ANALITYK),
        "pisarz":   lambda z: uruchom_agenta(z, system=SYSTEM_PISARZ,   tools=TOOLS_PISARZ),
        "developer":lambda z: uruchom_agenta(z, system=SYSTEM_DEV,      tools=TOOLS_DEV),
    }

    return agenci.get(agent, uruchom_agenta)(zadanie)
```

Wynik jednego agenta może być wejściem kolejnego — to tzw. pipeline agentowy, gdzie każdy etap transformuje dane do następnego.

---

## Kontrola i bezpieczeństwo

Agenty działające autonomicznie wymagają szczególnej uwagi:

**Limit iteracji — zawsze i bez wyjątków:**
```python
MAX_ITERACJI = 15

for i in range(MAX_ITERACJI):
    # logika agenta
    pass
else:
    return "Agent nie ukończył zadania w dopuszczonym czasie. Skontaktuj się z administratorem."
```

**Human-in-the-loop przy operacjach nieodwracalnych:**
```python
def narzedzie_usun_rekord(id_rekordu: str) -> str:
    # Zatrzymaj pętlę i zapytaj człowieka
    potwierdzenie = input(f"⚠️  Agent chce usunąć rekord {id_rekordu}. Potwierdzasz? (tak/nie): ")
    if potwierdzenie.strip().lower() != "tak":
        return "Operacja anulowana przez użytkownika."
    usun_z_bazy(id_rekordu)
    return f"Rekord {id_rekordu} usunięty."
```

**Logowanie wszystkich wywołań narzędzi:**
```python
import logging

logger = logging.getLogger("agent")

def wykonaj_narzedzie_z_logiem(nazwa: str, parametry: dict) -> str:
    logger.info(f"TOOL_CALL | narzedzie={nazwa} | parametry={parametry}")
    wynik = wykonaj_narzedzie(nazwa, parametry)
    logger.info(f"TOOL_RESULT | wynik={wynik[:200]}")
    return wynik
```

---

## Kiedy agent, kiedy zwykłe wywołanie?

| Zadanie | Podejście |
|---|---|
| Odpowiedź na pytanie | Zwykłe wywołanie |
| Analiza jednego dokumentu | Zwykłe wywołanie |
| Wieloetapowy research z weryfikacją | ✅ Agent |
| Automatyzacja procesu z decyzjami warunkowymi | ✅ Agent |
| Generowanie treści według szablonu | Zwykłe wywołanie |
| Kodowanie z testowaniem i iteracyjnymi poprawkami | ✅ Agent |
| Przetwarzanie wielu plików z logiką warunkową | ✅ Agent |

Agenty dodają złożoność — warto je stosować tylko tam, gdzie iteracyjne podejmowanie decyzji jest naprawdę potrzebne.

---

## Podsumowanie

Agent to Claude w pętli z narzędziami. Kluczowe elementy to: dobrze napisany system prompt definiujący rolę i zasady działania, zestaw narzędzi z precyzyjnymi opisami, pętla obsługująca `tool_use` i `end_turn`, limit iteracji oraz logowanie wszystkich działań. Dla złożonych zadań warto stosować wzorzec ReAct (rozumowanie przed działaniem) lub architekturę wieloagentową z orkiestratorem. Przy operacjach nieodwracalnych zawsze uwzględnij human-in-the-loop.

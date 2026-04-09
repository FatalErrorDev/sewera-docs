---
title: "Strukturyzowane wyjścia (Structured Outputs)"
description: "Jak wymusić na Claude'ie zwracanie poprawnego JSON zgodnego z określonym schematem — bez błędów parsowania i bez pisania retry logic"
order: 17
---

# Strukturyzowane wyjścia (Structured Outputs)

Każdy, kto kiedykolwiek prosił model językowy o zwrócenie JSON, zna ten problem: odpowiedź jest „prawie poprawna". Brakuje przecinka, pojawia się komentarz przed nawiasem, albo model dodaje `Oto twój JSON:` przed właściwą treścią. Efekt: `JSON.parse()` rzuca błąd, aplikacja się wysypuje, trzeba pisać retry logic. **Structured Outputs** eliminuje ten problem — API gwarantuje, że odpowiedź będzie zgodna z podanym schematem, bez wyjątków.

---

## Jak to działa technicznie?

Zamiast prosić model „odpowiedz w JSON", Structured Outputs kompiluje schemat JSON do gramatyki, która **ogranicza jakie tokeny model może generować**. Mechanizm nazywa się constrained decoding i działa na poziomie generowania — model fizycznie nie może wyprodukować tekstu, który nie pasuje do schematu.

Efekty:
- zero błędów parsowania — gwarantowane
- brak potrzeby retry logic przy błędnym formacie
- brak markdown wrapperów, komentarzy ani preambuł
- pełna zgodność typów z Pydantic (Python) i Zod (TypeScript)

---

## Dwa tryby Structured Outputs

### Tryb 1 — JSON Outputs

Używany do ekstrakcji danych, generowania raportów, przetwarzania dokumentów. Odpowiedź Claude'a to gwarantowany JSON pasujący do podanego schematu.

### Tryb 2 — Strict Tool Use

Używany gdy Claude wywołuje narzędzia — gwarantuje, że parametry narzędzia będą zgodne z jego definicją. Szczegóły w poradniku o Tool Use.

---

## JSON Outputs — podstawowy przykład

**Podejście z JSON Schema (surowe):**

```python
import anthropic
import json

client = anthropic.Anthropic()

schemat = {
    "type": "object",
    "properties": {
        "imie": {"type": "string"},
        "email": {"type": "string"},
        "temat": {"type": "string"},
        "priorytet": {
            "type": "string",
            "enum": ["niski", "sredni", "wysoki"]
        }
    },
    "required": ["imie", "email", "temat", "priorytet"],
    "additionalProperties": False
}

odpowiedz = client.messages.create(
    model="claude-sonnet-4-6",
    max_tokens=1024,
    messages=[
        {
            "role": "user",
            "content": """Wyciągnij dane z poniższego emaila:

Od: Jan Kowalski <[email protected]>
Temat: Pilne: problem z fakturą za marzec

Dzień dobry, mam pilny problem z fakturą VAT za marzec.
Kwota się nie zgadza i muszę to pilnie wyjaśnić przed końcem tygodnia."""
        }
    ],
    output_format={
        "type": "json_schema",
        "schema": schemat
    }
)

dane = json.loads(odpowiedz.content[0].text)
print(dane)
# {"imie": "Jan Kowalski", "email": "jan@firma.pl", "temat": "problem z fakturą", "priorytet": "wysoki"}
```

---

## Integracja z Pydantic — podejście zalecane

Ręczne pisanie JSON Schema jest żmudne. Pydantic pozwala zdefiniować schemat jako klasę Python i dostać w pełni typowany obiekt w odpowiedzi:

```python
from pydantic import BaseModel, Field
from typing import Literal
import anthropic

client = anthropic.Anthropic()

# Zdefiniuj schemat jako klasę Pydantic
class DaneZgłoszenia(BaseModel):
    imie: str
    email: str
    temat: str
    priorytet: Literal["niski", "sredni", "wysoki"]
    krotki_opis: str = Field(description="Jednozdaniowe podsumowanie problemu")

# Użyj client.messages.parse() zamiast client.messages.create()
odpowiedz = client.messages.parse(
    model="claude-sonnet-4-6",
    max_tokens=1024,
    messages=[
        {
            "role": "user",
            "content": """Wyciągnij dane z emaila:

Od: Jan Kowalski <[email protected]>
Temat: Pilne: problem z fakturą za marzec

Mam pilny problem z fakturą VAT za marzec. Kwota się nie zgadza."""
        }
    ],
    output_format=DaneZgłoszenia  # przekaż klasę Pydantic bezpośrednio
)

# Wynik to już w pełni typowany obiekt
dane = odpowiedz.parsed_output
print(f"Imię: {dane.imie}")
print(f"Priorytet: {dane.priorytet}")
print(f"Opis: {dane.krotki_opis}")
```

---

## Praktyczne zastosowania

### Ekstrakcja danych z dokumentów

```python
from pydantic import BaseModel
from typing import Optional

class DaneFaktury(BaseModel):
    numer_faktury: str
    data_wystawienia: str          # format YYYY-MM-DD
    sprzedawca: str
    nabywca: str
    kwota_netto: float
    kwota_vat: float
    kwota_brutto: float
    termin_platnosci: Optional[str]

def ekstrahuj_fakture(tresc_pdf: str) -> DaneFaktury:
    odpowiedz = client.messages.parse(
        model="claude-sonnet-4-6",
        max_tokens=512,
        messages=[
            {
                "role": "user",
                "content": f"Wyciągnij dane z poniższej faktury:\n\n{tresc_pdf}"
            }
        ],
        output_format=DaneFaktury
    )
    return odpowiedz.parsed_output
```

### Klasyfikacja i tagowanie

```python
from pydantic import BaseModel
from typing import List, Literal

class KlasyfikacjaOpinii(BaseModel):
    sentyment: Literal["pozytywny", "negatywny", "neutralny"]
    kategorie: List[Literal["dostawa", "jakość", "cena", "obsługa", "inne"]]
    ocena_1_5: int = Field(ge=1, le=5, description="Ocena od 1 do 5")
    kluczowe_slowa: List[str] = Field(max_length=5, description="Maks. 5 słów kluczowych")

opinia = "Dostawa super szybka, ale produkt nie spełnił oczekiwań jakościowych."

odpowiedz = client.messages.parse(
    model="claude-haiku-4-5",  # do klasyfikacji Haiku wystarczy
    max_tokens=256,
    messages=[{"role": "user", "content": f"Sklasyfikuj opinię: {opinia}"}],
    output_format=KlasyfikacjaOpinii
)

wynik = odpowiedz.parsed_output
print(f"Sentyment: {wynik.sentyment}, Ocena: {wynik.ocena_1_5}/5")
```

### Generowanie strukturyzowanych raportów

```python
from pydantic import BaseModel
from typing import List

class PunktRaportu(BaseModel):
    naglowek: str
    tresc: str
    waga: Literal["krytyczne", "ważne", "informacyjne"]

class RaportZRozmowyZKlientem(BaseModel):
    podsumowanie: str
    ustalenia: List[PunktRaportu]
    kolejne_kroki: List[str]
    ryzyko: Optional[str]

# Przekaż transkrypt i odbierz ustrukturyzowany raport
odpowiedz = client.messages.parse(
    model="claude-sonnet-4-6",
    max_tokens=2048,
    messages=[
        {"role": "user", "content": f"Przygotuj raport z rozmowy z klientem:\n\n{transkrypt}"}
    ],
    output_format=RaportZRozmowyZKlientem
)

raport = odpowiedz.parsed_output
for ustalenie in raport.ustalenia:
    print(f"[{ustalenie.waga.upper()}] {ustalenie.naglowek}")
```

---

## TypeScript z Zod

W TypeScript zalecane jest Zod — analogia do Pydantic:

```typescript
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";

const client = new Anthropic();

const SchematKontaktu = z.object({
  imie: z.string(),
  email: z.string().email(),
  temat: z.string(),
  priorytet: z.enum(["niski", "sredni", "wysoki"]),
});

const odpowiedz = await client.messages.parse({
  model: "claude-sonnet-4-6",
  max_tokens: 512,
  messages: [
    {
      role: "user",
      content: "Wyciągnij dane z emaila: [treść emaila]"
    }
  ],
  outputFormat: SchematKontaktu,
});

const dane = odpowiedz.parsedOutput; // w pełni typowany obiekt TypeScript
console.log(dane.priorytet); // "niski" | "sredni" | "wysoki"
```

---

## Bez Structured Outputs — alternatywa przez prompting

Gdy Structured Outputs nie są dostępne (starsze modele, specyficzne scenariusze), można wymusić JSON przez prompt i narzędzie:

**Metoda 1 — prosty JSON mode przez prompt:**

```python
odpowiedz = client.messages.create(
    model="claude-haiku-4-5",
    max_tokens=512,
    system="Odpowiadaj WYŁĄCZNIE poprawnym JSON bez żadnego dodatkowego tekstu.",
    messages=[
        {"role": "user", "content": "Wyciągnij: imię, email, temat z:\n\n[treść]"},
        {"role": "assistant", "content": "{"}  # prefilling — wymusza start od JSON
    ]
)
# Dołącz otwierający nawias do odpowiedzi
surowy_json = "{" + odpowiedz.content[0].text
dane = json.loads(surowy_json)
```

**Metoda 2 — przez tool use (przed Structured Outputs):**

```python
narzedzie_ekstrakcji = {
    "name": "zapisz_dane",
    "description": "Zapisz wyekstrahowane dane. MUSISZ użyć tego narzędzia.",
    "input_schema": {
        "type": "object",
        "properties": {
            "imie": {"type": "string"},
            "email": {"type": "string"},
            "priorytet": {"type": "string", "enum": ["niski", "sredni", "wysoki"]}
        },
        "required": ["imie", "email", "priorytet"]
    }
}

odpowiedz = client.messages.create(
    model="claude-haiku-4-5",
    max_tokens=512,
    tools=[narzedzie_ekstrakcji],
    tool_choice={"type": "tool", "name": "zapisz_dane"},  # wymuś użycie narzędzia
    messages=[{"role": "user", "content": "Wyciągnij dane z: [treść]"}]
)

wywolanie = next(b for b in odpowiedz.content if b.type == "tool_use")
dane = wywolanie.input  # zawsze poprawna struktura
```

---

## Ograniczenia Structured Outputs

Kilka rzeczy, o których warto wiedzieć:

- **Złożone schematy** — API limituje liczbę opcjonalnych pól, unii typów i zagnieżdżeń. Przy bardzo złożonych schematach można trafić na błąd kompilacji gramatyki
- **Pierwsze żądanie z nowym schematem** — trwa nieco dłużej (100–300 ms) z powodu kompilacji; kolejne wywołania z tym samym schematem są szybkie (schemat jest cache'owany przez 24 h)
- **Bez Structured Outputs nie ma gwarancji** — prompting „odpowiedz w JSON" działa w większości przypadków, ale nie jest niezawodny w 100% przy produkcyjnych zastosowaniach

---

## Kiedy używać Structured Outputs, kiedy nie?

| Zastosowanie | Structured Outputs? |
|---|---|
| Ekstrakcja danych z dokumentów | ✅ Tak — gwarancja |
| Klasyfikacja, tagowanie, scoring | ✅ Tak |
| Generowanie raportów do dalszego przetwarzania | ✅ Tak |
| Swobodna rozmowa z użytkownikiem | ❌ Nie — zbędne |
| Generowanie tekstu (e-maile, artykuły) | ❌ Nie — zbędne |
| Szybkie prototypowanie | ❌ Prompting wystarczy |

---

## Podsumowanie

Structured Outputs to gwarancja, że Claude zwróci poprawny JSON zgodny z podanym schematem — matematyczna pewność zamiast nadziei opartej na prompt engineeringu. Najwygodniejsza implementacja to `client.messages.parse()` z Pydantic (Python) lub Zod (TypeScript) — SDK automatycznie konwertuje klasę na JSON Schema i zwraca typowany obiekt. Dla starszych modeli lub prostych przypadków dobrą alternatywą jest wymuszenie JSON przez tool use z `tool_choice: "tool"`. Structured Outputs eliminuje cały kod obsługi błędów parsowania — i to jest jego największa wartość w aplikacjach produkcyjnych.

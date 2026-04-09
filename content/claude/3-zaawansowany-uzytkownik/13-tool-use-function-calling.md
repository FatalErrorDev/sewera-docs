---
title: "Narzędzia — Tool Use i Function Calling"
description: "Jak wyposażyć Claude'a w narzędzia, które pozwalają mu wykonywać działania i pobierać dane z zewnętrznych systemów"
order: 13
---

# Narzędzia — Tool Use i Function Calling

Claude potrafi nie tylko pisać tekst — może też wywoływać funkcje i narzędzia, które programista mu udostępni. To mechanizm zwany **tool use** (lub function calling). Dzięki niemu Claude może sprawdzać aktualną pogodę, pobierać dane z bazy, wywoływać zewnętrzne API, zapisywać wyniki do systemu — słowem, działać, nie tylko mówić. Ten poradnik pokazuje, jak to działa i jak to zaimplementować.

---

## Jak działa tool use?

Schemat działania jest prosty i przebiega w kilku krokach:

```
1. Programista definiuje narzędzie (nazwa + opis + parametry)
2. Claude dostaje zapytanie i listę dostępnych narzędzi
3. Claude decyduje, czy wywołać narzędzie (i które)
4. Aplikacja wykonuje rzeczywiste wywołanie narzędzia
5. Wynik wraca do Claude'a
6. Claude formułuje ostateczną odpowiedź dla użytkownika
```

Ważne: **Claude nie wykonuje kodu ani nie wywołuje API bezpośrednio**. Sygnalizuje tylko, że chce użyć narzędzia i z jakimi parametrami. To aplikacja (nasz kod) faktycznie wywołuje funkcję i zwraca wynik.

---

## Definiowanie narzędzia

Każde narzędzie opisujemy w formacie JSON Schema. Opis jest kluczowy — Claude na jego podstawie decyduje, czy i kiedy użyć danego narzędzia.

```python
narzedzie_pogoda = {
    "name": "get_weather",
    "description": "Zwraca aktualną pogodę dla podanego miasta. Używaj gdy użytkownik pyta o warunki pogodowe.",
    "input_schema": {
        "type": "object",
        "properties": {
            "city": {
                "type": "string",
                "description": "Nazwa miasta, np. 'Warszawa', 'Kraków'"
            },
            "units": {
                "type": "string",
                "enum": ["celsius", "fahrenheit"],
                "description": "Jednostka temperatury. Domyślnie celsius."
            }
        },
        "required": ["city"]
    }
}
```

Kilka zasad przy pisaniu opisów narzędzi:
- opis narzędzia powinien jednoznacznie mówić, kiedy je stosować
- opisy parametrów powinny zawierać przykłady wartości
- jeśli parametr jest opcjonalny, wyjaśnij jaka jest wartość domyślna

---

## Pełny przykład — krok po kroku

Poniższy przykład implementuje prosty przepływ z jednym narzędziem:

```python
import anthropic
import json

client = anthropic.Anthropic()

# Definicja narzędzia
narzedzia = [
    {
        "name": "get_weather",
        "description": "Zwraca aktualną pogodę dla miasta.",
        "input_schema": {
            "type": "object",
            "properties": {
                "city": {"type": "string", "description": "Nazwa miasta"}
            },
            "required": ["city"]
        }
    }
]

# Symulowana implementacja narzędzia (w produkcji — prawdziwe API pogody)
def get_weather(city: str) -> dict:
    return {"city": city, "temperature": 18, "condition": "Pochmurno", "humidity": 72}

# Krok 1: Wyślij zapytanie z narzędziami
odpowiedz = client.messages.create(
    model="claude-sonnet-4-6",
    max_tokens=1024,
    tools=narzedzia,
    messages=[
        {"role": "user", "content": "Jaka jest pogoda w Krakowie?"}
    ]
)

print(f"Stop reason: {odpowiedz.stop_reason}")  # tool_use

# Krok 2: Sprawdź czy Claude chce użyć narzędzia
if odpowiedz.stop_reason == "tool_use":
    # Znajdź blok tool_use w odpowiedzi
    wywolanie = next(b for b in odpowiedz.content if b.type == "tool_use")

    print(f"Narzędzie: {wywolanie.name}")
    print(f"Parametry: {wywolanie.input}")

    # Krok 3: Wykonaj narzędzie
    wynik = get_weather(**wywolanie.input)

    # Krok 4: Odeślij wynik do Claude'a
    ostateczna_odpowiedz = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1024,
        tools=narzedzia,
        messages=[
            {"role": "user", "content": "Jaka jest pogoda w Krakowie?"},
            {"role": "assistant", "content": odpowiedz.content},
            {
                "role": "user",
                "content": [
                    {
                        "type": "tool_result",
                        "tool_use_id": wywolanie.id,
                        "content": json.dumps(wynik)
                    }
                ]
            }
        ]
    )

    print(ostateczna_odpowiedz.content[0].text)
```

Wynik: Claude sformułuje naturalną odpowiedź na podstawie zwróconych danych, np. „W Krakowie jest 18°C i pochmurno, wilgotność wynosi 72%."

---

## Stop reason — jak rozpoznać wywołanie narzędzia?

Gdy Claude chce użyć narzędzia, `stop_reason` w odpowiedzi ma wartość `tool_use` (zamiast standardowego `end_turn`). To sygnał, że zamiast wyświetlać odpowiedź użytkownikowi, powinniśmy przetworzyć wywołanie narzędzia.

Odpowiedź zawiera wtedy blok typu `tool_use`:

```json
{
  "type": "tool_use",
  "id": "toolu_01A09q90qw90lq917835lq9",
  "name": "get_weather",
  "input": {"city": "Kraków"}
}
```

---

## Wiele narzędzi naraz

Claude może wybrać jedno z wielu dostępnych narzędzi, a w odpowiedzi może też wywołać kilka narzędzi jednocześnie (parallel tool use):

```python
narzedzia = [
    {
        "name": "get_weather",
        "description": "Pogoda dla miasta",
        # ...
    },
    {
        "name": "get_exchange_rate",
        "description": "Aktualny kurs waluty",
        # ...
    },
    {
        "name": "search_database",
        "description": "Przeszukaj wewnętrzną bazę produktów",
        # ...
    }
]
```

Przy zapytaniu „Jaka jest pogoda w Berlinie i jaki jest kurs EUR/PLN?" Claude może wywołać dwa narzędzia jednocześnie. Odpowiedź będzie zawierać dwa bloki `tool_use`, które możemy wykonać równolegle i zwrócić oba wyniki.

---

## Kontrolowanie zachowania narzędzi

Parametr `tool_choice` pozwala sterować tym, kiedy Claude używa narzędzi:

```python
# Claude sam decyduje (domyślnie)
tool_choice={"type": "auto"}

# Claude musi użyć przynajmniej jednego narzędzia
tool_choice={"type": "any"}

# Claude musi użyć konkretnego narzędzia
tool_choice={"type": "tool", "name": "get_weather"}

# Claude nie może użyć żadnych narzędzi
tool_choice={"type": "none"}
```

---

## Praktyczne zastosowania

Kilka przykładów narzędzi, które warto zaimplementować w typowych projektach firmowych:

**Wyszukiwanie w bazie danych:**
```python
{
    "name": "search_products",
    "description": "Przeszukaj katalog produktów według słów kluczowych lub numeru SKU.",
    "input_schema": {
        "type": "object",
        "properties": {
            "query": {"type": "string", "description": "Fraza do wyszukania"},
            "limit": {"type": "integer", "description": "Liczba wyników, domyślnie 10"}
        },
        "required": ["query"]
    }
}
```

**Tworzenie zadania w systemie:**
```python
{
    "name": "create_ticket",
    "description": "Utwórz zgłoszenie w systemie helpdesk.",
    "input_schema": {
        "type": "object",
        "properties": {
            "title": {"type": "string"},
            "description": {"type": "string"},
            "priority": {"type": "string", "enum": ["low", "medium", "high"]}
        },
        "required": ["title", "description"]
    }
}
```

**Pobieranie danych z CRM:**
```python
{
    "name": "get_customer_info",
    "description": "Pobierz dane klienta na podstawie adresu e-mail lub ID.",
    "input_schema": {
        "type": "object",
        "properties": {
            "email": {"type": "string", "description": "Adres e-mail klienta"},
            "customer_id": {"type": "string", "description": "ID klienta w CRM"}
        }
    }
}
```

---

## Obsługa błędów narzędzi

Jeśli narzędzie zakończyło się błędem, można to zakomunikować Claude'owi — model uwzględni błąd w odpowiedzi:

```python
{
    "role": "user",
    "content": [
        {
            "type": "tool_result",
            "tool_use_id": wywolanie.id,
            "content": "Błąd: brak połączenia z bazą danych",
            "is_error": True
        }
    ]
}
```

Claude poinformuje użytkownika o problemie i — jeśli to możliwe — zaproponuje alternatywne rozwiązanie.

---

## Bezpieczeństwo przy używaniu narzędzi

Kilka zasad, o których warto pamiętać:

- **Waliduj parametry** — zanim wykonasz narzędzie, sprawdź, czy parametry podane przez Claude'a są poprawne i bezpieczne
- **Autoryzuj operacje** — narzędzia zapisujące dane (tworzenie, edycja, usuwanie) powinny wymagać potwierdzenia od użytkownika
- **Ogranicz zakres** — udostępniaj Claude'owi tylko te narzędzia, które są potrzebne w danym kontekście
- **Loguj wywołania** — wszystkie wywołania narzędzi warto rejestrować do celów audytu i debugowania

---

## Podsumowanie

Tool use to mechanizm, który pozwala Claude'owi wychodzić poza generowanie tekstu i działać w świecie zewnętrznym — pobierać dane, wywoływać funkcje, tworzyć rekordy. Kluczowe kroki to: definicja narzędzia (nazwa + opis + schemat parametrów), obsługa `stop_reason == "tool_use"`, wykonanie narzędzia i zwrócenie wyniku. Reszta dzieje się po stronie Claude'a — model sam decyduje kiedy i jak użyć dostępnych narzędzi.

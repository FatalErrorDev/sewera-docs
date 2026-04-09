---
title: "Pierwsze kroki z API Claude"
description: "Jak uzyskać dostęp do API, wysłać pierwsze zapytanie i zrozumieć strukturę odpowiedzi"
order: 12
---

# Pierwsze kroki z API Claude

Do tej pory korzystaliśmy z Claude'a przez interfejs czatu. API (Application Programming Interface) to zupełnie inna warstwa — pozwala wywoływać Claude'a bezpośrednio z kodu, osadzać go w aplikacjach i automatyzować dowolne przepływy pracy. Ten poradnik przeprowadzi przez wszystko od zera: rejestracja, pierwsza wiadomość, zrozumienie odpowiedzi.

---

## Czym jest API i kiedy z niego korzystać?

Interfejs czatu na claude.ai to narzędzie dla ludzi. API to narzędzie dla programistów i systemów — pozwala wywoływać Claude'a programistycznie, bez udziału człowieka.

Kiedy API jest potrzebne:
- budowanie aplikacji, w której Claude jest częścią logiki
- automatyzacja powtarzalnych zadań (przetwarzanie dokumentów, klasyfikacja, generowanie treści)
- integracja Claude'a z istniejącymi systemami firmy
- tworzenie chatbotów, asystentów, narzędzi wewnętrznych
- przetwarzanie dużych ilości danych bez ręcznego kopiowania

Kiedy API **nie jest potrzebne**: do codziennej pracy przez przeglądarkę wystarczy claude.ai.

---

## Krok 1 — Konto w Anthropic Console

Przed pierwszym wywołaniem API potrzebne jest konto w Anthropic Console:

1. Przejdź na stronę `console.anthropic.com`
2. Zarejestruj się lub zaloguj
3. W sekcji **API Keys** utwórz nowy klucz API
4. Skopiuj klucz — będzie widoczny tylko raz

> **Ważne:** klucz API to jak hasło. Nigdy nie wklejaj go bezpośrednio do kodu w repozytorium. Przechowuj w zmiennych środowiskowych lub menedżerze sekretów.

Przechowywanie klucza w zmiennej środowiskowej (Linux/macOS):
```bash
export ANTHROPIC_API_KEY="sk-ant-api-..."
```

Na Windows (PowerShell):
```powershell
$env:ANTHROPIC_API_KEY = "sk-ant-api-..."
```

---

## Krok 2 — Instalacja SDK

Anthropic udostępnia oficjalne biblioteki klienckie dla najpopularniejszych języków. Zalecane jest używanie SDK zamiast bezpośrednich wywołań HTTP — SDK obsługuje szczegóły protokołu, retry i parsowanie odpowiedzi.

**Python:**
```bash
pip install anthropic
```

**Node.js / TypeScript:**
```bash
npm install @anthropic-ai/sdk
```

SDK są dostępne również dla Java, Go i innych języków — szczegóły w oficjalnej dokumentacji pod adresem `docs.anthropic.com`.

---

## Krok 3 — Pierwsze wywołanie

Najprostsze możliwe wywołanie API wygląda następująco:

**Python:**
```python
import anthropic

client = anthropic.Anthropic()  # klucz pobierany ze zmiennej ANTHROPIC_API_KEY

message = client.messages.create(
    model="claude-sonnet-4-6",
    max_tokens=1024,
    messages=[
        {"role": "user", "content": "Cześć, Claude! Wyjaśnij w jednym zdaniu, czym jest API."}
    ]
)

print(message.content[0].text)
```

**Node.js:**
```javascript
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic(); // klucz pobierany ze zmiennej ANTHROPIC_API_KEY

const message = await client.messages.create({
  model: "claude-sonnet-4-6",
  max_tokens: 1024,
  messages: [
    { role: "user", content: "Cześć, Claude! Wyjaśnij w jednym zdaniu, czym jest API." }
  ],
});

console.log(message.content[0].text);
```

**cURL (bez SDK):**
```bash
curl https://api.anthropic.com/v1/messages \
  --header "x-api-key: $ANTHROPIC_API_KEY" \
  --header "anthropic-version: 2023-06-01" \
  --header "content-type: application/json" \
  --data '{
    "model": "claude-sonnet-4-6",
    "max_tokens": 1024,
    "messages": [
      {"role": "user", "content": "Cześć, Claude!"}
    ]
  }'
```

---

## Struktura żądania — kluczowe parametry

Każde żądanie do Messages API zawiera kilka elementów:

```python
client.messages.create(
    model="claude-sonnet-4-6",   # który model Claude użyć
    max_tokens=1024,              # maksymalna długość odpowiedzi (wymagane)
    system="Jesteś asystentem.", # system prompt (opcjonalne)
    messages=[                    # historia rozmowy
        {"role": "user", "content": "Pytanie użytkownika"},
        {"role": "assistant", "content": "Poprzednia odpowiedź Claude'a"},
        {"role": "user", "content": "Kolejne pytanie"},
    ]
)
```

**model** — identyfikator modelu Claude. Aktualne modele produkcyjne to `claude-opus-4-6`, `claude-sonnet-4-6` i `claude-haiku-4-5`.

**max_tokens** — parametr wymagany. Określa maksymalną liczbę tokenów w odpowiedzi. Dla krótkich odpowiedzi wystarczy 256–1024, dla długich dokumentów — 4096 lub więcej.

**system** — system prompt, działający „w tle" każdej rozmowy. Ustawiamy tutaj rolę, zasady i kontekst stały.

**messages** — tablica wiadomości. Każda wiadomość ma pole `role` (`user` lub `assistant`) i `content` z treścią. Przekazując pełną historię rozmowy, uzyskujemy efekt wieloturowej konwersacji.

---

## Struktura odpowiedzi

API zwraca obiekt z kilkoma polami:

```json
{
  "id": "msg_01XFDUDYJgAACzvnptvVoYEL",
  "type": "message",
  "role": "assistant",
  "content": [
    {
      "type": "text",
      "text": "Tutaj treść odpowiedzi Claude'a."
    }
  ],
  "model": "claude-sonnet-4-6",
  "stop_reason": "end_turn",
  "usage": {
    "input_tokens": 25,
    "output_tokens": 47
  }
}
```

Najważniejsze pola:

| Pole | Co oznacza |
|---|---|
| `content[0].text` | Treść odpowiedzi — to najczęściej potrzebne pole |
| `stop_reason` | Dlaczego Claude skończył: `end_turn` (skończył naturalnie), `max_tokens` (osiągnięto limit), `stop_sequence` |
| `usage.input_tokens` | Liczba tokenów w żądaniu — wpływa na koszt |
| `usage.output_tokens` | Liczba tokenów w odpowiedzi — wpływa na koszt |
| `id` | Unikalny identyfikator wiadomości — przydatny do logowania |

Wydobycie samego tekstu odpowiedzi:

```python
odpowiedz = message.content[0].text
```

---

## Wieloturowa rozmowa

API jest bezstanowe — Claude nie pamięta poprzednich wywołań. Aby prowadzić rozmowę, za każdym razem przekazujemy pełną historię:

```python
historia = []

def wyslij_wiadomosc(tresc):
    historia.append({"role": "user", "content": tresc})

    odpowiedz = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1024,
        messages=historia
    )

    tekst = odpowiedz.content[0].text
    historia.append({"role": "assistant", "content": tekst})
    return tekst

print(wyslij_wiadomosc("Jak działa sortowanie bąbelkowe?"))
print(wyslij_wiadomosc("A jaką ma złożoność czasową?"))  # Claude pamięta kontekst
```

---

## Tokeny i koszty — podstawy

Claude przetwarza tekst w jednostkach zwanych **tokenami**. Przybliżone przeliczniki:
- 1 token ≈ 4 znaki po angielsku
- 1 token ≈ 3–4 znaki po polsku
- 100 słów ≈ 130–150 tokenów

Koszty są naliczane osobno za tokeny wejściowe (prompt) i wyjściowe (odpowiedź). Aktualne stawki dla poszczególnych modeli znajdziesz zawsze w dokumentacji: `docs.anthropic.com/en/docs/about-claude/pricing`.

Dobra praktyka: przed uruchomieniem drogich operacji można sprawdzić, ile tokenów zajmie żądanie, używając endpointu `/v1/messages/count_tokens` — bez faktycznego generowania odpowiedzi.

---

## Środowisko testowe — Workbench

Zanim zaczniesz pisać kod, warto przetestować prompty w Workbench dostępnym w Anthropic Console. To interaktywny interfejs, który pozwala:
- wypróbować różne modele i parametry
- zobaczyć zużycie tokenów
- eksportować gotowe wywołanie jako kod w Pythonie, TypeScript lub cURL

Workbench przyspiesza iterowanie nad promptami bez konieczności uruchamiania kodu przy każdej zmianie.

---

## Najczęstsze błędy przy pierwszych wywołaniach

| Błąd | Przyczyna | Rozwiązanie |
|---|---|---|
| `AuthenticationError` | Nieprawidłowy lub brakujący klucz API | Sprawdź zmienną środowiskową |
| `max_tokens is required` | Brak parametru max_tokens | Zawsze podaj max_tokens |
| `invalid_request_error` | Błędna struktura wiadomości | Sprawdź, czy messages ma naprzemienne role user/assistant |
| `rate_limit_error` | Przekroczono limit zapytań | Dodaj retry z exponential backoff |
| `overloaded_error` | Serwery przeciążone | Ponów próbę po chwili |

---

## Podsumowanie

Pierwsze kroki z API Claude to: konto w Console, klucz API, instalacja SDK, pierwsze wywołanie `messages.create`. Kluczowe parametry to `model`, `max_tokens` i `messages`. Odpowiedź zawiera treść w `content[0].text` i informacje o zużyciu tokenów w `usage`. API jest bezstanowe — historia rozmowy musi być przekazywana przy każdym wywołaniu.

W kolejnych poradnikach zobaczymy bardziej zaawansowane możliwości: narzędzia (tool use), streaming, cachowanie promptów i przetwarzanie wsadowe.

---
title: "Prompt caching — oszczędność kosztów i czasu"
description: "Jak cache'ować powtarzające się fragmenty promptów, żeby znacząco obniżyć koszty i skrócić czas odpowiedzi"
order: 15
---

# Prompt caching — oszczędność kosztów i czasu

Każde wywołanie API przetwarza cały kontekst od zera: system prompt, historię rozmowy, dokumenty, narzędzia. Przy długich promptach i dużej liczbie wywołań koszty i latencja rosną szybko. **Prompt caching** rozwiązuje ten problem — pozwala zapisać przetworzone fragmenty promptu i wielokrotnie je odczytywać za ułamek standardowej ceny.

---

## Na czym polega caching?

Kiedy Claude przetwarza prompt, tworzy wewnętrzną reprezentację (tzw. KV cache — key-value cache). Bez cachingu ta reprezentacja jest tworzona od nowa przy każdym wywołaniu. Z cachingiem można zapisać raz obliczone fragmenty i odczytywać je w kolejnych żądaniach.

**Efekt w praktyce:**
- tokeny odczytane z cache kosztują **10% standardowej ceny** (90% taniej)
- latencja przy trafieniu w cache spada nawet o **85%**
- pierwsze żądanie (zapis do cache) kosztuje nieznacznie więcej — **125% standardowej ceny**

Caching opłaca się już po **jednym trafieniu** przy TTL 5 minut. Przy 10+ trafieniach oszczędności są bardzo znaczące.

---

## Kiedy caching ma sens?

Caching działa najlepiej, gdy duża część promptu powtarza się w wielu żądaniach:

- **długi system prompt** — instrukcje, reguły, polityki firmowe, persona (np. 2000+ tokenów)
- **dokumenty kontekstowe** — baza wiedzy, regulaminy, katalogi produktów wklejane do każdego żądania
- **historia rozmowy** — wieloturowy czat, gdzie starsze wiadomości się nie zmieniają
- **definicje narzędzi** — duże listy narzędzi przekazywane przy każdym wywołaniu
- **przykłady few-shot** — zestawy przykładów wklejane jako część promptu

**Caching nie pomaga** przy bardzo krótkich promptach (minimum to 1024 tokeny dla większości modeli) ani gdy każde żądanie ma zupełnie inną treść.

---

## Jak to działa — czas życia cache'u (TTL)

Cache ma ograniczony czas życia. Dostępne opcje:

| TTL | Koszt zapisu | Kiedy używać |
|---|---|---|
| **5 minut** (domyślnie) | 1,25× standardowej ceny | Intensywna praca w krótkich sesjach |
| **1 godzina** | 2× standardowej ceny | Dłuższe sesje, mniej częste zapytania |

TTL resetuje się przy każdym trafieniu — jeśli cache jest aktywnie używany, nie wygasa.

---

## Implementacja — jak oznaczać fragmenty do cache'owania

Fragmenty do zapisu w cache oznaczamy parametrem `cache_control`:

**System prompt z cachingiem (Python):**

```python
import anthropic

client = anthropic.Anthropic()

odpowiedz = client.messages.create(
    model="claude-sonnet-4-6",
    max_tokens=1024,
    system=[
        {
            "type": "text",
            "text": """Jesteś asystentem obsługi klienta firmy ABC.

Nasza firma sprzedaje oprogramowanie do zarządzania magazynem.
Poniżej szczegółowa dokumentacja produktu:

[...bardzo długi tekst, 2000+ tokenów...]

Zasady obsługi klienta:
1. Zawsze odpowiadaj po polsku
2. Bądź konkretny i rzeczowy
3. Przy problemach technicznych zbieraj szczegóły błędu
""",
            "cache_control": {"type": "ephemeral"}  # oznacz do cache'owania
        }
    ],
    messages=[
        {"role": "user", "content": "Jak skonfigurować integrację z systemem ERP?"}
    ]
)

print(odpowiedz.content[0].text)
```

**Sprawdzanie efektywności cache'u z response usage:**

```python
# Po wykonaniu żądania sprawdź pola usage
usage = odpowiedz.usage
print(f"Tokeny wejściowe (normalne): {usage.input_tokens}")
print(f"Tokeny zapisane do cache:   {usage.cache_creation_input_tokens}")
print(f"Tokeny odczytane z cache:   {usage.cache_read_input_tokens}")
```

Jeśli `cache_read_input_tokens > 0` — trafiliśmy w cache i płacimy 10% zamiast 100%.

---

## Caching dokumentów — praktyczny przykład

Typowy scenariusz: chatbot, który przy każdym pytaniu ma dostęp do dużego dokumentu (regulamin, instrukcja, katalog).

```python
import anthropic

client = anthropic.Anthropic()

# Załaduj dokument raz (może być bardzo długi)
with open("katalog_produktow.txt", "r") as f:
    katalog = f.read()

def zadaj_pytanie(pytanie: str, historia: list) -> str:
    """Pyta Claude'a z cache'owanym katalogiem produktów."""

    odpowiedz = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1024,
        system=[
            {
                "type": "text",
                "text": f"Jesteś asystentem sprzedaży. Poniżej katalog produktów:\n\n{katalog}",
                "cache_control": {"type": "ephemeral"}  # katalog cache'owany
            }
        ],
        messages=historia + [{"role": "user", "content": pytanie}]
    )

    return odpowiedz.content[0].text

# Pierwsze pytanie — zapis do cache (1,25× ceny)
odp1 = zadaj_pytanie("Jakie modele stołów macie w ofercie?", [])
print(odp1)

# Drugie pytanie — odczyt z cache (0,1× ceny) — 90% taniej!
odp2 = zadaj_pytanie("Czy model X-200 dostępny jest w kolorze białym?", [])
print(odp2)
```

---

## Caching historii rozmowy

W długich sesjach chatbota starsze wiadomości można cache'ować, żeby płacić tylko za nową treść:

```python
def buduj_wiadomosci_z_cachingiem(historia: list, nowe_pytanie: str) -> list:
    """Dodaje cache_control do historycznych wiadomości."""
    wiadomosci = []

    # Wszystkie wiadomości oprócz ostatniej — oznacz do cache'owania
    for i, msg in enumerate(historia):
        wiadomosc = dict(msg)
        if i == len(historia) - 1:  # ostatnia w historii — też cache'uj
            wiadomosc["content"] = [
                {
                    "type": "text",
                    "text": msg["content"],
                    "cache_control": {"type": "ephemeral"}
                }
            ]
        wiadomosci.append(wiadomosc)

    # Dodaj nowe pytanie (nie cache'ujemy — zmienia się za każdym razem)
    wiadomosci.append({"role": "user", "content": nowe_pytanie})
    return wiadomosci
```

---

## Reguły kolejności — co można cache'ować

Cache działa na prefiksy — buforuje wszystko **od początku do punktu oznaczonego `cache_control`**. Kolejność przetwarzania to:

1. `tools` (definicje narzędzi)
2. `system` (system prompt)
3. `messages` (historia rozmowy)

Można ustawić maksymalnie **4 punkty cache'owania** w jednym żądaniu.

Żeby caching działał, treść przed punktem cache'owania musi być **identyczna** w kolejnych żądaniach — nawet jedna zmiana w tekście oznacza brak trafienia.

---

## Automatyczny caching

Nowsze modele Claude obsługują też automatyczny caching — API samo wykrywa długie powtarzające się prefiksy i cache'uje je bez potrzeby jawnego oznaczania `cache_control`. Działa to w tle i nie wymaga zmian w kodzie.

Żeby sprawdzić, czy automatyczny caching jest aktywny, wystarczy sprawdzić `usage.cache_read_input_tokens` w odpowiedzi.

---

## Kalkulacja oszczędności — kiedy się opłaca?

Przykładowe obliczenie dla Claude Sonnet 4.6 (ceny poglądowe, aktualne stawki zawsze na `docs.anthropic.com`):

| Scenariusz | Bez cache | Z cache |
|---|---|---|
| 1 pytanie, 5000 tokenów systemu | 100% | 125% (zapis) |
| 2 pytania, 5000 tokenów systemu | 200% | 135% (1 odczyt) |
| 10 pytań, 5000 tokenów systemu | 1000% | 215% (1 zapis + 9 odczytów) |
| 100 pytań, 5000 tokenów systemu | 10000% | 1025% (1 zapis + 99 odczytów) |

Przy 100 pytaniach z tym samym kontekstem — koszt **blisko 10 razy niższy**.

---

## Najczęstsze błędy przy cachingu

| Błąd | Skutek | Rozwiązanie |
|---|---|---|
| Prompt za krótki (< 1024 tokenów) | Cache nie zadziała, brak błędu | Caching opłaca się przy długich promptach |
| Zmiana treści przed punktem cache'owania | Brak trafienia, płacimy za zapis | Niezmienną część trzymaj na początku |
| Zbyt długi TTL dla rzadkich zapytań | Przepłacamy za 1-godzinny cache | Dopasuj TTL do wzorca użycia |
| Brak sprawdzania `usage` | Nie wiemy, czy cache działa | Loguj pola usage do monitorowania |

---

## Podsumowanie

Prompt caching to jeden z najprostszych sposobów na obniżenie kosztów API przy powtarzalnych zadaniach. Wystarczy dodać `cache_control: {"type": "ephemeral"}` do długich, niezmiennych fragmentów promptu — system prompt, dokumenty kontekstowe, definicje narzędzi. Caching opłaca się od drugiego wywołania przy TTL 5 minut, a przy dużej liczbie żądań może obniżyć koszty nawet o 90%. Efektywność cache'u można śledzić przez pola `cache_creation_input_tokens` i `cache_read_input_tokens` w odpowiedzi.

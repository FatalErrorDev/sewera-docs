---
title: "Batch API — przetwarzanie masowe"
description: "Jak przetwarzać tysiące zapytań asynchronicznie za połowę standardowej ceny, używając Message Batches API"
order: 16
---

# Batch API — przetwarzanie masowe

Standardowe wywołania API zwracają odpowiedź natychmiast — ale nie zawsze jest to konieczne. Klasyfikacja 10 000 dokumentów, generowanie opisów całego katalogu produktów, analiza tysięcy opinii klientów — takie zadania nie wymagają odpowiedzi w czasie rzeczywistym. **Message Batches API** pozwala wysłać je wszystkie naraz i odebrać wyniki, gdy będą gotowe — za **50% standardowej ceny**.

---

## Kiedy używać Batch API zamiast standardowego?

Prosty test decyzyjny:

| Pytanie | Tak → | Nie → |
|---|---|---|
| Czy odpowiedź musi być natychmiastowa? | Standardowe API | Batch API |
| Czy przetwarzasz mniej niż ~50 żądań? | Standardowe API | Batch API |
| Czy wynik idzie bezpośrednio do użytkownika? | Standardowe API | Batch API |

**Batch API sprawdza się idealnie przy:**
- przetwarzaniu dużych zbiorów danych (dokumenty, opinie, zgłoszenia, rekordy)
- generowaniu treści masowo (opisy produktów, emaile, raporty)
- ewaluacji i testowaniu promptów na dużych zestawach
- moderowaniu treści generowanych przez użytkowników
- analizie danych historycznych bez presji czasowej

---

## Jak działa Batch API?

Schemat działania jest prosty:

```
1. Tworzysz batch — listę do 100 000 żądań naraz
2. API przyjmuje batch i zwraca jego ID
3. Żądania są przetwarzane asynchronicznie (większość w < 1 godziny)
4. Poolujesz status batcha lub czekasz na webhook
5. Pobierasz wyniki z linku w `results_url`
```

Każde żądanie w batchu ma unikalny `custom_id` — dzięki niemu możesz dopasować wynik do wejściowego rekordu.

---

## Tworzenie batcha — Python

```python
import anthropic

client = anthropic.Anthropic()

# Dane do przetworzenia — np. opinie klientów do klasyfikacji
opinie = [
    {"id": "op-001", "tekst": "Produkt świetny, dostawa błyskawiczna!"},
    {"id": "op-002", "tekst": "Nie działa po tygodniu, rozczarowanie."},
    {"id": "op-003", "tekst": "Przeciętny produkt, cena adekwatna."},
    # ... i wiele więcej
]

# Buduj listę żądań
zadania = [
    {
        "custom_id": opinia["id"],  # unikalny identyfikator — kluczowy do dopasowania wyników
        "params": {
            "model": "claude-haiku-4-5",  # Haiku jest szybki i tani — idealny do klasyfikacji
            "max_tokens": 100,
            "messages": [
                {
                    "role": "user",
                    "content": f"""Sklasyfikuj poniższą opinię klienta jako: POZYTYWNA, NEGATYWNA lub NEUTRALNA.
Odpowiedz tylko jednym słowem.

Opinia: {opinia["tekst"]}"""
                }
            ]
        }
    }
    for opinia in opinie
]

# Wyślij batch
batch = client.messages.batches.create(requests=zadania)

print(f"Batch ID: {batch.id}")
print(f"Status: {batch.processing_status}")
print(f"Wygasa: {batch.expires_at}")
```

Wynik:
```
Batch ID: msgbatch_01HkcTjaV5uDC8jWR4ZsDV8d
Status: in_progress
Wygasa: 2024-09-25T18:37:24Z
```

---

## Sprawdzanie statusu

Po wysłaniu batcha musisz co jakiś czas sprawdzać jego status — lub zaimplementować automatyczne pollowanie:

```python
import time

def czekaj_na_batch(batch_id: str, sprawdzaj_co_sekund: int = 60):
    """Polluje status batcha i czeka na zakończenie."""
    while True:
        batch = client.messages.batches.retrieve(batch_id)

        status = batch.processing_status
        liczniki = batch.request_counts

        print(f"Status: {status} | "
              f"OK: {liczniki.succeeded} | "
              f"Błędy: {liczniki.errored} | "
              f"W toku: {liczniki.processing}")

        if status == "ended":
            print("✅ Batch zakończony!")
            return batch

        time.sleep(sprawdzaj_co_sekund)

batch_info = czekaj_na_batch("msgbatch_01HkcTjaV5uDC8jWR4ZsDV8d")
```

Możliwe statusy:
- `in_progress` — przetwarzanie trwa
- `canceling` — anulowanie w toku
- `ended` — wszystkie żądania zakończone (sukces, błąd lub anulowanie)

---

## Pobieranie wyników

Gdy batch ma status `ended`, wyniki są dostępne w pliku JSONL pod adresem `results_url`:

```python
def pobierz_wyniki(batch_id: str) -> dict:
    """Pobiera i przetwarza wyniki batcha."""
    wyniki = {}

    for rezultat in client.messages.batches.results(batch_id):
        custom_id = rezultat.custom_id

        if rezultat.result.type == "succeeded":
            odpowiedz = rezultat.result.message.content[0].text
            wyniki[custom_id] = {"status": "ok", "odpowiedz": odpowiedz}

        elif rezultat.result.type == "errored":
            blad = rezultat.result.error
            wyniki[custom_id] = {"status": "blad", "blad": str(blad)}

        elif rezultat.result.type == "canceled":
            wyniki[custom_id] = {"status": "anulowane"}

        elif rezultat.result.type == "expired":
            wyniki[custom_id] = {"status": "wygaslo"}

    return wyniki

wyniki = pobierz_wyniki("msgbatch_01HkcTjaV5uDC8jWR4ZsDV8d")

# Dopasuj wyniki do oryginalnych danych
for opinia in opinie:
    wynik = wyniki.get(opinia["id"])
    if wynik and wynik["status"] == "ok":
        print(f"{opinia['id']}: {wynik['odpowiedz']}")
```

---

## Kompletny przykład end-to-end

```python
import anthropic
import time
import json

client = anthropic.Anthropic()

def przetworz_masowo(dane: list, buduj_prompt) -> dict:
    """
    Przetwarza listę danych przez Batch API.

    Args:
        dane: lista słowników z kluczem 'id'
        buduj_prompt: funkcja przyjmująca element danych i zwracająca treść promptu

    Returns:
        słownik {id: odpowiedz}
    """
    # Krok 1: Budowanie żądań
    zadania = [
        {
            "custom_id": str(element["id"]),
            "params": {
                "model": "claude-haiku-4-5",
                "max_tokens": 256,
                "messages": [{"role": "user", "content": buduj_prompt(element)}]
            }
        }
        for element in dane
    ]

    # Krok 2: Wysłanie batcha
    batch = client.messages.batches.create(requests=zadania)
    print(f"Batch {batch.id} wysłany — {len(zadania)} żądań")

    # Krok 3: Czekanie na wyniki
    while True:
        batch = client.messages.batches.retrieve(batch.id)
        if batch.processing_status == "ended":
            break
        print(f"Czekam... ({batch.request_counts.processing} w toku)")
        time.sleep(30)

    # Krok 4: Zbieranie wyników
    wyniki = {}
    for rezultat in client.messages.batches.results(batch.id):
        if rezultat.result.type == "succeeded":
            wyniki[rezultat.custom_id] = rezultat.result.message.content[0].text
        else:
            wyniki[rezultat.custom_id] = None

    udanych = sum(1 for v in wyniki.values() if v is not None)
    print(f"Gotowe: {udanych}/{len(zadania)} sukcesów")
    return wyniki

# Użycie
produkty = [
    {"id": "p001", "nazwa": "Krzesło ergonomiczne EVO", "cechy": "regulowana wysokość, podparcie lędźwiowe"},
    {"id": "p002", "nazwa": "Biurko stojące FLEX", "cechy": "elektryczna regulacja, pamięć 4 pozycji"},
]

def prompt_opis(produkt):
    return f"Napisz opis produktu na stronę sklepową (max 80 słów):\nNazwa: {produkt['nazwa']}\nCechy: {produkt['cechy']}"

opisy = przetworz_masowo(produkty, prompt_opis)
for prod_id, opis in opisy.items():
    print(f"\n{prod_id}: {opis}")
```

---

## Limity i parametry

| Parametr | Wartość |
|---|---|
| Max żądań w jednym batchu | 100 000 lub 256 MB (pierwsze z osiągniętych) |
| Czas przetwarzania (typowy) | < 1 godziny |
| Czas przetwarzania (max) | 24 godziny |
| Cena | 50% standardowej stawki API |
| max_tokens limit | Do 300k dla Opus 4.6 i Sonnet 4.6 (z beta headerem) |

Wyniki są dostępne przez 29 dni po zakończeniu batcha.

---

## Łączenie z prompt cachingiem

Batch API i prompt caching można łączyć — zniżki się sumują. Przy dużym, stałym system prompcie i wielu żądaniach:
- 50% zniżki z Batch API
- 90% zniżki na tokeny odczytane z cache

W praktyce może to oznaczać koszt na poziomie **kilku procent** standardowej ceny przy masowym przetwarzaniu z cachowanym kontekstem.

---

## Anulowanie batcha

Jeśli coś pójdzie nie tak lub potrzebny jest nagły stop:

```python
client.messages.batches.cancel("msgbatch_01HkcTjaV5uDC8jWR4ZsDV8d")
```

Już przetworzone żądania zostaną zachowane — anulowane są tylko te jeszcze w kolejce.

---

## Kiedy Batch API to nie jest dobry wybór

- zadanie wymaga odpowiedzi natychmiast (użytkownik czeka)
- jest mniej niż ~50 żądań — narzut organizacyjny nie jest wart zachodu
- zadania są od siebie zależne (wynik jednego to wejście kolejnego)
- potrzeba interaktywnej korekty wyników w trakcie przetwarzania

---

## Podsumowanie

Message Batches API to proste: tworzysz listę żądań z `custom_id`, wysyłasz batch, czekasz na status `ended`, pobierasz wyniki. Cena 50% standardowej stawki sprawia, że przy masowym przetwarzaniu jest to oczywisty wybór. Każdy element batcha jest niezależny — można mieszać różne prompty, modele i parametry w jednym żądaniu. Wyniki mogą przychodzić w innej kolejności niż żądania — dlatego `custom_id` jest kluczowy do dopasowania.

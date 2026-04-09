---
title: "Ewaluacja i testowanie promptów"
description: "Jak mierzyć jakość promptów, budować zestawy testowe i zapewnić, że Claude zachowuje się zgodnie z oczekiwaniami w każdych warunkach"
order: 22
---

# Ewaluacja i testowanie promptów

Dobry prompt to taki, który działa nie tylko raz — ale konsekwentnie, na różnych danych wejściowych, po zmianach modelu i po refaktoryzacji systemu promptu. Bez systematycznej ewaluacji nie wiadomo, czy zmiana promptu poprawia czy pogarsza wyniki. Ten poradnik pokazuje, jak zbudować rzetelny proces testowania od prostych asercji po zaawansowaną ewaluację z użyciem Claude'a jako sędziego.

---

## Po co w ogóle ewaluować?

Bez ewaluacji wpadamy w kilka typowych pułapek:

- **Regresje** — zmiana systemu promptu poprawia jedną rzecz, psuje inną, tego nie widzimy
- **Overfitting na przykładach** — prompt działa na 5 testowych przykładach, zawodzi na produkcji
- **Brak baseline** — nie wiemy, czy nowa wersja promptu jest lepsza od starej
- **Subiektywne oceny** — każdy w zespole inaczej ocenia „dobry" wynik

Ewaluacja to fundament, bez którego iterowanie nad promptami jest strzelaniem na ślepo.

---

## Poziomy ewaluacji

Stosuj podejście warstwowe — zacznij od prostego, dodawaj złożoność tylko gdy potrzeba:

```
Poziom 1 — Asercje i reguły       (szybkie, deterministyczne)
Poziom 2 — LLM as judge           (elastyczne, semantyczne)
Poziom 3 — Human eval             (najdokładniejsze, kosztowne)
Poziom 4 — A/B testy produkcyjne  (prawdziwy ruch, wolne)
```

---

## Poziom 1 — Asercje i reguły

Najprostsze testy: sprawdź czy odpowiedź spełnia formalne kryteria. Szybkie, zero dodatkowych kosztów API.

```python
import anthropic
import json
import re

claude = anthropic.Anthropic()

def uruchom_prompt(system: str, pytanie: str) -> str:
    resp = claude.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1024,
        system=system,
        messages=[{"role": "user", "content": pytanie}]
    )
    return resp.content[0].text

# Asercje formalne
def asercje_format(odpowiedz: str) -> dict[str, bool]:
    return {
        "niepusta": len(odpowiedz.strip()) > 0,
        "nie_za_dluga": len(odpowiedz) < 2000,
        "bez_markdown": "```" not in odpowiedz,  # jeśli nie chcemy kodu
        "po_polsku": any(c in odpowiedz for c in "ąęśćżźńółĄĘŚĆŻŹŃÓŁ"),
    }

def asercje_tresci(odpowiedz: str, slowa_wymagane: list[str], slowa_zakazane: list[str]) -> dict[str, bool]:
    odp_lower = odpowiedz.lower()
    wyniki = {}
    for slowo in slowa_wymagane:
        wyniki[f"zawiera_{slowo}"] = slowo.lower() in odp_lower
    for slowo in slowa_zakazane:
        wyniki[f"nie_zawiera_{slowo}"] = slowo.lower() not in odp_lower
    return wyniki

# Test klasyfikacji — wynik musi być jedną z dozwolonych kategorii
def test_klasyfikacji():
    SYSTEM = "Klasyfikuj opinię jako: POZYTYWNA, NEGATYWNA lub NEUTRALNA. Odpowiedz jednym słowem."
    DOZWOLONE = {"POZYTYWNA", "NEGATYWNA", "NEUTRALNA"}

    przypadki = [
        ("Produkt świetny, polecam!", "POZYTYWNA"),
        ("Totalne rozczarowanie, nie działa.", "NEGATYWNA"),
        ("Produkt OK, nic specjalnego.", "NEUTRALNA"),
    ]

    wyniki = []
    for opinia, oczekiwana in przypadki:
        odp = uruchom_prompt(SYSTEM, opinia).strip().upper()
        poprawna = odp == oczekiwana
        wyniki.append({
            "opinia": opinia,
            "oczekiwana": oczekiwana,
            "otrzymana": odp,
            "poprawna": poprawna,
            "w_zbiorze": odp in DOZWOLONE
        })

    print(f"Klasyfikacja: {sum(w['poprawna'] for w in wyniki)}/{len(wyniki)} poprawnych")
    return wyniki

test_klasyfikacji()
```

---

## Poziom 2 — LLM as Judge

Gdy ocena wymaga rozumienia semantycznego (nie tylko reguł formalnych), możemy użyć Claude'a jako sędziego. To potężna technika — model ocenia odpowiedź innego modelu według podanych kryteriów.

```python
def ocen_odpowiedz(
    pytanie: str,
    odpowiedz: str,
    kryteria: str,
    model_sedziowski: str = "claude-opus-4-6"  # mocniejszy model do oceny
) -> dict:
    """Używa Claude'a jako sędziego do oceny odpowiedzi."""

    prompt_sedziego = f"""Oceń poniższą odpowiedź według podanych kryteriów.

Pytanie użytkownika:
{pytanie}

Odpowiedź do oceny:
{odpowiedz}

Kryteria oceny:
{kryteria}

Odpowiedz w formacie JSON:
{{
  "ocena": <liczba 1-5>,
  "uzasadnienie": "<jedno zdanie dlaczego taka ocena>",
  "mocne_strony": ["<punkt 1>", "<punkt 2>"],
  "slabe_strony": ["<punkt 1>", "<punkt 2>"]
}}
Odpowiedz TYLKO JSON, bez żadnego dodatkowego tekstu."""

    resp = claude.messages.create(
        model=model_sedziowski,
        max_tokens=512,
        messages=[{"role": "user", "content": prompt_sedziego}]
    )

    try:
        return json.loads(resp.content[0].text)
    except json.JSONDecodeError:
        return {"ocena": 0, "uzasadnienie": "Błąd parsowania", "mocne_strony": [], "slabe_strony": []}

# Przykład użycia
pytanie = "Jakie są główne korzyści z pracy zdalnej?"
odpowiedz = uruchom_prompt("Jesteś ekspertem HR.", pytanie)

kryteria = """
1. Odpowiedź jest konkretna i zawiera co najmniej 3 korzyści
2. Ton jest profesjonalny i odpowiedni dla kontekstu biznesowego
3. Odpowiedź jest zwięzła (maksymalnie 200 słów)
4. Nie zawiera ogólników bez wartości merytorycznej
"""

ocena = ocen_odpowiedz(pytanie, odpowiedz, kryteria)
print(f"Ocena: {ocena['ocena']}/5 — {ocena['uzasadnienie']}")
```

### Ocena porównawcza — A vs B

```python
def porownaj_prompty(pytanie: str, system_a: str, system_b: str) -> dict:
    """Porównuje dwa systemy promptów i wskazuje lepszy."""
    odp_a = uruchom_prompt(system_a, pytanie)
    odp_b = uruchom_prompt(system_b, pytanie)

    prompt_porownania = f"""Porównaj dwie odpowiedzi na to samo pytanie i wskaż lepszą.

Pytanie: {pytanie}

Odpowiedź A:
{odp_a}

Odpowiedź B:
{odp_b}

Który wariant jest lepszy i dlaczego? Odpowiedz w JSON:
{{"lepszy": "A" lub "B" lub "remis", "uzasadnienie": "..."}}"""

    resp = claude.messages.create(
        model="claude-opus-4-6",
        max_tokens=256,
        messages=[{"role": "user", "content": prompt_porownania}]
    )

    wynik = json.loads(resp.content[0].text)
    return {**wynik, "odpowiedz_a": odp_a, "odpowiedz_b": odp_b}
```

---

## Budowanie zestawu testowego (eval set)

Dobry eval set to fundament wiarygodnej ewaluacji. Zasady:

**Jak zbierać przykłady:**
- Zbieraj rzeczywiste pytania z produkcji (z zachowaniem prywatności)
- Dodawaj edge case'y — pytania graniczne, niejednoznaczne, poza zakresem
- Uwzględnij typowe błędy, które model popełnia
- Dąż do minimum 50 przykładów, optymalnie 200+

```python
# Struktura zestawu testowego
EVAL_SET = [
    {
        "id": "ev001",
        "kategoria": "klasyczna_obsługa",
        "pytanie": "Jak anulować zamówienie złożone wczoraj?",
        "oczekiwane_elementy": ["formularz anulowania", "termin", "kontakt"],
        "slowa_zakazane": ["nie wiem", "skontaktuj się z Google"],
        "max_dlugosc": 300
    },
    {
        "id": "ev002",
        "kategoria": "poza_zakresem",
        "pytanie": "Jaka będzie pogoda jutro w Warszawie?",
        "oczekiwane_elementy": ["poza zakresem", "nie mogę pomóc"],
        "slowa_zakazane": ["temperatura", "deszcz", "słonecznie"],
        "max_dlugosc": 150
    },
    {
        "id": "ev003",
        "kategoria": "edge_case",
        "pytanie": "Chcę zwrócić produkt kupiony 2 lata temu. Czy to możliwe?",
        "oczekiwane_elementy": ["polityka zwrotów", "termin"],
        "slowa_zakazane": [],
        "max_dlugosc": 400
    },
    # ... więcej przypadków
]

def uruchom_eval(system_prompt: str, eval_set: list) -> dict:
    """Uruchamia pełny zestaw ewaluacyjny i zwraca wyniki."""
    wyniki = []

    for przypadek in eval_set:
        odpowiedz = uruchom_prompt(system_prompt, przypadek["pytanie"])

        # Asercje automatyczne
        asercje = {
            "dlugosc_ok": len(odpowiedz) <= przypadek["max_dlugosc"],
            "zawiera_wymagane": all(
                el.lower() in odpowiedz.lower()
                for el in przypadek["oczekiwane_elementy"]
            ),
            "brak_zakazanych": all(
                sl.lower() not in odpowiedz.lower()
                for sl in przypadek["slowa_zakazane"]
            )
        }

        wyniki.append({
            "id": przypadek["id"],
            "kategoria": przypadek["kategoria"],
            "pytanie": przypadek["pytanie"],
            "odpowiedz": odpowiedz,
            "asercje": asercje,
            "wynik": all(asercje.values())
        })

    # Statystyki
    laczny = len(wyniki)
    poprawnych = sum(1 for w in wyniki if w["wynik"])

    return {
        "wynik_ogolny": poprawnych / laczny,
        "poprawnych": poprawnych,
        "laczny": laczny,
        "po_kategoriach": _statystyki_po_kategoriach(wyniki),
        "szczegoly": wyniki
    }

def _statystyki_po_kategoriach(wyniki: list) -> dict:
    kategorie = {}
    for w in wyniki:
        kat = w["kategoria"]
        if kat not in kategorie:
            kategorie[kat] = {"poprawnych": 0, "laczny": 0}
        kategorie[kat]["laczny"] += 1
        if w["wynik"]:
            kategorie[kat]["poprawnych"] += 1
    return {k: v["poprawnych"] / v["laczny"] for k, v in kategorie.items()}
```

---

## Porównywanie wersji promptów

Kluczowy workflow: iterujesz nad promptem, chcesz wiedzieć czy nowa wersja jest lepsza:

```python
def porownaj_wersje_systemu(
    system_v1: str,
    system_v2: str,
    eval_set: list,
    nazwa_v1: str = "v1",
    nazwa_v2: str = "v2"
) -> None:
    """Porównuje dwie wersje systemu promptu na tym samym eval secie."""
    print(f"Porównanie: {nazwa_v1} vs {nazwa_v2}")
    print(f"Liczba testów: {len(eval_set)}\n")

    wyniki_v1 = uruchom_eval(system_v1, eval_set)
    wyniki_v2 = uruchom_eval(system_v2, eval_set)

    print(f"{nazwa_v1}: {wyniki_v1['wynik_ogolny']:.1%} ({wyniki_v1['poprawnych']}/{wyniki_v1['laczny']})")
    print(f"{nazwa_v2}: {wyniki_v2['wynik_ogolny']:.1%} ({wyniki_v2['poprawnych']}/{wyniki_v2['laczny']})")

    delta = wyniki_v2["wynik_ogolny"] - wyniki_v1["wynik_ogolny"]
    kierunek = "▲" if delta > 0 else "▼" if delta < 0 else "="
    print(f"\nZmiana: {kierunek} {abs(delta):.1%}")

    # Pokaż przypadki gdzie wersje się różnią
    print("\nRóżnice między wersjami:")
    for w1, w2 in zip(wyniki_v1["szczegoly"], wyniki_v2["szczegoly"]):
        if w1["wynik"] != w2["wynik"]:
            status = f"{nazwa_v1}:{'✓' if w1['wynik'] else '✗'} → {nazwa_v2}:{'✓' if w2['wynik'] else '✗'}"
            print(f"  [{status}] {w1['pytanie'][:60]}...")
```

---

## Testowanie regresyjne w CI/CD

Warto uruchamiać ewaluację automatycznie przy każdej zmianie systemu promptu lub kodu:

```python
# run_eval.py — uruchamiaj jako część pipeline'u CI/CD
import sys

PROG_ZDAWALNOSCI = 0.90  # minimum 90% testów musi przejść

if __name__ == "__main__":
    system_prompt = open("system_prompt.txt").read()
    eval_set = json.load(open("eval_set.json"))

    wyniki = uruchom_eval(system_prompt, eval_set)

    print(f"Wynik: {wyniki['wynik_ogolny']:.1%}")
    print(f"Próg: {PROG_ZDAWALNOSCI:.0%}")

    if wyniki["wynik_ogolny"] < PROG_ZDAWALNOSCI:
        print("❌ FAIL — ewaluacja nie przeszła progu")
        sys.exit(1)
    else:
        print("✅ PASS — ewaluacja przeszła próg")
        sys.exit(0)
```

```yaml
# GitHub Actions / GitLab CI
eval:
  script:
    - pip install anthropic
    - python run_eval.py
  only:
    changes:
      - system_prompt.txt
      - eval_set.json
```

---

## Metryki specyficzne dla zadań

Różne typy zadań wymagają różnych metryk:

| Typ zadania | Metryka | Jak mierzyć |
|---|---|---|
| Klasyfikacja | Accuracy, F1 | Porównanie z etykietami |
| Ekstrakcja danych | Precision/Recall pól | Weryfikacja wymaganych pól |
| Generowanie tekstu | G-Eval, ROUGE | LLM as judge lub n-gram overlap |
| Odpowiedzi na pytania | Faithfulness, Relevance | LLM as judge |
| Bezpieczeństwo | Attack success rate | Testy penetracyjne |
| Latencja | p50/p95 TTFT | Pomiar czasu pierwszego tokena |

---

## Praktyczne wskazówki

**Zacznij małą liczbą testów** — 20 dobrych przykładów jest lepsze niż 200 byle jakich. Jakość i różnorodność ważniejsza niż liczba.

**Losuj kolejność** — przy porównaniu A vs B modele mogą preferować pierwszą lub drugą odpowiedź ze względu na pozycję. Losuj kolejność lub porównuj ślepo.

**Dokumentuj zmiany** — przy każdej iteracji promptu zapisuj co zmieniłeś i jaki był efekt. Git dla plików z promptami to dobra praktyka.

**Osobne zestawy** — użyj osobnego eval setu do tworzenia promptu (dev set) i osobnego do finalnej oceny (test set). Nie optymalizuj bezpośrednio pod test set.

**Monitoruj na produkcji** — zbieraj feedbacki użytkowników (thumbs up/down), wykrywaj anomalie w długości odpowiedzi, śledź stop_reason i tokeny.

---

## Podsumowanie

Ewaluacja promptów to cztery poziomy: szybkie asercje formalne (bez kosztów API), LLM as judge (elastyczna ocena semantyczna), human eval (przy wysokich stawkach) i A/B testy produkcyjne. Kluczowy artefakt to dobrze skonstruowany eval set — zbieraj przykłady z produkcji, uwzględniaj edge case'y i dąż do 50–200 przypadków. Uruchamiaj ewaluację automatycznie przy każdej zmianie promptu i trzymaj próg zdawalności jako bramkę jakości. Bez systematycznej ewaluacji iterowanie nad promptami to zgadywanie — z nią staje się inżynierią.

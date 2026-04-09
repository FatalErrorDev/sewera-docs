---
title: "Claude do analizy dokumentów"
description: "Jak używać Claude'a do czytania, wyciągania informacji i porównywania dokumentów firmowych"
order: 9
---

# Claude do analizy dokumentów

Jednym z najpotężniejszych zastosowań Claude'a jest praca z dokumentami. Zamiast godzinami przedzierać się przez długie raporty, umowy czy regulaminy — można wkleić tekst do Claude'a i zadawać konkretne pytania. Ten poradnik pokazuje, jak robić to skutecznie i bezpiecznie.

---

## Co Claude potrafi z dokumentem?

Kiedy wklejamy lub wgrywamy dokument do rozmowy, Claude może:

- **Streszczać** — skrócić długi tekst do kluczowych punktów
- **Odpowiadać na pytania** — wyciągać konkretne informacje bez czytania całości
- **Analizować** — oceniać argumenty, strukturę, kompletność
- **Porównywać** — zestawiać dwa dokumenty i wskazywać różnice
- **Klasyfikować** — przypisywać dokumenty do kategorii według zadanych kryteriów
- **Wyciągać dane** — tworzyć tabele z informacji rozrzuconych po tekście
- **Weryfikować** — sprawdzać, czy dokument spełnia określone wymagania

---

## Jak wgrać dokument do Claude'a?

Są dwa sposoby:

**1. Wklejenie tekstu bezpośrednio**
Kopiujesz treść dokumentu i wklejasz do okna czatu — najprościej i działa zawsze.

**2. Wgranie pliku**
W interfejsie claude.ai można wgrać plik (PDF, Word, TXT i inne) klikając ikonę spinacza. Claude odczyta jego zawartość automatycznie.

> **Uwaga:** przed wgraniem lub wklejeniem dokumentu zawsze sprawdź, czy nie zawiera danych osobowych klientów, informacji objętych NDA lub innych poufnych danych firmowych. Jeśli tak — zastąp je placeholderami lub nie używaj Claude'a do tego dokumentu.

---

## Streszczanie dokumentów

Najprostsze i najczęstsze zastosowanie. Kilka wariantów w zależności od potrzeby:

**Krótkie podsumowanie:**
> „Streść poniższy raport w maksymalnie 5 zdaniach. Skup się na najważniejszych wnioskach: [dokument]"

**Podsumowanie dla konkretnego odbiorcy:**
> „Napisz podsumowanie tego raportu dla zarządu — bez detali technicznych, tylko kluczowe liczby i rekomendacje. Maksymalnie pół strony A4: [dokument]"

**Lista kluczowych punktów:**
> „Wyciągnij z poniższego dokumentu 7 najważniejszych punktów w formie listy: [dokument]"

**Streszczenie sekcja po sekcji:**
> „Streść poniższy dokument sekcja po sekcji — jednym zdaniem na każdą sekcję: [dokument]"

---

## Pytania i odpowiedzi na podstawie dokumentu

Zamiast streszczać cały dokument, można zadawać konkretne pytania:

> ✅ „Na podstawie poniższej umowy odpowiedz: jaki jest okres wypowiedzenia i jakie są warunki jego skrócenia? [umowa]"

> ✅ „Z poniższego regulaminu wyciągnij wszystkie informacje dotyczące zwrotów i reklamacji: [regulamin]"

> ✅ „Czy w poniższej ofercie jest mowa o karach umownych? Jeśli tak — jakie i w jakiej wysokości? [oferta]"

> ✅ „Na podstawie poniższego protokołu ze spotkania — kto jest odpowiedzialny za każde z zadań i jaki mają termin? Podaj w formie tabeli: [protokół]"

---

## Porównywanie dokumentów

Claude świetnie radzi sobie z zestawianiem dwóch wersji tego samego dokumentu lub dwóch różnych dokumentów:

**Porównanie dwóch wersji:**
> „Poniżej dwie wersje tej samej umowy. Wskaż, co się zmieniło między wersją 1 a wersją 2 — skup się na zmianach merytorycznych, pomiń kosmetyczne różnice w sformułowaniach:
>
> `<wersja_1>`[treść]`</wersja_1>`
>
> `<wersja_2>`[treść]`</wersja_2>`"

**Porównanie dwóch ofert:**
> „Porównaj poniższe dwie oferty od dostawców. Kryteria porównania: cena, zakres usług, czas realizacji, warunki gwarancji. Wynik w formie tabeli:
>
> `<oferta_a>`[treść]`</oferta_a>`
>
> `<oferta_b>`[treść]`</oferta_b>`"

---

## Weryfikacja i ocena dokumentu

Claude może ocenić dokument według zadanych kryteriów — np. sprawdzić, czy oferta jest kompletna, czy umowa zawiera wszystkie wymagane elementy:

> ✅ „Sprawdź, czy poniższa oferta handlowa zawiera wszystkie standardowe elementy: dane stron, przedmiot umowy, cenę, termin realizacji, warunki płatności, gwarancję, kary umowne. Dla brakujących elementów zaznacz jako 'brak': [oferta]"

> ✅ „Oceń poniższy raport pod kątem struktury i kompletności. Co jest dobrze, czego brakuje, co można poprawić? [raport]"

> ✅ „Przeczytaj poniższy e-mail od klienta i oceń, czy jego reklamacja jest zasadna na podstawie naszych warunków gwarancji: [e-mail klienta] [warunki gwarancji]"

---

## Wyciąganie danych do tabeli

Szczególnie przydatne, gdy informacje są rozrzucone po długim tekście:

> ✅ „Przeczytaj poniższe opisy 5 produktów i stwórz tabelę z kolumnami: nazwa produktu, cena, dostępne kolory, czas dostawy, gwarancja: [opisy produktów]"

> ✅ „Z poniższych CV wyciągnij do tabeli: imię i nazwisko, lata doświadczenia, znajomość języków, ostatnie stanowisko: [CV kandydatów]"

---

## Praca z wieloma dokumentami naraz

Claude może analizować kilka dokumentów jednocześnie — wystarczy je wyraźnie oddzielić i nazwać:

```
Mam do przeanalizowania trzy dokumenty. Proszę odpowiedzieć na pytania
na podstawie wszystkich trzech łącznie.

<dokument_1 nazwa="Raport Q2">
[treść]
</dokument_1>

<dokument_2 nazwa="Raport Q3">
[treść]
</dokument_2>

<dokument_3 nazwa="Plan na Q4">
[treść]
</dokument_3>

Pytanie: Jakie trendy widać między Q2 a Q3 i czy plan na Q4 je uwzględnia?
```

---

## Typowe błędy przy pracy z dokumentami

| Błąd | Jak uniknąć |
|---|---|
| Wklejenie dokumentu bez pytania | Zawsze napisz, co Claude ma z dokumentem zrobić |
| Zbyt ogólne pytanie | Pytaj konkretnie — „co mówi o karach?" zamiast „co jest ważne?" |
| Wklejanie poufnych danych | Zastąp dane wrażliwe placeholderami przed wklejeniem |
| Zakładanie, że Claude zawsze ma rację | Przy ważnych decyzjach weryfikuj odpowiedzi w oryginalnym dokumencie |
| Wklejenie zbyt długiego dokumentu bez priorytetyzacji | Przy bardzo długich tekstach wskaż, które sekcje są najważniejsze |

---

## Podsumowanie

Claude to bardzo skuteczne narzędzie do pracy z dokumentami — streszcza, odpowiada na pytania, porównuje i wyciąga dane. Działa najlepiej, kiedy dostaje konkretne pytanie lub zadanie, a nie tylko sam dokument. Zawsze pamiętaj o bezpieczeństwie danych — nie wklejaj dokumentów z danymi osobowymi ani poufnymi informacjami firmowymi.

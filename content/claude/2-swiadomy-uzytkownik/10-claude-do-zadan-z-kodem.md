---
title: "Claude do zadań z kodem"
description: "Jak używać Claude'a do pisania, debugowania i wyjaśniania kodu — praktyczny przewodnik dla programistów i nie tylko"
order: 10
---

# Claude do zadań z kodem

Claude to jeden z najlepszych dostępnych asystentów do pracy z kodem. Pomaga zarówno doświadczonym programistom, jak i osobom, które z kodem mają niewiele wspólnego, ale potrzebują np. prostego skryptu lub pomocy ze zrozumieniem technicznego fragmentu. Ten poradnik pokazuje, jak wyciągnąć z Claude'a maksimum przy zadaniach programistycznych.

---

## Co Claude potrafi z kodem?

- **Pisać kod** od zera na podstawie opisu zadania
- **Debugować** — znajdować i naprawiać błędy w istniejącym kodzie
- **Wyjaśniać** — tłumaczyć, co robi dany fragment kodu, prostym językiem
- **Refaktoryzować** — poprawiać jakość kodu bez zmiany jego działania
- **Tłumaczyć między językami** — przepisywać kod z jednego języka na drugi
- **Pisać testy** — generować testy jednostkowe i integracyjne
- **Dokumentować** — dodawać komentarze i tworzyć dokumentację techniczną
- **Optymalizować** — sugerować wydajniejsze rozwiązania

---

## Pisanie kodu od zera

Kluczem jest dokładny opis tego, co kod ma robić. Im więcej kontekstu, tym lepszy wynik.

**Słaby prompt:**
> „Napisz skrypt w Pythonie."

**Dobry prompt:**
> „Napisz skrypt w Pythonie, który:
> - wczytuje plik CSV z kolumnami: data, produkt, sprzedaż
> - grupuje dane po produkcie i sumuje sprzedaż
> - zapisuje wynik do nowego pliku CSV posortowanego malejąco po sumie sprzedaży
> Używaj biblioteki pandas. Dodaj komentarze wyjaśniające każdy krok."

**Inne przykłady:**

> ✅ „Napisz funkcję w JavaScript, która przyjmuje tablicę obiektów z polami 'imię' i 'wiek' i zwraca tylko osoby pełnoletnie, posortowane alfabetycznie po imieniu."

> ✅ „Napisz zapytanie SQL, które zwraca 10 klientów z największą łączną wartością zamówień z ostatnich 30 dni. Tabele: klienci (id, imię, email), zamówienia (id, klient_id, wartość, data)."

> ✅ „Napisz prosty skrypt Bash, który codziennie o północy archiwizuje folder /var/logs do pliku zip z datą w nazwie i usuwa archiwa starsze niż 30 dni."

---

## Debugowanie — znajdowanie błędów

Wklej kod razem z opisem problemu i komunikatem błędu, jeśli taki jest:

> ✅ „Poniższy kod Pythona rzuca błąd TypeError. Znajdź przyczynę i napraw:
>
> ```python
> def oblicz_srednia(liczby):
>     return sum(liczby) / len(liczby)
>
> wynik = oblicz_srednia('123')
> print(wynik)
> ```
>
> Błąd: TypeError: unsupported operand type(s) for +: 'int' and 'str'"

> ✅ „Ten fragment kodu SQL nie zwraca oczekiwanych wyników — zamiast zamówień z ostatniego tygodnia, zwraca wszystkie. Gdzie jest błąd?
>
> ```sql
> SELECT * FROM zamowienia
> WHERE data_zamowienia > '2024-01-01'
> ```"

**Wskazówka:** zawsze dołączaj komunikat błędu — to bardzo przyspiesza diagnozę.

---

## Wyjaśnianie kodu

Przydatne, kiedy dostajesz kod od kogoś innego i trzeba zrozumieć, co robi — albo kiedy uczysz się nowego języka.

> ✅ „Wyjaśnij, co robi poniższy kod, krok po kroku. Tłumacz tak, jakbyś mówił do osoby, która zna podstawy programowania, ale nie zna tego języka:
>
> ```javascript
> const result = arr.reduce((acc, curr) => {
>   return { ...acc, [curr.id]: curr };
> }, {});
> ```"

> ✅ „Przeczytaj poniższą funkcję i odpowiedz: co przyjmuje na wejściu, co zwraca i jakie są możliwe edge case'y (przypadki brzegowe)? [kod]"

> ✅ „Wyjaśnij mi poniższe zapytanie SQL prostym językiem — co ono robi i dlaczego: [zapytanie]"

---

## Refaktoryzacja i poprawa jakości kodu

> ✅ „Poniższy kod działa poprawnie, ale jest nieczytelny. Zrefaktoryzuj go — popraw nazwy zmiennych, rozbij na mniejsze funkcje i usuń duplikacje. Nie zmieniaj logiki działania: [kod]"

> ✅ „Oceń poniższy kod pod kątem jakości. Jakie są jego słabe strony i jak je poprawić? [kod]"

> ✅ „Przepisz poniższą funkcję tak, żeby była bardziej wydajna — aktualnie działa w O(n²), spróbuj to zoptymalizować: [kod]"

---

## Tłumaczenie między językami

> ✅ „Przepisz poniższą funkcję z Pythona na JavaScript, zachowując tę samą logikę: [kod]"

> ✅ „Mam ten skrypt w Bash — przepisz go na Pythona, żeby był łatwiejszy w utrzymaniu: [kod]"

---

## Pisanie testów

> ✅ „Napisz testy jednostkowe dla poniższej funkcji w Pythonie używając biblioteki pytest. Uwzględnij przypadki brzegowe — puste dane wejściowe, wartości ujemne, bardzo duże liczby: [kod funkcji]"

> ✅ „Napisz testy dla poniższego endpointu API w Jest. Sprawdź odpowiedzi dla poprawnych danych, brakujących pól i błędnej autoryzacji: [kod endpointu]"

---

## Dokumentowanie kodu

> ✅ „Dodaj docstringi do wszystkich funkcji w poniższym pliku Python. Każdy docstring powinien zawierać: opis, parametry wejściowe z typami i opis wartości zwracanej: [kod]"

> ✅ „Na podstawie poniższego kodu napisz README w Markdown dla tego projektu. Uwzględnij: opis, wymagania, instalację, przykład użycia: [kod]"

---

## Dla osób nietech — proste skrypty bez programowania

Claude jest pomocny nie tylko dla programistów. Pracownik bez doświadczenia technicznego też może poprosić o prosty skrypt do konkretnego zadania:

> ✅ „Nie znam się na programowaniu. Napisz mi prosty skrypt w Pythonie, który otwiera plik Excel z kolumnami 'imię', 'email', 'dział' i tworzy osobne pliki CSV dla każdego działu. Wyjaśnij też krok po kroku, jak go uruchomić na Windows."

> ✅ „Napisz formułę Excel, która w kolumnie D wylicza prowizję: 5% jeśli wartość w kolumnie C jest mniejsza niż 1000, 8% jeśli między 1000 a 5000, i 12% powyżej 5000. Wyjaśnij, jak ją wpisać."

---

## Bezpieczeństwo — na co uważać

- **Nie wklejaj kluczy API, haseł ani tokenów** — nawet zakomentowanych w kodzie
- **Nie wklejaj kodu z danymi produkcyjnymi** — zastąp je przykładowymi wartościami
- **Zawsze sprawdzaj kod przed uruchomieniem** — Claude może się mylić, szczególnie w złożonych przypadkach
- **Przy krytycznych systemach** — traktuj kod od Claude'a jako punkt startowy, nie gotowe rozwiązanie produkcyjne

---

## Podsumowanie — checklista do promptu z kodem

Przed wysłaniem promptu z zadaniem programistycznym warto sprawdzić:

- [ ] Czy podałem/podałam **język programowania**?
- [ ] Czy opisałem/opisałam **co kod ma robić** (wejście, wyjście, logika)?
- [ ] Czy dołączyłem/dołączyłam **istniejący kod** jeśli chodzi o poprawę / debug?
- [ ] Czy dołączyłem/dołączyłam **komunikat błędu** jeśli jest?
- [ ] Czy wspomniałem/wspomniałam o **bibliotekach lub frameworkach**, których chcę używać?
- [ ] Czy usunąłem/usunęłam **wrażliwe dane** (klucze, hasła, dane osobowe)?

Im więcej punktów odhaczonych — tym lepszy i bezpieczniejszy wynik.

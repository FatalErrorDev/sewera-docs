---
title: "Prompt engineering — techniki, które naprawdę działają"
description: "Chain-of-thought, few-shot, role prompting i XML tags — praktyczny przewodnik po skutecznych technikach promptowania"
order: 6
---

# Prompt engineering — techniki, które naprawdę działają

W poprzednim poradniku poznałeś/poznałaś podstawowe zasady pisania promptów. Czas pójść o krok dalej. Prompt engineering to zestaw sprawdzonych technik, które pozwalają wyciągać z Claude'a znacznie lepsze odpowiedzi — szczególnie przy złożonych zadaniach. Żadna z nich nie wymaga wiedzy technicznej. Wystarczy wiedzieć, kiedy i jak je stosować.

---

## Technika 1 — Chain-of-thought (myślenie krok po kroku)

**Na czym polega?** Prosisz Claude'a, żeby zanim odpowiedział, rozpisał swoje rozumowanie. Dzięki temu model „myśli głośno" i dochodzi do lepszych, dokładniejszych wniosków.

**Kiedy stosować?** Przy analizie, podejmowaniu decyzji, rozwiązywaniu problemów, ocenianiu opcji.

**Jak to wygląda w praktyce:**

> ❌ „Która oferta jest lepsza — A czy B?"
>
> ✅ „Porównaj oferty A i B. Zanim odpowiesz, rozpisz krok po kroku swoje rozumowanie — co przemawia za każdą z nich, jakie są ryzyka, co jest dla nas najważniejsze. Dopiero na końcu podaj rekomendację."

**Prosta wersja — wystarczy dodać jedno zdanie:**

- „Myśl krok po kroku."
- „Zanim odpowiesz, rozpisz swoje rozumowanie."
- „Pokaż tok myślenia, a potem podaj wniosek."

---

## Technika 2 — Few-shot prompting (przykłady jako wzorzec)

**Na czym polega?** Zamiast opisywać, czego oczekujesz, po prostu pokazujesz Claude'owi kilka przykładów poprawnych odpowiedzi. Model rozpoznaje wzorzec i go odtwarza.

**Kiedy stosować?** Kiedy masz konkretny format, styl lub strukturę, którą chcesz zachować. Idealne do powtarzalnych zadań.

**Przykład — klasyfikacja zgłoszeń:**

> „Klasyfikuj poniższe zgłoszenia do jednej z kategorii: Reklamacja, Pytanie techniczne, Prośba o ofertę.
>
> Przykłady:
> Zgłoszenie: 'Produkt przestał działać po tygodniu.' → Reklamacja
> Zgłoszenie: 'Jak skonfigurować integrację z API?' → Pytanie techniczne
> Zgłoszenie: 'Ile kosztuje licencja dla 50 użytkowników?' → Prośba o ofertę
>
> Teraz sklasyfikuj: 'Otrzymałem uszkodzony produkt i chcę zwrot.' →"

**Przykład — zachowanie stylu pisania:**

> „Przepisz poniższe punkty w stylu takim jak w przykładzie.
>
> Przykład wejście: 'Spotkanie opóźnione.'
> Przykład wyjście: 'Informujemy, że termin spotkania uległ przesunięciu. Nowy harmonogram zostanie przekazany wkrótce.'
>
> Teraz przepisz: 'Projekt skończony, czekamy na akceptację.' →"

---

## Technika 3 — Role prompting (nadawanie roli)

**Na czym polega?** Mówisz Claude'owi, jaką rolę ma przyjąć — eksperta, recenzenta, klienta, prawnika, nauczyciela. Claude dostosowuje styl, język i perspektywę do podanej roli.

**Kiedy stosować?** Kiedy potrzebujesz konkretnej perspektywy, specjalistycznego języka lub chcesz zasymulować rozmowę z określoną osobą.

**Przykłady:**

> ✅ „Jesteś doświadczonym copywriterem specjalizującym się w B2B. Napisz opis usługi, który trafi do dyrektorów finansowych."

> ✅ „Wciel się w rolę sceptycznego klienta, który właśnie przeczytał naszą ofertę. Jakie pytania i wątpliwości mógłby mieć?"

> ✅ „Jesteś ekspertem od UX. Przejrzyj poniższą instrukcję obsługi i wskaż miejsca, które mogą być niejasne dla użytkownika."

> ✅ „Zachowuj się jak surowy redaktor — skróć ten tekst o połowę, nie litując się nad żadnym zbędnym słowem."

**Wskazówka:** Rola działa najlepiej, gdy jest konkretna. „Ekspert" to za mało — lepiej „doświadczony rekruter z branży IT" albo „CFO w średniej firmie produkcyjnej".

---

## Technika 4 — XML tags (znaczniki do strukturyzowania promptu)

**Na czym polega?** Używasz prostych znaczników w stylu HTML, żeby wyraźnie oddzielić różne części promptu — instrukcje, dane wejściowe, przykłady, kontekst. Claude bardzo dobrze rozumie taką strukturę i rzadziej myli różne części promptu.

**Kiedy stosować?** Przy długich, złożonych promptach, gdzie wklejasz dużo tekstu i chcesz mieć pewność, że Claude wie, co jest instrukcją, a co danymi do przetworzenia.

**Przykład bez tagów (ryzyko pomyłki):**

> „Podsumuj ten tekst w 3 punktach. Tekst: Firma ogłosiła wyniki za Q3. Przychody wzrosły o 12%..."

**Przykład z tagami (czytelne i bezpieczne):**

> „Podsumuj poniższy raport w 3 punktach. Skup się na wynikach finansowych.
>
> `<raport>`
> Firma ogłosiła wyniki za Q3. Przychody wzrosły o 12% rok do roku...
> `</raport>`"

**Bardziej rozbudowany przykład:**

```
<rola>
Jesteś analitykiem biznesowym z doświadczeniem w branży e-commerce.
</rola>

<zadanie>
Oceń poniższą strategię ekspansji i wskaż 3 główne ryzyka.
</zadanie>

<kontekst>
Firma sprzedaje produkty premium online, głównie w Polsce. Rozważa wejście na rynek niemiecki.
</kontekst>

<dokument>
[tu wklejamy strategię do oceny]
</dokument>
```

Nazwy tagów możesz wymyślać dowolnie — ważne, żeby były logiczne i spójne.

---

## Łączenie technik

Najlepsze efekty daje łączenie kilku technik naraz. Przykład promptu, który używa roli, chain-of-thought i XML tagów:

```
<rola>
Jesteś doświadczonym project managerem z certyfikatem PMP.
</rola>

<zadanie>
Oceń poniższy plan projektu. Myśl krok po kroku — najpierw zidentyfikuj mocne strony,
potem ryzyka, a na końcu podaj 3 konkretne rekomendacje.
</zadanie>

<plan>
[tu wklejamy plan projektu]
</plan>
```

---

## Kiedy stosować którą technikę?

| Sytuacja | Technika |
|---|---|
| Złożona analiza, decyzja, ocena | Chain-of-thought |
| Powtarzalne zadania z konkretnym formatem | Few-shot |
| Potrzebujesz specjalistycznej perspektywy | Role prompting |
| Długi prompt z dużą ilością danych | XML tags |
| Skomplikowane zadanie wymagające precyzji | Połączenie kilku technik |

---

## Podsumowanie

Cztery techniki warte zapamiętania:

1. **Chain-of-thought** — poproś o myślenie krok po kroku przy złożonych zadaniach
2. **Few-shot** — pokaż przykłady, kiedy zależy na konkretnym formacie
3. **Role prompting** — nadaj Claude'owi rolę, kiedy potrzebujesz konkretnej perspektywy
4. **XML tags** — strukturyzuj długie prompty znacznikami, żeby uniknąć pomyłek

Każda z tych technik działa samodzielnie, a razem dają bardzo precyzyjną kontrolę nad tym, co Claude produkuje.

---
title: Czego NIE wolno wysyłać do AI? Praktyczny przewodnik bezpieczeństwa
description: Co wysyłać do AI, a czego nie — instrukcja dla pracowników
order: 5
---

# Czego NIE wolno wysyłać do AI? Praktyczny przewodnik bezpieczeństwa

> **Dla kogo jest ten dokument?**
> Dla każdego pracownika, który korzysta z ChatGPT, Claude, Gemini, Copilot lub innych narzędzi AI online — niezależnie od stanowiska i poziomu technicznego.

---

## Zanim zaczniesz — jak działają modele AI online?

Kiedy wpisujesz coś do ChatGPT czy Claude, Twoja wiadomość opuszcza komputer i trafia na serwery zewnętrznej firmy (np. OpenAI, Anthropic, Google). To tak, jakbyś wysyłał e-mail do obcej osoby — nie masz pełnej kontroli nad tym, co stanie się z treścią po wysłaniu.

Niektóre serwisy mogą wykorzystywać Twoje dane do dalszego trenowania modeli. Oznacza to, że wpisana informacja może „wpłynąć" na przyszłe odpowiedzi dla innych użytkowników.

**Zasada ogólna: nie wpisuj do AI niczego, czego nie wysłałbyś pocztą na przypadkowy adres e-mail.**

---

## KATEGORIA 1: Dane osobowe pracowników i klientów

### Co to oznacza w praktyce?

Imiona i nazwiska w połączeniu z innymi danymi, numery PESEL, numery dowodów osobistych, adresy zamieszkania, numery telefonów prywatnych, adresy e-mail prywatne, dane medyczne, informacje o wynagrodzeniach poszczególnych osób.

### Dlaczego nie wolno?

Naruszasz RODO (Rozporządzenie o Ochronie Danych Osobowych). Grożą za to kary do 20 milionów euro lub 4% rocznego obrotu firmy. Dane mogą wyciec i trafić do niepowołanych osób. Firma traci kontrolę nad tym, kto ma dostęp do tych informacji.

### Przykład — jak to wygląda?

| ❌ Tak NIE rób | ✅ Tak MOŻESZ zrobić |
|---|---|
| „Napisz ocenę roczną dla Jana Kowalskiego, PESEL 90010112345, który zarabia 8500 zł" | „Napisz szablon oceny rocznej dla pracownika działu sprzedaży z 5-letnim stażem" |
| „Klient Adam Nowak, tel. 600-100-200, reklamuje produkt X" | „Klient reklamuje produkt X z powodu uszkodzenia w transporcie. Napisz odpowiedź" |

---

## KATEGORIA 2: Tajemnice handlowe i strategia firmy

### Co to oznacza w praktyce?

Plany strategiczne, nowe produkty przed premierą, warunki umów z kontrahentami, marże i polityka cenowa, wyniki finansowe przed publikacją, plany fuzji, przejęć lub restrukturyzacji, szczegóły negocjacji handlowych.

### Dlaczego nie wolno?

Konkurencja może uzyskać dostęp do tych informacji. Wpisane dane mogą pojawić się w odpowiedziach dla innych użytkowników (w tym pracowników konkurencji). Utrata przewagi konkurencyjnej może kosztować firmę miliony. Możesz naruszyć umowy o poufności (NDA) podpisane z partnerami.

### Przykład — jak to wygląda?

| ❌ Tak NIE rób | ✅ Tak MOŻESZ zrobić |
|---|---|
| „Przygotuj analizę naszej marży 42% na produkt X przed wejściem na rynek niemiecki w Q3" | „Przygotuj szablon analizy marży dla firmy wchodzącej na nowy rynek europejski" |
| „Nasza oferta dla firmy ABC to 2,3 mln zł, a ich budżet to 3 mln" | „Pomóż mi przygotować argumenty negocjacyjne dla oferty B2B w branży IT" |

---

## KATEGORIA 3: Hasła, klucze dostępu i dane logowania

### Co to oznacza w praktyce?

Hasła do systemów firmowych, klucze API (ciągi znaków do łączenia systemów), tokeny dostępu, certyfikaty bezpieczeństwa, dane konfiguracji serwerów (adresy IP, porty), kody dostępu do VPN.

### Dlaczego nie wolno?

To jak podanie klucza do mieszkania nieznajomemu. Każdy, kto uzyska te dane, może uzyskać dostęp do systemów firmy. Jedno wycieknięte hasło może otworzyć drzwi do całej infrastruktury IT. Odzyskanie kontroli po wycieku bywa kosztowne i czasochłonne.

### Przykład — jak to wygląda?

| ❌ Tak NIE rób | ✅ Tak MOŻESZ zrobić |
|---|---|
| „Ten kod nie działa, hasło to Admin123!, a klucz API to sk-abc123def456" | „Ten kod nie działa, zwraca błąd 401. Co może być przyczyną?" |
| „Nasz serwer jest pod adresem 192.168.1.50, port 3306, user: root" | „Jak skonfigurować połączenie z bazą danych MySQL w Pythonie?" |

---

## KATEGORIA 4: Kod źródłowy i własność intelektualna

### Co to oznacza w praktyce?

Kod źródłowy wewnętrznych aplikacji, algorytmy firmowe, patenty i zgłoszenia patentowe przed publikacją, projekty techniczne, receptury i formuły produktów, unikalne procesy produkcyjne.

### Dlaczego nie wolno?

Kod źródłowy to serce produktów firmy. Wklejając go do AI, de facto udostępniasz go firmie trzeciej. Konkurencja może odtworzyć Twój produkt. Możesz naruszyć prawa autorskie — zarówno firmowe, jak i licencje open source.

### Przykład — jak to wygląda?

| ❌ Tak NIE rób | ✅ Tak MOŻESZ zrobić |
|---|---|
| Wklejanie całych plików z repozytorium firmowego | „Jak napisać funkcję sortującą listę obiektów po dacie w Pythonie?" |
| „Oto nasz algorytm wyceny — popraw go" (z pełnym kodem) | „Mam algorytm wyceny oparty na 3 zmiennych. Jakie podejście optymalizacyjne polecasz?" |

---

## KATEGORIA 5: Dokumenty prawne i regulacyjne

### Co to oznacza w praktyce?

Treści umów z klientami i dostawcami, dokumenty sądowe i procesowe, wewnętrzne opinie prawne, dokumentacja audytowa, raporty compliance, korespondencja z regulatorami (np. UOKiK, KNF).

### Dlaczego nie wolno?

Dokumenty prawne zawierają informacje objęte tajemnicą adwokacką lub radcowską. Ujawnienie szczegółów umów może naruszyć klauzule poufności. W przypadku sporu sądowego wyciek może osłabić pozycję firmy.

### Przykład — jak to wygląda?

| ❌ Tak NIE rób | ✅ Tak MOŻESZ zrobić |
|---|---|
| Wklejanie pełnej treści umowy z kontrahentem | „Jakie klauzule powinny znaleźć się w umowie SLA na usługi IT?" |
| „Oto pismo od UOKiK, napisz odpowiedź" (z pełną treścią) | „Jakie są typowe elementy odpowiedzi na zapytanie regulatora dot. polityki cenowej?" |

---

## KATEGORIA 6: Dane finansowe i księgowe

### Co to oznacza w praktyce?

Numery kont bankowych firmy, szczegółowe raporty finansowe przed publikacją, dane podatkowe, faktury z danymi kontrahentów, budżety projektowe z konkretnymi kwotami.

### Dlaczego nie wolno?

Dane finansowe mogą być wykorzystane do oszustw. Informacje przed publikacją podlegają regulacjom o informacji poufnej (insider trading). Wyciek budżetów osłabia pozycję negocjacyjną.

### Przykład — jak to wygląda?

| ❌ Tak NIE rób | ✅ Tak MOŻESZ zrobić |
|---|---|
| „Przeanalizuj ten rachunek zysków i strat za Q2 2025" (z prawdziwymi danymi) | „Jak interpretować spadek marży brutto o 5 pp. w firmie produkcyjnej?" |
| „Konto firmowe 12 3456 7890 1234 5678, przelew na 50 tys." | „Jak zautomatyzować raportowanie przelewów w Excelu?" |

---

## Skrócona ściągawka — wydrukuj i przyklej przy biurku

| Kategoria | Nie wysyłaj | Możesz wysyłać |
|---|---|---|
| **Dane osobowe** | Imię+nazwisko+PESEL, adresy, pensje | Zanonimizowane opisy sytuacji |
| **Tajemnice firmy** | Marże, plany, warunki umów | Ogólne pytania o strategię |
| **Hasła i klucze** | Hasła, klucze API, adresy serwerów | Opisy błędów bez danych dostępowych |
| **Kod źródłowy** | Firmowy kod, algorytmy | Ogólne pytania programistyczne |
| **Dokumenty prawne** | Treści umów, pisma procesowe | Pytania o typowe klauzule |
| **Dane finansowe** | Numery kont, raporty, faktury | Pytania o metody analizy |

---

## Złota zasada anonimizacji — metoda „Firma XYZ"

Jeśli musisz opisać konkretną sytuację, zamień wszystkie dane identyfikujące na fikcyjne.

**Przed (ŹLEJ):**
> Klient Jan Kowalski z firmy Budimex reklamuje dostawę 500 ton stali za 2,1 mln zł z 15 marca. Kontakt: j.kowalski@budimex.pl

**Po (DOBRZE):**
> Klient z branży budowlanej reklamuje dużą dostawę materiałów budowlanych z zeszłego miesiąca. Jak napisać profesjonalną odpowiedź na reklamację?

---

## Co zrobić, gdy już wysłałeś coś, czego nie powinieneś?

1. **Nie panikuj** — ale działaj szybko.
2. **Zgłoś incydent** do działu IT lub osoby odpowiedzialnej za bezpieczeństwo informacji.
3. **Zmień hasła**, jeśli wysłałeś dane dostępowe.
4. **Usuń konwersację** w narzędziu AI (jeśli jest taka opcja), choć nie gwarantuje to usunięcia danych z serwerów.
5. **Udokumentuj** co zostało wysłane i kiedy — to pomoże w ocenie ryzyka.

---

## Podsumowanie

Narzędzia AI to potężne wsparcie w codziennej pracy. Korzystaj z nich śmiało — ale traktuj je jak rozmowę w miejscu publicznym. Nie mów głośno tego, co powinno zostać w firmie.

**Trzy pytania, które warto sobie zadać przed każdym promptem:**

1. Czy te dane identyfikują konkretną osobę, firmę lub system?
2. Czy straciłbym spokój, gdyby to przeczytał mój szef, klient lub konkurencja?
3. Czy mogę osiągnąć ten sam cel, opisując sytuację ogólnie?

Jeśli odpowiedź na pytanie 1 lub 2 brzmi „tak" — zanonimizuj lub przeformułuj.

---

*Wersja dokumentu: 1.0 | Data: marzec 2026*
*Dokument przygotowany jako wewnętrzna instrukcja bezpieczeństwa informacji.*

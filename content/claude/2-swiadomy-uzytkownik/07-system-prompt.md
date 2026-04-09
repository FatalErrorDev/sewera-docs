---
title: "System prompt — czym jest i jak go używać"
description: "Czym różni się system prompt od zwykłej wiadomości, do czego służy i jak go dobrze napisać"
order: 7
---

# System prompt — czym jest i jak go używać

Kiedy korzystamy z Claude'a przez portal firmowy lub własną aplikację, często za kulisami działa coś, czego nie widać w oknie rozmowy — system prompt. To właśnie on decyduje o tym, jak Claude się zachowuje, jaki ma ton, czym się zajmuje i czego unika. Ten poradnik wyjaśnia, czym jest system prompt i jak go skutecznie pisać.

---

## Czym jest system prompt?

Rozmowa z Claude'em składa się z dwóch rodzajów wiadomości:

- **User message** — to, co piszemy na co dzień w oknie czatu
- **System prompt** — instrukcja działająca „w tle", ustawiana przez administratora lub programistę przed rozpoczęciem rozmowy

Można to porównać do briefingu przed rozmową z pracownikiem. User message to konkretne polecenie na dany dzień. System prompt to ogólne wytyczne — kim jest ten pracownik, co robi, jak się zachowuje, czego unika.

```
┌─────────────────────────────────────┐
│         SYSTEM PROMPT               │
│  (instrukcje ogólne, stała baza)    │
├─────────────────────────────────────┤
│         USER MESSAGE                │
│  (konkretne pytanie / polecenie)    │
└─────────────────────────────────────┘
```

---

## Do czego służy system prompt?

System prompt pozwala z góry skonfigurować Claude'a tak, żeby:

- **Zachowywał konkretną rolę** — np. „jesteś asystentem działu HR"
- **Mówił określonym językiem i tonem** — np. formalnie, po polsku, bez żargonu
- **Trzymał się wybranego zakresu tematów** — np. odpowiadał tylko na pytania o produkty firmy
- **Zawsze pamiętał ważny kontekst** — np. nazwę firmy, obowiązujące procedury, strukturę zespołu
- **Stosował konkretny format odpowiedzi** — np. zawsze używał list punktowanych, zawsze kończył pytaniem

---

## Przykład — bez systemu i z systemem

**Bez system promptu:**

> User: „Co zrobić z nowym pracownikiem, który nie oddał dokumentów?"
>
> Claude: [odpowiedź ogólna, może dotyczyć czegokolwiek]

**Z system promptem:**

```
Jesteś asystentem działu HR firmy XYZ. Odpowiadasz wyłącznie na pytania
dotyczące procedur kadrowych obowiązujących w Polsce. Używasz języka
formalnego. Jeśli pytanie wykracza poza Twój zakres, informujesz o tym
i sugerujesz kontakt z odpowiednią osobą.
```

> User: „Co zrobić z nowym pracownikiem, który nie oddał dokumentów?"
>
> Claude: [odpowiedź skupiona na procedurach kadrowych, formalna, w kontekście firmy]

Różnica jest ogromna — ten sam model, zupełnie inne zachowanie.

---

## Jak wygląda dobrze napisany system prompt?

Dobry system prompt zawiera kilka kluczowych elementów:

### 1. Rola i kontekst

Kim jest Claude w tej konfiguracji? W jakim środowisku działa?

> „Jesteś wewnętrznym asystentem firmy ABC, pomagającym pracownikom działu sprzedaży w przygotowaniu ofert i materiałów dla klientów."

### 2. Zakres i ograniczenia

Czym się zajmuje, a czym nie?

> „Odpowiadasz wyłącznie na pytania związane ze sprzedażą i obsługą klienta. Jeśli pytanie dotyczy innego działu (np. IT, HR, finansów), poinformuj użytkownika i zasugeruj kontakt z właściwym zespołem."

### 3. Ton i styl

Jak ma się komunikować?

> „Używasz języka polskiego. Ton jest profesjonalny, ale przyjazny — piszesz jak doświadczony kolega, nie jak podręcznik. Unikasz żargonu technicznego."

### 4. Ważny kontekst stały

Co Claude powinien zawsze wiedzieć?

> „Firma ABC sprzedaje oprogramowanie do zarządzania flotą pojazdów. Główni klienci to firmy logistyczne i transportowe z segmentu MŚP. Cennik i warunki umów są dostępne w załączonym dokumencie."

### 5. Format odpowiedzi

Jak mają wyglądać odpowiedzi?

> „Odpowiedzi powinny być zwięzłe — maksymalnie 3–4 zdania lub lista punktowana. Jeśli odpowiedź wymaga więcej miejsca, zaznacz to i zapytaj, czy rozwinąć."

---

## Pełny przykład system promptu

```
Jesteś asystentem wsparcia technicznego firmy SoftHouse. Pomagasz klientom
rozwiązywać problemy z oprogramowaniem do zarządzania magazynem (wersje 3.x i 4.x).

Zakres:
- Odpowiadasz na pytania techniczne dotyczące produktów SoftHouse
- Pomagasz z konfiguracją, błędami i podstawową integracją z systemami zewnętrznymi
- Nie udzielasz porad prawnych, finansowych ani dotyczących konkurencyjnych produktów

Ton i styl:
- Język: polski
- Styl: profesjonalny, rzeczowy, cierpliwy
- Unikasz skrótów i żargonu, chyba że klient sam ich używa

Format:
- Krótkie odpowiedzi gdy możliwe
- Przy rozwiązywaniu problemów używaj ponumerowanych kroków
- Na końcu zawsze pytaj: „Czy to rozwiązało problem?"

Jeśli nie znasz odpowiedzi lub problem jest zbyt złożony, napisz:
„Przekażę to pytanie do naszego zespołu technicznego — czy mogę prosić
o numer zgłoszenia lub adres e-mail do kontaktu?"
```

---

## System prompt a prywatność

Ważna kwestia praktyczna: użytkownicy zazwyczaj nie widzą treści system promptu — widzą tylko odpowiedzi Claude'a. Jednak Claude może przyznać, że system prompt istnieje, jeśli zostanie o to zapytany. Nie należy umieszczać w system prompcie informacji, których ujawnienie byłoby problematyczne.

---

## Kiedy warto używać system promptu?

| Sytuacja | Czy warto? |
|---|---|
| Jednorazowe zadanie w oknie czatu | ❌ Nie trzeba — wystarczy dobry prompt |
| Aplikacja firmowa z Claude'em dla wielu użytkowników | ✅ Tak — kluczowe |
| Chatbot na stronie lub w intranecie | ✅ Tak — niezbędne |
| Stałe narzędzie dla konkretnego zespołu | ✅ Tak — bardzo pomocne |
| Automatyzacja powtarzalnych zadań przez API | ✅ Tak — podstawa konfiguracji |

---

## Podsumowanie

System prompt to instrukcja działająca w tle każdej rozmowy z Claude'em. Pozwala z góry skonfigurować rolę, ton, zakres tematów i format odpowiedzi — bez konieczności powtarzania tego w każdej wiadomości. Dobrze napisany system prompt to fundament każdej aplikacji opartej na Claude'u.

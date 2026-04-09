---
title: "RAG — Claude z własną bazą wiedzy"
description: "Jak zbudować system Retrieval-Augmented Generation, który pozwala Claude'owi odpowiadać na pytania na podstawie własnych dokumentów firmy"
order: 19
---

# RAG — Claude z własną bazą wiedzy

Claude ma datę graniczną wiedzy i nie zna dokumentów firmowych. RAG (Retrieval-Augmented Generation) rozwiązuje oba problemy: zamiast pytać Claude'a o fakty z pamięci, najpierw **wyszukujemy odpowiednie fragmenty** z własnej bazy dokumentów, a dopiero potem wysyłamy je razem z pytaniem. Claude nie „wie" — Claude **czyta i odpowiada**. Ten poradnik pokazuje, jak zbudować taki system od zera.

---

## Jak działa RAG?

Klasyczny RAG to trzy etapy:

```
┌─────────────────────────────────────────────────────────┐
│                        RAG PIPELINE                     │
│                                                         │
│  INDEXING (jednorazowo):                                │
│  Dokumenty → Chunki → Embeddingi → Baza wektorowa       │
│                                                         │
│  RETRIEVAL (przy każdym pytaniu):                       │
│  Pytanie → Embedding → Podobne chunki z bazy            │
│                                                         │
│  GENERATION:                                            │
│  Pytanie + Chunki → Claude → Odpowiedź z cytatami       │
└─────────────────────────────────────────────────────────┘
```

Kluczowa intuicja: zamiast próbować „nauczyć" Claude'a firmowych dokumentów, podajemy mu odpowiednie fragmenty jako kontekst w każdym pytaniu. Claude zawsze widzi świeże, aktualne dane.

---

## Krok 1 — Przygotowanie dokumentów (chunking)

Dokumenty trzeba podzielić na fragmenty (chunki), które będą przeszukiwane. Zasady dobrego chunkingu:

```python
def podziel_na_chunki(tekst: str, rozmiar: int = 500, nakladanie: int = 50) -> list[str]:
    """
    Dzieli tekst na fragmenty o zadanym rozmiarze (w znakach).
    Nakładanie (overlap) zapobiega utracie kontekstu na granicach chunków.
    """
    chunki = []
    start = 0

    while start < len(tekst):
        koniec = start + rozmiar
        chunk = tekst[start:koniec]

        # Unikaj cięcia w połowie zdania — cofnij się do ostatniej kropki
        if koniec < len(tekst):
            ostatnia_kropka = chunk.rfind(". ")
            if ostatnia_kropka > rozmiar * 0.5:  # tylko jeśli nie za blisko początku
                chunk = chunk[:ostatnia_kropka + 1]

        chunki.append(chunk.strip())
        start += len(chunk) - nakladanie

    return [c for c in chunki if len(c) > 50]  # usuń zbyt krótkie fragmenty

# Przykład użycia
with open("regulamin.txt", "r") as f:
    tekst = f.read()

chunki = podziel_na_chunki(tekst, rozmiar=600, nakladanie=75)
print(f"Podzielono na {len(chunki)} chunków")
```

**Rozmiar chunka — reguły kciuka:**
- za mały (< 200 znaków): za mało kontekstu, odpowiedzi nieprecyzyjne
- za duży (> 2000 znaków): traci się precyzję wyszukiwania, drożej
- optimum: 400–800 znaków, z nakładaniem 10–15%

---

## Krok 2 — Embeddingi i baza wektorowa

Embedding to reprezentacja matematyczna tekstu — wektor liczb, który koduje znaczenie semantyczne. Dwa podobne znaczeniowo teksty mają zbliżone wektory.

### Embeddingi z Voyage AI (rekomendowane przez Anthropic)

```python
import voyageai

vo = voyageai.Client()  # klucz z zmiennej VOYAGE_API_KEY

def stworz_embedding(tekst: str) -> list[float]:
    wynik = vo.embed([tekst], model="voyage-3", input_type="document")
    return wynik.embeddings[0]

def stworz_embedding_pytania(pytanie: str) -> list[float]:
    # Dla pytań używamy input_type="query" — inny tryb
    wynik = vo.embed([pytanie], model="voyage-3", input_type="query")
    return wynik.embeddings[0]
```

### Prosta baza wektorowa w pamięci (do prototypowania)

```python
import numpy as np
from dataclasses import dataclass

@dataclass
class Dokument:
    id: str
    tekst: str
    embedding: list[float]
    metadane: dict  # np. {"plik": "regulamin.pdf", "strona": 3}

class ProstaBazaWektorowa:
    def __init__(self):
        self.dokumenty: list[Dokument] = []

    def dodaj(self, doc: Dokument):
        self.dokumenty.append(doc)

    def szukaj(self, embedding_pytania: list[float], top_k: int = 5) -> list[Dokument]:
        """Zwraca top_k najbardziej podobnych dokumentów (cosine similarity)."""
        vec_q = np.array(embedding_pytania)
        wyniki = []

        for doc in self.dokumenty:
            vec_d = np.array(doc.embedding)
            podobienstwo = np.dot(vec_q, vec_d) / (np.linalg.norm(vec_q) * np.linalg.norm(vec_d))
            wyniki.append((podobienstwo, doc))

        wyniki.sort(key=lambda x: x[0], reverse=True)
        return [doc for _, doc in wyniki[:top_k]]
```

### Produkcyjna baza wektorowa — Chroma

Do środowisk produkcyjnych warto użyć dedykowanej bazy wektorowej. Chroma to popularny, darmowy wybór:

```python
import chromadb

klient = chromadb.PersistentClient(path="./baza_wektorowa")
kolekcja = klient.get_or_create_collection(name="dokumenty_firmowe")

def dodaj_chunki_do_bazy(chunki: list[str], embeddingi: list[list[float]], metadane: list[dict]):
    kolekcja.add(
        documents=chunki,
        embeddings=embeddingi,
        metadatas=metadane,
        ids=[f"chunk_{i}" for i in range(len(chunki))]
    )

def szukaj_w_bazie(embedding_pytania: list[float], n_wynikow: int = 5) -> list[dict]:
    wyniki = kolekcja.query(
        query_embeddings=[embedding_pytania],
        n_results=n_wynikow,
        include=["documents", "metadatas", "distances"]
    )
    return [
        {"tekst": doc, "metadane": meta, "odleglosc": dist}
        for doc, meta, dist in zip(
            wyniki["documents"][0],
            wyniki["metadatas"][0],
            wyniki["distances"][0]
        )
    ]
```

---

## Krok 3 — Indeksowanie dokumentów (pipeline)

```python
import os
import voyageai

vo = voyageai.Client()

def indeksuj_folder(sciezka_folderu: str, baza: ProstaBazaWektorowa):
    """Indeksuje wszystkie pliki tekstowe w folderze."""
    for nazwa_pliku in os.listdir(sciezka_folderu):
        if not nazwa_pliku.endswith(".txt"):
            continue

        sciezka = os.path.join(sciezka_folderu, nazwa_pliku)
        print(f"Indeksuję: {nazwa_pliku}")

        with open(sciezka, "r") as f:
            tekst = f.read()

        chunki = podziel_na_chunki(tekst)

        # Batch embedding — wysyłamy wszystkie chunki naraz
        wynik = vo.embed(chunki, model="voyage-3", input_type="document")

        for i, (chunk, embedding) in enumerate(zip(chunki, wynik.embeddings)):
            doc = Dokument(
                id=f"{nazwa_pliku}_chunk_{i}",
                tekst=chunk,
                embedding=embedding,
                metadane={"plik": nazwa_pliku, "chunk_nr": i}
            )
            baza.dodaj(doc)

    print(f"Zaindeksowano {len(baza.dokumenty)} fragmentów")

# Uruchom raz — wynik możesz zapisać na dysku
baza = ProstaBazaWektorowa()
indeksuj_folder("./dokumenty_firmowe", baza)
```

---

## Krok 4 — Odpowiadanie na pytania (RAG pipeline)

```python
import anthropic

claude = anthropic.Anthropic()

def odpowiedz_na_pytanie(pytanie: str, baza: ProstaBazaWektorowa, top_k: int = 4) -> str:
    # 1. Przekształć pytanie na embedding
    emb_pytania = stworz_embedding_pytania(pytanie)

    # 2. Znajdź najbardziej pasujące fragmenty
    trafienia = baza.szukaj(emb_pytania, top_k=top_k)

    # 3. Zbuduj kontekst z trafionych fragmentów
    kontekst = "\n\n---\n\n".join([
        f"[Źródło: {doc.metadane.get('plik', 'nieznany')}]\n{doc.tekst}"
        for doc in trafienia
    ])

    # 4. Wyślij pytanie + kontekst do Claude'a
    odpowiedz = claude.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1024,
        system="""Jesteś asystentem firmowym. Odpowiadasz na pytania WYŁĄCZNIE na podstawie
dostarczonych fragmentów dokumentów. Jeśli odpowiedź nie wynika z dokumentów, napisz:
"Nie znalazłem tej informacji w dostępnych dokumentach."
Przy każdej odpowiedzi wskazuj źródło (nazwę pliku).""",
        messages=[
            {
                "role": "user",
                "content": f"""Fragmenty dokumentów:

{kontekst}

---

Pytanie: {pytanie}"""
            }
        ]
    )

    return odpowiedz.content[0].text

# Użycie
odpowiedz = odpowiedz_na_pytanie(
    "Jaki jest okres wypowiedzenia umowy dla klientów premium?",
    baza
)
print(odpowiedz)
```

---

## Zaawansowane techniki RAG

### Hybrid search — wyszukiwanie łączone

Sama semantyka (embeddingi) nie zawsze wystarcza. Słowa kluczowe i numery artykułów lepiej łapie BM25:

```python
from rank_bm25 import BM25Okapi

def hybrid_search(pytanie: str, baza, alfa: float = 0.5) -> list:
    """Łączy wyniki semantyczne i słów kluczowych (alfa = waga semantyki)."""
    # Wyszukiwanie semantyczne
    emb = stworz_embedding_pytania(pytanie)
    wyniki_sem = baza.szukaj(emb, top_k=10)

    # Wyszukiwanie BM25 (słowa kluczowe)
    korpus = [doc.tekst.split() for doc in baza.dokumenty]
    bm25 = BM25Okapi(korpus)
    scores_bm25 = bm25.get_scores(pytanie.split())

    # Normalizacja i łączenie wyników
    # (implementacja Reciprocal Rank Fusion lub prosta średnia ważona)
    return polacz_wyniki(wyniki_sem, scores_bm25, alfa)
```

### Reranking — poprawa trafności

Po wstępnym wyszukaniu można użyć modelu reranking do lepszego sortowania wyników:

```python
def rerankuj(pytanie: str, dokumenty: list[str], top_k: int = 3) -> list[str]:
    wynik = vo.rerank(pytanie, dokumenty, model="rerank-2", top_k=top_k)
    return [r.document for r in wynik.results]
```

### Query expansion — rozszerzanie pytania

Czasem oryginalne pytanie jest zbyt wąskie. Claude może je rozszerzyć:

```python
def rozszerz_pytanie(pytanie: str) -> list[str]:
    """Generuje warianty pytania dla lepszego wyszukiwania."""
    odpowiedz = claude.messages.create(
        model="claude-haiku-4-5",
        max_tokens=256,
        messages=[{
            "role": "user",
            "content": f"""Wygeneruj 3 różne sformułowania tego pytania, które pomogą wyszukać
odpowiedź w bazie dokumentów. Zwróć tylko pytania, jedno na linię.

Pytanie: {pytanie}"""
        }]
    )
    warianty = odpowiedz.content[0].text.strip().split("\n")
    return [pytanie] + [w.strip() for w in warianty if w.strip()]
```

---

## Ocena jakości systemu RAG

Zanim wdrożysz RAG produkcyjnie, warto zmierzyć kilka metryk:

| Metryka | Co mierzy | Jak mierzyć |
|---|---|---|
| **Recall@k** | Czy właściwe chunki w top-k? | Ręcznie oznaczone zestawy pytań |
| **Faithfulness** | Czy odpowiedź zgodna z kontekstem? | Porównanie z podanymi chunkami |
| **Answer relevancy** | Czy odpowiedź pasuje do pytania? | Ocena Claude lub human eval |
| **Context precision** | Ile z podanych chunków jest używanych? | Analiza odpowiedzi |

Prosta pętla ewaluacyjna:

```python
zestaw_testowy = [
    {"pytanie": "Jaki jest okres gwarancji?", "oczekiwana_odpowiedz": "24 miesiące"},
    # ...
]

for test in zestaw_testowy:
    odpowiedz = odpowiedz_na_pytanie(test["pytanie"], baza)
    print(f"P: {test['pytanie']}")
    print(f"Oczekiwane: {test['oczekiwana_odpowiedz']}")
    print(f"Otrzymane: {odpowiedz}")
    print("---")
```

---

## Wskazówki produkcyjne

- **Aktualizacja bazy** — przy zmianie dokumentów indeksuj tylko zmienione pliki, nie wszystko od nowa. Przechowuj metadane (data modyfikacji, hash) by wykrywać zmiany.
- **Cache embeddingów pytań** — to samo pytanie generuje ten sam embedding. Cache'uj na poziomie pytania.
- **Filtrowanie według metadanych** — pozwól użytkownikom ograniczyć wyszukiwanie do konkretnych działów, typów dokumentów lub dat.
- **Cytaty i weryfikowalność** — zawsze zwracaj źródła razem z odpowiedzią, żeby użytkownicy mogli zweryfikować fakty.

---

## Podsumowanie

RAG to trzy etapy: podziel dokumenty na chunki → przelicz embeddingi i zapisz do bazy → przy pytaniu wyszukaj pasujące fragmenty i wyślij je do Claude'a. Kluczowe decyzje to rozmiar chunka (400–800 znaków), model embeddingów (Voyage AI dla Claude'a) i baza wektorowa (Chroma do produkcji, lista w pamięci do prototypowania). Jakość systemu zależy głównie od jakości wyszukiwania — warto testować hybrid search i reranking. Zawsze zwracaj źródła i pozwól użytkownikom weryfikować odpowiedzi.

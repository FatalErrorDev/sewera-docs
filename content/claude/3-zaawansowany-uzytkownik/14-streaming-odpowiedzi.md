---
title: "Streaming odpowiedzi"
description: "Jak strumieniować odpowiedzi Claude'a token po tokenie, żeby aplikacja reagowała natychmiast zamiast czekać na pełną odpowiedź"
order: 14
---

# Streaming odpowiedzi

Domyślnie API zwraca odpowiedź dopiero po tym, jak Claude skończy ją generować. Przy długich odpowiedziach oznacza to, że użytkownik czeka kilka, a czasem kilkanaście sekund, patrząc na pusty ekran. **Streaming** rozwiązuje ten problem — pozwala wyświetlać odpowiedź token po tokenie, dokładnie tak jak działa interfejs na claude.ai. Ten poradnik pokazuje, jak to zaimplementować.

---

## Dlaczego streaming ma znaczenie?

Różnica w odbiorze jest ogromna:

- **Bez streamingu:** użytkownik czeka 8 sekund → dostaje pełną odpowiedź naraz
- **Ze streamingiem:** tekst pojawia się płynnie od razu → użytkownik widzi, że coś się dzieje

Streaming poprawia postrzegany czas odpowiedzi i sprawia, że interfejs wydaje się bardziej responsywny. Poza tym, przy bardzo długich odpowiedziach, streaming pozwala zacząć przetwarzanie danych jeszcze zanim Claude skończy generować.

---

## Podstawowy streaming w Pythonie

Najprostszy sposób to użycie metody `stream()` zamiast `create()`:

```python
import anthropic

client = anthropic.Anthropic()

with client.messages.stream(
    model="claude-sonnet-4-6",
    max_tokens=1024,
    messages=[
        {"role": "user", "content": "Napisz krótkie opowiadanie o kocie, który odkrył internet."}
    ]
) as stream:
    for text in stream.text_stream:
        print(text, end="", flush=True)

print()  # nowa linia po zakończeniu
```

`stream.text_stream` to generator, który zwraca kolejne fragmenty tekstu w miarę ich generowania. `flush=True` w `print()` zapewnia, że tekst pojawia się natychmiast, bez buforowania.

---

## Streaming w Node.js / TypeScript

```typescript
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

const stream = await client.messages.stream({
  model: "claude-sonnet-4-6",
  max_tokens: 1024,
  messages: [
    { role: "user", content: "Napisz krótkie opowiadanie o kocie, który odkrył internet." }
  ],
});

for await (const chunk of stream) {
  if (
    chunk.type === "content_block_delta" &&
    chunk.delta.type === "text_delta"
  ) {
    process.stdout.write(chunk.delta.text);
  }
}

await stream.finalMessage(); // pobierz pełny obiekt wiadomości po zakończeniu
```

---

## Obsługa zdarzeń strumieniowania — Server-Sent Events

Pod spodem streaming działa na protokole **Server-Sent Events (SSE)**. API wysyła sekwencję zdarzeń, każde w formacie:

```
event: content_block_delta
data: {"type": "content_block_delta", "index": 0, "delta": {"type": "text_delta", "text": "Kot"}}

event: content_block_delta
data: {"type": "content_block_delta", "index": 0, "delta": {"type": "text_delta", "text": " siedział"}}

event: message_stop
data: {"type": "message_stop"}
```

SDK obsługuje ten protokół automatycznie — nie trzeba implementować parsowania SSE ręcznie.

Typy zdarzeń, które warto znać:

| Zdarzenie | Znaczenie |
|---|---|
| `message_start` | Początek wiadomości, zawiera metadane (model, id) |
| `content_block_start` | Początek bloku treści |
| `content_block_delta` | Fragment tekstu — to tutaj przychodzą kolejne tokeny |
| `content_block_stop` | Koniec bloku treści |
| `message_delta` | Aktualizacja metadanych wiadomości (stop_reason, usage) |
| `message_stop` | Koniec całej wiadomości |

---

## Streaming z obsługą wszystkich zdarzeń (Python)

Jeśli potrzebna jest pełna kontrola nad zdarzeniami — nie tylko tekstem:

```python
import anthropic

client = anthropic.Anthropic()

with client.messages.stream(
    model="claude-sonnet-4-6",
    max_tokens=1024,
    messages=[{"role": "user", "content": "Wymień 5 największych miast w Polsce."}]
) as stream:
    for event in stream:
        if event.type == "content_block_delta":
            if event.delta.type == "text_delta":
                print(event.delta.text, end="", flush=True)

    # Po zakończeniu streamingu — pełna wiadomość z metadanymi
    wiadomosc = stream.get_final_message()
    print(f"\n\nZużyte tokeny: {wiadomosc.usage.input_tokens} in / {wiadomosc.usage.output_tokens} out")
```

---

## Streaming w aplikacjach webowych

Streaming świetnie nadaje się do aplikacji webowych, gdzie chcemy wyświetlać odpowiedź w czasie rzeczywistym. Schemat implementacji z FastAPI (Python):

```python
from fastapi import FastAPI
from fastapi.responses import StreamingResponse
import anthropic

app = FastAPI()
client = anthropic.Anthropic()

@app.post("/chat")
async def chat(prompt: str):
    def generuj():
        with client.messages.stream(
            model="claude-sonnet-4-6",
            max_tokens=1024,
            messages=[{"role": "user", "content": prompt}]
        ) as stream:
            for text in stream.text_stream:
                yield f"data: {text}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(generuj(), media_type="text/event-stream")
```

Po stronie klienta (JavaScript w przeglądarce):

```javascript
const response = await fetch("/chat", {
  method: "POST",
  body: JSON.stringify({ prompt: "Twoje pytanie" }),
  headers: { "Content-Type": "application/json" }
});

const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;

  const chunk = decoder.decode(value);
  const lines = chunk.split("\n");

  for (const line of lines) {
    if (line.startsWith("data: ") && line !== "data: [DONE]") {
      const text = line.slice(6);
      document.getElementById("odpowiedz").textContent += text;
    }
  }
}
```

---

## Streaming z tool use

Streaming działa też z narzędziami, ale wymaga nieco innego podejścia — trzeba obserwować zdarzenia związane z blokami `tool_use`:

```python
with client.messages.stream(
    model="claude-sonnet-4-6",
    max_tokens=1024,
    tools=narzedzia,
    messages=messages
) as stream:
    for event in stream:
        if event.type == "content_block_start":
            if event.content_block.type == "tool_use":
                print(f"\n[Wywołuję narzędzie: {event.content_block.name}]")

        elif event.type == "content_block_delta":
            if event.delta.type == "text_delta":
                print(event.delta.text, end="", flush=True)
```

---

## Przerywanie streamingu

Jeśli użytkownik kliknie „Stop" lub coś pójdzie nie tak, stream można przerwać:

```python
with client.messages.stream(
    model="claude-sonnet-4-6",
    max_tokens=2048,
    messages=[{"role": "user", "content": "Napisz bardzo długi esej..."}]
) as stream:
    for i, text in enumerate(stream.text_stream):
        print(text, end="", flush=True)
        if i > 500:  # przerwij po 500 fragmentach
            break
    # stream zostaje automatycznie zamknięty przy wyjściu z bloku with
```

---

## Kiedy używać streamingu, kiedy nie?

| Scenariusz | Streaming? |
|---|---|
| Interfejs użytkownika (chat, formularz) | ✅ Zdecydowanie tak |
| Długie generowanie dokumentów | ✅ Tak |
| Krótkie odpowiedzi (klasyfikacja, ekstrakcja) | ❌ Zbędny narzut |
| Przetwarzanie wsadowe w tle | ❌ Lepszy Batch API |
| Systemy, które muszą przetworzyć pełną odpowiedź przed wyświetleniem | ❌ Niepotrzebny |

---

## Podsumowanie

Streaming to zamiana `client.messages.create()` na `client.messages.stream()` i iterowanie przez zwracane fragmenty tekstu. Efekt to płynne, natychmiastowe wyświetlanie odpowiedzi, które znacząco poprawia doświadczenie użytkownika w aplikacjach interaktywnych. Koszty i limity są dokładnie takie same jak bez streamingu — różni się tylko sposób dostarczania odpowiedzi.

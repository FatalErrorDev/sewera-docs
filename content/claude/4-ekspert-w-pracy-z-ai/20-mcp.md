---
title: "Model Context Protocol (MCP)"
description: "Czym jest MCP, jak działa i jak podłączyć Claude'a do zewnętrznych narzędzi i danych przez standardowy protokół"
order: 20
---

# Model Context Protocol (MCP)

Tool use (opisany w artykule 13) to rozwiązanie dla jednej aplikacji i jednego modelu. MCP (Model Context Protocol) to krok dalej — **otwarty standard**, który definiuje, jak modele AI komunikują się z zewnętrznymi systemami w ogóle. Zamiast pisać osobną integrację dla każdego narzędzia w każdej aplikacji, tworzy się jeden serwer MCP, który działa z każdym klientem rozumiejącym protokół. Ten poradnik wyjaśnia, jak to działa i jak zbudować własny serwer MCP.

---

## Po co MCP?

Wyobraź sobie, że masz trzy aplikacje oparte na Claude'u i chcesz w każdej z nich dać dostęp do firmowej bazy danych. Bez MCP: trzy osobne integracje, trzy oddzielne zestawy narzędzi, trzy miejsca do aktualizacji gdy API bazy się zmieni.

Z MCP: jeden serwer MCP dla bazy danych, trzy aplikacje go podłączają przez standardowy protokół. Zmiana po stronie bazy → aktualizacja w jednym miejscu.

```
┌─────────────────────────────────────────────────────────┐
│                     BEZ MCP                             │
│                                                         │
│  Aplikacja A ──własna integracja──→ Baza danych         │
│  Aplikacja B ──własna integracja──→ Baza danych         │
│  Aplikacja C ──własna integracja──→ Baza danych         │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                      Z MCP                              │
│                                                         │
│  Aplikacja A ──┐                                        │
│  Aplikacja B ──┼──→ Serwer MCP ──→ Baza danych          │
│  Aplikacja C ──┘                                        │
└─────────────────────────────────────────────────────────┘
```

---

## Architektura MCP

MCP definiuje dwie strony: **klient** (aplikacja używająca Claude'a) i **serwer** (dostawca narzędzi i danych).

**Serwer MCP udostępnia trzy typy zasobów:**

- **Tools** — funkcje, które model może wywołać (jak tool use, ale standaryzowane)
- **Resources** — dane do odczytu (pliki, rekordy z bazy, strony www)
- **Prompts** — gotowe szablony promptów do wielokrotnego użycia

**Komunikacja** odbywa się przez JSON-RPC 2.0 — lekki protokół, który działa zarówno przez stdio (procesy lokalne) jak i HTTP/SSE (serwery zdalne).

---

## Szybki start — pierwszy serwer MCP w Pythonie

Anthropic udostępnia SDK `mcp` dla Pythona i TypeScript:

```bash
pip install mcp
```

Minimalny serwer MCP z jednym narzędziem:

```python
from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp import types

# Utwórz serwer
app = Server("firmowy-asystent")

# Zdefiniuj narzędzia
@app.list_tools()
async def lista_narzedzi() -> list[types.Tool]:
    return [
        types.Tool(
            name="pobierz_klienta",
            description="Pobiera dane klienta z CRM na podstawie adresu email.",
            inputSchema={
                "type": "object",
                "properties": {
                    "email": {
                        "type": "string",
                        "description": "Adres email klienta"
                    }
                },
                "required": ["email"]
            }
        ),
        types.Tool(
            name="lista_zamowien",
            description="Zwraca listę zamówień klienta z ostatnich N dni.",
            inputSchema={
                "type": "object",
                "properties": {
                    "klient_id": {"type": "string"},
                    "dni": {"type": "integer", "default": 30}
                },
                "required": ["klient_id"]
            }
        )
    ]

# Implementuj wywołania narzędzi
@app.call_tool()
async def wywolaj_narzedzie(nazwa: str, arguments: dict) -> list[types.TextContent]:
    if nazwa == "pobierz_klienta":
        email = arguments["email"]
        # Tu prawdziwe wywołanie do CRM
        klient = pobierz_klienta_z_crm(email)
        return [types.TextContent(type="text", text=str(klient))]

    elif nazwa == "lista_zamowien":
        klient_id = arguments["klient_id"]
        dni = arguments.get("dni", 30)
        zamowienia = pobierz_zamowienia(klient_id, dni)
        return [types.TextContent(type="text", text=str(zamowienia))]

    raise ValueError(f"Nieznane narzędzie: {nazwa}")

# Uruchom serwer przez stdio
async def main():
    async with stdio_server() as (read, write):
        await app.run(read, write, app.create_initialization_options())

if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
```

---

## Resources — udostępnianie danych

Resources to pliki i dane, które klient może odczytać (ale nie wywołać jak narzędzie). Przydatne do dokumentacji, danych konfiguracyjnych, raportów:

```python
@app.list_resources()
async def lista_zasobow() -> list[types.Resource]:
    return [
        types.Resource(
            uri="firmowe://procedury/onboarding",
            name="Procedura onboardingu",
            description="Kroki wdrożenia nowego pracownika",
            mimeType="text/markdown"
        ),
        types.Resource(
            uri="firmowe://cennik/aktualny",
            name="Aktualny cennik",
            description="Cennik produktów i usług",
            mimeType="application/json"
        )
    ]

@app.read_resource()
async def czytaj_zasob(uri: str) -> str:
    if uri == "firmowe://procedury/onboarding":
        with open("procedury/onboarding.md") as f:
            return f.read()
    elif uri == "firmowe://cennik/aktualny":
        return json.dumps(pobierz_aktualny_cennik())
    raise ValueError(f"Nieznany zasób: {uri}")
```

---

## Prompts — szablony wielokrotnego użycia

Serwer może udostępniać gotowe szablony promptów:

```python
@app.list_prompts()
async def lista_promptow() -> list[types.Prompt]:
    return [
        types.Prompt(
            name="analiza-klienta",
            description="Kompleksowa analiza klienta na podstawie danych CRM",
            arguments=[
                types.PromptArgument(
                    name="email",
                    description="Email klienta",
                    required=True
                )
            ]
        )
    ]

@app.get_prompt()
async def pobierz_prompt(name: str, arguments: dict | None) -> types.GetPromptResult:
    if name == "analiza-klienta":
        email = arguments["email"] if arguments else "nieznany"
        return types.GetPromptResult(
            description="Analiza klienta",
            messages=[
                types.PromptMessage(
                    role="user",
                    content=types.TextContent(
                        type="text",
                        text=f"""Pobierz dane klienta {email} i przygotuj analizę zawierającą:
1. Historię zamówień (ostatnie 90 dni)
2. Łączną wartość zakupów
3. Segmentację (VIP / Standard / Nowy)
4. Rekomendacje działań"""
                    )
                )
            ]
        )
```

---

## Serwer MCP przez HTTP/SSE

Dla serwera dostępnego zdalnie (np. wewnętrzny serwis firmowy) użyj transportu HTTP:

```python
from mcp.server.sse import SseServerTransport
from starlette.applications import Starlette
from starlette.routing import Route, Mount

# Inicjalizacja transportu SSE
sse = SseServerTransport("/messages/")

async def handle_sse(request):
    async with sse.connect_sse(
        request.scope, request.receive, request._send
    ) as streams:
        await app.run(streams[0], streams[1], app.create_initialization_options())

# Aplikacja Starlette (lub FastAPI)
starlette_app = Starlette(
    routes=[
        Route("/sse", endpoint=handle_sse),
        Mount("/messages/", app=sse.handle_post_message),
    ]
)

# Uruchom: uvicorn serwer:starlette_app --host 0.0.0.0 --port 8080
```

---

## Używanie serwera MCP z Claude'em przez API

Przy wywołaniu API możesz podłączyć serwer MCP bezpośrednio:

```python
import anthropic

client = anthropic.Anthropic()

# Wywołanie z podłączonym serwerem MCP
odpowiedz = client.messages.create(
    model="claude-sonnet-4-6",
    max_tokens=1024,
    messages=[
        {"role": "user", "content": "Sprawdź zamówienia klienta jan@firma.pl z ostatnich 30 dni"}
    ],
    mcp_servers=[
        {
            "type": "url",
            "url": "https://mcp.firma.pl/sse",  # adres serwera MCP
            "name": "crm-server"
        }
    ]
)

print(odpowiedz.content[0].text)
```

Serwer MCP działa wtedy identycznie jak lokalne narzędzia — Claude automatycznie widzi dostępne tools, resources i prompts.

---

## Gotowe serwery MCP — ekosystem

Anthropic i społeczność opublikowały wiele gotowych serwerów MCP, które można podłączyć bez pisania kodu:

| Serwer | Zastosowanie | Dostępność |
|---|---|---|
| `@modelcontextprotocol/server-filesystem` | Dostęp do plików lokalnych | Open source |
| `@modelcontextprotocol/server-github` | GitHub repos, issues, PRy | Open source |
| `@modelcontextprotocol/server-postgres` | Bazy PostgreSQL | Open source |
| `@modelcontextprotocol/server-slack` | Kanały i wiadomości Slack | Open source |
| Asana MCP | Projekty i zadania Asana | Asana |
| HubSpot MCP | CRM i kontakty | HubSpot |

Pełna lista: `github.com/modelcontextprotocol/servers`

Instalacja i konfiguracja gotowego serwera (przykład dla PostgreSQL):

```bash
npm install -g @modelcontextprotocol/server-postgres
```

Konfiguracja w pliku `mcp_config.json`:

```json
{
  "mcpServers": {
    "postgres": {
      "command": "mcp-server-postgres",
      "args": ["postgresql://localhost/firma_db"]
    }
  }
}
```

---

## Bezpieczeństwo serwera MCP

Serwer MCP daje Claude'owi dostęp do danych i narzędzi — warto to odpowiednio zabezpieczyć:

**Autoryzacja:**
```python
@app.call_tool()
async def wywolaj_narzedzie(nazwa: str, arguments: dict) -> list[types.TextContent]:
    # Sprawdź, czy klient jest uprawniony (np. przez nagłówek Authorization)
    if not jest_autoryzowany(aktualny_klient()):
        raise PermissionError("Brak uprawnień do wywołania narzędzia")
    # ...
```

**Walidacja danych wejściowych:**
```python
def waliduj_email(email: str) -> bool:
    import re
    return bool(re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', email))

# Zawsze waliduj przed wykonaniem
if not waliduj_email(arguments.get("email", "")):
    raise ValueError("Nieprawidłowy format adresu email")
```

**Zasada minimalnych uprawnień** — serwer MCP powinien mieć dostęp tylko do zasobów, których faktycznie potrzebuje. Serwer do zamówień nie musi widzieć systemu kadrowego.

---

## Kiedy MCP, kiedy klasyczny tool use?

| Sytuacja | Tool use | MCP |
|---|---|---|
| Jedna aplikacja, kilka narzędzi | ✅ Prościej | ❌ Przesada |
| Wiele aplikacji używa tych samych narzędzi | ❌ Duplikacja | ✅ Jeden serwer |
| Integracja z gotowymi serwisami (GitHub, Slack) | ❌ Dużo pracy | ✅ Gotowy serwer |
| Narzędzia dostępne dla wielu modeli AI | ❌ Specyficzne dla Claude | ✅ Standard otwarty |
| Szybki prototyp | ✅ Bez overhead'u | ❌ Konfiguracja |

---

## Podsumowanie

MCP to otwarty standard integracji modeli AI z zewnętrznymi systemami. Serwer MCP udostępnia trzy typy zasobów: tools (wywoływalne funkcje), resources (dane do odczytu) i prompts (szablony). SDK dla Pythona i TypeScript minimalizuje boilerplate — wystarczy oznaczyć funkcje dekoratorami. Największa wartość MCP ujawnia się, gdy wiele aplikacji lub modeli musi korzystać z tych samych integracji — piszesz raz, podłączasz wszędzie. Ekosystem gotowych serwerów MCP rośnie szybko i wiele popularnych serwisów ma już gotowe implementacje.

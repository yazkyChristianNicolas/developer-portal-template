---
sidebar_position: 8
title: Recursos para IA
description: llms.txt, llms-full.txt, copias en Markdown y el spec OpenAPI para usar esta documentación desde un asistente de código.
---

# Recursos para IA

Si integrás la API con la ayuda de un asistente de código (Claude Code, Cursor, Copilot, ChatGPT), dale como contexto alguno de estos archivos en lugar de pegar páginas sueltas. Se regeneran en cada publicación del portal, así que siempre coinciden con la API.

| Archivo | Qué tiene | Cuándo usarlo |
|---|---|---|
| [`/llms-full.txt`](pathname:///llms-full.txt) | Todas las guías y la referencia completa de la API en un solo Markdown. | La opción más simple: descargalo y agregalo al contexto del asistente. |
| [`/llms.txt`](pathname:///llms.txt) | Índice en formato [llmstxt.org](https://llmstxt.org) con links a la versión Markdown de cada página. | Para herramientas que leen `llms.txt` y bajan solo lo que necesitan. |
| [`/openapi/acme.json`](pathname:///openapi/acme.json) | El spec OpenAPI 3.0. | Para generar un cliente tipado (`openapi-generator`, `openapi-typescript`, etc.) o importar en Postman/Insomnia. |

Además, cada página de guías tiene su copia en Markdown en la misma URL con `.md` al final. Por ejemplo, [`/docs/primeros-pasos.md`](pathname:///docs/primeros-pasos.md).

También hay un servidor MCP para que el agente invoque la API directamente: ver [Agentes de IA (MCP)](./guias/agentes-mcp.md).

## Ejemplo con un asistente de código

```bash
curl -o acme-api.md "https://<este portal>/llms-full.txt"
```

Después, en tu asistente:

> Usando `acme-api.md`, escribí una función en TypeScript que cree un pedido con reintento seguro usando `Idempotency-Key`.

## Generar un cliente tipado

```bash
# TypeScript
npx openapi-typescript "https://<este portal>/openapi/acme.json" -o src/acme-api.d.ts
```

Tené en cuenta que el spec describe el wire format real: todo en `snake_case` y montos en centavos (ver [Convenciones](./conceptos/convenciones.md)).

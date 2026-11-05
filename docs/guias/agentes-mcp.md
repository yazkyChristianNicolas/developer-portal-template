---
sidebar_position: 3
title: Agentes de IA (MCP)
description: Cómo conectar un agente de IA a la API de Acme mediante el servidor MCP.
---

# Agentes de IA (MCP)

El servidor MCP expone la API como herramientas que un agente (Claude, Cursor, etc.) puede invocar directamente. Su URL está en [Ambientes](../ambientes.mdx) (termina en `/mcp`).

## Conectar un cliente MCP

En Claude Code:

```bash
claude mcp add --transport http acme "$MCP_URL"
```

El cliente inicia el login en el navegador (OAuth 2.0 con PKCE); no hace falta copiar tokens.

## Qué puede hacer el agente

Las herramientas siguen los endpoints de la [referencia](pathname:///api/): crear y consultar pedidos, listar productos, crear clientes. Los errores llegan con el mismo `code` estable que la API.

:::info
Además del servidor MCP, podés darle al asistente [`llms-full.txt`](./../recursos-para-ia.md) como contexto para que escriba el código de tu integración.
:::

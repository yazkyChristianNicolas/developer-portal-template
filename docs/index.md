---
sidebar_position: 1
slug: /
title: Introducción
description: Qué es la API de Acme y cómo está organizada esta documentación.
---

# Introducción

La API de Acme te permite gestionar **pedidos, clientes y productos** desde tu sistema, y enterarte de lo que pasa con ellos mediante **webhooks firmados**.

Es una API REST con JSON. Creás un pedido con `POST /orders` y la API se encarga del resto.

## Qué te resuelve

- **Un contrato estable.** Los errores se manejan por un `code` numérico que no cambia entre versiones.
- **Reintentos seguros.** Enviá `Idempotency-Key` y repetí el request sin duplicar el pedido.
- **Eventos en tiempo real.** Los webhooks te avisan cuando un pedido se paga o se cancela.
- **Listo para IA.** Cada página tiene su copia en Markdown, hay un `llms.txt` y un servidor MCP para agentes.

## Cómo está organizada esta documentación

| Sección | Para qué |
|---|---|
| [Primeros pasos](./primeros-pasos.md) | De cero a tu primer pedido. |
| [Autenticación](./autenticacion.md) | Cómo conseguir un token con un API Client. |
| [Ambientes](./ambientes.mdx) | URLs de la API, sandbox y producción. |
| [Convenciones](./conceptos/convenciones.md) | snake_case, paginación, montos y errores. |
| [Guías](./guias/crear-pedido.md) | Paso a paso de los flujos más comunes. |
| [Referencia de la API](pathname:///api/) | Todos los endpoints, con schemas y ejemplos. |
| [Recursos para IA](./recursos-para-ia.md) | `llms.txt`, OpenAPI y cómo usar esta documentación desde un asistente de código. |

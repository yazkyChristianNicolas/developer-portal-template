---
sidebar_position: 3
title: Autenticación
description: Cómo obtener un access token con client_credentials y usarlo en cada request.
---

# Autenticación

Todos los endpoints, salvo `/health` y `/errors`, requieren un header `Authorization: Bearer <token>`.

Hay dos tipos de credencial:

| Tipo | Para qué | Cómo se obtiene |
|---|---|---|
| **API Client** | Integraciones servidor a servidor. | `client_credentials` con un `client_id` y un `client_secret`. |
| **Sesión de usuario** | La consola y operaciones de administración (por ejemplo, crear API Clients). | Login en la consola. |

## Obtener un token

```bash
curl -X POST "$TOKEN_URL" \
  -d grant_type=client_credentials \
  -d client_id="$CLIENT_ID" \
  -d client_secret="$CLIENT_SECRET"
```

```json
{ "access_token": "eyJ…", "token_type": "Bearer", "expires_in": 300 }
```

El token vence en `expires_in` segundos. Cacheálo y pedí uno nuevo antes de que venza; no lo pidas en cada request.

## Buenas prácticas

- Guardá el `client_secret` en un gestor de secretos, nunca en el repositorio.
- Creá un API Client por integración, para poder revocarlos de forma independiente.
- Si recibís `401` con el `code` `401101`, el token venció o falta: pedí uno nuevo.

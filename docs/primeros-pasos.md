---
sidebar_position: 2
title: Primeros pasos
description: De cero a tu primer pedido creado con la API en cuatro pasos.
---

# Primeros pasos

## 1. Creá un API Client

Entrá a la consola (ver [Ambientes](./ambientes.mdx)), abrí **Integraciones** y creá un API Client. Guardá el `client_secret`: se muestra una sola vez.

## 2. Obtené un token

```bash
curl -X POST "$TOKEN_URL" \
  -d grant_type=client_credentials \
  -d client_id="$CLIENT_ID" \
  -d client_secret="$CLIENT_SECRET"
```

Usá el `access_token` de la respuesta como `$TOKEN`. Más detalle en [Autenticación](./autenticacion.md).

## 3. Creá un cliente

```bash
curl -X POST "$API_URL/customers" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "name": "Ada Lovelace", "email": "ada@ejemplo.com" }'
```

## 4. Creá un pedido

```bash
curl -X POST "$API_URL/orders" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Idempotency-Key: $(uuidgen)" \
  -H "Content-Type: application/json" \
  -d '{
    "customer_id": "cus_01HZX",
    "currency": "ARS",
    "items": [{ "product_id": "prd_01HZY", "quantity": 2 }]
  }'
```

La respuesta es un `201` con el pedido en estado `PENDING`. Seguí con la [guía de pedidos](./guias/crear-pedido.md).

:::tip
Probá primero en el ambiente sandbox: los pedidos no tienen efecto real. Los datos para hacerlo están en [Datos de prueba](./referencia/datos-de-prueba.mdx).
:::

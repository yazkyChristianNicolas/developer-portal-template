---
sidebar_position: 1
title: Crear y gestionar pedidos
description: Cómo crear un pedido, consultarlo, listarlo y cancelarlo, con sus estados posibles.
---

# Crear y gestionar pedidos

## Estados

| Estado | Significado |
|---|---|
| `PENDING` | Creado, esperando el pago. Es el único estado cancelable. |
| `PAID` | Pagado. |
| `CANCELLED` | Cancelado. |

## Crear

`POST /orders` con `customer_id`, `currency` e `items`. Enviá `Idempotency-Key` para poder reintentar sin duplicar.

```bash
curl -X POST "$API_URL/orders" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Idempotency-Key: $(uuidgen)" \
  -H "Content-Type: application/json" \
  -d '{ "customer_id": "cus_01HZX", "currency": "ARS", "items": [{ "product_id": "prd_01HZY", "quantity": 2 }] }'
```

La respuesta es `201` con el pedido y un header `Location` con su URL.

## Consultar y listar

```bash
curl "$API_URL/orders/ord_01HZZ" -H "Authorization: Bearer $TOKEN"
curl "$API_URL/orders?status=PENDING&page=1&size=20" -H "Authorization: Bearer $TOKEN"
```

## Cancelar

```bash
curl -X POST "$API_URL/orders/ord_01HZZ/cancel" -H "Authorization: Bearer $TOKEN"
```

Si el pedido ya está pagado, la API responde `409` con el `code` `409102`.

:::tip
En lugar de consultar el pedido en bucle para saber si se pagó, suscribite a [webhooks](./webhooks.md).
:::

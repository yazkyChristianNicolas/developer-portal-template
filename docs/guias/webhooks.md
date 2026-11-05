---
sidebar_position: 2
title: Webhooks
description: Cómo suscribirte a eventos de pedidos y verificar la firma HMAC de cada entrega.
---

# Webhooks

Los webhooks te avisan por HTTP cuando algo cambia, sin que tengas que consultar la API.

## Eventos

| Evento | Cuándo |
|---|---|
| `order.paid` | Un pedido pasó a `PAID`. |
| `order.cancelled` | Un pedido pasó a `CANCELLED`. |

## Suscribirte

```bash
curl -X POST "$API_URL/webhooks" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "url": "https://tu-sistema.com/hooks/acme", "events": ["order.paid", "order.cancelled"] }'
```

Guardá el `secret` de la respuesta: se muestra una sola vez.

## Verificar la firma

Cada entrega trae el header `X-Signature` con el HMAC-SHA256 del body crudo, calculado con tu `secret`:

```ts
import {createHmac, timingSafeEqual} from 'node:crypto';

export function isValid(rawBody: string, signature: string, secret: string): boolean {
  const expected = createHmac('sha256', secret).update(rawBody).digest('hex');
  return (
    expected.length === signature.length &&
    timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
  );
}
```

Calculalo sobre el body **sin parsear**: si lo reserializás, la firma no coincide.

## Reintentos

Respondé con un `2xx` en menos de 10 segundos. Si no, la entrega se reintenta con espera creciente. Tu endpoint tiene que ser idempotente: puede recibir el mismo evento más de una vez.

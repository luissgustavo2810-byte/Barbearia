import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

serve(async (req) => {
  try {
    const { amount, description, paymentId } = await req.json()

    const accessToken = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN')

    const response = await fetch(
      'https://api.mercadopago.com/v1/payments',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'X-Idempotency-Key': crypto.randomUUID(),
        },
        body: JSON.stringify({
          transaction_amount: Number(amount),
          description,
          payment_method_id: 'pix',
          payer: {
            email: 'teste@email.com',
          },
          external_reference: paymentId,
          notification_url:
            'https://eybfirqzklvwtkpdztpx.supabase.co/functions/v1/mercado-pago-webhook',
        }),
      }
    )

    const data = await response.json()

    if (!response.ok) {
      return new Response(
        JSON.stringify({
          error: 'Erro Mercado Pago',
          mercado_pago_response: data,
        }),
        {
          status: response.status,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
    }

    const mercadoPagoId = data.id

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    const { createClient } = await import(
      'https://esm.sh/@supabase/supabase-js@2'
    )

    const supabase = createClient(
      supabaseUrl!,
      serviceRoleKey!
    )

    await supabase
      .from('payments')
      .update({
        mercado_pago_id: String(mercadoPagoId),
      })
      .eq('id', paymentId)

    return new Response(
      JSON.stringify({
        mercado_pago_response: data,
        qr_code:
          data.point_of_interaction
            ?.transaction_data?.qr_code,

        qr_code_base64:
          data.point_of_interaction
            ?.transaction_data?.qr_code_base64,
      }),
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error.message,
      }),
      {
        status: 500,
      }
    )
  }
})
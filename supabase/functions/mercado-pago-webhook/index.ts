import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    const body = await req.json()

    const mercadoPagoPaymentId =
      body?.data?.id ||
      body?.id

    if (!mercadoPagoPaymentId) {
      return new Response(
        JSON.stringify({ error: 'payment id not found' }),
        { status: 400 }
      )
    }

    const accessToken = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    const supabase = createClient(supabaseUrl!, serviceRoleKey!)

    const mpResponse = await fetch(
      `https://api.mercadopago.com/v1/payments/${mercadoPagoPaymentId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    )

    const mpPayment = await mpResponse.json()
    console.log('MP PAYMENT STATUS:', mpPayment.status)
    console.log('MP PAYMENT ID:', mpPayment.id)
    if (mpPayment.status !== 'approved') {
      return new Response(
        JSON.stringify({
          ok: true,
          status: mpPayment.status,
          message: 'payment not approved yet',
        }),
        { headers: { 'Content-Type': 'application/json' } }
      )
    }

    const mercadoPagoId = String(mpPayment.id)
    const externalReference = mpPayment.external_reference

    let query = supabase
      .from('payments')
      .update({
        status: 'paid',
        paid_at: new Date().toISOString(),
      })
      .eq('mercado_pago_id', mercadoPagoId)
      .select()
      .single()

    let { data: payment, error: paymentError } = await query

    if (paymentError && externalReference) {
      const fallback = await supabase
        .from('payments')
        .update({
          status: 'paid',
          paid_at: new Date().toISOString(),
        })
        .eq('id', externalReference)
        .select()
        .single()

      payment = fallback.data
      paymentError = fallback.error
    }

    if (paymentError) throw paymentError

    if (
      payment.type === 'subscription' &&
      payment.subscription_id
    ) {
      const { error } = await supabase
        .from('user_subscriptions')
        .update({ status: 'active' })
        .eq('id', payment.subscription_id)

      if (error) throw error
    }

    if (
      payment.type === 'appointment' &&
      payment.appointment_id
    ) {
      const { error } = await supabase
        .from('appointments')
        .update({ payment_status: 'paid' })
        .eq('id', payment.appointment_id)

      if (error) throw error
    }

    return new Response(
      JSON.stringify({
        ok: true,
        payment_id: payment.id,
        mercado_pago_id: mercadoPagoId,
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error.message,
      }),
      { status: 500 }
    )
  }
})
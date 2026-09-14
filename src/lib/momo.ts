import crypto from "crypto";

export async function createMoMoPaymentUrl({orderId, amount} : {orderId: string, amount: number}){
    const partnerCode = process.env.MOMO_PARTNER_CODE!;
    const accessKey = process.env.MOMO_ACCESS_KEY!;
    const secretKey = process.env.MOMO_SECRET_KEY!;
    const endpoint = process.env.MOMO_API_URL!;


    const redirectUrl = `${process.env.NEXT_PUBLIC_APP_URL}/checkout/result`;
    const ipnUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/webhook?provider=momo`;
    const requestId = `${orderId}_${Date.now()}`;
    const orderInfo = `Thanh toan don hang ${orderId}`;
    const requestType = 'captureWallet';
    const extraData = '';

    const numericAmount = Math.round(Number(amount));

    const rawSignature = `accessKey=${accessKey}&amount=${numericAmount}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${partnerCode}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${requestType}`;

    const signature = crypto
        .createHmac('sha256', secretKey)
        .update(rawSignature)
        .digest('hex')

    const requestBody = JSON.stringify({
        partnerCode,
        requestId,
        amount: numericAmount, // Phải là Number!
        orderId,
        orderInfo,
        redirectUrl,
        ipnUrl,
        extraData,
        requestType,
        signature,
        lang: 'vi',
    })

    const response = await fetch(endpoint, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: requestBody,
    })

    const data = await response.json()

    if(data.resultCode !== 0){
        throw new Error(`MoMo Error [${data.resultCode}] : ${data.message}`)
    }
    return {
        payUrl: data.payUrl,
        qrCodeUrl: data.qrCodeUrl || data.payUrl,
        requestId
    }

}
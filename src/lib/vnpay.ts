import crypto from 'crypto';
import querystring from 'qs';

function sortObject(obj: Record<string, unknown>) {
  const sorted: Record<string, string> = {};
  const keys = Object.keys(obj).sort();
  for (const key of keys) {
    if(obj[key] !== null && obj[key] !== undefined && obj[key] !== '')
    sorted[key] = encodeURIComponent(String(obj[key])).replace(/%20/g, '+');
  }
  return sorted;
}

export function buildVNPayUrl({ referenceId, amount, ipAddr,}: { referenceId: string; amount: number; ipAddr: string;}) {
  
    const tmnCode = process.env.VNP_TMN_CODE!;
    const secretKey = process.env.VNP_HASH_SECRET!;
    const vnpUrl = process.env.VNP_URL!;
    const returnUrl = `${process.env.NEXT_PUBLIC_APP_URL}/checkout/result`;

    const date = new Date();
    const createDate = date.toISOString().replace(/[^0-9]/g, '').slice(0, 14);

    const numericAmount = Math.round(Number(amount) * 100);

    let vnp_Params: Record<string, unknown> = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: tmnCode,
      vnp_Locale: 'vn',
      vnp_CurrCode: 'VND',
      vnp_TxnRef: referenceId,
      vnp_OrderInfo: `Thanh toan don hang ${referenceId}`,
      vnp_OrderType: 'other',
      vnp_Amount: numericAmount,
      vnp_ReturnUrl: returnUrl,
      vnp_IpAddr: ipAddr || '127.0.0.1',
      vnp_CreateDate: createDate,
    };

    vnp_Params = sortObject(vnp_Params);

    const signData = querystring.stringify(vnp_Params, { encode: false });
    const hmac = crypto.createHmac('sha512', secretKey);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
    vnp_Params['vnp_SecureHash'] = signed;

    return `${vnpUrl}?${querystring.stringify(vnp_Params, { encode: false })}`;
}
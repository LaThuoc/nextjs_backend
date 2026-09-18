import { NextRequest, NextResponse } from "next/server";
import crypto from 'crypto';
import querystring from 'qs';
import { prisma } from "@/src/lib/db";

function sortObject(obj: Record<string, string>) {
  const sorted: Record<string, string> = {};
  const keys = Object.keys(obj).sort();

  for (const key of keys) {
    if (obj[key] !== null && obj[key] !== undefined && obj[key] !== '') {
      sorted[key] = String(obj[key]);
    }
  }
  return sorted;
}

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    let vnp_Params: Record<string, string> = {};

    searchParams.forEach((value, key) => {
      vnp_Params[key] = value;
    });

    const secureHash = vnp_Params['vnp_SecureHash'];
    delete vnp_Params['vnp_SecureHash'];
    delete vnp_Params['vnp_SecureHashType'];

    vnp_Params = sortObject(vnp_Params);

    const secretKey = process.env.VNP_HASH_SECRET!;
    
    const signData = querystring.stringify(vnp_Params, { encode: false });
    const hmac = crypto.createHmac('sha512', secretKey);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    if (secureHash?.toLowerCase() !== signed.toLowerCase()) {
      return NextResponse.json(
        { RspCode: '97', Message: 'Invalid Checksum' }
      );
    }

    const referenceId = vnp_Params['vnp_TxnRef'];
    const rspCode = vnp_Params['vnp_ResponseCode'];
    const vnp_Amount = Number(vnp_Params['vnp_Amount']) / 100;
    const vnp_TransactionNo = vnp_Params['vnp_TransactionNo'];

    
    if(rspCode === '00'){
      const result = await prisma.$transaction(async(tx) => {
        const transaction = await tx.paymentTransaction.findUnique({
            where: { referenceId },
            include: { order: true }
        });
        
        if (!transaction) {
          return { code: '01', message: 'Order not found' }
        }

        if (Math.round(Number(transaction.amount)) !== Math.round(vnp_Amount)) {
          return { code: '04', message: 'Invalid amount' }
        }

        const updateResult = await tx.paymentTransaction.updateMany({
          where: {id: transaction.id, status: 'PENDING'},
          data: {
            status: 'SUCCESS',
            transactionNo: vnp_TransactionNo,
            rawResponse: JSON.stringify(vnp_Params)
          }
        })
        if(updateResult.count === 0){
          return {code: '02', message: 'order already confirmed '}
        }
        await tx.order.update({
          where: { id: transaction.orderId },
          data: {
            isPaid: true,
            paidAt: new Date(),
            status: 'PROCESSING',
            paymentMethod: transaction.provider
          }
        })
        return {code: '00', message: 'Confirm Success'}

      })
      return NextResponse.json({RspCode: result.code, Message: result.message})
    } else {
      const transaction = await prisma.paymentTransaction.findUnique({
        where: {referenceId}
      })
      if(!transaction){
        return NextResponse.json({
          RspCode: '01',
          message: 'Order not found'
        })
      }
      if (Math.round(Number(transaction.amount)) !== Math.round(vnp_Amount)) {
        return NextResponse.json({ RspCode: '04', message: 'Invalid amount' });
      }
      const updateResult = await prisma.paymentTransaction.updateMany({
        where: {id: transaction.id, status: 'PENDING'},
        data: {
          status: 'FAILED',
          transactionNo: vnp_TransactionNo,
          rawResponse: JSON.stringify(vnp_Params)
        }
      })
      if(updateResult.count === 0){
        return NextResponse.json({RspCode: '02', message: 'Order already confirmed'})
      }
      return NextResponse.json({ RspCode: '00', Message: 'Confirm Success' });
    }
  
  } catch (error) {
    console.error('Lỗi VNPAY IPN', error);
    return NextResponse.json({ RspCode: '99', Message: 'Unknown Error' });
  }
}
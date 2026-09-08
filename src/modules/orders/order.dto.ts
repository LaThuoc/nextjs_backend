import { z } from 'zod';

export const CreateOrderSchema = z.object({
  // Thông tin người nhận
  recipientName: z.string().min(1, 'Tên người nhận không được để trống'),
  recipientPhone: z.string().min(1, 'Số điện thoại không được để trống'),

  // Địa chỉ giao hàng (GHN Format)
  provinceId: z.number({ message: 'Chưa chọn Tỉnh/Thành' }),
  provinceName: z.string().min(1, 'Tên Tỉnh/Thành không được để trống'),
  districtId: z.number({ message: 'Chưa chọn Quận/Huyện' }),
  districtName: z.string().min(1, 'Tên Quận/Huyện không được để trống'),
  wardCode: z.string().min(1, 'Chưa chọn Phường/Xã'),
  wardName: z.string().min(1, 'Tên Phường/Xã không được để trống'),
  detailAddress: z.string().min(1, 'Địa chỉ chi tiết không được để trống'),

  // Phí vận chuyển & Khuyến mãi
  shippingFee: z.number().min(0, 'Phí vận chuyển không hợp lệ'),
  discountAmount: z.number().min(0).default(0),
  couponId: z.string().optional(),

  // Thanh toán & Ghi chú
  paymentMethod: z.enum(['COD', 'VNPAY', 'MOMO']).default('COD'),
  weight: z.number().default(500),
  note: z.string().optional(),
});

export const UpdateOrderStatusSchema = z.object({
  status: z.enum(['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']),
});

export const CancelOrderSchema = z.object({
  cancelReason: z.string().min(1, 'Vui lòng nhập lý do hủy đơn hàng'),
});

export type CreateOrderDto = z.infer<typeof CreateOrderSchema>;
export type UpdateOrderStatusDto = z.infer<typeof UpdateOrderStatusSchema>;
export type CancelOrderDto = z.infer<typeof CancelOrderSchema>;
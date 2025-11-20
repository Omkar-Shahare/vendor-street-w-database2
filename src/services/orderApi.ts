import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type Order = Database['public']['Tables']['orders']['Row'];
type OrderInsert = Database['public']['Tables']['orders']['Insert'];
type OrderItemInsert = Database['public']['Tables']['order_items']['Insert'];

export interface OrderItem {
  product_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface CreateOrderData {
  vendor_id: string;
  supplier_id: string;
  order_number: string;
  items: OrderItem[];
  total_amount: number;
  delivery_address: string;
  delivery_date?: string;
  notes?: string;
  status?: string;
}

export interface OrderResponse {
  message: string;
  orderId: string;
  data: Order;
}

export const orderApi = {
  create: async (orderData: CreateOrderData): Promise<OrderResponse> => {
    console.log('Creating order with Supabase:', orderData);

    const { items, ...orderFields } = orderData;

    const orderInsert: OrderInsert = {
      vendor_id: orderFields.vendor_id,
      supplier_id: orderFields.supplier_id,
      order_number: orderFields.order_number,
      status: orderFields.status || 'pending',
      total_amount: orderFields.total_amount,
      delivery_address: orderFields.delivery_address,
      delivery_date: orderFields.delivery_date ? new Date(orderFields.delivery_date).toISOString() : null,
      notes: orderFields.notes || null,
    };

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert(orderInsert)
      .select()
      .single();

    if (orderError) {
      console.error('Supabase Order Error:', orderError);
      throw new Error(`Failed to create order: ${orderError.message}`);
    }

    const itemsWithOrderId: OrderItemInsert[] = items.map(item => ({
      order_id: order.id,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total_price: item.total_price,
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(itemsWithOrderId);

    if (itemsError) {
      console.error('Supabase Order Items Error:', itemsError);
      await supabase.from('orders').delete().eq('id', order.id);
      throw new Error(`Failed to create order items: ${itemsError.message}`);
    }

    console.log('Order created successfully:', order);
    return {
      message: 'Order created successfully',
      orderId: order.id,
      data: order,
    };
  },

  getAll: async (): Promise<Order[]> => {
    console.log('Fetching all orders');

    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase Error:', error);
      throw new Error(`Failed to fetch orders: ${error.message}`);
    }

    return data;
  },

  getByVendorId: async (vendorId: string): Promise<Order[]> => {
    console.log('Fetching orders by vendor ID:', vendorId);

    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('vendor_id', vendorId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase Error:', error);
      throw new Error(`Failed to fetch orders: ${error.message}`);
    }

    return data;
  },

  getBySupplierId: async (supplierId: string): Promise<Order[]> => {
    console.log('Fetching orders by supplier ID:', supplierId);

    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('supplier_id', supplierId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase Error:', error);
      throw new Error(`Failed to fetch orders: ${error.message}`);
    }

    return data;
  },

  getPendingOrders: async (): Promise<Order[]> => {
    console.log('Fetching pending orders');

    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase Error:', error);
      throw new Error(`Failed to fetch pending orders: ${error.message}`);
    }

    return data;
  },

  getById: async (orderId: string): Promise<Order> => {
    console.log('Fetching order by ID:', orderId);

    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (error) {
      console.error('Supabase Error:', error);
      throw new Error(`Failed to fetch order: ${error.message}`);
    }

    return data;
  },

  updateStatus: async (orderId: string, status: string): Promise<Order> => {
    console.log('Updating order status:', orderId, status);

    const { data, error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId)
      .select()
      .single();

    if (error) {
      console.error('Supabase Error:', error);
      throw new Error(`Failed to update order status: ${error.message}`);
    }

    return data;
  },

  delete: async (orderId: string): Promise<void> => {
    console.log('Deleting order:', orderId);

    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('id', orderId);

    if (error) {
      console.error('Supabase Error:', error);
      throw new Error(`Failed to delete order: ${error.message}`);
    }
  },
};

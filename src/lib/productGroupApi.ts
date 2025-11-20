import { supabase } from './supabase';
import type { Database } from './database.types';

type Product = Database['public']['Tables']['products']['Row'];
type ProductInsert = Database['public']['Tables']['products']['Insert'];
type ProductUpdate = Database['public']['Tables']['products']['Update'];

interface ProductGroupData {
  supplier_id: string;
  name: string;
  category: string;
  unit: string;
  price_per_unit: number;
  min_order_quantity?: number;
  stock_available?: boolean;
  description?: string;
  image_url?: string;
}

export async function createProductGroup(data: ProductGroupData): Promise<Product> {
  console.log('Creating product with Supabase:', data);

  const productData: ProductInsert = {
    supplier_id: data.supplier_id,
    name: data.name,
    category: data.category,
    unit: data.unit,
    price_per_unit: data.price_per_unit,
    min_order_quantity: data.min_order_quantity || 1,
    stock_available: data.stock_available !== undefined ? data.stock_available : true,
    description: data.description || null,
    image_url: data.image_url || null,
  };

  const { data: result, error } = await supabase
    .from('products')
    .insert(productData)
    .select()
    .single();

  if (error) {
    console.error('Supabase Error:', error);
    throw new Error(`Failed to create product: ${error.message}`);
  }

  console.log('Product created successfully:', result);
  return result;
}

export async function fetchProductGroups(params: Record<string, any> = {}): Promise<Product[]> {
  console.log('Fetching products with params:', params);

  let query = supabase.from('products').select('*');

  if (params.supplier_id) {
    query = query.eq('supplier_id', params.supplier_id);
  }

  if (params.category) {
    query = query.ilike('category', `%${params.category}%`);
  }

  if (params.stock_available !== undefined) {
    query = query.eq('stock_available', params.stock_available);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) {
    console.error('Supabase Error:', error);
    throw new Error(`Failed to fetch products: ${error.message}`);
  }

  console.log('Products fetched successfully:', data);
  return data;
}

export async function updateProductGroupStatus(id: string, status: 'accepted' | 'declined' | 'delivered'): Promise<Product> {
  console.log(`Updating product status: ${id} with status: ${status}`);

  const updateData: ProductUpdate = {
    stock_available: status === 'delivered' ? true : status === 'accepted' ? true : false,
  };

  const { data: result, error } = await supabase
    .from('products')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Supabase Error:', error);
    throw new Error(`Failed to update product status: ${error.message}`);
  }

  console.log('Product status updated successfully:', result);
  return result;
}

export async function updateProductGroup(id: string, data: ProductUpdate): Promise<Product> {
  console.log(`Updating product ${id} with data:`, data);

  const { data: result, error } = await supabase
    .from('products')
    .update(data)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Supabase Error:', error);
    throw new Error(`Failed to update product: ${error.message}`);
  }

  console.log('Product updated successfully:', result);
  return result;
}

export async function deleteProductGroup(id: string): Promise<void> {
  console.log(`Deleting product ${id}`);

  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Supabase Error:', error);
    throw new Error(`Failed to delete product: ${error.message}`);
  }

  console.log('Product deleted successfully');
}
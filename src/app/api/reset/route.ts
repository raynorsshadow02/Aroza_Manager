import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json({ error: 'Supabase configuration missing' }, { status: 500 });
  }

  const authHeader = req.headers.get('authorization');
  const token = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.substring('Bearer '.length)
    : undefined;

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    },
  });

  // Verify authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized reset request' }, { status: 401 });
  }

  // 1. Execute DB reset RPC
  const { error: rpcError } = await supabase.rpc('reset_user_data_secure');

  if (rpcError) {
    console.error('Reset RPC error:', rpcError);
    return NextResponse.json({ error: rpcError.message || 'Reset failed' }, { status: 500 });
  }

  // 2. Clean up user files in Supabase Storage buckets
  const buckets = ['product_images', 'receipts', 'invoices', 'order_screenshots'];
  const storageErrors: string[] = [];

  for (const bucket of buckets) {
    try {
      const { data: fileList, error: listErr } = await supabase.storage
        .from(bucket)
        .list(`${user.id}`, { limit: 1000 });

      if (listErr) {
        // Bucket might not exist or be empty, ignore not found errors
        continue;
      }

      if (fileList && fileList.length > 0) {
        const filePaths = fileList
          .filter((file) => file.name && !file.name.startsWith('.'))
          .map((file) => `${user.id}/${file.name}`);

        if (filePaths.length > 0) {
          const { error: removeErr } = await supabase.storage
            .from(bucket)
            .remove(filePaths);

          if (removeErr) {
            storageErrors.push(`Failed to remove files in ${bucket}: ${removeErr.message}`);
          }
        }
      }
    } catch (err: any) {
      storageErrors.push(`Error processing ${bucket}: ${err.message}`);
    }
  }

  return NextResponse.json({
    success: true,
    storageWarnings: storageErrors.length > 0 ? storageErrors : undefined,
  });
}

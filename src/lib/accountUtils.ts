import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export async function ensureAccountExists(userId: string) {
  try {
    // Check if account exists
    const { data: existingAccount, error: fetchError } = await supabase
      .from('accounts')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (fetchError) {
      console.error('Error fetching account:', fetchError);
      toast.error(`Error fetching account: ${fetchError.message}`);
      throw fetchError;
    }

    if (existingAccount) {
      return existingAccount;
    }

    // Create account if it doesn't exist
    console.log('Creating new account for user:', userId);
    const { data: newAccount, error } = await supabase
      .from('accounts')
      .insert({
        user_id: userId,
        account_number: `GB${Math.floor(10000000 + Math.random() * 90000000)}`,
        account_type: 'savings',
        balance: 0,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating account:', error);
      toast.error(`Error creating account: ${error.message}`);
      throw error;
    }

    console.log('Account created successfully:', newAccount);
    toast.success('Account created successfully!');
    return newAccount;
  } catch (error: any) {
    console.error('Error ensuring account exists:', error);
    toast.error(error?.message || 'Failed to create/fetch account');
    throw error;
  }
}

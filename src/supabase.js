import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://yefvypbyakgyugoyshmw.supabase.co";
const SUPABASE_KEY = "sb_publishable_eFqcK7a1Ddg91rjtMGQ5MQ_8FxvLd4C";

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

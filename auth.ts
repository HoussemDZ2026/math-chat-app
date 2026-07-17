sb_publishable_c4kC3SkqWwkmknTT7u9j8Q_-eKnEx4o
import { createClient, User } from '@supabase/supabase-base-js';

// تهيئة عميل Supabase باستخدام متغيرات البيئة الحساسة
const supabaseUrl = process.env.SUPABASE_URL || 'https://your-supabase-url.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'your-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// تعريف واجهة لبيانات صلاحيات المستخدم في التطبيق
export interface UserProfile {
  id: string;
  email: string;
  role: 'student' | 'parent' | 'admin';
  subscription_end_date: string | null; // تاريخ انتهاء الاشتراك المالي
  level: '1AM' | '2AM' | '3AM' | '4AM' | null; // السنة الدراسية للطور المتوسط
}

/**
 * التحقق من جلسة المستخدم الحالية وصلاحية اشتراكه
 */
export async function checkUserSession(): Promise<{ user: User | null; profile: UserProfile | null; error: string | null }> {
  try {
    // 1. جلب بيانات الجلسة الحالية من Supabase
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      return { user: null, profile: null, error: 'لم يتم العثور على جلسة نشطة. يرجى تسجيل الدخول.' };
    }

    const user = session.user;

    // 2. جلب صلاحيات المستخدم الإضافية وتفاصيل اشتراكه من جدول المستخدمين المخصص
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, role, subscription_end_date, level')
      .eq('id', user.id)
      .single();

    if (profileError) {
      return { user, profile: null, error: 'فشل في جلب بيانات الصلاحيات والاشتراك.' };
    }

    // 3. التحقق من صلاحية مدة الاشتراك للتلميذ
    if (profile.role === 'student' && profile.subscription_end_date) {
      const expiryDate = new Date(profile.subscription_end_date);
      const currentDate = new Date();
      
      if (currentDate > expiryDate) {
        return { user, profile: profile as UserProfile, error: 'انتهت فترة اشتراكك في منصة الأستاذ حسام للرياضيات. يرجى التجديد.' };
      }
    }

    return { user, profile: profile as UserProfile, error: null };

  } catch (err) {
    console.error('حدث خطأ غير متوقع أثناء التحقق من الصلاحيات:', err);
    return { user: null, profile: null, error: 'حدث خطأ داخلي في الخادم.' };
  }
}

/**
 * تسجيل الخروج بأمان وإنهاء الجلسة
 */
export async function logoutUser(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error('خطأ أثناء تسجيل الخروج:', error.message);
  } else {
    // إعادة توجيه المستخدم لصفحة تسجيل الدخول أو تحديث الصفحة
    window.location.href = '/login.html';
  }
}

import os
import json
import requests
from dotenv import load_dotenv

# تحميل متغيرات البيئة (مثل روابط الـ Webhooks والـ API Keys)
load_dotenv()

# رابط الـ Webhook الخاص بـ n8n لاستلام تحديثات المناهج الوزارية
N8N_WEBHOOK_URL = os.getenv("N8N_WEBHOOK_URL", "https://your-n8n-instance.com/webhook/sync-curriculum")
# مسار تخزين ملف المنهج محلياً داخل خادم التطبيق
LOCAL_CURRICULUM_PATH = os.path.join(os.path.dirname(__file__), "curriculum_data.json")

def fetch_latest_curriculum():
    """
    يقوم بالاتصال بـ n8n لجلب آخر تحديثات المناهج التعليمية للطور المتوسط في مادة الرياضيات.
    """
    print("⏳ جاري بدء المزامنة مع n8n لجلب المناهج الوزارية...")
    
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {os.getenv('SYNC_TOKEN', 'default_secure_token')}"
    }
    
    try:
        # إرسال طلب لـ n8n لبدء سحب البيانات من موقع الوزارة أو قاعدة البيانات المحدثة
        response = requests.post(N8N_WEBHOOK_URL, json={"action": "get_latest_curriculum"}, headers=headers, timeout=30)
        
        if response.status_code == 200:
            curriculum_data = response.json()
            
            # حفظ المنهج المحدث محلياً لكي يستخدمه ملف solve.js لمطابقة الشروحات
            with open(LOCAL_CURRICULUM_PATH, "w", encoding="utf-8") as f:
                json.dump(curriculum_data, f, ensure_ascii=False, indent=4)
                
            print("✅ تمت المزامنة بنجاح! تم تحديث ملف المنهج المحلي.")
            return True
        else:
            print(f"❌ فشلت المزامنة. رمز الاستجابة من n8n: {response.status_code}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ خطأ أثناء الاتصال بـ n8n: {e}")
        return False

def verify_curriculum_structure():
    """
    يتحقق من وجود ملف المناهج محلياً وصحة هيكل البيانات لدعم الذكاء الاصطناعي.
    """
    if not os.path.exists(LOCAL_CURRICULUM_PATH):
        print("⚠️ ملف المناهج المحلي غير موجود. جاري إنشاء ملف أولي...")
        initial_structure = {
            "level_1_am": {"topics": ["الأعداد الطبيعية والعشرية", "الكتابات الكسرية", "الهندسة الأساسية"]},
            "level_2_am": {"topics": ["الكسور والعمليات عليها", "الأعداد النسبية", "الزوايا والمثلثات"]},
            "level_3_am": {"topics": ["الحساب الحرفي", "القوى ذات أسس نسبية صحيحة", "خاصية فيثاغورس"]},
            "level_4_am": {"topics": ["الحساب على الجذور", "خاصية طاليس", "المعادلات والمتراجحات"]}
        }
        with open(LOCAL_CURRICULUM_PATH, "w", encoding="utf-8") as f:
            json.dump(initial_structure, f, ensure_ascii=False, indent=4)
        print("📁 تم إنشاء الملف الأولي بنجاح.")

if __name__ == "__main__":
    verify_curriculum_structure()
    fetch_latest_curriculum()

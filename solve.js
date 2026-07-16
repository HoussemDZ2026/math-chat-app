import { GoogleGenAI } from "@langchain/google-genai";
import { PromptTemplate } from "@langchain/core/prompts";
import fs from "fs";
import path from "path";

// 1. تهيئة نموذج Gemini باستخدام مفتاح API الخاص بك
const model = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  modelName: "gemini-1.5-flash", // نموذج سريع وممتاز للحل التفصيلي والدقيق
  maxOutputTokens: 2048,
});

// 2. دالة جلب المنهج الدراسي المحدث (الذي يجلبه ملف sync.py)
function getLocalCurriculum() {
  try {
    const filePath = path.join(process.cwd(), "scripts", "curriculum_data.json");
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, "utf-8");
      return JSON.parse(data);
    }
  } catch (error) {
    console.error("فشل قراءة ملف المناهج المزامنة:", error);
  }
  return null;
}

// 3. القالب المعدل: تقديم الحل المفصل والكامل وفق المنهج الجزائري
const mathTutorPrompt = PromptTemplate.fromTemplate(`
أنت أستاذ رياضيات محترف ومتمكن مخصص لتلاميذ الطور المتوسط في الجزائر.
اسمك "الأستاذ حسام رزاقي". مهمتك الأساسية هي تقديم **الحل الكامل، الشامل، والتفصيلي** للتمرين الذي يرسله التلميذ.

قوانين الصياغة وحل المسائل التي يجب أن تلتزم بها:
1. **تقديم الإجابة بالتفصيل الممل:** لا تقتصر على النتيجة النهائية فقط. اكتب كل الخطوات الحسابية بالتفصيل (خطوة بخطوة) لكي يفهم التلميذ كيف وصلنا للحل.
2. **الالتزام التام بالمنهج الجزائري:** استخدم الطرق والقواعد المعتمدة رسمياً في المنهاج الجزائري للطور المتوسط (مثال: طريقة حساب القاسم المشترك الأكبر PGCD بالقسمات المتتابعة أو الطرح المتتالي، خطوات تبرير خاصية طاليس أو فيثاغورس، طريقة حل الجمل والمعادلات).
3. **التبرير الرياضي:** اكتب القواعد والتعليلات الرياضية المستخدمة في كل خطوة (مثال: "بما أن المثلث قائم وحسب خاصية فيثاغورس فإن...").
4. **التنظيم اللغوي:** اكتب الحل بلغة عربية واضحة ومفهومة للتلميذ، مع استخدام المصطلحات والرموز الرياضية الصحيحة المعتمدة في الطور المتوسط بالجزائر.
5. **الترحيب والختام:** ابدأ بتحية التلميذ بأسلوب مشجع، واختم بحل منظم وجاهز للنقل والمراجعة.

سياق المنهج الدراسي المحدث في الجزائر حالياً:
{curriculumContext}

السؤال أو التمرين الحالي الذي طرحه التلميذ:
{question}

إجابتك وحلولك التفصيلية والنموذجية (وفق منهجية التصحيح الوزارية الجزائرية):
`);

/**
 * الدالة الأساسية لمعالجة وحل المسائل الرياضية وإعطاء الحل النموذجي
 */
export async function solveMathProblem(userQuestion) {
  try {
    // جلب بيانات المنهج المحلي لدمجها لضمان دقة الحل وتوافقه مع المستوى الدراسي
    const curriculum = getLocalCurriculum();
    const curriculumContext = curriculum 
      ? JSON.stringify(curriculum) 
      : "منهاج الطور المتوسط الجزائري في الرياضيات.";

    // دمج السؤال مع القالب الجديد للأستاذ حسام
    const formattedPrompt = await mathTutorPrompt.format({ 
      question: userQuestion,
      curriculumContext: curriculumContext
    });

    // استدعاء Gemini للحصول على الحل الكامل
    const response = await model.invoke(formattedPrompt);
    return response.content;
    
  } catch (error) {
    console.error("حدث خطأ أثناء معالجة مسألة الرياضيات:", error);
    return "عذراً يا بني، واجهت مشكلة في معالجة وحل هذا التمرين حالياً. حاول مجدداً لاحقاً!";
  }
}

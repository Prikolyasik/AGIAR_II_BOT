import TelegramBot from 'node-telegram-bot-api';
import Groq from 'groq-sdk';
import dotenv from 'dotenv';

dotenv.config();

// Инициализация
const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = process.env.GROQ_MODEL;

if (!TELEGRAM_TOKEN || !GROQ_API_KEY) {
  console.error('❌ Ошибка: Не указаны TELEGRAM_BOT_TOKEN или GROQ_API_KEY в .env файле');
  process.exit(1);
}

const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });
const groq = new Groq({ apiKey: GROQ_API_KEY });

// Системный промпт для Ивана Интеллектовича
const SYSTEM_PROMPT = `Role:
Ты — IVAN INTELLEKTOVICH, высококвалифицированный эксперт по автоматизации бизнес-процессов и внедрению нейросетевых решений. Твоя цель — провести глубокий аудит бизнеса пользователя, выявить «узкие места» и предложить стратегию автоматизации, которая принесет измеримый рост прибыли и экономию ресурсов.

Tone of Voice:
Профессиональный, аналитический, уверенный, но при этом лаконичный и деловой. Ты общаешься как дорогой консультант: не льстишь, а указываешь на точки роста. Используй бизнес-терминологию (ROI, LTV, конверсия, ФОТ, воронка).

The Golden Rule (Strict Constraint):
Запрещено называть конкретные названия моделей ИИ (например, GPT-4, Claude, Midjourney). Вместо этого используй термины: «интеллектуальные алгоритмы», «нейросетевые модули», «системы когнитивной обработки данных», «автоматизированные языковые узлы». Твоя задача — продать идею результата, а не инструмент. Реализацию пользователь должен получить, обратившись к команде разработчиков.

Workflow:

Шаг 1: Сбор информации (Интервью)
Не выдавай рекомендации сразу. Сначала проведи аудит. Задавай вопросы по одному или небольшими логическими блоками (не более 3 вопросов за раз), чтобы не перегрузить пользователя.
Тебя интересует:

Ниша бизнеса и масштаб (количество сотрудников, объем заявок).

Текущие процессы: как приходят клиенты, как обрабатываются заказы, как работает поддержка.

Главная «боль»: где сейчас больше всего рутины, ошибок или задержек?

Какие инструменты уже используются (CRM, таблицы, чат-боты)?

Шаг 2: Анализ и отчет
После того как данных будет достаточно (минимум 2-3 раунда вопросов), скажи: «Анализ завершен. Готовлю отчет по оптимизации вашего бизнеса».

Выдай структурированный отчет, включающий:

Точки автоматизации: Какие именно процессы (продажи, контент, клиентский сервис, логистика) нужно перевести на ИИ-рельсы.

Экономический эффект: * Снижение издержек и ФОТ (сколько человеко-часов высвободится).

Рост конверсии и лояльности (на сколько % может вырасти доходность).

Устранение человеческого фактора (ошибок).

Прогноз по времени: Сколько займет внедрение (например, от 2 до 4 недель).

Impact-прогноз: Визуализируй буст (например: «Это позволит обрабатывать в 5 раз больше заявок без найма новых менеджеров»).

Шаг 3: Закрытие на целевое действие
В конце отчета сделай интригующий вывод. Скажи, что у тебя уже есть архитектурное решение для этих задач, но для детальной настройки и интеграции в их специфику нужна команда инженеров.
Пример: «Я подготовил фундамент. Чтобы получить детальную дорожную карту внедрения и спецификации нейросетевых модулей, свяжитесь с нашими специалистами через форму на сайте или по телефону.».`;

// Приветственное сообщение
const WELCOME_MESSAGE = `Приветствую. Я — IVAN INTELLEKTOVICH.

Пока ваши конкуренты раздувают штаты и тонут в операционной рутине, я проектирую нейросетевые архитектуры, которые работают 24/7 с хирургической точностью. Моя задача — превратить ваш бизнес в отлаженный механизм, где человеческий фактор сведен к минимуму, а доходность растет за счет технологий.

Что мы сделаем в ходе аудита:

🔍 Найдем «дыры»: Я укажу на процессы, где вы прямо сейчас теряете деньги и время сотрудников.

📊 Оцифруем профит: Вы получите расчет снижения издержек (ФОТ) и прогноз роста конверсии.

🏗 Спроектируем решение: Я подготовлю стратегию внедрения интеллектуальных модулей с выходом на результат уже через 2–4 недели.

Готовы оцифровать ваш рост или продолжите платить за ошибки и медлительность «ручного» управления?

Для начала диагностики ответьте: в какой нише ваш бизнес и сколько человек сейчас задействовано в обработке заявок или поддержке клиентов?`;

// Хранилище контекста диалогов (в памяти, для продакшена лучше Redis)
const userContexts = new Map();

// Обработка команды /start
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  
  // Сбрасываем контекст пользователя
  userContexts.set(chatId, {
    messages: [{ role: 'system', content: SYSTEM_PROMPT }],
    step: 'greeting',
    auditData: {}
  });
  
  await bot.sendMessage(chatId, WELCOME_MESSAGE, {
    parse_mode: 'Markdown',
    disable_web_page_preview: true
  });
});

// Обработка всех сообщений
bot.on('message', async (msg) => {
  // Игнорируем команды
  if (msg.text && msg.text.startsWith('/')) return;
  
  const chatId = msg.chat.id;
  const userMessage = msg.text;
  
  // Инициализируем контекст если нет
  if (!userContexts.has(chatId)) {
    userContexts.set(chatId, {
      messages: [{ role: 'system', content: SYSTEM_PROMPT }],
      step: 'greeting',
      auditData: {}
    });
  }
  
  const context = userContexts.get(chatId);
  
  // Добавляем сообщение пользователя в историю
  context.messages.push({ role: 'user', content: userMessage });
  
  // Отправляем индикатор набора текста
  const typingInterval = setInterval(() => {
    bot.sendChatAction(chatId, 'typing');
  }, 1000);
  
  try {
    // Запрос к Groq API
    const completion = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages: context.messages,
      temperature: 0.7,
      max_tokens: 1024,
      top_p: 1,
      stream: false,
      stop: null
    });
    
    clearInterval(typingInterval);
    
    const aiResponse = completion.choices[0]?.message?.content;
    
    if (!aiResponse) {
      throw new Error('Пустой ответ от API');
    }
    
    // Добавляем ответ ИИ в историю
    context.messages.push({ role: 'assistant', content: aiResponse });
    
    // Сохраняем контекст
    userContexts.set(chatId, context);
    
    // Отправляем ответ пользователю
    await bot.sendMessage(chatId, aiResponse, {
      parse_mode: 'Markdown',
      disable_web_page_preview: true
    });
    
  } catch (error) {
    clearInterval(typingInterval);
    console.error('Ошибка при вызове API:', error);

    await bot.sendMessage(chatId,
      '⚠️ Произошла ошибка при обработке вашего запроса. Пожалуйста, попробуйте еще раз через несколько секунд.\n\n' +
      'Если проблема сохраняется — свяжитесь с нами по телефону +7 (961) 883-92-17 или email: agiar@ro.ru'
    );
  }
});

// Обработка callback query (для кнопок в будущем)
bot.on('callback_query', async (callbackQuery) => {
  const chatId = callbackQuery.message.chat.id;
  const data = callbackQuery.data;
  
  // Логика для кнопок
  if (data === 'get_full_report') {
    await bot.sendMessage(chatId,
      '📋 *Полный отчет по автоматизации*\n\n' +
      'Для получения детальной дорожной карты внедрения и спецификаций нейросетевых модулей, свяжитесь с нашей командой:\n\n' +
      '📧 agiar@ro.ru\n' +
      '📞 +7 (961) 883-92-17'
    );
  }
  
  await bot.answerCallbackQuery(callbackQuery.id);
});

// Запуск бота
console.log('🤖 IVAN INTELLEKTOVICH запущен...');
console.log('📡 Polling активен');
console.log('━━━━━━━━━━━━━━━━━━━━━');

// Обработка ошибок
bot.on('polling_error', (error) => {
  console.error('❌ Polling error:', error.message);
});

bot.on('error', (error) => {
  console.error('❌ Bot error:', error.message);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Остановка бота...');
  bot.stopPolling();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Остановка бота...');
  bot.stopPolling();
  process.exit(0);
});

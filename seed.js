// Скрипт для генерации синтетических ответов на опрос
// Запуск: node seed.js (после запуска сервера)
// Очищает старые данные и генерирует 150 новых ответов

const API_URL = process.env.API_URL || 'http://localhost:3000';

// Конфигурация департаментов — более позитивные профили
// Диапазоны сдвинуты вверх, чтобы общий статус был "Есть проблемы" вместо "Критично"
const departments = [
  {
    name: 'Департамент продаж',
    // Проблемный, но не катастрофа
    profile: { effectiveness: [5, 7], communication: [6, 8], transparency: [4, 6], responsiveness: [5, 7], closure_speed: [5, 7], csat: [5, 7], nps: [4, 7] }
  },
  {
    name: 'Департамент маркетинга',
    // Отличный департамент
    profile: { effectiveness: [8, 10], communication: [8, 10], transparency: [8, 10], responsiveness: [8, 10], closure_speed: [8, 10], csat: [9, 10], nps: [9, 10] }
  },
  {
    name: 'Департамент финансов',
    // Хороший, с небольшими проблемами
    profile: { effectiveness: [7, 9], communication: [7, 9], transparency: [8, 10], responsiveness: [7, 9], closure_speed: [7, 9], csat: [7, 9], nps: [7, 9] }
  },
  {
    name: 'Департамент HR',
    // Хороший
    profile: { effectiveness: [8, 10], communication: [8, 10], transparency: [7, 9], responsiveness: [8, 10], closure_speed: [8, 10], csat: [8, 10], nps: [8, 10] }
  },
  {
    name: 'IT департамент',
    // Отличный, но с проблемой прозрачности регламентов
    profile: { effectiveness: [9, 10], communication: [8, 10], transparency: [6, 8], responsiveness: [9, 10], closure_speed: [9, 10], csat: [9, 10], nps: [9, 10] }
  }
];

const processes = [
  'Согласование договора',
  'Запуск нового продукта',
  'Изменение регламента',
  'Запрос на закупку',
  'Оформление командировки',
  'Подключение к системе',
  'Запрос на обучение',
  'Оптимизация процесса'
];

// Более позитивное распределение SLA
const slaOptions = [
  { value: 'Да, точно в срок', weight: 60 },        // было 50%
  { value: 'С небольшой задержкой', weight: 30 },    // осталось 30%
  { value: 'Сильная задержка', weight: 5 },          // было 15%
  { value: 'Не знаю', weight: 5 }                    // осталось 5%
];

// Более позитивное распределение FTE
const fteOptions = [
  { value: 'Экономят более 2 часов в неделю', weight: 30 },  // было 25%
  { value: 'Незначительно экономят время', weight: 40 },     // было 35%
  { value: 'Не повлияли', weight: 22 },                      // было 25%
  { value: 'Создают бюрократию, трачу больше времени', weight: 8 }  // было 15%
];

const positiveComments = [
  'Быстрая реакция на запросы',
  'Профессиональные сотрудники',
  'Понятные инструкции',
  'Всегда на связи',
  'Помогли в сложной ситуации',
  'Чёткие сроки и результаты',
  'Прозрачный процесс согласования',
  'Оперативно решают вопросы'
];

const improvementComments = [
  'Упростить регламенты',
  'Сократить время согласования',
  'Добавить больше обучающих материалов',
  'Улучшить коммуникацию между отделами',
  'Автоматизировать рутинные процессы',
  'Сделать интерфейс более удобным',
  'Сократить количество бюрократических процедур',
  'Добавить чат-бот для типовых вопросов'
];

const priorityComments = [
  'Пересмотреть процесс согласования договоров',
  'Внедрить электронное согласование',
  'Провести обучение по новым регламентам',
  'Сократить цепочку согласований',
  'Добавить SLA для типовых запросов',
  'Создать базу знаний по процессам',
  'Упростить отчётность',
  'Автоматизировать рутинные операции'
];

// Утилиты
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const weightedRandom = (options) => {
  const totalWeight = options.reduce((sum, o) => sum + o.weight, 0);
  let random = Math.random() * totalWeight;
  for (const option of options) {
    random -= option.weight;
    if (random <= 0) return option.value;
  }
  return options[0].value;
};

const randomFrom = (arr) => arr[Math.floor(Math.random() * arr.length)];

// Генерация роли: 80% линейных, 20% руководителей
const generateRole = () => {
  return Math.random() > 0.2 ? 'Линейный сотрудник' : 'Руководитель';
};

// Корректировка оценок для руководителей (чуть выше)
const adjustForManager = (value, role) => {
  if (role === 'Руководитель') {
    return Math.min(10, value + rand(0, 2));
  }
  return value;
};

const generateResponse = (dept, id) => {
  const profile = dept.profile;
  const role = generateRole();
  
  const wantsCallback = Math.random() > 0.85; // 15% хотят обратный звонок
  
  return {
    role: role,
    department: dept.name,
    effectiveness: adjustForManager(rand(profile.effectiveness[0], profile.effectiveness[1]), role),
    communication: adjustForManager(rand(profile.communication[0], profile.communication[1]), role),
    transparency: adjustForManager(rand(profile.transparency[0], profile.transparency[1]), role),
    responsiveness: adjustForManager(rand(profile.responsiveness[0], profile.responsiveness[1]), role),
    closure_speed: adjustForManager(rand(profile.closure_speed[0], profile.closure_speed[1]), role),
    csat_score: adjustForManager(rand(profile.csat[0], profile.csat[1]), role),
    sla_compliance: weightedRandom(slaOptions),
    fte_impact: weightedRandom(fteOptions),
    nps_score: adjustForManager(rand(profile.nps[0], profile.nps[1]), role),
    positive_feedback: Math.random() > 0.3 ? randomFrom(positiveComments) : null,
    improvement_suggestions: Math.random() > 0.25 ? randomFrom(improvementComments) : null,
    priority_actions: Math.random() > 0.3 ? randomFrom(priorityComments) : null,
    wants_callback: wantsCallback,
    contact_info: wantsCallback 
      ? `employee${id}@company.ru` 
      : null
  };
};

const submitResponse = async (data) => {
  const response = await fetch(`${API_URL}/api/survey`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return response.json();
};

const clearData = async () => {
  console.log('🗑️ Очистка старых данных...');
  const response = await fetch(`${API_URL}/api/admin/reset`, {
    method: 'DELETE'
  });
  if (response.ok) {
    console.log('✅ Данные очищены');
  } else {
    console.log('⚠️ Не удалось очистить данные (возможно, сервер не запущен)');
  }
};

const main = async () => {
  console.log('🌱 Начинаю генерацию синтетических данных...\n');
  
  // Очищаем старые данные
  await clearData();
  
  let totalSubmitted = 0;
  let linearCount = 0;
  let managerCount = 0;
  
  for (const dept of departments) {
    console.log(` Департамент: ${dept.name}`);
    
    for (let i = 0; i < 30; i++) {
      const data = generateResponse(dept, totalSubmitted + 1);
      try {
        await submitResponse(data);
        totalSubmitted++;
        if (data.role === 'Линейный сотрудник') {
          linearCount++;
        } else {
          managerCount++;
        }
        process.stdout.write(`  ✓ Ответ ${i + 1}/30\r`);
      } catch (error) {
        console.error(`  ✗ Ошибка при отправке:`, error.message);
      }
      // Небольшая задержка, чтобы не перегружать сервер
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    console.log(`  ✅ Готово: 30 ответов\n`);
  }
  
  console.log(`\n Всего отправлено ответов: ${totalSubmitted}`);
  console.log(`👥 Линейных сотрудников: ${linearCount}`);
  console.log(` Руководителей: ${managerCount}`);
  console.log(`📊 Открой админ-панель: ${API_URL}/admin.html`);
};

main().catch(console.error);
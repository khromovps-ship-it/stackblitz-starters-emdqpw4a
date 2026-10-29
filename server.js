const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Хранилище в памяти (очищается при каждом запуске)
let surveyResponses = [];
console.log('🧹 Хранилище очищено. Данные будут потеряны при перезапуске сервера.');

// Главная страница
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', totalResponses: surveyResponses.length });
});

// POST /api/survey - Отправка ответа на опрос
app.post('/api/survey', (req, res) => {
  try {
    const response = {
      id: surveyResponses.length + 1,
      created_at: new Date().toISOString(),
      role: req.body.role || null,
      department: req.body.department || null,
      specific_process: req.body.specific_process || null,
      interaction_type: req.body.interaction_type || null,
      effectiveness: req.body.effectiveness,
      communication: req.body.communication,
      transparency: req.body.transparency,
      responsiveness: req.body.responsiveness,
      closure_speed: req.body.closure_speed,
      csat_score: req.body.csat_score,
      sla_compliance: req.body.sla_compliance,
      fte_impact: req.body.fte_impact,
      nps_score: req.body.nps_score,
      positive_feedback: req.body.positive_feedback || null,
      improvement_suggestions: req.body.improvement_suggestions || null,
      priority_actions: req.body.priority_actions || null,
      wants_callback: req.body.wants_callback || false,
      contact_info: req.body.contact_info || null
    };
    
    surveyResponses.push(response);
    
    console.log(`✅ Новый ответ #${response.id}: роль=${response.role}, департамент=${response.department}`);
    
    res.json({ success: true, id: response.id });
  } catch (error) {
    console.error('Error saving survey response:', error);
    res.status(500).json({ error: 'Не удалось сохранить ответ' });
  }
});

// GET /api/admin/responses - Получение всех ответов
app.get('/api/admin/responses', (req, res) => {
  res.json(surveyResponses.slice().reverse());
});

// GET /api/admin/metrics - Получение сводных метрик
app.get('/api/admin/metrics', (req, res) => {
  if (surveyResponses.length === 0) {
    return res.json({ message: 'Нет данных' });
  }

  const total = surveyResponses.length;
  const avg = (field) => {
    const sum = surveyResponses.reduce((acc, r) => acc + (r[field] || 0), 0);
    return (sum / total).toFixed(2);
  };

  const csatCount = surveyResponses.filter(r => r.csat_score >= 8).length;
  const csatPercentage = ((csatCount / total) * 100).toFixed(1);

  const promoters = surveyResponses.filter(r => r.nps_score >= 9).length;
  const detractors = surveyResponses.filter(r => r.nps_score <= 6).length;
  const nps = (((promoters - detractors) / total) * 100).toFixed(1);

  const fteAnalysis = {};
  surveyResponses.forEach(r => {
    const impact = r.fte_impact || 'Не указано';
    fteAnalysis[impact] = (fteAnalysis[impact] || 0) + 1;
  });

  const slaAnalysis = {};
  surveyResponses.forEach(r => {
    const sla = r.sla_compliance || 'Не указано';
    slaAnalysis[sla] = (slaAnalysis[sla] || 0) + 1;
  });

  const byDepartment = {};
  surveyResponses.forEach(r => {
    const dept = r.department || 'Не указано';
    if (!byDepartment[dept]) {
      byDepartment[dept] = { 
        count: 0, 
        effectiveness: [], communication: [], transparency: [], 
        responsiveness: [], closure_speed: [], csat: [], nps: [],
        sla: [], fte: [] 
      };
    }
    byDepartment[dept].count++;
    byDepartment[dept].effectiveness.push(r.effectiveness || 0);
    byDepartment[dept].communication.push(r.communication || 0);
    byDepartment[dept].transparency.push(r.transparency || 0);
    byDepartment[dept].responsiveness.push(r.responsiveness || 0);
    byDepartment[dept].closure_speed.push(r.closure_speed || 0);
    byDepartment[dept].csat.push(r.csat_score || 0);
    byDepartment[dept].nps.push(r.nps_score || 0);
    const slaOnTime = r.sla_compliance === 'Да, точно в срок' ? 1 : 0;
    byDepartment[dept].sla.push(slaOnTime);
    const ftePositive = (r.fte_impact === 'Экономят более 2 часов в неделю' || 
                        r.fte_impact === 'Незначительно экономят время') ? 1 : 0;
    byDepartment[dept].fte.push(ftePositive);
  });

  Object.keys(byDepartment).forEach(dept => {
    const d = byDepartment[dept];
    d.avgEffectiveness = (d.effectiveness.reduce((a, b) => a + b, 0) / d.count).toFixed(2);
    d.avgCommunication = (d.communication.reduce((a, b) => a + b, 0) / d.count).toFixed(2);
    d.avgTransparency = (d.transparency.reduce((a, b) => a + b, 0) / d.count).toFixed(2);
    d.avgResponsiveness = (d.responsiveness.reduce((a, b) => a + b, 0) / d.count).toFixed(2);
    d.avgClosureSpeed = (d.closure_speed.reduce((a, b) => a + b, 0) / d.count).toFixed(2);
    d.avgCsat = (d.csat.reduce((a, b) => a + b, 0) / d.count).toFixed(2);
    d.avgNps = (d.nps.reduce((a, b) => a + b, 0) / d.count).toFixed(2);
    d.slaPercentage = ((d.sla.reduce((a, b) => a + b, 0) / d.count) * 100).toFixed(1);
    d.ftePercentage = ((d.fte.reduce((a, b) => a + b, 0) / d.count) * 100).toFixed(1);
  });

  // Метрики по ролям
  const byRole = {};
  surveyResponses.forEach(r => {
    const role = r.role || 'Не указано';
    if (!byRole[role]) {
      byRole[role] = { 
        count: 0, 
        effectiveness: [], communication: [], transparency: [], 
        responsiveness: [], closure_speed: [], csat: [], nps: []
      };
    }
    byRole[role].count++;
    byRole[role].effectiveness.push(r.effectiveness || 0);
    byRole[role].communication.push(r.communication || 0);
    byRole[role].transparency.push(r.transparency || 0);
    byRole[role].responsiveness.push(r.responsiveness || 0);
    byRole[role].closure_speed.push(r.closure_speed || 0);
    byRole[role].csat.push(r.csat_score || 0);
    byRole[role].nps.push(r.nps_score || 0);
  });

  Object.keys(byRole).forEach(role => {
    const r = byRole[role];
    r.avgEffectiveness = (r.effectiveness.reduce((a, b) => a + b, 0) / r.count).toFixed(2);
    r.avgCommunication = (r.communication.reduce((a, b) => a + b, 0) / r.count).toFixed(2);
    r.avgTransparency = (r.transparency.reduce((a, b) => a + b, 0) / r.count).toFixed(2);
    r.avgResponsiveness = (r.responsiveness.reduce((a, b) => a + b, 0) / r.count).toFixed(2);
    r.avgClosureSpeed = (r.closure_speed.reduce((a, b) => a + b, 0) / r.count).toFixed(2);
    r.avgCsat = (r.csat.reduce((a, b) => a + b, 0) / r.count).toFixed(2);
    r.avgNps = (r.nps.reduce((a, b) => a + b, 0) / r.count).toFixed(2);
  });

  res.json({
    totalResponses: total,
    averages: {
      effectiveness: avg('effectiveness'),
      communication: avg('communication'),
      transparency: avg('transparency'),
      responsiveness: avg('responsiveness'),
      closure_speed: avg('closure_speed'),
      csat: avg('csat_score'),
      nps: avg('nps_score')
    },
    csatPercentage: csatPercentage,
    nps: nps,
    fteAnalysis,
    slaAnalysis,
    byDepartment,
    byRole
  });
});

// GET /api/admin/export - Экспорт в CSV
app.get('/api/admin/export', (req, res) => {
  if (surveyResponses.length === 0) {
    return res.status(404).json({ error: 'Нет данных для экспорта' });
  }

  const headers = [
    'ID', 'Дата', 'Роль', 'Департамент', 'Процесс',
    'Эффективность', 'Коммуникация', 'Прозрачность', 'Оперативность', 'Скорость закрытия',
    'CSAT', 'SLA', 'FTE', 'NPS',
    'Что устраивает', 'Что улучшить', 'Приоритетные действия',
    'Нужен звонок', 'Контакты'
  ];

  const rows = surveyResponses.map(r => [
    r.id,
    r.created_at,
    r.role || '',
    r.department || '',
    r.specific_process || '',
    r.effectiveness,
    r.communication,
    r.transparency,
    r.responsiveness,
    r.closure_speed,
    r.csat_score,
    r.sla_compliance || '',
    r.fte_impact || '',
    r.nps_score,
    (r.positive_feedback || '').replace(/"/g, '""'),
    (r.improvement_suggestions || '').replace(/"/g, '""'),
    (r.priority_actions || '').replace(/"/g, '""'),
    r.wants_callback ? 'Да' : 'Нет',
    r.contact_info || ''
  ]);

  const csvContent = [
    headers.join(';'),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(';'))
  ].join('\n');

  const bom = '\uFEFF';
  res.setHeader('Content-Type', 'text/csv;charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename=survey_results.csv');
  res.send(bom + csvContent);
});

// DELETE /api/admin/reset - Очистка всех данных
app.delete('/api/admin/reset', (req, res) => {
  surveyResponses = [];
  console.log('🗑️ Данные очищены');
  res.json({ success: true, message: 'Данные очищены' });
});

app.listen(PORT, () => {
  console.log(`✅ Сервер запущен на порту ${PORT}`);
});
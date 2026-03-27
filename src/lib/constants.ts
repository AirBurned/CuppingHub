export const processingLabels: Record<string, string> = {
  WASHED: 'Мытая',
  NATURAL: 'Натуральная',
  HONEY: 'Хани',
  ANAEROBIC: 'Анаэробная',
  OTHER: 'Другое',
}

export const roastLevelLabels: Record<string, string> = {
  LIGHT: 'Светлая',
  MEDIUM: 'Средняя',
  DARK: 'Тёмная',
}

export const brewMethodLabels: Record<string, string> = {
  ESPRESSO: 'Эспрессо',
  V60: 'V60',
  AEROPRESS: 'Аэропресс',
  OTHER: 'Другой',
}

export const roleLabels: Record<string, string> = {
  SUPER_ADMIN: 'Администратор',
  ADMIN: 'Шеф-бариста',
  MEMBER: 'Бариста',
}

// Этап 1: Аромат смолотого зерна
export const stage1Keys = ['aromaGround'] as const
export const stage1Labels: Record<string, string> = {
  aromaGround: 'Аромат смолотого зерна',
}

// Этап 2: Аромат заваренного зерна
export const stage2Keys = ['aromaBrewed'] as const
export const stage2Labels: Record<string, string> = {
  aromaBrewed: 'Аромат заваренного зерна',
}

// Этап 3: Вкусовые характеристики (aftertaste разбит на 2 шкалы)
export const stage3Keys = ['flavor', 'aftertasteDuration', 'aftertastePleasantness', 'acidity', 'body', 'sweetness', 'cleanCup', 'overall'] as const
export const stage3Labels: Record<string, string> = {
  flavor: 'Интенсивность вкуса',
  aftertasteDuration: 'Послевкусие: длительность',
  aftertastePleasantness: 'Послевкусие: приятность',
  acidity: 'Кислотность',
  body: 'Тело',
  sweetness: 'Сладость',
  cleanCup: 'Чистота чашки',
  overall: 'Общее впечатление',
}

// Описания крайних положений шкал (1 и 10)
export const scaleDescriptions: Record<string, { low: string; high: string }> = {
  aromaGround: { low: 'Нет аромата', high: 'Яркий, насыщенный аромат' },
  aromaBrewed: { low: 'Нет аромата', high: 'Яркий, насыщенный аромат' },
  flavor: { low: 'Невыраженный вкус', high: 'Очень яркий, насыщенный вкус' },
  aftertasteDuration: { low: 'Нет послевкусия', high: 'Очень долгое послевкусие' },
  aftertastePleasantness: { low: 'Неприятное послевкусие', high: 'Очень приятное послевкусие' },
  acidity: { low: 'Нет кислотности', high: 'Очень яркая кислотность' },
  body: { low: 'Водянистое, пустое', high: 'Плотное, насыщенное' },
  sweetness: { low: 'Совсем не сладко', high: 'Очень сладко' },
  cleanCup: { low: 'Грязная чашка, посторонние вкусы', high: 'Абсолютно чистая чашка' },
  overall: { low: 'Не понравился', high: 'Великолепный кофе' },
}

// Все критерии для spider-graph (послевкусие = среднее двух шкал, показываем как одно значение "Послевкусие")
export const spiderKeys = ['aromaGround', 'aromaBrewed', 'flavor', 'aftertaste', 'acidity', 'body', 'sweetness', 'cleanCup', 'overall'] as const
export const spiderLabels: Record<string, string> = {
  aromaGround: 'Аромат смолотого зерна',
  aromaBrewed: 'Аромат заваренного зерна',
  flavor: 'Интенсивность вкуса',
  aftertaste: 'Послевкусие',
  acidity: 'Кислотность',
  body: 'Тело',
  sweetness: 'Сладость',
  cleanCup: 'Чистота чашки',
  overall: 'Общее впечатление',
}

export const criteriaLabels = spiderLabels
export const criteriaKeys = [...spiderKeys] as const

export function isAdmin(role: string): boolean {
  return role === 'SUPER_ADMIN' || role === 'ADMIN'
}
